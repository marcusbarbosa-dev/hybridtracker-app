import { Link } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import type { Language } from '@/types';
import {
  Activity, ArrowRight, BarChart3, BookOpen, Check, ChevronDown, CircleHelp,
  Dumbbell, Gauge, Globe, Headphones, Heart, History, Play, Route,
  ShieldCheck, SlidersHorizontal, Sparkles, Timer, TrendingUp, Volume2, VolumeX,
  Zap,
} from 'lucide-react';

const langLabels: Record<Language, string> = { pt: 'PT-BR', en: 'EN', de: 'DE' };
const langFlags: Record<Language, string> = { pt: '🇧🇷', en: '🇺🇸', de: '🇩🇪' };

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.08 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>{children}</div>;
}

const stations = ['1 KM RUN', 'SKIERG', 'SLED PUSH', 'SLED PULL', 'BURPEE BROAD JUMPS', 'ROW', 'FARMER CARRY', 'LUNGES', 'WALL BALLS'];

function MotionBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="landing-grid" />
      <div className="landing-glow landing-glow-one" />
      <div className="landing-glow landing-glow-two" />
      <div className="landing-scan" />
      <div className="race-stations-background opacity-40">
        <div className="race-stations-track">
          {[...stations, ...stations].map((station, index) => <div className="race-station-pill" key={`${station}-${index}`}><Activity className="h-4 w-4" />{station}</div>)}
        </div>
        <div className="race-stations-track race-stations-track-reverse">
          {[...stations.slice().reverse(), ...stations.slice().reverse()].map((station, index) => <div className="race-station-pill race-station-pill-muted" key={`${station}-r-${index}`}><Timer className="h-4 w-4" />{station}</div>)}
        </div>
      </div>
    </div>
  );
}

function HeroVideoBackground() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive(current => (current + 1) % 2), 7800);
    return () => window.clearInterval(timer);
  }, []);
  const videos = ['/media/hybrid-run.mp4', '/media/hybrid-sled.mp4'];
  return (
    <div className="hero-video-background" aria-hidden="true">
      {videos.map((src, index) => (
        <video key={src} className={active === index ? 'is-active' : ''} autoPlay muted loop playsInline preload={index === 0 ? 'auto' : 'metadata'}>
          <source src={src} type="video/mp4" />
        </video>
      ))}
      <div className="hero-video-vignette" />
    </div>
  );
}

function SectionVideoBackground({ src, position = 'center' }: { src: string; position?: string }) {
  return (
    <div className="section-video-background" aria-hidden="true">
      <video autoPlay muted loop playsInline preload="metadata" style={{ objectPosition: position }}>
        <source src={src} type="video/mp4" />
      </video>
      <div className="section-video-vignette" />
    </div>
  );
}

function SoundExperience({ isPt, isEn }: { isPt: boolean; isEn: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [showGate, setShowGate] = useState(() => sessionStorage.getItem('hybridtracker-sound-choice') === null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeRef = useRef<number | null>(null);

  const cancelFade = () => {
    if (fadeRef.current !== null) window.cancelAnimationFrame(fadeRef.current);
    fadeRef.current = null;
  };

  const fadeTo = (target: number, onDone?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    cancelFade();
    const start = audio.volume;
    const startedAt = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 700);
      audio.volume = start + (target - start) * progress;
      if (progress < 1) fadeRef.current = window.requestAnimationFrame(step);
      else { fadeRef.current = null; onDone?.(); }
    };
    fadeRef.current = window.requestAnimationFrame(step);
  };

  const stop = () => {
    fadeTo(0, () => audioRef.current?.pause());
    setPlaying(false);
    localStorage.setItem('hybridtracker-sound', 'off');
  };

  const start = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0;
    try {
      await audio.play();
      fadeTo(0.22);
      setPlaying(true);
      localStorage.setItem('hybridtracker-sound', 'on');
    } catch {
      setPlaying(false);
    }
  };

  const enterWithSound = async () => {
    sessionStorage.setItem('hybridtracker-sound-choice', 'sound');
    setShowGate(false);
    await start();
  };

  const enterSilently = () => {
    sessionStorage.setItem('hybridtracker-sound-choice', 'silent');
    localStorage.setItem('hybridtracker-sound', 'off');
    setShowGate(false);
  };

  useEffect(() => () => cancelFade(), []);

  return (
    <>
      <audio ref={audioRef} src="/media/hybridtracker-techno.mp3" loop preload="metadata" />
      {showGate && (
        <div className="sound-gate" role="dialog" aria-modal="true" aria-labelledby="sound-gate-title">
          <div className="sound-gate-panel">
            <span className="sound-gate-kicker">HYBRIDTRACKER EXPERIENCE</span>
            <Headphones className="sound-gate-icon" />
            <h2 id="sound-gate-title">{isPt ? 'Entre no ritmo do seu próximo nível.' : isEn ? 'Step into the rhythm of your next level.' : 'Spüre den Rhythmus deines nächsten Levels.'}</h2>
            <p>{isPt ? 'Uma experiência criada para ser vista e ouvida.' : isEn ? 'An experience designed to be seen and heard.' : 'Ein Erlebnis, das man sehen und hören kann.'}</p>
            <button className="sound-gate-primary" onClick={enterWithSound}><Volume2 />{isPt ? 'Entrar com som' : isEn ? 'Enter with sound' : 'Mit Sound starten'}</button>
            <button className="sound-gate-secondary" onClick={enterSilently}>{isPt ? 'Continuar sem som' : isEn ? 'Continue without sound' : 'Ohne Sound fortfahren'}</button>
          </div>
        </div>
      )}
      <button onClick={playing ? stop : start} aria-pressed={playing} className={`sound-toggle ${playing ? 'sound-toggle-active' : ''}`}>
        {playing ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        <span>{playing ? (isPt ? 'Som ativo' : isEn ? 'Sound on' : 'Sound an') : (isPt ? 'Ativar experiência sonora' : isEn ? 'Enable sound experience' : 'Sound-Erlebnis aktivieren')}</span>
        <span className="sound-bars" aria-hidden="true"><i /><i /><i /><i /></span>
      </button>
    </>
  );
}

function ProductDemo({ isPt, isEn }: { isPt: boolean; isEn: boolean }) {
  const labels = isPt
    ? { tag: 'PLANO ADAPTADO', title: 'Corrida sob fadiga', why: 'POR QUE ESTA SESSÃO?', reason: 'Seu perfil, seus equipamentos e seus registros definem a sugestão.', run: '6 × 600 m controlado', station: 'Sled push + burpee broad jump', finish: 'Recuperação guiada' }
    : isEn
      ? { tag: 'ADAPTED PLAN', title: 'Compromised running', why: 'WHY THIS SESSION?', reason: 'Your profile, equipment and records shape the suggestion.', run: '6 × 600 m controlled', station: 'Sled push + burpee broad jump', finish: 'Guided recovery' }
      : { tag: 'ANGEPASSTER PLAN', title: 'Laufen unter Ermüdung', why: 'WARUM DIESE EINHEIT?', reason: 'Profil, Equipment und Einträge formen den Vorschlag.', run: '6 × 600 m kontrolliert', station: 'Sled Push + Burpee Broad Jump', finish: 'Geführte Erholung' };
  return (
    <div className="product-demo" aria-label={isPt ? 'Demonstração animada do HybridTracker' : 'Animated HybridTracker demonstration'}>
      <div className="demo-top"><span className="demo-live"><i /> HYBRIDTRACKER LIVE</span><span>60 MIN · RPE 7/10</span></div>
      <div className="demo-heading"><span>{labels.tag}</span><h3>{labels.title}</h3></div>
      <div className="demo-week">
        {['SEG', 'TER', 'QUA', 'QUI', 'SEX'].map((day, index) => <div className={index === 3 ? 'active' : index < 2 ? 'done' : ''} key={day}><small>{day}</small><strong>{19 + index}</strong><i /></div>)}
      </div>
      <div className="demo-layout">
        <div className="demo-session">
          {[['01', labels.run, '24 min'], ['02', labels.station, '18 min'], ['03', labels.finish, '8 min']].map(([n, title, duration], index) => <div className="demo-row" style={{ animationDelay: `${index * 500}ms` }} key={n}><span>{n}</span><div><strong>{title}</strong><small>{index === 0 ? 'RPE 7/10' : index === 1 ? '4 voltas' : 'respiração + mobilidade'}</small></div><em>{duration}</em></div>)}
        </div>
        <div className="demo-insight"><Gauge /><small>{labels.why}</small><strong>{labels.reason}</strong><div><span style={{ width: '76%' }} /></div></div>
      </div>
      <div className="demo-cursor"><ArrowRight /></div>
    </div>
  );
}

export default function LandingPage() {
  const { lang, setLang } = useI18n();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const isPt = lang === 'pt';
  const isEn = lang === 'en';
  const brazilCheckoutUrl = 'https://pay.hotmart.com/D107289174S?off=wsvcmylk';
  const internationalCheckoutUrl = 'https://pay.hotmart.com/D107289174S?off=js4d4nnl';
  const hotmartUrl = isPt ? brazilCheckoutUrl : internationalCheckoutUrl;

  const copy = isPt ? {
    eyebrow: 'SEU TREINO NÃO PRECISA SER UM PALPITE',
    heroA: 'Pare de improvisar.', heroB: 'Treine com uma semana que entende você.',
    heroP: 'O HybridTracker organiza corrida, estações e recuperação a partir do seu nível, equipamentos, disponibilidade e registros. Você mantém o controle.',
    primary: 'Começar 7 dias grátis', secondary: 'Explorar o app', note: 'Cobrança segura pela Hotmart · Cancele quando quiser',
    problemTag: 'A PROVA É PREVISÍVEL. SUA SEMANA TAMBÉM PODE SER.',
    problemTitle: 'Dados primeiro. Decisões melhores depois.',
    problemP: 'Não entregamos uma planilha engessada. O HybridTracker transforma o que você informa em uma semana coerente e deixa cada sugestão editável.',
    methodTitle: 'Do perfil à evolução, sem perder o controle.',
    featureTitle: 'Um sistema para a preparação inteira.',
    pricingTitle: 'Menos que uma aula avulsa. Presente em toda a sua semana.',
    finalTitle: 'Sua próxima semana pode começar com mais clareza.',
    faqTitle: 'Perguntas antes da largada',
  } : isEn ? {
    eyebrow: 'YOUR TRAINING SHOULD NOT BE A GUESS', heroA: 'Stop improvising.', heroB: 'Train with a week that understands you.',
    heroP: 'HybridTracker organizes running, stations and recovery around your level, equipment, availability and records. You stay in control.',
    primary: 'Start 7 days free', secondary: 'Explore the app', note: 'Secure billing by Hotmart · Cancel anytime', problemTag: 'THE RACE IS PREDICTABLE. YOUR WEEK CAN BE TOO.',
    problemTitle: 'Data first. Better decisions next.', problemP: 'Not a rigid spreadsheet. HybridTracker turns your inputs into a coherent week and keeps every suggestion editable.',
    methodTitle: 'From profile to progress, without losing control.', featureTitle: 'One system for the whole preparation.', pricingTitle: 'Less than one drop-in class. Present throughout your week.', finalTitle: 'Your next week can start with more clarity.', faqTitle: 'Questions before the start',
  } : {
    eyebrow: 'DEIN TRAINING SOLLTE KEIN RÄTSEL SEIN', heroA: 'Hör auf zu improvisieren.', heroB: 'Trainiere mit einer Woche, die dich versteht.',
    heroP: 'HybridTracker organisiert Laufen, Stationen und Erholung nach Level, Equipment, Verfügbarkeit und Einträgen. Du behältst die Kontrolle.',
    primary: '7 Tage kostenlos starten', secondary: 'App erkunden', note: 'Sichere Abrechnung über Hotmart · Jederzeit kündbar', problemTag: 'DAS RENNEN IST PLANBAR. DEINE WOCHE AUCH.',
    problemTitle: 'Zuerst Daten. Dann bessere Entscheidungen.', problemP: 'Kein starrer Plan. HybridTracker macht aus deinen Angaben eine stimmige, frei editierbare Woche.', methodTitle: 'Vom Profil zum Fortschritt – unter deiner Kontrolle.', featureTitle: 'Ein System für deine gesamte Vorbereitung.', pricingTitle: 'Weniger als eine Einzelstunde. Die ganze Woche dabei.', finalTitle: 'Deine nächste Woche kann klarer beginnen.', faqTitle: 'Fragen vor dem Start',
  };

  const journey = [
    { icon: SlidersHorizontal, n: '01', title: isPt ? 'Declare seu contexto' : isEn ? 'Set your context' : 'Kontext festlegen', text: isPt ? 'Nível, objetivo, dias e equipamentos disponíveis.' : isEn ? 'Level, goal, days and available equipment.' : 'Level, Ziel, Tage und verfügbares Equipment.' },
    { icon: BarChart3, n: '02', title: isPt ? 'Registre referências' : isEn ? 'Record references' : 'Referenzen erfassen', text: isPt ? 'Benchmarks dão contexto ao ritmo e à intensidade.' : isEn ? 'Benchmarks give context to pace and intensity.' : 'Benchmarks geben Tempo und Intensität Kontext.' },
    { icon: Sparkles, n: '03', title: isPt ? 'Receba uma semana coerente' : isEn ? 'Get a coherent week' : 'Stimmige Woche erhalten', text: isPt ? 'Corrida, força, estações e recuperação organizadas.' : isEn ? 'Running, strength, stations and recovery organized.' : 'Laufen, Kraft, Stationen und Erholung organisiert.' },
    { icon: TrendingUp, n: '04', title: isPt ? 'Registre e ajuste' : isEn ? 'Record and adjust' : 'Erfassen und anpassen', text: isPt ? 'RPE, aderência e histórico ajudam a enxergar padrões.' : isEn ? 'RPE, adherence and history reveal patterns.' : 'RPE, Einhaltung und Verlauf zeigen Muster.' },
  ];

  const features = [
    { icon: Route, title: isPt ? 'Plano semanal adaptado' : isEn ? 'Adaptive weekly plan' : 'Adaptiver Wochenplan', text: isPt ? 'Organizado a partir do seu perfil, disponibilidade e equipamentos.' : isEn ? 'Organized around your profile, availability and equipment.' : 'Nach Profil, Verfügbarkeit und Equipment organisiert.' },
    { icon: Dumbbell, title: isPt ? 'Corrida + estações' : isEn ? 'Running + stations' : 'Laufen + Stationen', text: isPt ? 'Sessões híbridas, intervalados, força e recuperação na mesma visão.' : isEn ? 'Hybrid sessions, intervals, strength and recovery in one view.' : 'Hybrid, Intervalle, Kraft und Erholung in einer Ansicht.' },
    { icon: Gauge, title: 'RPE', text: isPt ? 'Compare o esforço previsto com o que você realmente sentiu.' : isEn ? 'Compare planned effort with what you actually felt.' : 'Geplante mit tatsächlich empfundener Belastung vergleichen.' },
    { icon: BarChart3, title: 'Benchmarks', text: isPt ? 'Use referências de desempenho para acompanhar evolução.' : isEn ? 'Use performance references to track progress.' : 'Leistungsreferenzen zur Fortschrittskontrolle.' },
    { icon: History, title: isPt ? 'Histórico útil' : isEn ? 'Useful history' : 'Nützlicher Verlauf', text: isPt ? 'Minutos, aderência, consistência e sessões em um só lugar.' : isEn ? 'Minutes, adherence, consistency and sessions in one place.' : 'Minuten, Einhaltung, Konsistenz und Einheiten an einem Ort.' },
    { icon: BookOpen, title: isPt ? 'Biblioteca de movimentos' : isEn ? 'Movement library' : 'Bewegungsbibliothek', text: isPt ? 'Objetivo, organização e pontos de atenção antes de executar.' : isEn ? 'Purpose, setup and key points before execution.' : 'Ziel, Aufbau und wichtige Punkte vor der Ausführung.' },
    { icon: Timer, title: isPt ? 'Timer de treino' : isEn ? 'Training timer' : 'Trainingstimer', text: isPt ? 'Controle blocos e transições durante suas sessões.' : isEn ? 'Control blocks and transitions during sessions.' : 'Blöcke und Übergänge während der Einheit steuern.' },
    { icon: Heart, title: isPt ? 'Recuperação' : isEn ? 'Recovery' : 'Erholung', text: isPt ? 'Check-ins e rotinas para organizar o lado invisível do treino.' : isEn ? 'Check-ins and routines for the invisible side of training.' : 'Check-ins und Routinen für die unsichtbare Seite des Trainings.' },
  ];

  const planDetails = isPt
    ? ['Plano semanal adaptado ao perfil', 'Corrida, estações, força e recuperação', 'Benchmarks e referências de corrida', 'RPE previsto e realizado', 'Histórico e consistência', 'Timer e biblioteca de movimentos', 'Português, inglês e alemão']
    : isEn
      ? ['Weekly plan adapted to your profile', 'Running, stations, strength and recovery', 'Benchmarks and running references', 'Planned and actual RPE', 'History and consistency', 'Timer and movement library', 'Portuguese, English and German']
      : ['Wochenplan passend zum Profil', 'Laufen, Stationen, Kraft und Erholung', 'Benchmarks und Laufreferenzen', 'Geplantes und tatsächliches RPE', 'Verlauf und Konsistenz', 'Timer und Bewegungsbibliothek', 'Portugiesisch, Englisch und Deutsch'];

  const faqs = [
    { q: isPt ? 'Preciso já ter experiência em fitness racing?' : isEn ? 'Do I need fitness racing experience?' : 'Brauche ich Fitness-Racing-Erfahrung?', a: isPt ? 'Não. Você informa seu nível e o contexto disponível. Termos como RPE, benchmark e Metcon possuem explicações dentro do app.' : isEn ? 'No. You provide your level and context. Terms such as RPE, benchmark and Metcon are explained inside the app.' : 'Nein. Du gibst Level und Kontext an. Begriffe wie RPE, Benchmark und Metcon werden in der App erklärt.' },
    { q: isPt ? 'O plano substitui um treinador?' : isEn ? 'Does the plan replace a coach?' : 'Ersetzt der Plan einen Coach?', a: isPt ? 'Não. O HybridTracker é uma plataforma de organização e sugestões para atletas autogerenciados. Você pode editar cada sessão e também usá-lo junto ao seu treinador.' : isEn ? 'No. HybridTracker organizes data and suggestions for self-managed athletes. You can edit every session or use it alongside your coach.' : 'Nein. HybridTracker organisiert Daten und Vorschläge für selbstgesteuerte Athleten. Jede Einheit ist editierbar und kann mit einem Coach genutzt werden.' },
    { q: isPt ? 'Preciso ter todos os equipamentos?' : isEn ? 'Do I need all equipment?' : 'Brauche ich die gesamte Ausrüstung?', a: isPt ? 'Não. O plano considera os equipamentos declarados. Se você selecionar apenas peso corporal e corrida, as sessões respeitarão essa escolha.' : isEn ? 'No. The plan considers the equipment you declare. Bodyweight-and-running profiles receive sessions within that context.' : 'Nein. Der Plan berücksichtigt dein angegebenes Equipment.' },
    { q: isPt ? 'Como funcionam os 7 dias grátis?' : isEn ? 'How do the 7 free days work?' : 'Wie funktionieren die 7 Gratistage?', a: isPt ? 'O período começa após a confirmação da assinatura pela Hotmart. Depois dos 7 dias, o primeiro mês custa R$ 19,90; a partir do segundo, R$ 49,90/mês.' : isEn ? 'The trial starts after Hotmart confirms the subscription. After 7 days, the first month is US$9; from the second month onward, US$29/month.' : 'Der Test beginnt nach Bestätigung durch Hotmart. Nach 7 Tagen kostet der erste Monat US$9; ab dem zweiten Monat US$29/Monat.' },
    { q: isPt ? 'Posso cancelar quando quiser?' : isEn ? 'Can I cancel anytime?' : 'Kann ich jederzeit kündigen?', a: isPt ? 'Sim. A assinatura é gerenciada pela Hotmart e pode ser cancelada sem fidelidade.' : isEn ? 'Yes. The subscription is managed through Hotmart and can be canceled without commitment.' : 'Ja. Das Abo wird über Hotmart verwaltet und kann ohne Bindung gekündigt werden.' },
  ];

  return (
    <main className="min-h-screen bg-[#060606] text-white overflow-x-hidden">
      <div className="sticky top-0 z-50 border-b border-orange-500/25 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-3 text-center text-xs sm:text-sm">
          <Zap className="h-4 w-4 text-orange-500" /><strong className="text-orange-400">{isPt ? 'CONDIÇÃO DE LANÇAMENTO' : isEn ? 'LAUNCH OFFER' : 'STARTANGEBOT'}</strong><span className="text-white/65">· {isPt ? '7 dias grátis · 1º mês R$ 19,90' : isEn ? '7 days free · first month US$9' : '7 Tage kostenlos · erster Monat US$9'}</span>
        </div>
      </div>

      <div className="fixed top-14 right-3 z-50 flex flex-col items-end gap-2">
        <div className="relative">
          <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center gap-2 rounded-full border border-orange-500/30 bg-black/80 px-3 py-2 text-sm text-orange-300 backdrop-blur"><Globe className="h-4 w-4" />{langFlags[lang]} {langLabels[lang]}<ChevronDown className="h-3 w-3" /></button>
          {showLangMenu && <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-orange-500/20 bg-black/95">{(Object.keys(langLabels) as Language[]).map(l => <button key={l} onClick={() => { setLang(l); setShowLangMenu(false); }} className="block w-full px-4 py-3 text-left text-sm hover:bg-orange-500/15">{langFlags[l]} {langLabels[l]}</button>)}</div>}
        </div>
        <SoundExperience isPt={isPt} isEn={isEn} />
      </div>

      <section className="relative min-h-[900px] flex items-center pt-20 pb-24">
        <HeroVideoBackground />
        <MotionBackground />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-[0.88fr_1.12fr]">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-bold tracking-[.18em] text-orange-300"><Zap className="h-4 w-4" />{copy.eyebrow}</div>
            <h1 className="mt-7 text-5xl font-black leading-[.95] tracking-tight sm:text-7xl lg:text-[78px]">{copy.heroA}<br /><span className="landing-gradient-text">{copy.heroB}</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/65 sm:text-xl">{copy.heroP}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href={hotmartUrl}><Button size="lg" className="w-full h-14 rounded-xl bg-orange-500 px-7 text-base font-black text-black hover:bg-orange-400 sm:w-auto">{copy.primary}<ArrowRight className="ml-2 h-5 w-5" /></Button></a>
              <Link to="/treino"><Button size="lg" variant="outline" className="w-full h-14 rounded-xl border-white/20 bg-white/5 px-7 text-base text-white hover:bg-white/10 sm:w-auto"><Play className="mr-2 h-5 w-5" />{copy.secondary}</Button></Link>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-white/45"><ShieldCheck className="h-4 w-4 text-emerald-400" />{copy.note}</p>
          </FadeIn>
          <FadeIn delay={180}><ProductDemo isPt={isPt} isEn={isEn} /></FadeIn>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b0b0b] py-24">
        <div className="mx-auto max-w-7xl px-5">
          <FadeIn><p className="text-sm font-bold tracking-[.22em] text-orange-500">{copy.problemTag}</p><div className="mt-5 grid gap-6 lg:grid-cols-2"><h2 className="text-4xl font-black sm:text-6xl">{copy.problemTitle}</h2><p className="text-lg leading-relaxed text-white/60">{copy.problemP}</p></div></FadeIn>
          <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-4">
            {journey.map((item, i) => <FadeIn key={item.n} delay={i * 100}><div className="journey-card"><span>{item.n}</span><item.icon className="h-7 w-7 text-orange-500" /><h3>{item.title}</h3><p>{item.text}</p><i /></div></FadeIn>)}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-28">
        <SectionVideoBackground src="/media/hybridtracker-woman-running.mp4" position="center 42%" />
        <div className="relative z-10 mx-auto max-w-7xl px-5">
          <FadeIn><div className="mx-auto max-w-3xl text-center"><span className="section-kicker">{isPt ? 'A EXPERIÊNCIA DO PRODUTO' : isEn ? 'THE PRODUCT EXPERIENCE' : 'DAS PRODUKTERLEBNIS'}</span><h2 className="mt-4 text-4xl font-black sm:text-6xl">{copy.methodTitle}</h2></div></FadeIn>
          <div className="mt-16"><ProductDemo isPt={isPt} isEn={isEn} /></div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-white/10 bg-[#0a0a0a] py-28">
        <SectionVideoBackground src="/media/hybridtracker-woman-sled-push.mp4" position="center 55%" />
        <div className="absolute inset-0 landing-grid opacity-30" />
        <div className="relative mx-auto max-w-7xl px-5">
          <FadeIn><span className="section-kicker">{isPt ? 'TUDO CONECTADO' : isEn ? 'EVERYTHING CONNECTED' : 'ALLES VERBUNDEN'}</span><h2 className="mt-4 max-w-3xl text-4xl font-black sm:text-6xl">{copy.featureTitle}</h2></FadeIn>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map((f, i) => <FadeIn key={f.title} delay={(i % 4) * 80}><div className="feature-card"><f.icon className="h-7 w-7 text-orange-500" /><h3>{f.title}</h3><p>{f.text}</p></div></FadeIn>)}</div>
        </div>
      </section>

      <section className="py-28">
        <div className="mx-auto max-w-6xl px-5">
          <FadeIn><div className="text-center"><span className="section-kicker">{isPt ? 'OFERTA DE LANÇAMENTO' : isEn ? 'LAUNCH OFFER' : 'STARTANGEBOT'}</span><h2 className="mt-4 text-4xl font-black sm:text-6xl">{copy.pricingTitle}</h2></div></FadeIn>
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <FadeIn><div className="price-card price-card-featured"><span className="price-badge">{isPt ? '7 DIAS GRÁTIS' : isEn ? '7 DAYS FREE' : '7 TAGE KOSTENLOS'}</span><p>{isPt ? 'Plano mensal' : isEn ? 'Monthly plan' : 'Monatsabo'}</p><div className="price-intro"><strong>{isPt ? 'R$ 19,90' : 'US$9'}</strong><span>{isPt ? 'no primeiro mês' : isEn ? 'first month' : 'im ersten Monat'}</span></div><div className="price-after">{isPt ? 'Depois, R$ 49,90/mês a partir do segundo mês' : isEn ? 'Then US$29/month from the second month' : 'Danach US$29/Monat ab dem zweiten Monat'}</div><ul>{planDetails.map(item => <li key={item}><Check />{item}</li>)}</ul><a href={hotmartUrl}><Button className="h-14 w-full bg-orange-500 font-black text-black hover:bg-orange-400">{copy.primary}<ArrowRight className="ml-2" /></Button></a></div></FadeIn>
          </div>
          <p className="mt-6 text-center text-sm text-white/40">{isPt ? 'Preços apresentados para o Brasil. A oferta internacional poderá variar conforme a região e os impostos aplicáveis.' : isEn ? 'International pricing may vary by region and applicable taxes.' : 'Internationale Preise können je nach Region und Steuern variieren.'}</p>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0a0a0a] py-24">
        <div className="mx-auto max-w-4xl px-5"><FadeIn><div className="text-center"><CircleHelp className="mx-auto h-10 w-10 text-orange-500" /><h2 className="mt-4 text-4xl font-black sm:text-5xl">{copy.faqTitle}</h2></div></FadeIn><div className="mt-12 space-y-3">{faqs.map((faq, i) => <button key={faq.q} onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="faq-row"><span>{faq.q}</span><ChevronDown className={`shrink-0 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />{activeFaq === i && <p>{faq.a}</p>}</button>)}</div></div>
      </section>

      <section className="relative overflow-hidden py-32 text-center"><SectionVideoBackground src="/media/hybridtracker-woman-kettlebell.mp4" position="center 45%" /><MotionBackground /><div className="relative z-10 mx-auto max-w-4xl px-5"><Headphones className="mx-auto h-10 w-10 text-orange-500" /><h2 className="mt-6 text-5xl font-black sm:text-7xl">{copy.finalTitle}</h2><p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">{copy.heroP}</p><a href={hotmartUrl}><Button size="lg" className="mt-9 h-16 rounded-xl bg-orange-500 px-9 text-lg font-black text-black hover:bg-orange-400">{copy.primary}<ArrowRight className="ml-2" /></Button></a><p className="mt-4 text-sm text-white/45">{copy.note}</p></div></section>

      <footer className="border-t border-white/10 bg-black py-10"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 text-sm text-white/40 sm:flex-row"><strong className="text-xl text-white">Hybrid<span className="text-orange-500">Tracker</span></strong><div className="flex gap-5"><Link to="/termos">{isPt ? 'Termos' : 'Terms'}</Link><Link to="/privacidade">{isPt ? 'Privacidade' : 'Privacy'}</Link><Link to="/login">Login</Link></div><span>© 2026 HybridTracker</span></div></footer>
    </main>
  );
}
