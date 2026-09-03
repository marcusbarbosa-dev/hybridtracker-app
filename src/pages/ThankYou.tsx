import { Link } from 'react-router';
import { ArrowRight, Check, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

export default function ThankYou() {
  const { lang, setLang } = useI18n();
  const en = lang === 'en';
  const steps = en ? [
    'Click the button below to open the access page.',
    'Create your account using the same email used at checkout — or log in if you already have one.',
    'Confirm your email and complete your athlete profile.',
    'Start your personalized weekly plan.',
  ] : [
    'Clique no botão abaixo para abrir a tela de acesso.',
    'Crie sua conta com o mesmo e-mail usado no checkout — ou entre, se já tiver cadastro.',
    'Confirme seu e-mail e complete seu perfil de atleta.',
    'Comece seu plano semanal personalizado.',
  ];
  return (
    <main className="relative min-h-screen bg-[#060606] px-5 py-12 text-white">
      <div className="absolute right-5 top-5 flex rounded-full border border-white/15 bg-black/70 p-1 text-xs font-bold">
        <button onClick={() => setLang('en')} className={`rounded-full px-3 py-1.5 ${lang === 'en' ? 'bg-orange-500 text-black' : 'text-white/60'}`}>EN</button>
        <button onClick={() => setLang('pt')} className={`rounded-full px-3 py-1.5 ${lang === 'pt' ? 'bg-orange-500 text-black' : 'text-white/60'}`}>PT</button>
      </div>
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <img src="/logo-v2.png" alt="HybridTracker" className="mx-auto mb-5 h-20 w-20 rounded-full" />
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
            <Check className="h-9 w-9" />
          </div>
          <p className="text-sm font-black tracking-[.2em] text-orange-400">{en ? 'SUBSCRIPTION CONFIRMED' : 'ASSINATURA CONFIRMADA'}</p>
          <h1 className="mt-4 text-4xl font-black sm:text-6xl">{en ? 'Welcome to HybridTracker!' : 'Bem-vindo ao HybridTracker!'}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/65">
            {en ? 'Hotmart has confirmed your purchase. Create or access your account to start your 7 free days.' : 'Sua compra foi recebida pela Hotmart. Agora crie ou acesse sua conta para começar seus 7 dias gratuitos.'}
          </p>
        </div>

        <section className="rounded-3xl border border-orange-500/25 bg-[#111] p-6 shadow-2xl shadow-orange-950/20 sm:p-9">
          <div className="mb-7 flex items-start gap-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
            <Mail className="mt-1 h-6 w-6 shrink-0 text-orange-400" />
            <div>
              <h2 className="font-bold">{en ? 'Use the same email provided at checkout' : 'Use o mesmo e-mail informado na compra'}</h2>
              <p className="mt-1 text-sm leading-relaxed text-white/60">
                {en ? 'This allows HybridTracker to recognize your Hotmart subscription and grant the correct access automatically.' : 'Isso permite que o HybridTracker reconheça automaticamente sua assinatura da Hotmart e libere o acesso correto.'}
              </p>
            </div>
          </div>

          <h2 className="text-xl font-black">{en ? 'Next steps' : 'Próximos passos'}</h2>
          <ol className="mt-5 space-y-4">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4 text-white/75">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 font-black text-black">{index + 1}</span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>

          <Button asChild size="lg" className="mt-8 h-14 w-full bg-orange-500 text-base font-black text-black hover:bg-orange-400">
            <Link to={`/login?lang=${lang}`}>{en ? 'Create or access my account' : 'Criar ou acessar minha conta'} <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <Sparkles className="h-6 w-6 text-orange-400" />
            <h3 className="mt-3 font-bold">{en ? 'Your offer' : 'Sua condição'}</h3>
            <p className="mt-1 text-sm text-white/55">{en ? '7 days free, first month for US$9, then US$29/month. Applicable taxes are shown at checkout.' : '7 dias grátis, primeiro mês por R$ 19,90 e depois R$ 49,90/mês.'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <h3 className="mt-3 font-bold">{en ? 'Secure payment' : 'Pagamento seguro'}</h3>
            <p className="mt-1 text-sm text-white/55">{en ? 'Billing and subscription management are securely handled by Hotmart.' : 'Cobrança e gerenciamento da assinatura realizados pela Hotmart.'}</p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-white/40">
          {en ? 'Confirmation may take a few minutes. Keep the email and receipt sent by Hotmart.' : 'A confirmação pode levar alguns minutos. Guarde o e-mail e o comprovante enviados pela Hotmart.'}
        </p>
      </div>
    </main>
  );
}
