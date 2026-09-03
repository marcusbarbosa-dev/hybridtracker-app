import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, Zap, Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export default function Login() {
  const { lang } = useI18n();
  const tr = (pt: string, en: string, de: string) => lang === 'en' ? en : lang === 'de' ? de : pt;
  const { login, register, magicLink, resendConfirmation, backendConfigured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resending, setResending] = useState(false);

  const run = async (action: () => Promise<boolean>, successMessage?: string) => {
    setError('');
    setMessage('');
    setSubmitting(true);
    const success = await action();
    setSubmitting(false);
    if (!success) {
      setError(tr('Não foi possível concluir. Confira os dados e tente novamente.', 'We could not complete the request. Check your details and try again.', 'Die Anfrage konnte nicht abgeschlossen werden. Überprüfe deine Angaben und versuche es erneut.'));
      return false;
    }
    if (successMessage) setMessage(successMessage);
    else navigate('/dashboard');
    return true;
  };

  const createAccount = async () => {
    const success = await run(() => register(email, password, lang), backendConfigured ? tr('Confirme seu e-mail com o link enviado para continuar.', 'Confirm your email using the link we sent to continue.', 'Bestätige deine E-Mail-Adresse über den gesendeten Link, um fortzufahren.') : undefined);
    if (success && backendConfigured) setAwaitingConfirmation(true);
  };

  const resendEmail = async () => {
    setError('');
    setMessage('');
    setResending(true);
    const success = await resendConfirmation(email, lang);
    setResending(false);
    if (success) setMessage(tr('Novo link enviado. Verifique também as pastas Spam, Lixo eletrônico e Promoções.', 'New link sent. Please also check your Spam, Junk and Promotions folders.', 'Neuer Link gesendet. Schau auch in deinen Spam-, Werbe- und Papierkorb-Ordnern nach.'));
    else setError(tr('Não foi possível reenviar agora. Aguarde pelo menos 60 segundos e tente novamente.', 'We could not resend it yet. Wait at least 60 seconds and try again.', 'Der Link konnte noch nicht erneut gesendet werden. Warte mindestens 60 Sekunden und versuche es dann erneut.'));
  };

  const passwordField = (
    <div className="relative">
      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input type={showPassword ? 'text' : 'password'} placeholder={tr('Senha (mín. 6 caracteres)', 'Password (6 characters minimum)', 'Passwort (mind. 6 Zeichen)')} value={password} onChange={(event) => setPassword(event.target.value)} className="pl-10 pr-10" required minLength={6} />
      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" aria-label={showPassword ? tr('Ocultar senha', 'Hide password', 'Passwort ausblenden') : tr('Mostrar senha', 'Show password', 'Passwort anzeigen')}>
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  const emailField = (
    <div className="relative">
      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input type="email" placeholder={tr('seu@email.com', 'your@email.com', 'deine@email.com')} value={email} onChange={(event) => setEmail(event.target.value)} className="pl-10" required />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-b from-orange-950/40 to-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-v2.png" alt="HybridTracker" className="h-20 w-20 mx-auto mb-4 rounded-full" />
          <h1 className="text-3xl font-bold text-white">HybridTracker</h1>
          <p className="text-muted-foreground mt-2">{tr('Seu treino híbrido, na palma da mão', 'Hybrid training in the palm of your hand', 'Dein Hybrid-Training in deiner Hand')}</p>
        </div>

        <Card className="border-orange-500/20 bg-card">
          <CardHeader><CardTitle className="text-center text-white">{tr('Acesse sua conta', 'Access your account', 'Auf dein Konto zugreifen')}</CardTitle></CardHeader>
          <CardContent>
            {!backendConfigured && <p className="mb-4 rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300">{tr('Modo demonstração: o backend ainda não foi conectado.', 'Demo mode: the backend is not connected yet.', 'Demo-Modus: Das Backend ist noch nicht verbunden.')}</p>}
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="login">{tr('Entrar', 'Log in', 'Anmelden')}</TabsTrigger>
                <TabsTrigger value="register">{tr('Criar conta', 'Sign up', 'Registrieren')}</TabsTrigger>
                <TabsTrigger value="magic">{tr('Link', 'Email link', 'E-Mail-Link')}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={(event) => { event.preventDefault(); run(() => login(email, password, lang)); }} className="space-y-4">
                  {emailField}{passwordField}
                  <SubmitFeedback error={error} message={message} />
                  <Button disabled={submitting} type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-700">
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />} {tr('Entrar', 'Log in', 'Anmelden')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={(event) => { event.preventDefault(); createAccount(); }} className="space-y-4">
                  {emailField}{passwordField}
                  <SubmitFeedback error={error} message={message} />
                  {awaitingConfirmation && backendConfigured && (
                    <Button type="button" variant="outline" disabled={resending || !email.includes('@')} onClick={resendEmail} className="w-full">
                      {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />} {tr('Reenviar e-mail de confirmação', 'Resend confirmation email', 'Bestätigungs-E-Mail erneut senden')}
                    </Button>
                  )}
                  <Button disabled={submitting} type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-700">
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />} {tr('Criar conta', 'Create account', 'Konto erstellen')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="magic">
                <form onSubmit={(event) => { event.preventDefault(); run(() => magicLink(email, lang), backendConfigured ? tr('Enviamos um link seguro para o seu e-mail.', 'We sent a secure sign-in link to your email.', 'Wir haben dir einen sicheren Anmeldelink per E-Mail geschickt.') : undefined); }} className="space-y-4">
                  {emailField}
                  <SubmitFeedback error={error} message={message} />
                  <Button disabled={submitting} type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-700">
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />} {tr('Enviar link de acesso', 'Send sign-in link', 'Anmeldelink senden')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center space-y-2 text-muted-foreground">
          <p className="text-sm">{tr('O teste gratuito de 7 dias começa na criação da conta.', 'Your 7-day free trial starts when you create your account.', 'Deine 7-tägige kostenlose Testphase beginnt mit der Kontoerstellung.')}</p>
          <p className="text-xs">{tr('Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade.', 'By continuing, you agree to the Terms of Use and Privacy Policy.', 'Wenn du fortfährst, stimmst du den Nutzungsbedingungen und der Datenschutzrichtlinie zu.')}</p>
        </div>
      </div>
    </div>
  );
}

function SubmitFeedback({ error, message }: { error: string; message: string }) {
  return <>{error && <p className="text-sm text-red-500">{error}</p>}{message && <p className="text-sm text-green-500">{message}</p>}</>;
}
