import { useI18n } from '@/i18n/I18nContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Zap, Calendar, Crown } from 'lucide-react';

const BRAZIL_CHECKOUT_URL = 'https://pay.hotmart.com/D107289174S?off=wsvcmylk';
const INTERNATIONAL_CHECKOUT_URL = 'https://pay.hotmart.com/D107289174S?off=js4d4nnl';

export default function Subscription() {
  const { t, lang } = useI18n();
  const isPt = lang === 'pt';
  const checkoutUrl = isPt ? BRAZIL_CHECKOUT_URL : INTERNATIONAL_CHECKOUT_URL;
  const tr = (pt: string, en: string, de: string) => lang === 'en' ? en : lang === 'de' ? de : pt;

  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Crown className="h-7 w-7 text-orange-500" />
          {t.subscription.title}
        </h1>
        <p className="text-muted-foreground mt-2">
          {tr('7 dias grátis. Primeiro mês por R$ 19,90; depois, R$ 49,90/mês.', '7 days free. First month for US$9; then US$29/month.', '7 Tage kostenlos. Erster Monat für 9 US$; danach 29 US$/Monat.')}
        </p>
      </div>

      <Card className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/20 border-orange-200">
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-orange-500" />
            <div>
              <p className="font-bold">{tr('Teste Grátis de 7 Dias', '7-Day Free Trial', '7 Tage kostenlos testen')}</p>
              <p className="text-sm text-muted-foreground">{tr('Acesso completo a todos os recursos', 'Full access to every feature', 'Voller Zugriff auf alle Funktionen')}</p>
            </div>
          </div>
          <Badge variant="default" className="bg-green-600">{tr('Incluído', 'Included', 'Inklusive')}</Badge>
        </CardContent>
      </Card>

      <div className="mx-auto mb-8 max-w-md">
        <Card className="relative ring-2 ring-orange-500 shadow-lg">
          <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-orange-500 hover:bg-orange-600">
            {tr('7 dias grátis', '7 days free', '7 Tage kostenlos')}
          </Badge>
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-lg">{tr('Plano mensal', 'Monthly plan', 'Monatsabo')}</CardTitle>
            <div className="mt-2">
              <span className="text-3xl font-bold">{isPt ? 'R$ 19,90' : 'US$9'}</span>
              <span className="text-muted-foreground text-sm">{tr(' no primeiro mês', ' for the first month', ' im ersten Monat')}</span>
            </div>
            <p className="text-sm text-muted-foreground">{tr('Após 7 dias grátis. A partir do segundo mês: R$ 49,90/mês.', 'After 7 free days. From the second month: US$29/month.', 'Nach 7 kostenlosen Tagen. Ab dem zweiten Monat: 29 US$/Monat.')}</p>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
              <a href={checkoutUrl}>
                <CreditCard className="h-4 w-4" />
                {t.subscription.cta}
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            {tr('Tudo incluso na assinatura', 'Everything included', 'Alles im Abo enthalten')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {t.subscription.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <Calendar className="h-4 w-4 inline mr-1" />
        {tr('Pagamento processado via Hotmart. Acesso imediato após confirmação.', 'Payment processed securely by Hotmart. Immediate access after confirmation.', 'Zahlung sicher über Hotmart abgewickelt. Sofortiger Zugriff nach Bestätigung.')}
      </div>
    </div>
  );
}
