import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import type { WorkoutDay } from '@/types';
import { getReadinessRecommendation, loadTodayReadiness } from '@/lib/readiness';
import { getPeriodizationPhase } from '@/lib/periodization';
import { startOfLocalWeek, toLocalDateKey } from '@/lib/dates';
import { RpeHelp } from '@/components/RpeHelp';
import { useI18n } from '@/i18n/I18nContext';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  CirclePlay,
  Clock3,
  Dumbbell,
  Gauge,
  HeartPulse,
  Info,
  Play,
  Route,
  TrendingUp,
  Sparkles,
  Video,
} from 'lucide-react';

const baseBlocks = [
  {
    icon: Activity,
    label: 'Aquecimento',
    duration: '10 min',
    title: 'Mobilidade + ativação de corrida',
    detail: '2 voltas: 200 m leve, mobilidade de tornozelo, 10 air squats e 8 inchworms.',
  },
  {
    icon: Route,
    label: 'Bloco 1 · corrida',
    duration: '24 min',
    title: '6 × 600 m em ritmo controlado',
    detail: 'RPE 7/10 · recuperação de 90 s trotando. Ritmo-alvo ajustado pelo benchmark de 5 km.',
  },
  {
    icon: Dumbbell,
    label: 'Bloco 2 · estações',
    duration: '18 min',
    title: 'Sled push + burpee broad jump',
    detail: '4 voltas: 20 m sled push + 10 burpee broad jumps. Preserve técnica e transições consistentes.',
  },
  {
    icon: HeartPulse,
    label: 'Finalização',
    duration: '8 min',
    title: 'Desaceleração e recuperação',
    detail: 'Caminhada leve, respiração nasal e mobilidade de quadril.',
  },
];

const movements = [
  { name: 'Sled Push', meta: { pt: 'Técnica · 0:32', en: 'Technique · 0:32', de: 'Technik · 0:32' }, accent: 'from-orange-500/30' },
  { name: 'Burpee Broad Jump', meta: { pt: 'Eficiência · 0:38', en: 'Efficiency · 0:38', de: 'Effizienz · 0:38' }, accent: 'from-amber-500/25' },
  { name: 'SkiErg', meta: { pt: 'Técnica · 0:41', en: 'Technique · 0:41', de: 'Technik · 0:41' }, accent: 'from-sky-500/20' },
  { name: 'Wall Ball', meta: { pt: 'Padrão de movimento · 0:35', en: 'Movement pattern · 0:35', de: 'Bewegungsmuster · 0:35' }, accent: 'from-red-500/20' },
];

const completionDefinitions: Record<string, { title: string; description: string }> = {
  Rx: {
    title: 'Concluído como prescrito',
    description: 'Você realizou todos os blocos, repetições, distâncias e cargas exatamente como estavam descritos.',
  },
  Scaled: {
    title: 'Concluído com adaptação',
    description: 'Você completou a sessão preservando o objetivo, mas modificou carga, distância, repetições ou algum movimento.',
  },
  Parcial: {
    title: 'Realizado parcialmente',
    description: 'Você iniciou a sessão, mas não realizou todos os blocos ou todo o volume previsto.',
  },
  'Time Cap': {
    title: 'Limite de tempo atingido',
    description: 'Você treinou até o tempo máximo definido e registrou o ponto alcançado quando o cronômetro terminou.',
  },
};

export default function TrainingDemo() {
  const { state, updateWorkout } = useApp();
  const { lang } = useI18n();
  const en = lang === 'en';
  const isDe = lang === 'de';
  const tr = (pt: string, english: string, german: string) => en ? english : isDe ? german : pt;
  const localizeSavedPlanText = (value?: string) => {
    if (!value || (!en && !isDe)) return value || '';
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    if (en) {
      if (normalized.includes('corrida intervalada controlada')) return 'Controlled interval run';
      if (normalized.includes('corrida leve') || normalized.includes('base aerobia')) return 'Easy run · aerobic base';
      if (normalized.includes('corrida sob fadiga')) return 'Running under fatigue · hybrid training';
      if (normalized === 'descanso' || normalized.includes('dia de descanso')) return 'Rest';
      if (normalized.includes('forca funcional') || normalized === 'funcional') return 'Functional strength';
      if (normalized === 'iniciante') return 'Beginner';
      if (normalized === 'intermediario') return 'Intermediate';
      if (normalized === 'avancado') return 'Advanced';

      const translatedProfileText = value
        .replace(/Academia completa/gi, 'Full gym')
        .replace(/Remo ergom[eé]trico/gi, 'RowErg')
        .replace(/Halteres e kettlebells/gi, 'Dumbbells and kettlebells')
        .replace(/Corrida \(esteira ou pista\)/gi, 'Running (treadmill or track)');

      if (translatedProfileText !== value) return translatedProfileText;
      if (normalized.includes('forca + tecnica de corrida')) return 'Strength + running technique';
      if (normalized.includes('tecnica e resistencia nas estacoes')) return 'Station technique and endurance';
      if (normalized.includes('corrida sob fadiga') && normalized.includes('simulado progressivo')) return 'Running under fatigue · progressive simulation';
      if (normalized.includes('corrida sob fadiga') && normalized.includes('treino hibrido')) return 'Running under fatigue · hybrid workout';
      if (normalized === 'descanso') return 'Rest';
      if (normalized.includes('6 × 600 m') && normalized.includes('recuperacao')) return '6 × 600 m at RPE 6–7/10, with 90 seconds of recovery';
      if (normalized.includes('4 blocos:') && normalized.includes('burpee')) return '4 blocks: 600 m run + burpee broad jumps (30 m) + rowing (600 m). Regain your pace after each station; RPE 7/10.';
      if (normalized.includes('recupere-se') && normalized.includes('hidrate-se')) return 'Recover, hydrate and prioritize sleep. If you wish, add an easy walk or light mobility.';
      return value;
    }

    // German
    if (normalized.includes('corrida intervalada controlada')) return 'Kontrollierter Intervalllauf';
    if (normalized.includes('corrida leve') || normalized.includes('base aerobia')) return 'Lockerer Lauf · aerobe Basis';
    if (normalized.includes('corrida sob fadiga')) return 'Laufen unter Ermüdung · Hybridtraining';
    if (normalized === 'descanso' || normalized.includes('dia de descanso')) return 'Ruhetag';
    if (normalized.includes('forca funcional') || normalized === 'funcional') return 'Funktionelle Kraft';
    if (normalized === 'iniciante') return 'Anfänger';
    if (normalized === 'intermediario') return 'Fortgeschritten';
    if (normalized === 'avancado') return 'Profi';

    const translatedProfileTextDe = value
      .replace(/Academia completa/gi, 'Vollausgestattetes Fitnessstudio')
      .replace(/Remo ergom[eé]trico/gi, 'RowErg')
      .replace(/Halteres e kettlebells/gi, 'Kurzhanteln und Kettlebells')
      .replace(/Corrida \(esteira ou pista\)/gi, 'Laufen (Laufband oder Bahn)');

    if (translatedProfileTextDe !== value) return translatedProfileTextDe;
    if (normalized.includes('forca + tecnica de corrida')) return 'Kraft + Lauftechnik';
    if (normalized.includes('tecnica e resistencia nas estacoes')) return 'Stationstechnik und Ausdauer';
    if (normalized.includes('corrida sob fadiga') && normalized.includes('simulado progressivo')) return 'Laufen unter Ermüdung · progressive Simulation';
    if (normalized.includes('corrida sob fadiga') && normalized.includes('treino hibrido')) return 'Laufen unter Ermüdung · Hybrid-Workout';
    if (normalized === 'descanso') return 'Ruhetag';
    if (normalized.includes('6 × 600 m') && normalized.includes('recuperacao')) return '6 × 600 m bei RPE 6–7/10, mit 90 Sekunden Erholung';
    if (normalized.includes('4 blocos:') && normalized.includes('burpee')) return '4 Blöcke: 600 m Lauf + Burpee Broad Jumps (30 m) + Rudern (600 m). Finde nach jeder Station wieder in dein Tempo; RPE 7/10.';
    if (normalized.includes('recupere-se') && normalized.includes('hidrate-se')) return 'Erhole dich, trinke ausreichend und priorisiere den Schlaf. Bei Bedarf kannst du einen lockeren Spaziergang oder leichte Mobilität ergänzen.';
  return value;
};

const localizeRunReference = (value?: string) => {
  if (!value) return en ? 'running benchmark' : isDe ? 'Lauf-Benchmark' : 'benchmark de corrida';
  if (!en && !isDe) return value;

  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (en) {
    if (normalized.includes('acima de 30')) return '5K over 30 min';
    if (normalized.includes('entre 22 e 30')) return '5K between 22 and 30 min';
    if (normalized.includes('abaixo de 22')) return '5K under 22 min';
    if (normalized.includes('comecando a correr')) return "I'm starting to run";
    return value;
  }
  if (normalized.includes('acima de 30')) return '5 km \u00fcber 30 Min';
  if (normalized.includes('entre 22 e 30')) return '5 km zwischen 22 und 30 Min';
  if (normalized.includes('abaixo de 22')) return '5 km unter 22 Min';
  if (normalized.includes('comecando a correr')) return 'Ich fange gerade an zu laufen';
  return value;
};

const levelLabels: Record<string, { en: string; de: string }> = {
  Iniciante: { en: 'Beginner', de: 'Anfänger' },
  Intermediário: { en: 'Intermediate', de: 'Fortgeschritten' },
  Avançado: { en: 'Advanced', de: 'Profi' },
};
const localizeLevel = (value: string) => en ? (levelLabels[value]?.en || value) : isDe ? (levelLabels[value]?.de || value) : value;

const equipmentLabels: Record<string, { en: string; de: string }> = {
  'Academia completa': { en: 'Full gym', de: 'Komplettes Fitnessstudio' },
  Sled: { en: 'Sled', de: 'Sled' },
  SkiErg: { en: 'SkiErg', de: 'SkiErg' },
  'Remo ergométrico': { en: 'Rowing machine', de: 'Rudergerät' },
  'Halteres e kettlebells': { en: 'Dumbbells and kettlebells', de: 'Kurzhanteln und Kettlebells' },
  'Corrida (esteira ou pista)': { en: 'Running (treadmill or track)', de: 'Laufen (Laufband oder Bahn)' },
  'Peso corporal': { en: 'Bodyweight', de: 'Körpergewicht' },
};
const localizeEquipment = (value: string) => en ? (equipmentLabels[value]?.en || value) : isDe ? (equipmentLabels[value]?.de || value) : value;

  const [selectedStatus, setSelectedStatus] = useState('Rx');
  const [viewedDate, setViewedDate] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('hybridtracker-selected-workout');
      if (saved) {
        const parsed = JSON.parse(saved) as WorkoutDay;
        if (parsed?.date) return parsed.date;
      }
    } catch { /* fall back to today */ }
    return toLocalDateKey();
  });
  const selectedWorkout = useMemo(
    () => state.workoutPlan.find((workout) => workout.date === viewedDate) || null,
    [state.workoutPlan, viewedDate]
  );
  const selectDay = (dateKey: string) => {
    setViewedDate(dateKey);
    const workout = state.workoutPlan.find((item) => item.date === dateKey);
    if (workout) localStorage.setItem('hybridtracker-selected-workout', JSON.stringify(workout));
    else localStorage.removeItem('hybridtracker-selected-workout');
  };
  const isRestDay = selectedWorkout?.type === 'rest';
  // The block-by-block breakdown below (warm-up + running intervals + stations + cool-down) and the
  // race-simulation Timer only match a real "hybrid" (running + stations) session. Strength, easy/quality
  // run and stations-only days get a simpler summary instead of this mismatched content.
  // The block-by-block breakdown below and the race-simulation Timer represent a fixed 8-station
  // Hyrox race in order (SkiErg, Sled Push, Sled Pull, ...). No generated daily session — including
  // hybrid days, which mix running with just 2 rotating stations — actually matches that sequence,
  // so it's never shown as "today's workout"; every day gets the accurate summary view instead.
  const showFullBreakdown = false;
  const intensityLabels: Record<string, string> = {
    low: tr('Leve', 'Light', 'Leicht'),
    moderate: tr('Moderada', 'Moderate', 'Moderat'),
    high: tr('Alta', 'High', 'Hoch'),
  };
  const isViewingToday = viewedDate === toLocalDateKey();
  const viewedDayLabel = useMemo(() => {
    const dateObj = new Date(`${viewedDate}T12:00:00`);
    const locale = en ? 'en-US' : isDe ? 'de-DE' : 'pt-BR';
    return dateObj.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' });
  }, [viewedDate, en, isDe]);
  const timerResult = useMemo(() => {
    try {
      const saved = localStorage.getItem('hybridtracker-last-timer');
      return saved ? JSON.parse(saved) as { elapsedSeconds: number; finishedAt: string } : null;
    } catch { return null; }
  }, []);
  const localProfile = useMemo(() => {
    try {
      const saved = localStorage.getItem('hybridtracker-athlete-profile');
      return saved ? JSON.parse(saved) as { goal: string; level: string; days: number; equipment: string[]; runReference: string; targetCompetitionDate?: string } : null;
    } catch {
      return null;
    }
  }, []);
  const [athleteProfile, setAthleteProfile] = useState(localProfile);
  const [actualRpe, setActualRpe] = useState(7);
  const [notes, setNotes] = useState('');
  const [logMessage, setLogMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dailyReadiness = useMemo(() => loadTodayReadiness(), []);
  const week = useMemo(() => {
    const todayKey = toLocalDateKey();
    const monday = startOfLocalWeek();
    const dayLabels = en ? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] : isDe ? ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'] : ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

    return dayLabels.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateKey = toLocalDateKey(date);
      const planned = state.workoutPlan.find((workout) => workout.date === dateKey);
      const status = dateKey === todayKey
        ? 'today'
        : planned?.completed
          ? 'done'
          : planned?.type === 'rest'
            ? 'rest'
            : dateKey < todayKey
              ? 'past'
              : 'next';

      return {
        day,
        date: String(date.getDate()),
        type: localizeSavedPlanText(planned?.title) || tr('Sem sessão', 'No session', 'Keine Einheit'),
        status,
        dateKey,
      };
    });
  }, [state.workoutPlan, en, isDe]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    client.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: cloudProfile } = await client.from('athlete_profiles').select('goal, level, training_days, equipment, run_reference, race_date').eq('user_id', data.user.id).maybeSingle();
      if (!cloudProfile) return;
      const normalized = { goal: cloudProfile.goal, level: cloudProfile.level, days: cloudProfile.training_days, equipment: cloudProfile.equipment || [], runReference: cloudProfile.run_reference || '', targetCompetitionDate: cloudProfile.race_date || '' };
      setAthleteProfile(normalized);
      localStorage.setItem('hybridtracker-athlete-profile', JSON.stringify(normalized));
    });
  }, []);

  const level = athleteProfile?.level || 'Intermediário';
  const { phase, weeksToRace } = useMemo(
    () => getPeriodizationPhase(athleteProfile?.goal, athleteProfile?.targetCompetitionDate),
    [athleteProfile?.goal, athleteProfile?.targetCompetitionDate]
  );
  const phaseLabels: Record<typeof phase, string> = {
    base: tr('Base', 'Base', 'Basis'),
    development: tr('Desenvolvimento', 'Development', 'Aufbau'),
    specificity: tr('Especificidade', 'Specificity', 'Spezifität'),
    taper: tr('Polimento', 'Taper', 'Tapering'),
  };
  const plannedRpe = selectedWorkout?.intensity === 'low' ? 4 : selectedWorkout?.intensity === 'high' ? 8 : level === 'Iniciante' ? 6 : level === 'Avançado' ? 8 : 7;
  const readinessRecommendation = dailyReadiness ? getReadinessRecommendation(dailyReadiness) : null;
  const suggestedRpe = Math.max(3, plannedRpe - (readinessRecommendation?.rpeReduction || 0));
  const rpe = `${suggestedRpe}/10`;
  const plannedMinutes = selectedWorkout ? (selectedWorkout.duration ?? 0) : (level === 'Iniciante' ? 45 : level === 'Avançado' ? 75 : 60);
  const adaptedMinutes = readinessRecommendation ? Math.round(plannedMinutes * readinessRecommendation.volumeFactor) : plannedMinutes;
  const sessionMinutes = String(Math.min(adaptedMinutes, dailyReadiness?.availableMinutes || plannedMinutes));
  const workoutName = localizeSavedPlanText(selectedWorkout?.title) || tr('Corrida + Estações', 'Running + Stations', 'Laufen + Stationen');
  const workoutDescription = localizeSavedPlanText(selectedWorkout?.description) || tr('Objetivo: sustentar qualidade técnica com frequência cardíaca elevada.', 'Goal: maintain technical quality at an elevated heart rate.', 'Ziel: technische Qualität bei erhöhter Herzfrequenz aufrechterhalten.');
  const hasSled = athleteProfile?.equipment.some((item) => item === 'Sled' || item === 'Academia completa') ?? true;
  const bodyweightOnly = athleteProfile ? !athleteProfile.equipment.some(item => ['Academia completa', 'Sled', 'SkiErg', 'Remo ergométrico', 'Halteres e kettlebells'].includes(item)) : false;
  const hasWeights = athleteProfile?.equipment.some((item) => item === 'Halteres e kettlebells' || item === 'Academia completa') ?? true;
  const baseVolume = level === 'Iniciante' ? { rounds: 3, runReps: 5, runDistance: 400, station: 8, load: 'leve' } : level === 'Avançado' ? { rounds: 5, runReps: 8, runDistance: 600, station: 12, load: 'alta' } : { rounds: 4, runReps: 6, runDistance: 600, station: 10, load: 'moderada' };
  const volumeFactor = readinessRecommendation?.volumeFactor || 1;
  const volumeByLevel = {
    rounds: Math.max(2, Math.round(baseVolume.rounds * volumeFactor)),
    run: `${Math.max(3, Math.round(baseVolume.runReps * volumeFactor))} × ${baseVolume.runDistance} m`,
    station: Math.max(5, Math.round(baseVolume.station * volumeFactor)),
    load: readinessRecommendation?.band === 'recovery' ? 'muito leve' : readinessRecommendation?.band === 'adjusted' ? 'leve a moderada' : baseVolume.load,
  };
  const englishLoad = volumeByLevel.load === 'muito leve' ? 'very light' : volumeByLevel.load === 'leve a moderada' ? 'light to moderate' : volumeByLevel.load === 'leve' ? 'light' : volumeByLevel.load === 'alta' ? 'high' : 'moderate';
  const germanLoad = volumeByLevel.load === 'muito leve' ? 'sehr leichte' : volumeByLevel.load === 'leve a moderada' ? 'leichte bis moderate' : volumeByLevel.load === 'leve' ? 'leichte' : volumeByLevel.load === 'alta' ? 'hohe' : 'moderate';
  const readinessTitle = readinessRecommendation
    ? readinessRecommendation.band === 'recovery'
      ? tr(readinessRecommendation.title, 'Recovery-focused session', 'Erholungsfokussierte Einheit')
      : readinessRecommendation.band === 'adjusted'
        ? tr(readinessRecommendation.title, 'Workout adjusted for today', 'Training für heute angepasst')
        : tr(readinessRecommendation.title, 'Ready for the planned workout', 'Bereit für das geplante Training')
    : tr('Treino ainda não ajustado ao seu dia', 'Workout not yet adjusted for your day', 'Training noch nicht an deinen Tag angepasst');
  const readinessDescription = readinessRecommendation
    ? readinessRecommendation.band === 'recovery'
      ? tr(readinessRecommendation.description, 'Your check-in indicates that reducing intensity and volume is the best choice today.', 'Dein Check-in zeigt, dass eine Reduzierung von Intensität und Umfang heute die beste Wahl ist.')
      : readinessRecommendation.band === 'adjusted'
        ? tr(readinessRecommendation.description, 'Your check-in suggests a controlled adjustment to intensity and volume today.', 'Dein Check-in legt heute eine kontrollierte Anpassung von Intensität und Umfang nahe.')
        : tr(readinessRecommendation.description, "Today's check-in supports keeping the session as planned.", 'Dein heutiges Check-in spricht dafür, die Einheit wie geplant durchzuziehen.')
    : tr(`A sugestão-base usa RPE ${rpe}, volume ${volumeByLevel.load} e movimentos compatíveis com os equipamentos informados.`, `The baseline suggestion uses RPE ${rpe}, ${englishLoad} volume and movements compatible with your available equipment.`, `Der Basisvorschlag nutzt RPE ${rpe}, ${germanLoad} Belastung und Bewegungen, die zu deinem verfügbaren Equipment passen.`);
  const stationTitle = hasSled ? 'Sled push + burpee broad jump' : hasWeights ? 'Farmer carry + burpee broad jump' : 'Bear crawl + burpee broad jump';
  const stationDetail = hasSled
    ? `${volumeByLevel.rounds} voltas: 20 m sled push com carga ${volumeByLevel.load} + ${volumeByLevel.station} burpee broad jumps.`
    : hasWeights
      ? `${volumeByLevel.rounds} voltas: 40 m farmer carry com carga ${volumeByLevel.load} + ${volumeByLevel.station} burpee broad jumps.`
      : `${volumeByLevel.rounds} voltas: 20 m bear crawl + ${Math.max(6, volumeByLevel.station - 2)} burpee broad jumps.`;
  const englishBlocks = [
    { icon: Activity, label: 'Warm-up', duration: '10 min', title: 'Mobility + running activation', detail: '2 rounds: 200 m easy, ankle mobility, 10 air squats and 8 inchworms.' },
    { icon: Route, label: 'Block 1 · running', duration: '24 min', title: 'Controlled running intervals', detail: 'RPE-guided intervals with 90 seconds of easy jogging recovery.' },
    { icon: Dumbbell, label: 'Block 2 · stations', duration: '18 min', title: stationTitle, detail: hasSled ? `${volumeByLevel.rounds} rounds: 20 m sled push with ${volumeByLevel.load} load + ${volumeByLevel.station} burpee broad jumps.` : hasWeights ? `${volumeByLevel.rounds} rounds: 40 m farmer carry with ${volumeByLevel.load} load + ${volumeByLevel.station} burpee broad jumps.` : `${volumeByLevel.rounds} rounds: 20 m bear crawl + ${Math.max(6, volumeByLevel.station - 2)} burpee broad jumps.` },
    { icon: HeartPulse, label: 'Cool-down', duration: '8 min', title: 'Cool-down and recovery', detail: 'Easy walking, nasal breathing and hip mobility.' },
  ];
  const germanBlocks = [
    { icon: Activity, label: 'Aufwärmen', duration: '10 min', title: 'Mobilität + Lauf-Aktivierung', detail: '2 Runden: 200 m locker, Knöchelmobilität, 10 Air Squats und 8 Inchworms.' },
    { icon: Route, label: 'Block 1 · Laufen', duration: '24 min', title: 'Kontrollierte Laufintervalle', detail: 'RPE-gesteuerte Intervalle mit 90 Sekunden lockerem Trab zur Erholung.' },
    { icon: Dumbbell, label: 'Block 2 · Stationen', duration: '18 min', title: stationTitle, detail: hasSled ? `${volumeByLevel.rounds} Runden: 20 m Sled Push mit ${germanLoad} Last + ${volumeByLevel.station} Burpee Broad Jumps.` : hasWeights ? `${volumeByLevel.rounds} Runden: 40 m Farmer Carry mit ${germanLoad} Last + ${volumeByLevel.station} Burpee Broad Jumps.` : `${volumeByLevel.rounds} Runden: 20 m Bärengang + ${Math.max(6, volumeByLevel.station - 2)} Burpee Broad Jumps.` },
    { icon: HeartPulse, label: 'Abkühlung', duration: '8 min', title: 'Abkühlung und Erholung', detail: 'Lockeres Gehen, Nasenatmung und Hüftmobilität.' },
  ];
  const blocks = (en ? englishBlocks : isDe ? germanBlocks : baseBlocks).map((block) => {
    if (en && block.label.includes('Block 1')) return { ...block, title: `${volumeByLevel.run} at a controlled pace`, detail: `RPE ${rpe} · 90 s easy jogging recovery. Pace guided by: ${localizeRunReference(athleteProfile?.runReference)}.` };
    if (isDe && block.label.includes('Block 1')) return { ...block, title: `${volumeByLevel.run} in kontrolliertem Tempo`, detail: `RPE ${rpe} · 90 s lockeres Traben zur Erholung. Tempo orientiert an: ${localizeRunReference(athleteProfile?.runReference)}.` };
    if (block.label.includes('Bloco 2')) return { ...block, title: stationTitle, detail: stationDetail };
    if (block.label.includes('Bloco 1')) return { ...block, title: `${volumeByLevel.run} em ritmo controlado`, detail: `RPE ${rpe} · recuperação de 90 s trotando. Ritmo orientado por: ${athleteProfile?.runReference || 'benchmark de corrida'}.` };
    return block;
  });
  const germanCompletionCopy: Record<string, { title: string; description: string }> = {
    Rx: { title: 'Wie vorgeschrieben abgeschlossen', description: 'Du hast alle Blöcke, Wiederholungen, Distanzen und Lasten genau wie beschrieben absolviert.' },
    Scaled: { title: 'Mit Anpassung abgeschlossen', description: 'Du hast das Ziel der Einheit erreicht, aber Last, Distanz, Wiederholungen oder eine Bewegung angepasst.' },
    Parcial: { title: 'Teilweise absolviert', description: 'Du hast die Einheit begonnen, aber nicht alle Blöcke oder das gesamte geplante Volumen absolviert.' },
    'Time Cap': { title: 'Zeitlimit erreicht', description: 'Du hast bis zum maximalen Zeitlimit trainiert und den erreichten Punkt beim Ablauf des Timers festgehalten.' },
  };
  const completionCopy: Record<string, { title: string; description: string }> = en ? {
    Rx: { title: 'Completed as prescribed', description: 'You completed every block, repetition, distance and load exactly as prescribed.' },
    Scaled: { title: 'Completed with adaptations', description: 'You preserved the session goal but adjusted load, distance, repetitions or a movement.' },
    Parcial: { title: 'Partially completed', description: 'You started the session but did not complete every block or the full planned volume.' },
    'Time Cap': { title: 'Time cap reached', description: 'You trained until the time limit and logged where you stopped when the timer ended.' },
  } : isDe ? germanCompletionCopy : completionDefinitions;
  const heroFocus = athleteProfile?.goal === 'Preparar uma competição'
    ? tr('sua preparação para a prova.', 'your race preparation.', 'deine Wettkampfvorbereitung.')
    : athleteProfile?.goal === 'Melhorar meu condicionamento'
      ? tr('seu condicionamento híbrido.', 'your hybrid fitness.', 'deine Hybrid-Fitness.')
      : tr('sua corrida sob fadiga.', 'your running under fatigue.', 'dein Laufen unter Ermüdung.');

  const saveWorkout = async () => {
    if (saving || saved) return;
    setSaving(true);
    setLogMessage('');
    const localLogs = JSON.parse(localStorage.getItem('hybridtracker-workout-logs') || '[]');
    const recentDuplicate = localLogs.some((item: { workout_name?: string; created_at?: string; workout_date?: string }) =>
      (item.workout_name === workoutName || (!selectedWorkout && item.workout_name === 'Engine + Stations'))
      && (!selectedWorkout || !item.workout_date || item.workout_date === selectedWorkout.date)
      && item.created_at
      && Date.now() - new Date(item.created_at).getTime() < 120000
    );
    if (recentDuplicate) {
      setLogMessage(tr('Este treino já foi registrado há poucos instantes. Nenhum registro duplicado foi criado.', 'This workout was logged a few moments ago. No duplicate entry was created.', 'Dieses Training wurde vor wenigen Momenten bereits registriert. Es wurde kein doppelter Eintrag erstellt.'));
      setSaving(false);
      setSaved(true);
      return;
    }
    const clientId = crypto.randomUUID();
    const log = {
      workout_date: selectedWorkout?.date || new Date().toISOString().slice(0, 10),
      workout_name: workoutName,
      completion_status: selectedStatus,
      planned_rpe: plannedRpe,
      actual_rpe: actualRpe,
      duration_minutes: timerResult?.elapsedSeconds ? Math.max(1, Math.round(timerResult.elapsedSeconds / 60)) : Number(sessionMinutes),
      notes,
      session_snapshot: { clientId, plannedDate: selectedWorkout?.date, workoutType: selectedWorkout?.type, level, equipment: athleteProfile?.equipment || [], stationTitle, run: volumeByLevel.run, dailyReadiness, suggestedRpe, suggestedMinutes: Number(sessionMinutes) },
    };
    localStorage.setItem('hybridtracker-workout-logs', JSON.stringify([{ ...log, created_at: new Date().toISOString() }, ...localLogs]));
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { error } = await supabase.from('workout_logs').insert({ ...log, user_id: data.user.id });
        setLogMessage(error ? `${tr('Treino salvo neste dispositivo. Sincronização pendente:', 'Workout saved on this device. Sync pending:', 'Training auf diesem Gerät gespeichert. Synchronisierung ausstehend:')} ${error.message}` : tr('Treino registrado e sincronizado com sucesso.', 'Workout logged and synced successfully.', 'Training erfolgreich registriert und synchronisiert.'));
        setSaved(true);
        setSaving(false);
        if (selectedWorkout) updateWorkout(selectedWorkout.date, { completed: true });
        localStorage.removeItem('hybridtracker-last-timer');
        return;
      }
    }
    setLogMessage(tr('Treino registrado neste dispositivo.', 'Workout logged on this device.', 'Training auf diesem Gerät registriert.'));
    setSaved(true);
    setSaving(false);
    if (selectedWorkout) updateWorkout(selectedWorkout.date, { completed: true });
    localStorage.removeItem('hybridtracker-last-timer');
  };

  return (
    <div className="min-h-screen bg-[#090909] pb-24 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(249,115,22,.18),transparent_34%),radial-gradient(circle_at_10%_80%,rgba(249,115,22,.08),transparent_28%)]" />
        <div className="container relative px-4 py-10 md:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[.18em] text-orange-300">
                  <Sparkles className="h-3.5 w-3.5" /> {tr('Planejamento inteligente', 'Smart planning', 'Intelligente Planung')}
                </span>
                {weeksToRace !== null && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.04] px-3 py-1 text-xs font-bold uppercase tracking-[.18em] text-zinc-300">
                    <CalendarDays className="h-3.5 w-3.5" /> {phaseLabels[phase]} · {weeksToRace <= 0 ? tr('semana da prova', 'race week', 'Wettkampfwoche') : tr(`${weeksToRace} semanas para a prova`, `${weeksToRace} weeks to race`, `noch ${weeksToRace} Wochen`)}
                  </span>
                )}
              </div>
              <p className="mb-2 text-sm font-semibold text-zinc-400">{isViewingToday ? tr('Sua sugestão de hoje · nível', "Today's suggestion · level", 'Dein heutiger Vorschlag · Level') : tr(`Sugestão para ${viewedDayLabel} · nível`, `Suggestion for ${viewedDayLabel} · level`, `Vorschlag für ${viewedDayLabel} · Level`)} {en ? ({ Iniciante: 'beginner', Intermediário: 'intermediate', Avançado: 'advanced' }[level] || level.toLowerCase()) : isDe ? ({ Iniciante: 'Anfänger', Intermediário: 'Fortgeschritten', Avançado: 'Profi' }[level] || level) : level.toLowerCase()}</p>
              {isRestDay ? (
                <>
                  <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                    {isViewingToday ? tr('Hoje é dia de', 'Today is a', 'Heute ist ein') : tr(`${viewedDayLabel} é dia de`, `${viewedDayLabel} is a`, `${viewedDayLabel} ist ein`)} <span className="text-orange-500">{tr('descanso', 'rest day', 'Ruhetag')}</span>
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">{workoutDescription}</p>
                </>
              ) : showFullBreakdown ? (
                <>
                  <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                    {isViewingToday ? tr('Hoje você desenvolve', 'Today you develop', 'Heute entwickelst du') : tr(`Em ${viewedDayLabel}, você desenvolve`, `On ${viewedDayLabel}, you develop`, `Am ${viewedDayLabel} entwickelst du`)} <span className="text-orange-500">{heroFocus}</span>
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
                    {tr('Sugestão de sessão com corrida intervalada e estações, considerando seu nível, objetivo e equipamentos disponíveis. Você mantém o controle e pode editar tudo antes de começar.', 'A suggested session with interval running and stations, tailored to your level, goal and available equipment. You stay in control and can edit everything before you start.', 'Ein Sitzungsvorschlag mit Intervalllauf und Stationen, abgestimmt auf dein Level, dein Ziel und dein verfügbares Equipment. Du behältst die Kontrolle und kannst alles bearbeiten, bevor du startest.')}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{workoutName}</h1>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">{workoutDescription}</p>
                </>
              )}
            </div>
            {showFullBreakdown && (
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[.035] p-3 backdrop-blur">
              <Metric value={sessionMinutes} label="min" />
              <Metric value={rpe} label={<span className="flex items-center justify-center gap-1">{suggestedRpe === plannedRpe ? 'RPE' : `RPE · prev. ${plannedRpe}`}<RpeHelp /></span>} />
              <Metric value={level === 'Iniciante' ? tr('Leve', 'Light', 'Leicht') : level === 'Avançado' ? tr('Alta', 'High', 'Hoch') : tr('Média', 'Medium', 'Mittel')} label={tr('carga', 'load', 'Belastung')} />
            </div>
            )}
          </div>
          <Link to="/configurar" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-orange-400 hover:text-orange-300">{tr('Configurar meu perfil e minha semana', 'Set up my profile and week', 'Mein Profil und meine Woche einrichten')} <ArrowRight className="h-4 w-4" /></Link>
          {athleteProfile && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
              <span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5">{athleteProfile.days} {tr('dias/semana', 'days/week', 'Tage/Woche')}</span>
              <span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5">{localizeLevel(athleteProfile.level)}</span>
              <span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5">{athleteProfile.equipment.map(localizeEquipment).join(' · ')}</span>
              <span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5">{localizeRunReference(athleteProfile.runReference)}</span>
            </div>
          )}
          {bodyweightOnly && <div className="mt-4 flex max-w-3xl gap-3 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm leading-relaxed text-sky-200"><Info className="mt-0.5 h-5 w-5 shrink-0" /><p><strong>Plano adaptado ao equipamento disponível:</strong> como não há estações ou cargas selecionadas, você recebe sessões com corrida, caso marcada, e movimentos que não exigem equipamentos. Caso passe a ter acesso a trenó, SkiErg, remo, halteres ou kettlebells, atualize seu perfil e gere um novo plano para incluí-los. As adaptações contribuem para o condicionamento geral, mas não reproduzem todas as estações da competição.</p></div>}
        </div>
      </section>

      <main className="container space-y-10 px-4 py-8">
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-500">{tr('Semana atual', 'Current week', 'Aktuelle Woche')}</p>
              <h2 className="mt-1 text-2xl font-bold">{tr('Sua semana de treinamento', 'Your training week', 'Deine Trainingswoche')}</h2>
            </div>
            <button className="hidden items-center gap-1 text-sm font-semibold text-zinc-400 hover:text-white sm:flex">{tr('Ver plano', 'View plan', 'Plan ansehen')} <ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {week.map((item) => {
              const isViewed = item.dateKey === viewedDate;
              return (
                <button
                  type="button"
                  key={item.dateKey}
                  onClick={() => selectDay(item.dateKey)}
                  className={`rounded-2xl border p-3 text-left transition ${isViewed ? 'border-orange-500 bg-orange-500/12 shadow-[0_0_28px_rgba(249,115,22,.12)]' : 'border-white/10 bg-white/[.025] hover:border-orange-500/35'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider text-zinc-500">{item.day}</span>
                    {item.status === 'done' && <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-black"><Check className="h-3 w-3" /></span>}
                    {item.status === 'today' && !isViewed && <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_10px_#f97316]" title={tr('Hoje', 'Today', 'Heute')} />}
                  </div>
                  <p className="mt-4 text-2xl font-black">{item.date}</p>
                  <p className={`mt-1 truncate text-xs ${isViewed ? 'font-bold text-orange-300' : 'text-zinc-500'}`}>{item.type}</p>
                </button>
              );
            })}
          </div>
        </section>

        {isRestDay ? (
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#111] p-8 text-center sm:p-12">
            <HeartPulse className="mx-auto h-10 w-10 text-orange-400" />
            <h2 className="mt-4 text-2xl font-black sm:text-3xl">{isViewingToday ? tr('Hoje é dia de descanso', 'Today is a rest day', 'Heute ist Ruhetag') : tr(`${viewedDayLabel} é dia de descanso`, `${viewedDayLabel} is a rest day`, `${viewedDayLabel} ist ein Ruhetag`)}</h2>
            <p className="mx-auto mt-2 max-w-lg text-zinc-400">{workoutDescription}</p>
            <Link to="/recovery" className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 font-black text-black transition hover:bg-orange-400">
              {tr('Ver recuperação ativa', 'See active recovery', 'Aktive Erholung ansehen')} <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        ) : (
        <section className="grid gap-6 lg:grid-cols-[1.45fr_.55fr]">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111]">
            <div className="flex flex-col gap-4 border-b border-white/10 bg-gradient-to-r from-orange-500/15 to-transparent p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-orange-400"><CalendarDays className="h-4 w-4" /> {isViewingToday ? tr('Sugestão para hoje', "Today's suggestion", 'Vorschlag für heute') : tr(`Sugestão para ${viewedDayLabel}`, `Suggestion for ${viewedDayLabel}`, `Vorschlag für ${viewedDayLabel}`)}</div>
                <h2 className="text-2xl font-black">{workoutName}</h2>
                <p className="mt-1 text-sm text-zinc-400">{workoutDescription}</p>
              </div>
              {showFullBreakdown && (
                <Link to="/timer" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 font-black text-black transition hover:bg-orange-400">
                  <Play className="h-4 w-4 fill-current" /> {tr('Iniciar treino', 'Start workout', 'Training starten')}
                </Link>
              )}
            </div>
            {showFullBreakdown ? (
              <div className="divide-y divide-white/10 px-6">
                {blocks.map((block, index) => (
                  <div key={block.title} className="grid gap-4 py-5 sm:grid-cols-[44px_1fr_auto] sm:items-center">
                    <div className="grid h-11 w-11 place-items-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400"><block.icon className="h-5 w-5" /></div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[.14em] text-zinc-500">{index + 1}. {block.label}</p>
                      <h3 className="mt-1 font-bold">{block.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-400">{block.detail}</p>
                    </div>
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300"><Clock3 className="h-3.5 w-3.5" /> {block.duration}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 px-6 py-6">
                {typeof selectedWorkout?.duration === 'number' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300"><Clock3 className="h-3.5 w-3.5" /> {selectedWorkout.duration} min</span>
                )}
                {selectedWorkout?.intensity && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300"><Gauge className="h-3.5 w-3.5" /> {intensityLabels[selectedWorkout.intensity] || selectedWorkout.intensity}</span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-orange-500/25 bg-gradient-to-br from-orange-500/14 to-transparent p-6">
              <div className="flex items-center gap-2 text-orange-400"><Gauge className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[.15em]">{tr('Por que esta sessão?', 'Why this session?', 'Warum diese Einheit?')}</span></div>
              <h3 className="mt-4 text-xl font-bold">{readinessTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{readinessDescription}</p>
              {dailyReadiness ? <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-400"><strong className="text-white">{tr('Dados de hoje:', "Today's data:", 'Heutige Daten:')}</strong> {tr('Sono', 'Sleep', 'Schlaf')} {dailyReadiness.sleep}/10 · {tr('Dor', 'Pain', 'Schmerz')} {dailyReadiness.pain}/10 · {tr('Energia', 'Energy', 'Energie')} {dailyReadiness.energy}/10 · {dailyReadiness.availableMinutes} {tr('min disponíveis', 'min available', 'min verfügbar')}<br/><span className="mt-1 block text-orange-300">{tr('Índice', 'Readiness', 'Bereitschaft')} {dailyReadiness.readiness}% · {tr('RPE planejado', 'planned RPE', 'geplantes RPE')} {plannedRpe}/10 → {tr('sugerido', 'suggested', 'empfohlen')} {suggestedRpe}/10 · {tr('duração até', 'duration up to', 'Dauer bis')} {sessionMinutes} min</span></div> : <div className="mt-5 rounded-xl border border-orange-500/20 bg-orange-500/10 p-3 text-xs text-orange-200">{tr('Faça o check-in para considerar sono, energia, dor e tempo disponível antes de iniciar.', 'Complete your check-in so sleep, energy, pain and available time can be considered before you start.', 'Mach deinen Check-in, damit Schlaf, Energie, Schmerz und verfügbare Zeit vor dem Start berücksichtigt werden können.')}</div>}
              <Link to="/recovery" className="mt-3 block w-full rounded-xl border border-orange-500/30 px-3 py-2.5 text-center text-sm font-bold text-orange-300 transition hover:bg-orange-500/10">{dailyReadiness ? tr('Atualizar check-in ou editar sessão', 'Update check-in or edit session', 'Check-in aktualisieren oder Einheit bearbeiten') : tr('Fazer check-in diário', 'Complete daily check-in', 'Täglichen Check-in durchführen')}</Link>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#111] p-6">
              <p className="text-xs font-bold uppercase tracking-[.15em] text-zinc-500">{tr('Como você realizou?', 'How did you complete it?', 'Wie hast du es absolviert?')}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {['Rx', 'Scaled', 'Parcial', 'Time Cap'].map(status => (
                  <button key={status} onClick={() => setSelectedStatus(status)} className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${selectedStatus === status ? 'border-orange-500 bg-orange-500 text-black' : 'border-white/10 bg-white/[.025] text-zinc-400 hover:border-orange-500/40'}`}>{en && status === 'Parcial' ? 'Partial' : isDe && status === 'Parcial' ? 'Teilweise' : status}</button>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-bold text-white">{completionCopy[selectedStatus].title}</p>
                <p className="mt-1 flex gap-2 text-xs leading-relaxed text-zinc-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {completionCopy[selectedStatus].description}</p>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-zinc-600"><strong className="text-zinc-400">{tr('Resumo:', 'Summary:', 'Zusammenfassung:')}</strong> {tr('Rx = como prescrito · Scaled = adaptado · Parcial = parte da sessão · Time Cap = limite de tempo.', 'Rx = as prescribed · Scaled = adapted · Partial = part of the session · Time Cap = time limit reached.', 'Rx = wie vorgeschrieben · Scaled = angepasst · Teilweise = Teil der Einheit · Time Cap = Zeitlimit erreicht.')}</p>
              <div className="mt-4 border-t border-white/10 pt-4">
                {timerResult?.elapsedSeconds && <p className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">{tr('Cronômetro concluído:', 'Timer completed:', 'Timer abgeschlossen:')} {Math.floor(timerResult.elapsedSeconds / 60)} min {timerResult.elapsedSeconds % 60} s. {tr('Esse tempo será usado no histórico.', 'This time will be used in your history.', 'Diese Zeit wird in deinem Verlauf verwendet.')}</p>}
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">{tr('RPE realizado:', 'Completed RPE:', 'Erreichtes RPE:')} <span className="text-orange-400">{actualRpe}/10</span><RpeHelp /></label>
                <input type="range" min="1" max="10" value={actualRpe} onChange={(event) => setActualRpe(Number(event.target.value))} className="mt-2 w-full accent-orange-500" />
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={tr('Observações do treino (opcional)', 'Workout notes (optional)', 'Trainingsnotizen (optional)')} className="mt-3 min-h-20 w-full rounded-xl border border-white/10 bg-black/25 p-3 text-sm outline-none placeholder:text-zinc-600 focus:border-orange-500/50" />
                <button onClick={saveWorkout} disabled={saving || saved} className="mt-3 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">{saving ? tr('Registrando...', 'Logging...', 'Wird registriert...') : saved ? tr('Treino registrado', 'Workout logged', 'Training registriert') : tr('Registrar treino', 'Log workout', 'Training registrieren')}</button>
                {logMessage && <p className="mt-3 text-xs leading-relaxed text-emerald-400">{logMessage}</p>}
              </div>
            </div>
          </div>
        </section>
        )}

        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-500">{tr('Aprenda antes de executar', 'Learn before you perform', 'Lerne, bevor du ausführst')}</p>
              <h2 className="mt-1 text-2xl font-bold">{tr('Biblioteca de movimentos', 'Movement library', 'Bewegungsbibliothek')}</h2>
            </div>
            <Link to="/biblioteca" className="hidden items-center gap-1 text-sm font-semibold text-zinc-400 hover:text-white sm:flex">{tr('Ver biblioteca', 'View library', 'Bibliothek ansehen')} <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {movements.map(movement => (
              <Link to="/biblioteca" key={movement.name} className={`group relative min-h-48 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${movement.accent} to-[#101010] p-5`}>
                <div className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/40 transition group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-black"><CirclePlay className="h-5 w-5" /></div>
                <div className="absolute bottom-5 left-5">
                  <Video className="mb-7 h-7 w-7 text-white/25" />
                  <h3 className="font-black">{movement.name}</h3>
                  <p className="mt-1 text-xs text-zinc-400">{tr(movement.meta.pt, movement.meta.en, movement.meta.de)}</p>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-orange-500 transition group-hover:scale-x-100" />
              </Link>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-orange-500/25 bg-gradient-to-r from-orange-950/55 via-[#16100d] to-[#0d0d0d] p-6 md:p-9">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-2 text-orange-400"><TrendingUp className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[.16em]">{tr('Insights dos seus registros', 'Insights from your records', 'Erkenntnisse aus deinen Aufzeichnungen')}</span></div>
              <h2 className="text-2xl font-black md:text-3xl">{tr('Evolução orientada por dados, decisões sempre suas.', 'Data-guided progress, with every decision in your hands.', 'Datengestützter Fortschritt, jede Entscheidung liegt bei dir.')}</h2>
              <p className="mt-3 leading-relaxed text-zinc-400">{tr('O HybridTracker conecta consistência, percepção de esforço, benchmarks e resultados para mostrar padrões úteis. Você decide como organizar a preparação, pode editar qualquer sugestão e mantém seu histórico em um só lugar.', 'HybridTracker connects consistency, perceived effort, benchmarks and results to reveal useful patterns. You decide how to organize your preparation, can edit any suggestion and keep your entire history in one place.', 'HybridTracker verbindet Konsistenz, wahrgenommene Anstrengung, Benchmarks und Ergebnisse, um nützliche Muster aufzuzeigen. Du entscheidest, wie du deine Vorbereitung organisierst, kannst jeden Vorschlag bearbeiten und behältst deinen gesamten Verlauf an einem Ort.')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm text-zinc-300">
              <p className="mb-3 font-bold text-white">{tr('Esta semana', 'This week', 'Diese Woche')}</p>
              <ul className="space-y-2">
                {(en ? ['4 organized sessions', '82% adherence', 'Average RPE 6.8', 'Running: positive trend'] : isDe ? ['4 organisierte Einheiten', '82% Adhärenz', 'Durchschnittliches RPE 6,8', 'Laufen: positiver Trend'] : ['4 sessões organizadas', '82% de aderência', 'RPE médio 6,8', 'Corrida: tendência positiva']).map(item => <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-orange-500" /> {item}</li>)}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: ReactNode }) {
  return <div className="min-w-20 rounded-xl bg-black/25 px-3 py-3 text-center"><p className="text-lg font-black text-white">{value}</p><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p></div>;
}
