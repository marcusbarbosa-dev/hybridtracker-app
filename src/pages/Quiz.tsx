import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Flag, Gauge, Sparkles, CalendarDays, ShieldCheck, ChevronLeft, Zap,
  Dumbbell, Home, Clock, HeartPulse, BookOpen, Trees,
} from 'lucide-react';

const FB_PIXEL_ID = '921122063916488';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function loadPixel() {
  if (window.fbq) return;
  const w = window as Window & { _fbq?: unknown };
  const n: {
    (...args: unknown[]): void;
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[];
    push: unknown;
    loaded: boolean;
    version: string;
  } = Object.assign(
    function (this: unknown, ...args: unknown[]) {
      if (n.callMethod) n.callMethod.apply(n, args);
      else n.queue.push(args);
    },
    { queue: [] as unknown[], push: undefined as unknown, loaded: true, version: '2.0' },
  );
  n.push = n;
  w.fbq = n as unknown as Window['fbq'];
  if (!w._fbq) w._fbq = n;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
}

function firePixel(...args: unknown[]) {
  loadPixel();
  window.fbq?.(...args);
}

type Option = { value: string; label: string; icon: typeof Flag };
type Question = { key: string; title: string; subtitle: string; icon: typeof Flag; options: Option[] };

export default function Quiz() {
  const { lang } = useI18n();
  const isPt = lang === 'pt';
  const isEn = lang === 'en';
  const tr = (pt: string, en: string, de: string) => isPt ? pt : isEn ? en : de;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [started, setStarted] = useState(false);

  useEffect(() => {
    loadPixel();
    firePixel('init', FB_PIXEL_ID);
    firePixel('track', 'PageView');
  }, []);

  const questions: Question[] = useMemo(() => [
    {
      key: 'goal',
      title: tr('Qual é o seu maior desafio hoje?', "What's your biggest challenge right now?", 'Was ist deine größte Herausforderung?'),
      subtitle: tr('Escolha a opção mais próxima da sua realidade.', 'Pick the option closest to your reality.', 'Wähle die Option, die am besten passt.'),
      icon: Flag,
      options: [
        { value: 'first_race', icon: Flag, label: tr('Terminar minha primeira prova Hyrox', 'Finishing my first HYROX race', 'Mein erstes HYROX-Rennen beenden') },
        { value: 'improve_time', icon: Gauge, label: tr('Melhorar meu tempo e ficar mais competitivo', 'Improving my time and getting competitive', 'Meine Zeit verbessern und wettbewerbsfähiger werden') },
        { value: 'hybrid_fitness', icon: Zap, label: tr('Ganhar resistência e força ao mesmo tempo', 'Building endurance and strength together', 'Ausdauer und Kraft gleichzeitig aufbauen') },
        { value: 'unsure', icon: Sparkles, label: tr('Nem sei por onde começar', "I don't even know where to start", 'Ich weiß nicht, wo ich anfangen soll') },
      ],
    },
    {
      key: 'level',
      title: tr('Como você descreveria seu nível atual?', 'How would you describe your current level?', 'Wie würdest du dein aktuelles Level beschreiben?'),
      subtitle: tr('Sem julgamento — isso ajusta seu plano.', 'No judgment — this just tailors your plan.', 'Keine Wertung — das passt nur deinen Plan an.'),
      icon: Gauge,
      options: [
        { value: 'beginner', icon: Sparkles, label: tr('Iniciante — pouco treino estruturado', 'Beginner — little structured training', 'Anfänger — wenig strukturiertes Training') },
        { value: 'intermediate', icon: Gauge, label: tr('Intermediário — já treino, mas sem plano', 'Intermediate — I train, but without a plan', 'Fortgeschritten — ich trainiere, aber ohne Plan') },
        { value: 'advanced', icon: Zap, label: tr('Avançado — já compito ou treino sério', 'Advanced — I already compete or train seriously', 'Fortgeschritten — ich trainiere bereits ernsthaft') },
      ],
    },
    {
      key: 'days',
      title: tr('Quantos dias por semana você consegue treinar?', 'How many days a week can you train?', 'Wie viele Tage pro Woche kannst du trainieren?'),
      subtitle: tr('Vamos montar um plano que cabe na sua rotina.', "We'll build a plan that fits your routine.", 'Wir erstellen einen Plan, der zu deinem Alltag passt.'),
      icon: CalendarDays,
      options: [
        { value: '2-3', icon: CalendarDays, label: tr('2–3 dias', '2–3 days', '2–3 Tage') },
        { value: '4-5', icon: CalendarDays, label: tr('4–5 dias', '4–5 days', '4–5 Tage') },
        { value: '6+', icon: CalendarDays, label: tr('6+ dias', '6+ days', '6+ Tage') },
      ],
    },
    {
      key: 'environment',
      title: tr('Onde você costuma treinar?', 'Where do you usually train?', 'Wo trainierst du normalerweise?'),
      subtitle: tr('Vamos adaptar os exercícios ao que você tem disponível.', "We'll adapt the exercises to what you have available.", 'Wir passen die Übungen an das an, was dir zur Verfügung steht.'),
      icon: Dumbbell,
      options: [
        { value: 'full_gym', icon: Dumbbell, label: tr('Academia completa', 'A full gym', 'Ein vollständiges Fitnessstudio') },
        { value: 'home', icon: Home, label: tr('Em casa, com pouco equipamento', 'At home, with little equipment', 'Zu Hause, mit wenig Ausrüstung') },
        { value: 'outdoor', icon: Trees, label: tr('Ao ar livre / só corrida', 'Outdoors / running only', 'Draußen / nur Laufen') },
        { value: 'mixed', icon: Sparkles, label: tr('Um pouco de tudo', 'A bit of everything', 'Ein bisschen von allem') },
      ],
    },
    {
      key: 'obstacle',
      title: tr('O que mais te atrapalha para treinar hoje?', "What's holding you back the most right now?", 'Was hält dich im Moment am meisten zurück?'),
      subtitle: tr('Seja sincero — vamos construir o plano em volta disso.', "Be honest — we'll build the plan around this.", 'Sei ehrlich — wir bauen den Plan darum herum auf.'),
      icon: HeartPulse,
      options: [
        { value: 'time', icon: Clock, label: tr('Falta de tempo', 'Lack of time', 'Zeitmangel') },
        { value: 'consistency', icon: HeartPulse, label: tr('Falta de constância e motivação', 'Lack of consistency and motivation', 'Mangelnde Beständigkeit und Motivation') },
        { value: 'knowledge', icon: BookOpen, label: tr('Não saber montar o treino certo', 'Not knowing how to structure training', 'Nicht zu wissen, wie man richtig trainiert') },
        { value: 'injury', icon: ShieldCheck, label: tr('Medo de lesão ou dor', 'Fear of injury or pain', 'Angst vor Verletzung oder Schmerzen') },
      ],
    },
    {
      key: 'timeline',
      title: tr('Você já tem uma prova marcada?', 'Do you already have a race booked?', 'Hast du bereits ein Rennen gebucht?'),
      subtitle: tr('Isso define a urgência do seu plano.', 'This sets the urgency of your plan.', 'Das bestimmt die Dringlichkeit deines Plans.'),
      icon: Flag,
      options: [
        { value: 'soon', icon: Flag, label: tr('Sim, nos próximos 3 meses', 'Yes, in the next 3 months', 'Ja, in den nächsten 3 Monaten') },
        { value: 'later', icon: CalendarDays, label: tr('Sim, mas mais pra frente', 'Yes, but further down the road', 'Ja, aber erst später') },
        { value: 'none', icon: Sparkles, label: tr('Ainda não, só quero treinar melhor', 'Not yet, I just want to train better', 'Noch nicht, ich will nur besser trainieren') },
      ],
    },
  ], [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSteps = questions.length;
  const finished = step >= totalSteps;
  const progress = Math.round((Math.min(step, totalSteps) / totalSteps) * 100);
  const brazilCheckoutUrl = 'https://pay.hotmart.com/D107289174S?off=wsvcmylk';
  const internationalCheckoutUrl = 'https://pay.hotmart.com/D107289174S?off=js4d4nnl';
  const hotmartUrl = isPt ? brazilCheckoutUrl : internationalCheckoutUrl;

  const selectAnswer = (question: Question, option: Option) => {
    const next = { ...answers, [question.key]: option.value };
    setAnswers(next);
    firePixel('trackCustom', 'QuizAnswer', { question: question.key, answer: option.value, step: step + 1 });
    window.setTimeout(() => setStep((current) => current + 1), 220);
  };

  const goBack = () => setStep((current) => Math.max(0, current - 1));

  const start = () => {
    setStarted(true);
    firePixel('trackCustom', 'QuizStart');
  };

  useEffect(() => {
    if (finished) firePixel('trackCustom', 'QuizComplete', answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const resultCopy = useMemo(() => {
    const level = answers.level;
    const goal = answers.goal;
    const levelLabel = level === 'beginner'
      ? tr('iniciante', 'beginner', 'Anfänger')
      : level === 'advanced'
        ? tr('avançado', 'advanced', 'fortgeschritten')
        : tr('intermediário', 'intermediate', 'fortgeschritten');
    const goalLabel = goal === 'first_race'
      ? tr('terminar sua primeira prova', 'finish your first race', 'dein erstes Rennen beenden')
      : goal === 'improve_time'
        ? tr('melhorar seu tempo', 'improve your time', 'deine Zeit verbessern')
        : goal === 'hybrid_fitness'
          ? tr('ganhar resistência e força juntas', 'build endurance and strength together', 'Ausdauer und Kraft gemeinsam aufbauen')
          : tr('começar com o pé direito', 'get started on the right foot', 'richtig loszulegen');
    const obstacle = answers.obstacle;
    const obstacleLabel = obstacle === 'time'
      ? tr('a falta de tempo', 'your lack of time', 'deinen Zeitmangel')
      : obstacle === 'consistency'
        ? tr('a falta de constância', 'your lack of consistency', 'deine mangelnde Beständigkeit')
        : obstacle === 'injury'
          ? tr('o medo de lesão', 'your fear of injury', 'deine Angst vor Verletzungen')
          : tr('não saber montar o treino certo', 'not knowing how to train correctly', 'nicht zu wissen, wie man richtig trainiert');
    return { levelLabel, goalLabel, obstacleLabel };
  }, [answers, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10 px-5 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-v2.png" alt="HybridTracker" className="h-7 w-7 rounded-full" />
            <span className="text-lg font-bold">Hybrid<span className="text-orange-500">Tracker</span></span>
          </Link>
          {started && !finished && (
            <button onClick={goBack} className="flex items-center gap-1 text-sm text-white/50 hover:text-white/80">
              <ChevronLeft className="h-4 w-4" />{tr('Voltar', 'Back', 'Zurück')}
            </button>
          )}
        </div>
        {started && (
          <div className="mx-auto mt-4 max-w-2xl">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-orange-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-2xl px-5 py-14">
        {!started && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-bold tracking-[.18em] text-orange-300">
              <Zap className="h-4 w-4" />{tr('1 MINUTO', '1 MINUTE', '1 MINUTE')}
            </div>
            <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl">
              {tr('Descubra seu plano ideal para o Hyrox', 'Discover your ideal HYROX training plan', 'Entdecke deinen idealen HYROX-Trainingsplan')}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/60">
              {tr('6 perguntas rápidas para montarmos um caminho de treino sob medida para você.', '6 quick questions so we can build a training path made for you.', '6 kurze Fragen, um einen Trainingsplan genau für dich zu erstellen.')}
            </p>
            <Button size="lg" onClick={start} className="mt-9 h-14 rounded-xl bg-orange-500 px-8 text-base font-black text-black hover:bg-orange-400">
              {tr('Começar quiz', 'Start the quiz', 'Quiz starten')}<ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {started && !finished && (
          <div key={step} className="quiz-step-enter">
            <p className="text-sm font-bold tracking-widest text-orange-500">
              {step + 1}/{totalSteps}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">{questions[step].title}</h2>
            <p className="mt-3 text-white/55">{questions[step].subtitle}</p>
            <div className="mt-8 space-y-3">
              {questions[step].options.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => selectAnswer(questions[step], option)}
                    className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-left text-base font-medium transition-all hover:border-orange-500/50 hover:bg-orange-500/10"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-orange-500" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {finished && (
          <div className="text-center">
            <Sparkles className="mx-auto h-10 w-10 text-orange-500" />
            <h2 className="mt-5 text-3xl font-black sm:text-4xl">
              {tr('Seu plano está pronto', 'Your plan is ready', 'Dein Plan ist fertig')}
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-white/65">
              {isPt && (
                <>Com um perfil <strong className="text-white">{resultCopy.levelLabel}</strong>, o HybridTracker vai te ajudar a <strong className="text-white">{resultCopy.goalLabel}</strong> com um plano semanal que se adapta à sua rotina.</>
              )}
              {isEn && (
                <>With a <strong className="text-white">{resultCopy.levelLabel}</strong> profile, HybridTracker will help you <strong className="text-white">{resultCopy.goalLabel}</strong> with a weekly plan that adapts to your routine.</>
              )}
              {!isPt && !isEn && (
                <>Mit einem <strong className="text-white">{resultCopy.levelLabel}</strong>-Profil hilft dir HybridTracker, <strong className="text-white">{resultCopy.goalLabel}</strong> — mit einem Wochenplan, der sich an deinen Alltag anpasst.</>
              )}
            </p>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/45">
              {isPt && <>Sabemos que <strong className="text-white/70">{resultCopy.obstacleLabel}</strong> é um desafio real — por isso o plano é pensado pra caber exatamente na sua rotina.</>}
              {isEn && <>We know <strong className="text-white/70">{resultCopy.obstacleLabel}</strong> is a real challenge — that's why the plan is built to fit exactly into your routine.</>}
              {!isPt && !isEn && <>Wir wissen, dass <strong className="text-white/70">{resultCopy.obstacleLabel}</strong> eine echte Herausforderung ist — deshalb passt der Plan genau in deinen Alltag.</>}
            </p>
            <a href={hotmartUrl} onClick={() => firePixel('track', 'InitiateCheckout')}>
              <Button size="lg" className="mt-9 h-14 w-full rounded-xl bg-orange-500 px-8 text-base font-black text-black hover:bg-orange-400 sm:w-auto">
                {tr('Começar 7 dias grátis', 'Start my 7-day free trial', '7 Tage kostenlos starten')}<ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-white/45">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              {tr('Cancele quando quiser, sem compromisso.', 'Cancel anytime, no commitment.', 'Jederzeit kündbar, unverbindlich.')}
            </p>
            <Link to="/login" className="mt-6 inline-block text-sm text-white/40 hover:text-white/70">
              {tr('Já sou assinante — entrar', 'Already a subscriber — log in', 'Bereits Abonnent — anmelden')}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
