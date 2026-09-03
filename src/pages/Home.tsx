import { Link } from 'react-router';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BenchmarkHelp } from '@/components/BenchmarkHelp';
import {
  Timer,
  BarChart3,
  Heart,
  Watch,
  Zap,
  Shield,
  Trophy,
  ArrowRight,
} from 'lucide-react';

export default function Home() {
  const { t, lang } = useI18n();
  const en = lang === 'en';

  const featuresPt = [
    { icon: BarChart3, title: 'Benchmarks', desc: 'Acompanhe suas 8 estações + teste de pista. Calcule VO₂max e limiar de lactato.' },
    { icon: Timer, title: 'Timer de Prova', desc: 'Simule a prova completa com cronômetro e alertas de transição.' },
    { icon: Zap, title: 'Plano Semanal', desc: 'Treinos adaptativos baseados nos seus benchmarks e data da próxima prova.' },
    { icon: Heart, title: 'Recuperação', desc: 'Mobilidade, sono, respiração e contrast bath nos dias OFF.' },
    { icon: Watch, title: 'Wearables', desc: 'Upload de .FIT/.TCX do Garmin, Polar, Apple Watch e Samsung.' },
    { icon: Shield, title: 'Prevenção', desc: 'Notificações de hidratação, sono e check-in semanal de dor.' },
  ];
  const featuresEn = [
    { icon: BarChart3, title: 'Benchmarks', desc: 'Track all 8 stations plus your running test. Calculate VO₂max and lactate threshold.' },
    { icon: Timer, title: 'Race Timer', desc: 'Simulate the full race with a timer and transition alerts.' },
    { icon: Zap, title: 'Weekly Plan', desc: 'Adaptive workouts based on your benchmarks and next race date.' },
    { icon: Heart, title: 'Recovery', desc: 'Mobility, sleep, breathing and contrast baths on rest days.' },
    { icon: Watch, title: 'Wearables', desc: 'Upload .FIT/.TCX files from Garmin, Polar, Apple Watch and Samsung.' },
    { icon: Shield, title: 'Prevention', desc: 'Hydration and sleep reminders, plus a weekly pain check-in.' },
  ];
  const featuresDe = [
    { icon: BarChart3, title: 'Benchmarks', desc: 'Erfasse alle 8 Stationen und deinen Lauftest. Berechne VO₂max und Laktatschwelle.' },
    { icon: Timer, title: 'Renn-Timer', desc: 'Simuliere das komplette Rennen mit Stoppuhr und Übergangs-Alarmen.' },
    { icon: Zap, title: 'Wochenplan', desc: 'Adaptive Workouts basierend auf deinen Benchmarks und dem Datum deines nächsten Rennens.' },
    { icon: Heart, title: 'Erholung', desc: 'Mobilität, Schlaf, Atmung und Wechselbäder an deinen Ruhetagen.' },
    { icon: Watch, title: 'Wearables', desc: 'Lade .FIT/.TCX-Dateien von Garmin, Polar, Apple Watch und Samsung hoch.' },
    { icon: Shield, title: 'Vorbeugung', desc: 'Erinnerungen zu Hydration und Schlaf, plus ein wöchentlicher Schmerz-Check-in.' },
  ];
  const features = en ? featuresEn : lang === 'de' ? featuresDe : featuresPt;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-orange-500/20 bg-gradient-to-b from-orange-950/40 to-background">
        <div className="container px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <img src="/logo-v2.png" alt="HybridTracker" className="h-24 w-24 mx-auto mb-6 rounded-full" />
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl whitespace-pre-line text-white">
              {t.hero.title}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              {t.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/benchmarks">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800">
                  <Zap className="h-5 w-5" />
                  {t.hero.ctaTrial}
                </Button>
              </Link>
              <Link to="/subscription">
                <Button variant="outline" size="lg" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300">
                  {t.hero.ctaPrice}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Card key={i} className="group hover:shadow-lg hover:shadow-orange-500/10 transition-all border-orange-500/10 bg-card">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
                  <f.icon className="h-5 w-5 text-orange-500" />
                </div>
                <CardTitle className="flex items-center gap-2 text-lg text-white">{f.title}{f.title === 'Benchmarks' && <BenchmarkHelp />}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Trial banner */}
      <section className="border-t border-orange-500/20 bg-muted/30">
        <div className="container px-4 py-12">
          <div className="mx-auto max-w-2xl text-center">
            <Trophy className="mx-auto h-10 w-10 text-orange-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-white">{t.trial.title}</h2>
            <p className="text-muted-foreground mb-6">{t.trial.description}</p>
            <Link to="/subscription">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800">
                {t.trial.upgrade}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
