import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Calendar, Check, Dumbbell, Flag, Gauge, Info, Route, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { getWeeksToRace } from '@/lib/periodization';

type Profile = { goal: string; level: string; days: number; equipment: string[]; runReference: string; targetCompetitionDate: string };
type PlanItem = { day: string; dayEn: string; dayDe: string; title: string; titleEn: string; titleDe: string; focus: string; focusEn: string; focusDe: string };
type Choice = { value: string; label: string; desc: string; icon: typeof Flag };

const planByDays: Record<number, PlanItem[]> = {
  3: [
    { day: 'TER', dayEn: 'TUE', dayDe: 'DI', title: 'Corrida de qualidade', titleEn: 'Quality run', titleDe: 'Intensiver Lauf', focus: 'Intervalos ou limiar', focusEn: 'Intervals or threshold', focusDe: 'Intervalle oder Schwelle' },
    { day: 'QUI', dayEn: 'THU', dayDe: 'DO', title: 'Força + estações', titleEn: 'Strength + stations', titleDe: 'Kraft + Stationen', focus: 'Técnica e resistência', focusEn: 'Technique and endurance', focusDe: 'Technik und Ausdauer' },
    { day: 'SÁB', dayEn: 'SAT', dayDe: 'SA', title: 'Sessão híbrida', titleEn: 'Hybrid session', titleDe: 'Hybrid-Einheit', focus: 'Corrida sob fadiga', focusEn: 'Running under fatigue', focusDe: 'Laufen unter Ermüdung' },
  ],
  4: [
    { day: 'SEG', dayEn: 'MON', dayDe: 'MO', title: 'Força', titleEn: 'Strength', titleDe: 'Kraft', focus: 'Base estrutural', focusEn: 'Structural foundation', focusDe: 'Strukturelle Grundlage' },
    { day: 'QUA', dayEn: 'WED', dayDe: 'MI', title: 'Corrida de qualidade', titleEn: 'Quality run', titleDe: 'Intensiver Lauf', focus: 'Intervalos ou limiar', focusEn: 'Intervals or threshold', focusDe: 'Intervalle oder Schwelle' },
    { day: 'SEX', dayEn: 'FRI', dayDe: 'FR', title: 'Estações', titleEn: 'Stations', titleDe: 'Stationen', focus: 'Técnica e eficiência', focusEn: 'Technique and efficiency', focusDe: 'Technik und Effizienz' },
    { day: 'SÁB', dayEn: 'SAT', dayDe: 'SA', title: 'Sessão híbrida', titleEn: 'Hybrid session', titleDe: 'Hybrid-Einheit', focus: 'Corrida sob fadiga', focusEn: 'Running under fatigue', focusDe: 'Laufen unter Ermüdung' },
  ],
  5: [
    { day: 'SEG', dayEn: 'MON', dayDe: 'MO', title: 'Força', titleEn: 'Strength', titleDe: 'Kraft', focus: 'Base estrutural', focusEn: 'Structural foundation', focusDe: 'Strukturelle Grundlage' },
    { day: 'TER', dayEn: 'TUE', dayDe: 'DI', title: 'Corrida leve', titleEn: 'Easy run', titleDe: 'Lockerer Lauf', focus: 'Base aeróbica', focusEn: 'Aerobic base', focusDe: 'Aerobe Basis' },
    { day: 'QUI', dayEn: 'THU', dayDe: 'DO', title: 'Corrida de qualidade', titleEn: 'Quality run', titleDe: 'Intensiver Lauf', focus: 'Intervalos ou limiar', focusEn: 'Intervals or threshold', focusDe: 'Intervalle oder Schwelle' },
    { day: 'SEX', dayEn: 'FRI', dayDe: 'FR', title: 'Estações', titleEn: 'Stations', titleDe: 'Stationen', focus: 'Técnica e eficiência', focusEn: 'Technique and efficiency', focusDe: 'Technik und Effizienz' },
    { day: 'SÁB', dayEn: 'SAT', dayDe: 'SA', title: 'Sessão híbrida', titleEn: 'Hybrid session', titleDe: 'Hybrid-Einheit', focus: 'Corrida sob fadiga', focusEn: 'Running under fatigue', focusDe: 'Laufen unter Ermüdung' },
  ],
};

export default function AthleteSetup() {
  const navigate = useNavigate();
  const { markSetupComplete } = useAuth();
  const { generatePlan } = useApp();
  const { lang } = useI18n();
  const en = lang === 'en';
  const de = lang === 'de';
  const tr = (pt: string, english: string, german: string) => en ? english : lang === 'de' ? german : pt;
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const saved = localStorage.getItem('hybridtracker-athlete-profile');
      if (saved) {
        const current = JSON.parse(saved) as Profile;
        const equipment = current.equipment.includes('Somente peso corporal e corrida') ? ['Peso corporal', 'Corrida (esteira ou pista)'] : current.equipment;
        return { ...current, equipment, targetCompetitionDate: current.targetCompetitionDate || '' };
      }
    } catch { /* start with an empty profile */ }
    return { goal: '', level: '', days: 4, equipment: [], runReference: '', targetCompetitionDate: '' };
  });
  const isCompetitionGoal = profile.goal === 'Preparar uma competição';
  const stepKeys = useMemo(() => ['goal', ...(isCompetitionGoal ? ['raceDate'] : []), 'level', 'days', 'equipment', 'runReference'], [isCompetitionGoal]);
  const stepsByKey: Record<string, { title: string; subtitle: string }> = {
    goal: { title: tr('Seu objetivo', 'Your goal', 'Dein Ziel'), subtitle: tr('O que você quer organizar primeiro?', 'What would you like to focus on first?', 'Womit möchtest du zuerst starten?') },
    raceDate: { title: tr('Data da sua prova', 'Your race date', 'Dein Wettkampftermin'), subtitle: tr('Vamos organizar seu treino de trás para frente, a partir dessa data.', "We'll build your training backward from this date.", 'Wir planen dein Training rückwärts, ausgehend von diesem Termin.') },
    level: { title: tr('Sua experiência', 'Your experience', 'Deine Erfahrung'), subtitle: tr('Escolha a descrição mais próxima do seu momento.', 'Choose the option that best describes you right now.', 'Wähle die Beschreibung, die gerade am besten zu dir passt.') },
    days: { title: tr('Sua disponibilidade', 'Your availability', 'Deine Verfügbarkeit'), subtitle: tr('Quantos dias por semana deseja reservar?', 'How many days per week can you train?', 'Wie viele Tage pro Woche willst du einplanen?') },
    equipment: { title: tr('Seus equipamentos', 'Your equipment', 'Deine Ausrüstung'), subtitle: tr('Marque tudo o que costuma ter disponível.', 'Select everything you usually have available.', 'Wähle alles aus, was dir normalerweise zur Verfügung steht.') },
    runReference: { title: tr('Referência de corrida', 'Running benchmark', 'Lauf-Referenzwert'), subtitle: tr('Uma referência simples ajuda a calibrar as sugestões.', 'A simple benchmark helps us tailor your recommendations.', 'Ein einfacher Referenzwert hilft uns, deine Empfehlungen anzupassen.') },
  };
  const steps = stepKeys.map(key => stepsByKey[key]);
  const currentStepKey = stepKeys[Math.min(step, stepKeys.length - 1)];
  const suggestedPlan = useMemo(() => planByDays[profile.days], [profile.days]);
  const hasStationEquipment = profile.equipment.some(item => ['Academia completa', 'Sled', 'SkiErg', 'Remo ergométrico', 'Halteres e kettlebells'].includes(item));
  const usesNoStationEquipment = profile.equipment.length > 0 && !hasStationEquipment;
  const canContinueByKey: Record<string, unknown> = {
    goal: profile.goal, raceDate: profile.targetCompetitionDate, level: profile.level,
    days: profile.days, equipment: profile.equipment.length, runReference: profile.runReference,
  };
  const canContinue = canContinueByKey[currentStepKey];
  const weeksToRace = getWeeksToRace(profile.targetCompetitionDate);
  const choose = (key: keyof Profile, value: Profile[keyof Profile]) => setProfile(current => ({ ...current, [key]: value }));
  const toggleEquipment = (item: string) => setProfile(current => {
    if (item === 'Academia completa') return { ...current, equipment: current.equipment.includes(item) ? [] : ['Academia completa', 'Sled', 'SkiErg', 'Remo ergométrico', 'Halteres e kettlebells', 'Corrida (esteira ou pista)'] };
    const options = current.equipment.filter(value => value !== 'Academia completa' && value !== 'Somente peso corporal e corrida');
    return { ...current, equipment: options.includes(item) ? options.filter(value => value !== item) : [...options, item] };
  });

  const next = async () => {
    if (step < steps.length - 1) return setStep(step + 1);
    localStorage.setItem('hybridtracker-athlete-profile', JSON.stringify(profile));
    setSaving(true);
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const payload: Record<string, unknown> = { user_id: data.user.id, goal: profile.goal, level: profile.level, training_days: profile.days, equipment: profile.equipment, run_reference: profile.runReference, updated_at: new Date().toISOString() };
        if (profile.targetCompetitionDate) payload.race_date = profile.targetCompetitionDate;
        const { error } = await supabase.from('athlete_profiles').upsert(payload);
        // The race_date column may not exist yet in older databases; retry without it so the
        // rest of the profile still syncs to the cloud instead of the whole upsert failing.
        if (error && payload.race_date) {
          const { race_date: _raceDate, ...fallbackPayload } = payload;
          await supabase.from('athlete_profiles').upsert(fallbackPayload);
        }
      }
    }
    generatePlan();
    setSaving(false);
    markSetupComplete();
    setFinished(true);
  };

  const goals: Choice[] = [
    { value: 'Preparar uma competição', label: tr('Preparar uma competição', 'Prepare for a competition', 'Auf einen Wettkampf vorbereiten'), desc: tr('Organizar a jornada até a prova', 'Build your journey to race day', 'Deinen Weg bis zum Wettkampftag planen'), icon: Flag },
    { value: 'Melhorar meu condicionamento', label: tr('Melhorar meu condicionamento', 'Improve my fitness', 'Meine Fitness verbessern'), desc: tr('Evoluir corrida, força e resistência', 'Improve running, strength and endurance', 'Laufen, Kraft und Ausdauer verbessern'), icon: Gauge },
    { value: 'Treinar de forma híbrida', label: tr('Treinar de forma híbrida', 'Train hybrid', 'Hybrid trainieren'), desc: tr('Manter uma rotina mais completa', 'Build a more complete routine', 'Eine vielseitigere Routine aufbauen'), icon: Sparkles },
  ];
  const levels: Choice[] = [
    { value: 'Iniciante', label: tr('Iniciante', 'Beginner', 'Anfänger'), desc: tr('Estou começando ou voltando agora', 'I am starting or returning to training', 'Ich fange gerade an oder steige wieder ein'), icon: Route },
    { value: 'Intermediário', label: tr('Intermediário', 'Intermediate', 'Fortgeschritten'), desc: tr('Já treino com regularidade', 'I already train consistently', 'Ich trainiere schon regelmäßig'), icon: Dumbbell },
    { value: 'Avançado', label: tr('Avançado', 'Advanced', 'Profi'), desc: tr('Tenho experiência em provas e treinos híbridos', 'I have experience with races and hybrid training', 'Ich habe Erfahrung mit Wettkämpfen und Hybrid-Training'), icon: Gauge },
  ];
  const runOptions: Choice[] = [
    { value: 'Estou começando a correr', label: tr('Estou começando a correr', 'I am new to running', 'Ich fange gerade mit dem Laufen an'), desc: tr('Ainda não tenho tempo de referência', 'I do not have a benchmark yet', 'Ich habe noch keinen Referenzwert'), icon: Route },
    { value: '5 km acima de 30 min', label: tr('5 km acima de 30 min', '5K over 30 minutes', '5 km über 30 Minuten'), desc: tr('Ritmo atual acima de 6:00/km', 'Current pace slower than 6:00/km', 'Aktuelles Tempo langsamer als 6:00/km'), icon: Route },
    { value: '5 km entre 22 e 30 min', label: tr('5 km entre 22 e 30 min', '5K between 22 and 30 minutes', '5 km zwischen 22 und 30 Minuten'), desc: tr('Ritmo atual entre 4:24 e 6:00/km', 'Current pace between 4:24 and 6:00/km', 'Aktuelles Tempo zwischen 4:24 und 6:00/km'), icon: Route },
    { value: '5 km abaixo de 22 min', label: tr('5 km abaixo de 22 min', '5K under 22 minutes', '5 km unter 22 Minuten'), desc: tr('Ritmo atual abaixo de 4:24/km', 'Current pace faster than 4:24/km', 'Aktuelles Tempo schneller als 4:24/km'), icon: Route },
  ];
  const equipment = [
    ['Academia completa', tr('Academia completa', 'Full gym', 'Komplettes Fitnessstudio'), tr('Marca automaticamente trenó, SkiErg, remo, halteres e kettlebells.', 'Automatically selects sled, SkiErg, rower, dumbbells and kettlebells.', 'Wählt automatisch Sled, SkiErg, Rudergerät, Kurzhanteln und Kettlebells aus.')],
    ['Sled', 'Sled', tr('Trenó para empurrar e puxar.', 'Sled for pushing and pulling.', 'Sled zum Schieben und Ziehen.')],
    ['SkiErg', 'SkiErg', tr('Ergômetro de esqui.', 'Ski ergometer.', 'Ski-Ergometer.')],
    ['Remo ergométrico', tr('Remo ergométrico', 'Rowing machine', 'Rudergerät'), tr('Equipamento de remo indoor.', 'Indoor rowing machine.', 'Rudergerät für drinnen.')],
    ['Halteres e kettlebells', tr('Halteres e kettlebells', 'Dumbbells and kettlebells', 'Kurzhanteln und Kettlebells'), tr('Cargas livres para força e transporte.', 'Free weights for strength and carries.', 'Freie Gewichte für Kraft und Carries.')],
    ['Corrida (esteira ou pista)', tr('Corrida (esteira ou pista)', 'Running (treadmill or track)', 'Laufen (Laufband oder Bahn)'), tr('Pode ser combinada com qualquer estação ou equipamento.', 'Can be combined with any station or equipment.', 'Kann mit jeder Station oder Ausrüstung kombiniert werden.')],
    ['Peso corporal', tr('Peso corporal', 'Bodyweight', 'Körpergewicht'), tr('Movimentos que não exigem equipamentos.', 'Movements that require no equipment.', 'Übungen, für die keine Ausrüstung nötig ist.')],
  ];

  if (finished) return <div className="min-h-[calc(100vh-3.5rem)] bg-[#090909] px-4 py-12 text-white"><div className="mx-auto max-w-5xl">
    <div className="mb-8 max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[.15em] text-emerald-400"><Check className="h-4 w-4" /> {tr('Perfil configurado', 'Profile complete', 'Profil eingerichtet')}</div><h1 className="text-4xl font-black">{tr('Sua primeira semana está organizada.', 'Your first week is ready.', 'Deine erste Woche ist fertig geplant.')}</h1><p className="mt-3 text-zinc-400">{tr('Esta é uma sugestão inicial baseada nas informações fornecidas. Você poderá trocar dias, sessões e intensidade.', 'This initial plan is based on your answers. You can adjust training days, sessions and intensity anytime.', 'Dies ist ein erster Vorschlag basierend auf deinen Angaben. Du kannst Trainingstage, Einheiten und Intensität jederzeit anpassen.')}</p></div>
    <div className={`grid gap-3 ${profile.days === 5 ? 'lg:grid-cols-5' : profile.days === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>{suggestedPlan.map((item, index) => <article key={item.day} className="rounded-2xl border border-white/10 bg-[#121212] p-5"><div className="flex items-center justify-between"><span className="text-xs font-black text-orange-500">{en ? item.dayEn : de ? item.dayDe : item.day}</span><span className="text-xs text-zinc-600">0{index + 1}</span></div><h2 className="mt-8 font-black">{en ? item.titleEn : de ? item.titleDe : item.title}</h2><p className="mt-1 text-sm text-zinc-500">{en ? item.focusEn : de ? item.focusDe : item.focus}</p></article>)}</div>
    <div className="mt-8 flex flex-col gap-3 sm:flex-row"><button onClick={() => navigate('/treino')} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 font-black text-black">{tr('Ver sugestão de hoje', "See today's workout", 'Heutiges Workout ansehen')} <ArrowRight className="h-4 w-4" /></button><button onClick={() => setFinished(false)} className="h-12 rounded-xl border border-white/10 px-6 font-bold text-zinc-300">{tr('Editar respostas', 'Edit answers', 'Antworten bearbeiten')}</button></div>
  </div></div>;

  return <div className="min-h-[calc(100vh-3.5rem)] bg-[#090909] px-4 py-10 text-white"><div className="mx-auto max-w-3xl">
    <div className="mb-9"><div className="flex items-center justify-between text-xs font-bold uppercase tracking-[.16em] text-zinc-500"><span>{tr('Configuração do atleta', 'Athlete setup', 'Athleten-Setup')}</span><span>{step + 1} {tr('de', 'of', 'von')} {steps.length}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div></div>
    <div className="mb-7"><h1 className="text-3xl font-black md:text-4xl">{steps[step].title}</h1><p className="mt-2 text-zinc-400">{steps[step].subtitle}</p></div>
    {currentStepKey === 'goal' && <ChoiceGrid options={goals} selected={profile.goal} onSelect={value => choose('goal', value)} />}
    {currentStepKey === 'raceDate' && <div>
      <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#121212] p-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-400"><Calendar className="h-5 w-5" /></span>
        <input
          type="date"
          value={profile.targetCompetitionDate}
          min={new Date().toISOString().slice(0, 10)}
          onChange={event => choose('targetCompetitionDate', event.target.value)}
          className="h-11 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-white outline-none focus:border-orange-500/50"
        />
      </div>
      {weeksToRace !== null && <p className="mt-4 text-sm text-zinc-400">
        {weeksToRace <= 0
          ? tr('Sua prova é essa semana. Boa sorte!', 'Your race is this week. Good luck!', 'Dein Wettkampf ist diese Woche. Viel Erfolg!')
          : tr(`Faltam ${weeksToRace} semanas. Vamos organizar seu treino em blocos de base, desenvolvimento, especificidade e polimento até lá.`, `${weeksToRace} weeks to go. We'll organize your training into base, development, specificity and taper blocks leading up to it.`, `Noch ${weeksToRace} Wochen. Wir gliedern dein Training bis dahin in Basis-, Aufbau-, Spezifitäts- und Tapering-Blöcke.`)}
      </p>}
    </div>}
    {currentStepKey === 'level' && <ChoiceGrid options={levels} selected={profile.level} onSelect={value => choose('level', value)} />}
    {currentStepKey === 'days' && <div className="grid grid-cols-3 gap-3">{[3, 4, 5].map(days => <button key={days} onClick={() => choose('days', days)} className={`rounded-2xl border p-6 text-center transition ${profile.days === days ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-[#121212]'}`}><span className="text-4xl font-black">{days}</span><span className="mt-1 block text-xs text-zinc-500">{tr('dias por semana', 'days per week', 'Tage pro Woche')}</span></button>)}</div>}
    {currentStepKey === 'equipment' && <div><div className="grid gap-3 sm:grid-cols-2">{equipment.map(([value, label, detail]) => <button key={value} onClick={() => toggleEquipment(value)} className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-left transition ${profile.equipment.includes(value) ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-[#121212]'}`}><span><strong className="block">{label}</strong><small className="mt-1 block text-xs font-normal leading-relaxed text-zinc-500">{detail}</small></span>{profile.equipment.includes(value) && <Check className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />}</button>)}</div>{usesNoStationEquipment && <div className="mt-4 flex gap-3 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm leading-relaxed text-sky-200"><Info className="mt-0.5 h-5 w-5 shrink-0" /><p><strong>{tr('Plano adaptado ao equipamento disponível:', 'Plan adapted to your available equipment:', 'Plan an die verfügbare Ausrüstung angepasst:')}</strong> {tr('como não há estações ou cargas selecionadas, as sessões usarão corrida, caso marcada, e movimentos com o peso corporal. Atualize seu perfil quando tiver acesso a mais equipamentos para incluí-los no plano.', 'because no stations or weights are selected, sessions will use running, when selected, and bodyweight movements. Update your profile when you gain access to more equipment to include it in your plan.', 'da keine Stationen oder Gewichte ausgewählt sind, nutzen die Einheiten Laufen, falls ausgewählt, und Übungen mit dem eigenen Körpergewicht. Aktualisiere dein Profil, sobald du Zugang zu mehr Ausrüstung hast, um sie in den Plan einzubinden.')}</p></div>}</div>}
    {currentStepKey === 'runReference' && <ChoiceGrid options={runOptions} selected={profile.runReference} onSelect={value => choose('runReference', value)} />}
    <div className="mt-9 flex items-center justify-between"><button disabled={step === 0} onClick={() => setStep(step - 1)} className="inline-flex items-center gap-2 px-3 py-2 font-bold text-zinc-400 disabled:opacity-0"><ArrowLeft className="h-4 w-4" /> {tr('Voltar', 'Back', 'Zurück')}</button><button disabled={!canContinue || saving} onClick={next} className="inline-flex h-12 items-center gap-2 rounded-xl bg-orange-500 px-6 font-black text-black disabled:cursor-not-allowed disabled:opacity-35">{saving ? tr('Salvando...', 'Saving...', 'Wird gespeichert...') : step === steps.length - 1 ? tr('Criar minha semana', 'Build my week', 'Meine Woche erstellen') : tr('Continuar', 'Continue', 'Weiter')} <ArrowRight className="h-4 w-4" /></button></div>
  </div></div>;
}

function ChoiceGrid({ options, selected, onSelect }: { options: Choice[]; selected: string; onSelect: (value: string) => void }) {
  return <div className="grid gap-3">{options.map(({ value, label, desc, icon: Icon }) => <button key={value} onClick={() => onSelect(value)} className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition ${selected === value ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-[#121212] hover:border-orange-500/30'}`}><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-400"><Icon className="h-5 w-5" /></span><span className="flex-1"><strong className="block">{label}</strong><small className="mt-1 block text-sm text-zinc-500">{desc}</small></span>{selected === value && <Check className="h-5 w-5 text-orange-500" />}</button>)}</div>;
}
