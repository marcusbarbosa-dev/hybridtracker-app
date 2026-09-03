import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AppState, BenchmarkData, UserProfile, WorkoutDay, RecoveryActivity, Language } from '@/types';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/i18n/I18nContext';
import { getPeriodizationPhase, PHASE_ADJUSTMENTS } from '@/lib/periodization';

interface AppContextType {
  state: AppState;
  setUser: (user: UserProfile | null) => void;
  setBenchmarks: (benchmarks: BenchmarkData | null) => void;
  setWorkoutPlan: (plan: WorkoutDay[]) => void;
  setRecoveryActivities: (activities: RecoveryActivity[]) => void;
  setIsPro: (isPro: boolean) => void;
  setLanguage: (lang: AppState['language']) => void;
  generatePlan: () => void;
  calculateMetrics: (benchmarks: BenchmarkData) => { vo2max: number; threshold: number; predictedTime: number };
  toggleWorkoutComplete: (date: string) => void;
  updateWorkout: (date: string, updates: Partial<WorkoutDay>) => void;
  deleteWorkout: (date: string) => void;
  addWorkout: (workout: WorkoutDay) => void;
}

const defaultState: AppState = {
  user: null,
  benchmarks: null,
  vo2max: null,
  threshold: null,
  predictedTime: null,
  workoutPlan: [],
  recoveryActivities: [],
  trialStartDate: null,
  isPro: false,
  language: 'pt',
};

function loadState(): AppState {
  try {
    const saved = localStorage.getItem('hybridtracker-state');
    if (saved) return { ...defaultState, ...JSON.parse(saved) };
  } catch {
    // ignore
  }
  return defaultState;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const { lang } = useI18n();
  const cloudUserId = useRef<string | null>(null);
  const cloudReady = useRef(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = (next: AppState) => {
    setState(next);
    localStorage.setItem('hybridtracker-state', JSON.stringify(next));
  };

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    const loadCloudPlan = async () => {
      const { data: authData } = await client.auth.getUser();
      if (!active || !authData.user) return;
      cloudUserId.current = authData.user.id;
      const [{ data, error }, { data: profileData }] = await Promise.all([
        client.from('planned_workouts').select('*').eq('user_id', authData.user.id).order('workout_date'),
        client.from('athlete_profiles').select('goal, level, training_days, equipment, run_reference, race_date').eq('user_id', authData.user.id).maybeSingle(),
      ]);
      if (!active || error) return;
      if (profileData) localStorage.setItem('hybridtracker-athlete-profile', JSON.stringify({ goal: profileData.goal, level: profileData.level, days: profileData.training_days, equipment: profileData.equipment || [], runReference: profileData.run_reference || '', targetCompetitionDate: profileData.race_date || '' }));
      if (data?.length) {
        const cloudPlan: WorkoutDay[] = data.map(item => ({ date: item.workout_date, type: item.workout_type, title: item.title, description: item.description || '', completed: item.completed, duration: item.duration_minutes, intensity: item.intensity || undefined }));
        setState(current => {
          const next = { ...current, workoutPlan: cloudPlan };
          localStorage.setItem('hybridtracker-state', JSON.stringify(next));
          return next;
        });
        cloudReady.current = true;
      } else {
        cloudReady.current = true;
        setState(current => ({ ...current, workoutPlan: [...current.workoutPlan] }));
      }
    };
    loadCloudPlan();
    const { data: authListener } = client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') setTimeout(loadCloudPlan, 0);
      if (event === 'SIGNED_OUT') { cloudUserId.current = null; cloudReady.current = false; }
    });
    return () => { active = false; authListener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabase || !cloudReady.current || !cloudUserId.current) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const userId = cloudUserId.current;
      if (!userId || !supabase) return;
      const rows = state.workoutPlan.map(item => ({ user_id: userId, workout_date: item.date, workout_type: item.type, title: item.title, description: item.description, completed: item.completed, duration_minutes: item.duration || 0, intensity: item.intensity || null, updated_at: new Date().toISOString() }));
      if (rows.length) {
        const { error } = await supabase.from('planned_workouts').upsert(rows, { onConflict: 'user_id,workout_date' });
        if (error) return;
        const dates = rows.map(item => item.workout_date);
        await supabase.from('planned_workouts').delete().eq('user_id', userId).not('workout_date', 'in', `(${dates.join(',')})`);
      } else {
        await supabase.from('planned_workouts').delete().eq('user_id', userId);
      }
    }, 350);
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [state.workoutPlan]);

  const setUser = (user: UserProfile | null) => persist({ ...state, user });
  const setBenchmarks = (benchmarks: BenchmarkData | null) => persist({ ...state, benchmarks });
  const setWorkoutPlan = (workoutPlan: WorkoutDay[]) => persist({ ...state, workoutPlan });
  const setRecoveryActivities = (recoveryActivities: RecoveryActivity[]) => persist({ ...state, recoveryActivities });
  const setIsPro = (isPro: boolean) => persist({ ...state, isPro });
  const setLanguage = (language: AppState['language']) => persist({ ...state, language });

  const calculateMetrics = (b: BenchmarkData) => {
    const v1600 = 1600 / b.test1600m;
    const vo2max = 6.354 * v1600 - 2.472;
    const threshold = 0.7507 * v1600 + 21.575;
    const stationTotal = 
      b.skiErg1000m + b.sledPush50m + b.sledPull50m + b.burpeeBroadJumps80m +
      b.row1000m + b.farmersCarry200m + b.sandbagLunges100m + b.wallBalls75reps;
    const runTotal = (8000 / threshold) * 60;
    const predictedTime = stationTotal + runTotal;
    return { vo2max, threshold, predictedTime };
  };

  type AthleteProfile = { goal: string; level: string; days: number; equipment: string[]; runReference: string; targetCompetitionDate?: string };

  const loadAthleteProfile = (): AthleteProfile => {
    let profile: AthleteProfile = { goal: 'Treinar de forma híbrida', level: 'Intermediário', days: 4, equipment: ['Academia completa'], runReference: '5 km entre 22 e 30 min' };
    try { const saved = localStorage.getItem('hybridtracker-athlete-profile'); if (saved) profile = { ...profile, ...JSON.parse(saved) }; } catch { /* usa perfil padrão */ }
    return profile;
  };

  const buildWorkoutPlan = (targetLang: Language, profile: AthleteProfile): WorkoutDay[] => {
    const days = [3, 4, 5].includes(profile.days) ? profile.days : 4;
    const trainingWeekdays: Record<number, number[]> = { 3: [2, 4, 6], 4: [1, 3, 5, 6], 5: [1, 2, 4, 5, 6] };
    const sessionTemplates: Record<number, { type: WorkoutDay['type']; role: string; intensity: WorkoutDay['intensity'] }[]> = {
      3: [{ type: 'run', role: 'easy', intensity: 'low' }, { type: 'strength', role: 'strength', intensity: 'moderate' }, { type: 'hybrid', role: 'hybrid', intensity: 'high' }],
      4: [{ type: 'run', role: 'easy', intensity: 'low' }, { type: 'strength', role: 'strength', intensity: 'moderate' }, { type: 'run', role: 'quality', intensity: 'high' }, { type: 'hybrid', role: 'hybrid', intensity: 'high' }],
      5: [{ type: 'strength', role: 'strength', intensity: 'moderate' }, { type: 'run', role: 'easy', intensity: 'low' }, { type: 'run', role: 'quality', intensity: 'high' }, { type: 'metcon', role: 'stations', intensity: 'moderate' }, { type: 'hybrid', role: 'hybrid', intensity: 'high' }],
    };
    if (profile.goal === 'Melhorar meu condicionamento') sessionTemplates[days] = sessionTemplates[days].map(item => item.role === 'hybrid' ? { ...item, intensity: 'moderate' } : item);
    if (profile.level === 'Iniciante') sessionTemplates[days] = sessionTemplates[days].map(item => ({ ...item, intensity: item.intensity === 'high' ? 'moderate' : item.intensity }));

    const completeGym = profile.equipment.includes('Academia completa');
    const bodyweightOnly = !profile.equipment.some(item => ['Academia completa', 'Sled', 'SkiErg', 'Remo ergométrico', 'Halteres e kettlebells'].includes(item));
    const hasSled = completeGym || profile.equipment.includes('Sled');
    const hasSki = completeGym || profile.equipment.includes('SkiErg');
    const hasRow = completeGym || profile.equipment.includes('Remo ergométrico');
    const hasWeights = completeGym || profile.equipment.includes('Halteres e kettlebells');
    const hasRun = completeGym || profile.equipment.includes('Corrida (esteira ou pista)');
    const levelMinutes = profile.level === 'Iniciante' ? 45 : profile.level === 'Avançado' ? 70 : 60;
    const levelIndex = profile.level === 'Iniciante' ? 0 : profile.level === 'Avançado' ? 2 : 1;
    const station = (name: string, beginner: string, intermediate: string, advanced: string) => ({ name, prescription: [beginner, intermediate, advanced][levelIndex] });
    const stations = [
      hasSki && station('SkiErg', '400 m', '600 m', '800 m'),
      hasSled && station('Empurrar trenó', '15 m · carga técnica', '25 m · carga controlada', '40 m · carga de prova'),
      hasSled && station('Puxar trenó', '15 m · carga técnica', '25 m · carga controlada', '40 m · carga de prova'),
      station('Burpee com salto em distância', '20 m', '30 m', '40 m'),
      hasRow && station('Remo ergométrico', '400 m', '600 m', '800 m'),
      hasWeights && station('Caminhada do fazendeiro', '50 m', '100 m', '150 m'),
      hasWeights && station(completeGym ? 'Afundo com sandbag' : 'Afundo com halteres', '20 m', '30 m', '50 m'),
      completeGym && station('Wall ball', '20 repetições', '40 repetições', '60 repetições'),
    ].filter(Boolean) as { name: string; prescription: string }[];
    if (bodyweightOnly) stations.push(station('Bear crawl', '20 m', '30 m', '40 m'), station('Agachamento com peso corporal', '15 repetições', '20 repetições', '25 repetições'));
    const stationPair = (offset: number) => [stations[offset % stations.length], stations[(offset + 1) % stations.length]];

    const stationNames: Record<Language, Record<string, string>> = {
      pt: {},
      en: {
        'Empurrar trenó': 'Sled push', 'Puxar trenó': 'Sled pull', 'Burpee com salto em distância': 'Burpee broad jumps',
        'Remo ergométrico': 'Rowing machine', 'Caminhada do fazendeiro': "Farmer's carry", 'Afundo com sandbag': 'Sandbag lunges',
        'Afundo com halteres': 'Dumbbell lunges', 'Agachamento com peso corporal': 'Bodyweight squats',
      },
      de: {
        'Empurrar trenó': 'Schlitten schieben', 'Puxar trenó': 'Schlitten ziehen', 'Burpee com salto em distância': 'Burpee mit Weitsprung',
        'Remo ergométrico': 'Rudergerät', 'Caminhada do fazendeiro': "Farmer's Carry", 'Afundo com sandbag': 'Ausfallschritte mit Sandsack',
        'Afundo com halteres': 'Ausfallschritte mit Kurzhanteln', 'Agachamento com peso corporal': 'Kniebeugen mit Körpergewicht',
      },
    };
    const translatePrescription = (value: string) => {
      if (targetLang === 'en') return value.replace('carga técnica', 'technique load').replace('carga controlada', 'controlled load').replace('carga de prova', 'race load').replace('repetições', 'reps');
      if (targetLang === 'de') return value.replace('carga técnica', 'Techniklast').replace('carga controlada', 'kontrollierte Last').replace('carga de prova', 'Wettkampflast').replace('repetições', 'Wiederholungen');
      return value;
    };
    const formatStations = (items: { name: string; prescription: string }[]) => items.map(item => `${stationNames[targetLang][item.name] || item.name} (${translatePrescription(item.prescription)})`).join(' + ');

    // Strength day prescription: sets/reps scale by level, exercises name the actual equipment in use,
    // and load progresses via RPE/reps-in-reserve since the app doesn't collect a 1RM to work off percentages.
    const setsRepsByLang: Record<Language, string> = {
      pt: profile.level === 'Iniciante' ? '3 séries de 10 repetições' : profile.level === 'Avançado' ? '5 séries de 6 repetições' : '4 séries de 8 repetições',
      en: profile.level === 'Iniciante' ? '3 sets of 10 reps' : profile.level === 'Avançado' ? '5 sets of 6 reps' : '4 sets of 8 reps',
      de: profile.level === 'Iniciante' ? '3 Sätze à 10 Wiederholungen' : profile.level === 'Avançado' ? '5 Sätze à 6 Wiederholungen' : '4 Sätze à 8 Wiederholungen',
    };
    const strengthExercisesByLang: Record<Language, string> = {
      pt: hasWeights ? "agachamento com barra ou halteres, levantamento terra romeno e carregamento unilateral (farmer's carry ou kettlebell)" : 'agachamento livre, afundo búlgaro e prancha com apoio unilateral',
      en: hasWeights ? "barbell or dumbbell squat, Romanian deadlift and a loaded single-arm carry (farmer's carry or kettlebell)" : 'bodyweight squats, Bulgarian split squats and single-arm plank holds',
      de: hasWeights ? "Kniebeuge mit Langhantel oder Kurzhanteln, rumänisches Kreuzheben und einseitiges Tragen (Farmer's Carry oder Kettlebell)" : 'Kniebeugen mit Körpergewicht, bulgarische Split Squats und einarmige Planks',
    };
    const strengthLoadNoteByLang: Record<Language, string> = hasWeights ? {
      pt: 'Aumente a carga a cada série, deixando 2–3 repetições de reserva; RPE 5–6/10.',
      en: 'Increase the load each set, leaving 2–3 reps in reserve; RPE 5–6/10.',
      de: 'Steigere die Last mit jedem Satz und lasse 2–3 Wiederholungen in Reserve; RPE 5–6/10.',
    } : {
      pt: 'Aumente a dificuldade a cada série (tempo sob tensão, amplitude ou uma variação mais avançada), deixando 2–3 repetições de reserva; RPE 5–6/10.',
      en: 'Increase the difficulty each set (tempo, range of motion or a harder variation), leaving 2–3 reps in reserve; RPE 5–6/10.',
      de: 'Steigere die Schwierigkeit mit jedem Satz (Tempo, Bewegungsumfang oder eine anspruchsvollere Variante) und lasse 2–3 Wiederholungen in Reserve; RPE 5–6/10.',
    };

    const today = new Date(); today.setHours(12, 0, 0, 0);
    const { phase } = getPeriodizationPhase(profile.goal, profile.targetCompetitionDate, today);
    const phaseAdjustment = PHASE_ADJUSTMENTS[phase];

    const easyBase = Math.round((profile.level === 'Iniciante' ? 25 : profile.level === 'Avançado' ? 45 : 35) * phaseAdjustment.volumeFactor);
    const hybridBlocks = Math.max(2, (profile.level === 'Iniciante' ? 3 : profile.level === 'Avançado' ? 5 : 4) + phaseAdjustment.hybridBlocksDelta);
    const hybridRunBase = profile.level === 'Iniciante' ? 400 : profile.level === 'Avançado' ? 800 : 600;
    const levelMinutesAdj = Math.max(30, levelMinutes + phaseAdjustment.minutesDelta);

    const titlesByLang: Record<Language, Record<string, string>> = {
      en: { strength: days === 3 && hasRun ? 'Strength + running technique' : 'Functional strength', easy: 'Easy run · aerobic base', quality: 'Controlled interval run', stations: 'Station technique and endurance', hybrid: profile.goal === 'Preparar uma competição' ? 'Running under fatigue · progressive simulation' : 'Running under fatigue · hybrid workout', rest: 'Rest day' },
      de: { strength: days === 3 && hasRun ? 'Kraft + Lauftechnik' : 'Funktionelle Kraft', easy: 'Lockerer Lauf · aerobe Basis', quality: 'Kontrollierter Intervalllauf', stations: 'Stationstechnik und Ausdauer', hybrid: profile.goal === 'Preparar uma competição' ? 'Laufen unter Ermüdung · progressive Simulation' : 'Laufen unter Ermüdung · Hybrid-Workout', rest: 'Ruhetag' },
      pt: { strength: days === 3 && hasRun ? 'Força + técnica de corrida' : 'Força funcional', easy: 'Corrida leve · base aeróbia', quality: 'Corrida intervalada controlada', stations: 'Técnica e resistência nas estações', hybrid: profile.goal === 'Preparar uma competição' ? 'Corrida sob fadiga · simulado progressivo' : 'Corrida sob fadiga · treino híbrido', rest: 'Descanso' },
    };
    const titles = titlesByLang[targetLang];

    const plan: WorkoutDay[] = [];
    const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < 14; i++) {
      const date = new Date(today); date.setDate(today.getDate() + i);
      const weekdayIndex = trainingWeekdays[days].indexOf(date.getDay());
      const session = weekdayIndex >= 0 ? sessionTemplates[days][weekdayIndex] : null;
      const role = session?.role || 'rest';
      const week = Math.floor(i / 7);
      const selectedStations = stationPair((week * 3) + Math.max(0, weekdayIndex));

      const intervalDescriptionByLang: Record<Language, string> = {
        pt: profile.runReference === 'Estou começando a correr'
          ? `${6 + week} × 2 min correndo em RPE 4–5/10, com 2 min caminhando`
          : profile.runReference === '5 km acima de 30 min'
            ? `${6 + week} × 400 m em RPE 6/10, com 90 s de recuperação`
            : profile.runReference === '5 km abaixo de 22 min'
              ? `${week === 0 ? '8 × 600 m' : '6 × 800 m'} em RPE 7–8/10, com 75 s de recuperação`
              : `${6 + week} × 600 m em RPE 6–7/10, com 90 s de recuperação`,
        en: profile.runReference === 'Estou começando a correr'
          ? `${6 + week} × 2 min running at RPE 4–5/10, with 2 min walking`
          : profile.runReference === '5 km acima de 30 min'
            ? `${6 + week} × 400 m at RPE 6/10, with 90 s recovery`
            : profile.runReference === '5 km abaixo de 22 min'
              ? `${week === 0 ? '8 × 600 m' : '6 × 800 m'} at RPE 7–8/10, with 75 s recovery`
              : `${6 + week} × 600 m at RPE 6–7/10, with 90 s recovery`,
        de: profile.runReference === 'Estou começando a correr'
          ? `${6 + week} × 2 Min. Laufen bei RPE 4–5/10, mit 2 Min. Gehen`
          : profile.runReference === '5 km acima de 30 min'
            ? `${6 + week} × 400 m bei RPE 6/10, mit 90 s Pause`
            : profile.runReference === '5 km abaixo de 22 min'
              ? `${week === 0 ? '8 × 600 m' : '6 × 800 m'} bei RPE 7–8/10, mit 75 s Pause`
              : `${6 + week} × 600 m bei RPE 6–7/10, mit 90 s Pause`,
      };

      const descriptionsByLang: Record<Language, Record<string, string>> = {
        pt: {
          strength: `${days === 3 && hasRun ? '10 min de corrida leve + ' : ''}${setsRepsByLang.pt} de ${strengthExercisesByLang.pt}. ${strengthLoadNoteByLang.pt}`,
          easy: `${easyBase + (week * 5)} min em ritmo confortável e conversável (RPE 3–4/10). Objetivo: desenvolver base aeróbia, não velocidade.`,
          quality: intervalDescriptionByLang.pt,
          stations: `${formatStations(selectedStations)}. Trabalhe movimentos consistentes e transições sem buscar exaustão; RPE 5–6/10.`,
          hybrid: `${hybridBlocks} blocos: ${hybridRunBase + (week * 100)} m de corrida + ${formatStations(selectedStations)}. Reorganize o ritmo nos primeiros metros após cada estação; RPE ${profile.level === 'Iniciante' ? '6' : '7'}/10.`,
          rest: 'Recupere-se, hidrate-se e priorize o sono. Se desejar, faça caminhada ou mobilidade leve.',
        },
        en: {
          strength: `${days === 3 && hasRun ? '10 min easy running + ' : ''}${setsRepsByLang.en} of ${strengthExercisesByLang.en}. ${strengthLoadNoteByLang.en}`,
          easy: `${easyBase + (week * 5)} min at a comfortable conversational pace (RPE 3–4/10). Goal: develop your aerobic base, not speed.`,
          quality: intervalDescriptionByLang.en,
          stations: `${formatStations(selectedStations)}. Use consistent movement and smooth transitions without chasing exhaustion; RPE 5–6/10.`,
          hybrid: `${hybridBlocks} blocks: ${hybridRunBase + (week * 100)} m running + ${formatStations(selectedStations)}. Reorganize your pace during the first meters after each station; RPE ${profile.level === 'Iniciante' ? '6' : '7'}/10.`,
          rest: 'Recover, hydrate and prioritize sleep. Add an easy walk or mobility work if desired.',
        },
        de: {
          strength: `${days === 3 && hasRun ? '10 Min. lockeres Laufen + ' : ''}${setsRepsByLang.de}: ${strengthExercisesByLang.de}. ${strengthLoadNoteByLang.de}`,
          easy: `${easyBase + (week * 5)} Min. in einem angenehmen, gesprächigen Tempo (RPE 3–4/10). Ziel: aerobe Basis aufbauen, nicht Geschwindigkeit.`,
          quality: intervalDescriptionByLang.de,
          stations: `${formatStations(selectedStations)}. Achte auf gleichmäßige Bewegungen und flüssige Übergänge, ohne bis zur Erschöpfung zu gehen; RPE 5–6/10.`,
          hybrid: `${hybridBlocks} Blöcke: ${hybridRunBase + (week * 100)} m Laufen + ${formatStations(selectedStations)}. Finde nach jeder Station in den ersten Metern wieder in dein Tempo; RPE ${profile.level === 'Iniciante' ? '6' : '7'}/10.`,
          rest: 'Erhole dich, trinke ausreichend und priorisiere den Schlaf. Bei Bedarf ein lockerer Spaziergang oder leichte Mobilisation.',
        },
      };
      const descriptions = descriptionsByLang[targetLang];

      plan.push({
        date: dateKey(date), type: session?.type || 'rest',
        title: titles[role],
        description: descriptions[role],
        completed: false,
        duration: role === 'rest' ? 0 : role === 'easy' ? easyBase + (week * 5) : role === 'stations' ? Math.max(35, levelMinutesAdj - 10) : levelMinutesAdj,
        intensity: session?.intensity || 'low',
      });
    }
    return plan;
  };

  const generatePlan = () => {
    const plan = buildWorkoutPlan(lang, loadAthleteProfile());
    persist({ ...state, workoutPlan: plan });
  };

  const prevLangRef = useRef(lang);
  useEffect(() => {
    if (prevLangRef.current === lang) return;
    const oldLang = prevLangRef.current;
    prevLangRef.current = lang;
    setState(current => {
      if (!current.workoutPlan.length) return current;
      const profile = loadAthleteProfile();
      const oldGenerated = buildWorkoutPlan(oldLang, profile);
      const newGenerated = buildWorkoutPlan(lang, profile);
      const oldByDate = new Map(oldGenerated.map(w => [w.date, w]));
      const newByDate = new Map(newGenerated.map(w => [w.date, w]));
      const relocalized = current.workoutPlan.map(workout => {
        const matchedOld = oldByDate.get(workout.date);
        const matchedNew = newByDate.get(workout.date);
        if (!matchedOld || !matchedNew) return workout;
        if (workout.title !== matchedOld.title || workout.description !== matchedOld.description) return workout;
        return { ...workout, title: matchedNew.title, description: matchedNew.description };
      });
      const next = { ...current, workoutPlan: relocalized };
      localStorage.setItem('hybridtracker-state', JSON.stringify(next));
      return next;
    });
  }, [lang]);

  const toggleWorkoutComplete = (date: string) => {
    const updated = state.workoutPlan.map((w) =>
      w.date === date ? { ...w, completed: !w.completed } : w
    );
    persist({ ...state, workoutPlan: updated });
  };

  const updateWorkout = (date: string, updates: Partial<WorkoutDay>) => {
    const updated = state.workoutPlan.map((w) =>
      w.date === date ? { ...w, ...updates } : w
    );
    persist({ ...state, workoutPlan: updated });
  };

  const deleteWorkout = (date: string) => {
    const updated = state.workoutPlan.filter((w) => w.date !== date);
    persist({ ...state, workoutPlan: updated });
  };

  const addWorkout = (workout: WorkoutDay) => {
    persist({ ...state, workoutPlan: [...state.workoutPlan, workout].sort((a, b) => a.date.localeCompare(b.date)) });
  };

  return (
    <AppContext.Provider value={{
      state, setUser, setBenchmarks, setWorkoutPlan, setRecoveryActivities,
      setIsPro, setLanguage, generatePlan, calculateMetrics,
      toggleWorkoutComplete, updateWorkout, deleteWorkout, addWorkout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
