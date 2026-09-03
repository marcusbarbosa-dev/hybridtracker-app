import { useI18n } from '@/i18n/I18nContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';
import { Info, Award, Target, Users, BookOpen, ArrowRight, HeartHandshake, ExternalLink } from 'lucide-react';

const HYROX_VOLUNTEER_URL = 'https://hyrox.com/the-hyrox-family/';

export default function About() {
  const { t, lang } = useI18n();
  const tr = (pt: string, en: string, de: string) => lang === 'en' ? en : lang === 'de' ? de : pt;

  return (
    <div className="container px-4 py-8 max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Info className="h-7 w-7 text-orange-500" />
          {t.about.title}
        </h1>
        <p className="text-muted-foreground mt-2">{t.about.description}</p>
      </div>

      {/* Features highlight */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <Target className="h-6 w-6 text-orange-500" />
            <div>
              <p className="font-medium">{tr('Benchmarks científicos', 'Scientific benchmarks', 'Wissenschaftliche Benchmarks')}</p>
              <p className="text-xs text-muted-foreground">{tr('VO₂max e limiar pelo teste de 1600 m', 'VO₂max and threshold from the 1600 m test', 'VO₂max und Schwelle aus dem 1600-m-Test')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <Award className="h-6 w-6 text-orange-500" />
            <div>
              <p className="font-medium">{tr('Timer de prova', 'Race timer', 'Renn-Timer')}</p>
              <p className="text-xs text-muted-foreground">{tr('Simule os 8 blocos com precisão', 'Simulate all 8 blocks with precision', 'Simuliere alle 8 Blöcke mit Präzision')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <Users className="h-6 w-6 text-orange-500" />
            <div>
              <p className="font-medium">{tr('Comunidade global', 'Global community', 'Globale Community')}</p>
              <p className="text-xs text-muted-foreground">{tr('Português, inglês e alemão', 'Portuguese, English and German', 'Portugiesisch, Englisch und Deutsch')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-orange-500" />
            <div>
              <p className="font-medium">{tr('Manual do atleta', 'Athlete manual', 'Athleten-Handbuch')}</p>
              <p className="text-xs text-muted-foreground">{tr('PDF completo incluso na assinatura', 'Complete PDF included with your subscription', 'Vollständiges PDF in deinem Abo enthalten')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Founders tribute */}
      <Card className="mb-8 border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="text-xl">{t.about.founders.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{t.about.founders.description}</p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Badge variant="secondary">CEO</Badge>
              <div>
                <p className="font-medium text-sm">{t.about.founders.christian}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Badge variant="secondary">{tr('Atleta', 'Athlete', 'Athlet')}</Badge>
              <div>
                <p className="font-medium text-sm">{t.about.founders.moritz}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Badge variant="secondary">CMO</Badge>
              <div>
                <p className="font-medium text-sm">{t.about.founders.michael}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volunteer at HYROX events */}
      <Card className="mb-8 border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-orange-500" />
            {t.about.volunteer.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{t.about.volunteer.description}</p>
          <a href={HYROX_VOLUNTEER_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2 border-orange-500/50 text-orange-500 hover:bg-orange-500/10">
              {t.about.volunteer.cta}
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center">
        <Link to="/subscription">
          <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 gap-2">
            {tr('Começar teste grátis', 'Start free trial', 'Kostenlose Testphase starten')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
