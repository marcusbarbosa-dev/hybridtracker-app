export interface BenchmarkData {
  skiErg1000m: number; // segundos
  sledPush50m: number; // segundos
  sledPull50m: number; // segundos
  burpeeBroadJumps80m: number; // segundos
  row1000m: number; // segundos
  farmersCarry200m: number; // segundos
  sandbagLunges100m: number; // segundos
  wallBalls75reps: number; // segundos
  run1000m: number; // segundos
  test1600m: number; // segundos - teste de pista
}

export interface UserProfile {
  name: string;
  email: string;
  category: 'open' | 'pro' | 'doubles' | 'relay';
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female';
  nextRaceDate?: string;
}

export interface WorkoutDay {
  date: string;
  type: 'run' | 'strength' | 'metcon' | 'recovery' | 'rest' | 'hybrid';
  title: string;
  description: string;
  completed: boolean;
  duration?: number; // minutos
  intensity?: 'low' | 'moderate' | 'high';
}

export interface RecoveryActivity {
  id: string;
  title: string;
  description: string;
  duration: number; // minutos
  category: 'mobility' | 'sleep' | 'breathing' | 'contrast' | 'stretching';
  completed: boolean;
}

export interface AppState {
  user: UserProfile | null;
  benchmarks: BenchmarkData | null;
  vo2max: number | null;
  threshold: number | null; // velocidade limiar em m/min
  predictedTime: number | null; // tempo previsto de prova em segundos
  workoutPlan: WorkoutDay[];
  recoveryActivities: RecoveryActivity[];
  trialStartDate: string | null;
  isPro: boolean;
  language: 'pt' | 'en' | 'de';
}

export type Language = 'pt' | 'en' | 'de';
