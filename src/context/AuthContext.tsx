import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Language } from '@/types';

interface AuthUser {
  id?: string;
  email: string;
  name: string;
  subscriptionStatus: 'trial' | 'active' | 'expired';
  trialStartDate: string;
  trialEndsAt?: string;
  accessUntil?: string | null;
  plan: 'monthly' | 'yearly' | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isPro: boolean;
  daysLeft: number;
  loading: boolean;
  backendConfigured: boolean;
  needsSetup: boolean;
  markSetupComplete: () => void;
  login: (email: string, password: string, lang?: Language) => Promise<boolean>;
  register: (email: string, password: string, lang?: Language) => Promise<boolean>;
  magicLink: (email: string, lang?: Language) => Promise<boolean>;
  resendConfirmation: (email: string, lang?: Language) => Promise<boolean>;
  logout: () => Promise<void>;
  startTrial: () => void;
}

const TRIAL_DAYS = 7;
const AuthContext = createContext<AuthContextType | null>(null);

function validLanguage(value: unknown): value is Language {
  return value === 'pt' || value === 'en' || value === 'de';
}

function selectedLanguage(preferred?: Language): Language {
  if (validLanguage(preferred)) return preferred;
  const savedLanguage = localStorage.getItem('hybridtracker-lang');
  return validLanguage(savedLanguage) ? savedLanguage : 'pt';
}

function authRedirectUrl(preferred?: Language) {
  const base = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
  const lang = selectedLanguage(preferred);
  return `${base}/login?lang=${lang}`;
}

function loadDemoAuth(): AuthUser | null {
  try {
    const saved = localStorage.getItem('hybridtracker-demo-auth');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveDemoAuth(user: AuthUser | null) {
  if (user) localStorage.setItem('hybridtracker-demo-auth', JSON.stringify(user));
  else localStorage.removeItem('hybridtracker-demo-auth');
  localStorage.removeItem('hybridtracker-auth');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => isSupabaseConfigured ? null : loadDemoAuth());
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [needsSetup, setNeedsSetup] = useState(() => !localStorage.getItem('hybridtracker-athlete-profile'));

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;

    const loadUser = async (authUser: User | null) => {
      if (!active) return;
      if (!authUser?.email) {
        setUser(null);
        setLoading(false);
        return;
      }

      const accountLanguage = authUser.user_metadata?.language;
      const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
      if (!validLanguage(requestedLanguage) && validLanguage(accountLanguage)) {
        localStorage.setItem('hybridtracker-lang', accountLanguage);
        window.dispatchEvent(new CustomEvent('hybridtracker-language', { detail: accountLanguage }));
      }

      const [{ data: profile }, { data: subscriptions }, { data: athleteProfile }] = await Promise.all([
        client.from('profiles').select('display_name, trial_started_at, trial_ends_at').eq('id', authUser.id).maybeSingle(),
        client.from('subscriptions').select('status, plan, access_until, updated_at').eq('user_id', authUser.id).order('updated_at', { ascending: false }).limit(1),
        client.from('athlete_profiles').select('goal, level, training_days, equipment, run_reference, race_date').eq('user_id', authUser.id).maybeSingle(),
      ]);

      if (athleteProfile?.level) {
        localStorage.setItem('hybridtracker-athlete-profile', JSON.stringify({
          goal: athleteProfile.goal,
          level: athleteProfile.level,
          days: athleteProfile.training_days,
          equipment: athleteProfile.equipment || [],
          runReference: athleteProfile.run_reference || '',
          targetCompetitionDate: athleteProfile.race_date || '',
        }));
        setNeedsSetup(false);
      } else if (!localStorage.getItem('hybridtracker-athlete-profile')) {
        // Only send the athlete back through onboarding when there's truly no profile
        // anywhere (cloud or local). A transient network hiccup or a momentary empty
        // cloud response must never override a profile we already have saved locally,
        // otherwise returning users get re-asked their level/days/equipment every launch.
        setNeedsSetup(true);
      }

      const subscription = subscriptions?.[0];
      const accessStillValid = subscription?.access_until && new Date(subscription.access_until).getTime() > Date.now();
      const hasPaidAccess = subscription?.status === 'active' || (subscription?.status === 'canceled' && accessStillValid);
      const trialEndsAt = profile?.trial_ends_at || new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString();
      const trialActive = new Date(trialEndsAt).getTime() > Date.now();

      setUser({
        id: authUser.id,
        email: authUser.email,
        name: profile?.display_name || authUser.user_metadata?.name || authUser.email.split('@')[0],
        subscriptionStatus: hasPaidAccess ? 'active' : trialActive ? 'trial' : 'expired',
        trialStartDate: profile?.trial_started_at || authUser.created_at,
        trialEndsAt,
        accessUntil: subscription?.access_until,
        plan: subscription?.plan || null,
      });
      setLoading(false);
    };

    client.auth.getUser().then(({ data }) => loadUser(data.user));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => loadUser(session?.user || null));

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const daysLeft = useMemo(() => {
    if (!user || user.subscriptionStatus !== 'trial') return 0;
    const end = user.trialEndsAt
      ? new Date(user.trialEndsAt).getTime()
      : new Date(user.trialStartDate).getTime() + TRIAL_DAYS * 86400000;
    return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
  }, [user]);

  const persistDemo = (nextUser: AuthUser | null) => {
    setUser(nextUser);
    saveDemoAuth(nextUser);
  };

  const createDemoUser = (email: string): AuthUser => ({
    email,
    name: email.split('@')[0],
    subscriptionStatus: 'trial',
    trialStartDate: new Date().toISOString(),
    trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString(),
    plan: null,
  });

  const login = async (email: string, password: string, lang?: Language) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user && data.user.user_metadata?.language !== selectedLanguage(lang)) {
        await supabase.auth.updateUser({ data: { language: selectedLanguage(lang) } });
      }
      return !error;
    }
    if (!email.includes('@') || password.length < 6) return false;
    const existing = loadDemoAuth();
    if (!existing || existing.email !== email) return false;
    persistDemo(existing);
    return true;
  };

  const register = async (email: string, password: string, lang?: Language) => {
    if (supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: authRedirectUrl(lang),
          data: { language: selectedLanguage(lang) },
        },
      });
      return !error;
    }
    if (!email.includes('@') || password.length < 6) return false;
    persistDemo(createDemoUser(email));
    return true;
  };

  const resendConfirmation = async (email: string, lang?: Language) => {
    if (!supabase || !email.includes('@')) return false;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: authRedirectUrl(lang),
      },
    });
    return !error;
  };

  const magicLink = async (email: string, lang?: Language) => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: authRedirectUrl(lang),
        },
      });
      return !error;
    }
    if (!email.includes('@')) return false;
    persistDemo(createDemoUser(email));
    return true;
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    else persistDemo(null);
  };

  const startTrial = () => {
    if (supabase || !user) return;
    persistDemo(createDemoUser(user.email));
  };

  const markSetupComplete = () => setNeedsSetup(false);

  const isPro = user?.subscriptionStatus === 'active' || (user?.subscriptionStatus === 'trial' && daysLeft > 0);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user),
      isPro,
      daysLeft,
      loading,
      backendConfigured: isSupabaseConfigured,
      needsSetup,
      markSetupComplete,
      login,
      register,
      magicLink,
      resendConfirmation,
      logout,
      startTrial,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
