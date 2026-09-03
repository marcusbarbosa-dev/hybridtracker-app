export interface DailyReadinessCheckin {
  date: string;
  sleep: number;
  energy: number;
  pain: number;
  availableMinutes: number;
  readiness: number;
}

export const READINESS_STORAGE_KEY = 'hybridtracker-daily-readiness';

export function calculateReadiness(sleep: number, energy: number, pain: number) {
  return Math.round(((sleep + energy + (10 - pain)) / 30) * 100);
}

export function loadTodayReadiness(): DailyReadinessCheckin | null {
  try {
    const saved = localStorage.getItem(READINESS_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as DailyReadinessCheckin;
    return parsed.date === new Date().toISOString().slice(0, 10) ? parsed : null;
  } catch {
    return null;
  }
}

export function getReadinessRecommendation(checkin: DailyReadinessCheckin) {
  if (checkin.pain >= 7 || checkin.readiness < 50) {
    return {
      band: 'recovery' as const,
      title: 'Priorize recuperação e técnica',
      description: 'Hoje o app recomenda retirar os blocos intensos, reduzir o volume e manter apenas atividade leve, técnica ou recuperação.',
      volumeFactor: 0.6,
      rpeReduction: 3,
    };
  }
  if (checkin.readiness < 75) {
    return {
      band: 'adjusted' as const,
      title: 'Ajuste moderado recomendado',
      description: 'O objetivo da sessão é mantido, com menos volume e RPE um ponto abaixo do planejado.',
      volumeFactor: 0.8,
      rpeReduction: 1,
    };
  }
  return {
    band: 'ready' as const,
    title: 'Pronto para o treino planejado',
    description: 'Os seus registros de hoje permitem manter a sessão como planejada.',
    volumeFactor: 1,
    rpeReduction: 0,
  };
}
