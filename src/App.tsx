import { Routes, Route, Navigate } from 'react-router';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Benchmarks from './pages/Benchmarks';
import TimerPage from './pages/Timer';
import Recovery from './pages/Recovery';
import Wearables from './pages/Wearables';
import About from './pages/About';
import Subscription from './pages/Subscription';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import TrainingDemo from './pages/TrainingDemo';
import AthleteSetup from './pages/AthleteSetup';
import WorkoutHistory from './pages/WorkoutHistory';
import MovementLibrary from './pages/MovementLibrary';
import ThankYou from './pages/ThankYou';
import Quiz from './pages/Quiz';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isPro, daysLeft, loading, needsSetup } = useAuth();
  const { lang } = useI18n();
  const tr = (pt: string, en: string, de: string) => lang === 'en' ? en : lang === 'de' ? de : pt;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        {tr('Carregando sua conta...', 'Loading your account...', 'Dein Konto wird geladen...')}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (needsSetup) {
    return <Navigate to="/configurar" replace />;
  }

  return (
    <>
      {!isPro && daysLeft <= 0 && (
        <div className="bg-red-950/50 border-b border-red-500/30 text-center py-2 text-sm text-red-400">
          {tr('Seu trial expirou.', 'Your trial has expired.', 'Deine Testphase ist abgelaufen.')} <a href="#/subscription" className="underline font-semibold">{tr('Assine agora', 'Subscribe now', 'Jetzt abonnieren')}</a> {tr('para continuar.', 'to continue.', 'um weiterzumachen.')}
        </div>
      )}
      {isAuthenticated && !isPro && daysLeft > 0 && (
        <div className="bg-orange-950/50 border-b border-orange-500/30 text-center py-2 text-sm text-orange-400">
          {tr('Trial ativo:', 'Active trial:', 'Aktive Testphase:')} {daysLeft} {tr('dias restantes.', 'days left.', 'Tage übrig.')} <a href="#/subscription" className="underline font-semibold">{tr('Ver planos', 'View plans', 'Pläne ansehen')}</a>
        </div>
      )}
      {children}
    </>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main>{children}</main>
    </div>
  );
}

function PrivateSetupRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Loading your account...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/vendas" element={<LandingPage />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/obrigado" element={<ThankYou />} />
            <Route
              path="/treino"
              element={
                <AppLayout>
                  <TrainingDemo />
                </AppLayout>
              }
            />
            <Route
              path="/configurar"
              element={
                <AppLayout>
                  <PrivateSetupRoute><AthleteSetup /></PrivateSetupRoute>
                </AppLayout>
              }
            />
            <Route
              path="/biblioteca"
              element={
                <AppLayout>
                  <PrivateRoute>
                    <MovementLibrary />
                  </PrivateRoute>
                </AppLayout>
              }
            />
            <Route
              path="/historico"
              element={
                <AppLayout>
                  <PrivateRoute>
                    <WorkoutHistory />
                  </PrivateRoute>
                </AppLayout>
              }
            />
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/inicio"
              element={
                <AppLayout>
                  <Home />
                </AppLayout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <AppLayout>
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                </AppLayout>
              }
            />
            <Route
              path="/benchmarks"
              element={
                <AppLayout>
                  <PrivateRoute>
                    <Benchmarks />
                  </PrivateRoute>
                </AppLayout>
              }
            />
            <Route
              path="/timer"
              element={
                <AppLayout>
                  <PrivateRoute>
                    <TimerPage />
                  </PrivateRoute>
                </AppLayout>
              }
            />
            <Route
              path="/recovery"
              element={
                <AppLayout>
                  <PrivateRoute>
                    <Recovery />
                  </PrivateRoute>
                </AppLayout>
              }
            />
            <Route
              path="/wearables"
              element={
                <AppLayout>
                  <PrivateRoute>
                    <Wearables />
                  </PrivateRoute>
                </AppLayout>
              }
            />
            <Route
              path="/about"
              element={
                <AppLayout>
                  <About />
                </AppLayout>
              }
            />
            <Route
              path="/subscription"
              element={
                <AppLayout>
                  <Subscription />
                </AppLayout>
              }
            />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
