export type PeriodizationPhase = 'base' | 'development' | 'specificity' | 'taper';

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function getWeeksToRace(targetCompetitionDate: string | undefined, today: Date = new Date()): number | null {
  if (!targetCompetitionDate) return null;
  const race = new Date(`${targetCompetitionDate}T12:00:00`);
  if (Number.isNaN(race.getTime())) return null;
  const reference = new Date(today);
  reference.setHours(12, 0, 0, 0);
  const diffMs = race.getTime() - reference.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / MS_PER_WEEK);
}

export function getPeriodizationPhase(
  goal: string | undefined,
  targetCompetitionDate: string | undefined,
  today: Date = new Date()
): { phase: PeriodizationPhase; weeksToRace: number | null } {
  const weeksToRace = goal === 'Preparar uma competição' ? getWeeksToRace(targetCompetitionDate, today) : null;
  if (weeksToRace === null) return { phase: 'base', weeksToRace: null };
  if (weeksToRace <= 1) return { phase: 'taper', weeksToRace };
  if (weeksToRace <= 4) return { phase: 'specificity', weeksToRace };
  if (weeksToRace <= 8) return { phase: 'development', weeksToRace };
  return { phase: 'base', weeksToRace };
}

// Lean, parameter-level adjustment of the existing plan generator per periodization phase.
// Base: current default behavior. Development: builds volume/blocks toward specificity.
// Specificity: adds a race-simulation block and sharpens pace, without growing overall volume.
// Taper: cuts volume and duration while keeping some intensity, ahead of race day.
export const PHASE_ADJUSTMENTS: Record<PeriodizationPhase, { volumeFactor: number; hybridBlocksDelta: number; minutesDelta: number }> = {
  base: { volumeFactor: 1, hybridBlocksDelta: 0, minutesDelta: 0 },
  development: { volumeFactor: 1.1, hybridBlocksDelta: 0, minutesDelta: 5 },
  specificity: { volumeFactor: 1, hybridBlocksDelta: 1, minutesDelta: 0 },
  taper: { volumeFactor: 0.6, hybridBlocksDelta: -1, minutesDelta: -15 },
};
