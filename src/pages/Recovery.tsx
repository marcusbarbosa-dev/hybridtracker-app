import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { calculateReadiness, getReadinessRecommendation, loadTodayReadiness, READINESS_STORAGE_KEY, type DailyReadinessCheckin } from '@/lib/readiness';
import { supabase } from '@/lib/supabase';
import {
  Heart, Droplets, Moon, Sun, Wind, Thermometer, Activity, CheckCircle2,
  Bell, BellOff, Mail, Settings2, Gauge, Clock3,
} from 'lucide-react';

const defaultActivities = [
  { id: 'mob1', title: 'Mobilidade de quadril', desc: 'Posição 90/90, postura do pombo e círculos de quadril — 10 min', category: 'mobility' as const, duration: 10, completed: false },
  { id: 'mob2', title: 'Mobilidade de ombros', desc: 'Passagens com bastão, abertura com elástico e deslizamento na parede — 8 min', category: 'mobility' as const, duration: 8, completed: false },
  { id: 'mob3', title: 'Tornozelos e pés', desc: 'Elevação de panturrilha, círculos de tornozelo e mobilidade dos dedos — 5 min', category: 'mobility' as const, duration: 5, completed: false },
  { id: 'bre1', title: 'Respiração 4-7-8', desc: 'Inspire 4s, segure 7s, expire 8s. 10 ciclos.', category: 'breathing' as const, duration: 5, completed: false },
  { id: 'bre2', title: 'Respiração quadrada', desc: 'Inspire por 4 s, segure por 4 s, expire por 4 s e segure por 4 s. Continue por 5 min.', category: 'breathing' as const, duration: 5, completed: false },
  { id: 'str1', title: 'Alongamento de corpo inteiro', desc: 'Posteriores de coxa, quadríceps, flexores do quadril, peitoral e dorsais — 15 min', category: 'stretching' as const, duration: 15, completed: false },
  { id: 'con1', title: 'Protocolo de banho de contraste', desc: '3 min em água quente → 1 min em água fria. Repita 3 vezes.', category: 'contrast' as const, duration: 15, completed: false },
  { id: 'sle1', title: 'Rotina de Sono', desc: 'Sem telas 30 min antes. Temperatura 18–20 °C. Escurecimento total.', category: 'sleep' as const, duration: 480, completed: false },
];

const activityEnglish: Record<string, { title: string; desc: string }> = {
  mob1: { title: 'Hip mobility', desc: '90/90 position, pigeon pose and hip circles — 10 min' },
  mob2: { title: 'Shoulder mobility', desc: 'Dowel pass-throughs, band opening and wall slides — 8 min' },
  mob3: { title: 'Ankles and feet', desc: 'Calf raises, ankle circles and toe mobility — 5 min' },
  bre1: { title: '4-7-8 breathing', desc: 'Inhale for 4s, hold for 7s and exhale for 8s. Complete 10 cycles.' },
  bre2: { title: 'Box breathing', desc: 'Inhale, hold, exhale and hold for 4 seconds each. Continue for 5 min.' },
  str1: { title: 'Full-body stretching', desc: 'Hamstrings, quadriceps, hip flexors, chest and lats — 15 min' },
  con1: { title: 'Contrast shower protocol', desc: '3 min hot water → 1 min cold water. Repeat 3 times.' },
  sle1: { title: 'Sleep routine', desc: 'No screens for 30 min before bed. Room at 18–20°C. Complete darkness.' },
};

const activityGerman: Record<string, { title: string; desc: string }> = {
  mob1: { title: 'Hüftmobilität', desc: '90/90-Position, Taubenhaltung und Hüftkreisen — 10 Min' },
  mob2: { title: 'Schultermobilität', desc: 'Stab-Überzüge, Bandöffnung und Wandgleiten — 8 Min' },
  mob3: { title: 'Knöchel und Füße', desc: 'Wadenheben, Knöchelkreisen und Zehenmobilität — 5 Min' },
  bre1: { title: '4-7-8-Atmung', desc: '4 s einatmen, 7 s halten, 8 s ausatmen. 10 Zyklen.' },
  bre2: { title: 'Box-Atmung', desc: 'Einatmen, halten, ausatmen und halten für je 4 Sekunden. 5 Min fortsetzen.' },
  str1: { title: 'Ganzkörper-Dehnung', desc: 'Oberschenkelrückseite, Quadrizeps, Hüftbeuger, Brust und Rücken — 15 Min' },
  con1: { title: 'Wechseldusche-Protokoll', desc: '3 Min heißes Wasser → 1 Min kaltes Wasser. 3-mal wiederholen.' },
  sle1: { title: 'Schlafroutine', desc: 'Keine Bildschirme 30 Min vor dem Schlafen. Raumtemperatur 18–20 °C. Vollständige Dunkelheit.' },
};

const categoryIcons: Record<string, typeof Activity> = {
  mobility: Sun, breathing: Wind, stretching: Activity, contrast: Thermometer, sleep: Moon,
};

interface NotificationPreferences {
  hydration: boolean;
  nutrition: boolean;
  sleep: boolean;
  emailEnabled: boolean;
  email: string;
  hydrationInterval: number;
  quietStart: string;
  quietEnd: string;
}

const defaultPreferences: NotificationPreferences = {
  hydration: true,
  nutrition: true,
  sleep: true,
  emailEnabled: false,
  email: '',
  hydrationInterval: 3,
  quietStart: '22:00',
  quietEnd: '07:00',
};

function loadPreferences(): NotificationPreferences {
  try {
    const saved = localStorage.getItem('hybridtracker-notification-preferences');
    return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

export default function Recovery() {
  const { t, lang } = useI18n();
  const en = lang === 'en';
  const tr = (pt: string, english: string, german: string) => en ? english : lang === 'de' ? german : pt;
  const [activities, setActivities] = useState(defaultActivities);
  const [checkin, setCheckin] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(loadPreferences);
  const [dailyCheckin, setDailyCheckin] = useState<DailyReadinessCheckin>(() => loadTodayReadiness() || {
    date: new Date().toISOString().slice(0, 10), sleep: 7, energy: 7, pain: 0, availableMinutes: 60, readiness: calculateReadiness(7, 7, 0),
  });
  const [checkinSaved, setCheckinSaved] = useState(Boolean(loadTodayReadiness()));
  const [athleteLevel, setAthleteLevel] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hybridtracker-athlete-profile') || '{}').level || 'Intermediário'; } catch { return 'Intermediário'; }
  });
  const [levelSaved, setLevelSaved] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );

  useEffect(() => {
    localStorage.setItem('hybridtracker-notification-preferences', JSON.stringify(preferences));
  }, [preferences]);

  const saveAthleteLevel = async () => {
    let profile: Record<string, unknown> = {};
    try { profile = JSON.parse(localStorage.getItem('hybridtracker-athlete-profile') || '{}'); } catch { profile = {}; }
    localStorage.setItem('hybridtracker-athlete-profile', JSON.stringify({ ...profile, level: athleteLevel }));
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data.user) await supabase.from('athlete_profiles').update({ level: athleteLevel, updated_at: new Date().toISOString() }).eq('user_id', data.user.id);
    }
    setLevelSaved(true);
  };

  const updatePreference = <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  const requestNotifications = async () => {
    if (typeof Notification === 'undefined') {
      setNotificationPermission('unsupported');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const sendTestNotification = async () => {
    if (notificationPermission !== 'granted') return;
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification('HybridTracker', {
        body: 'Teste concluído. Seus lembretes poderão aparecer aqui.',
        icon: '/logo-hybridtracker.png',
        badge: '/logo-hybridtracker.png',
        tag: 'hybridtracker-test',
      });
    } else {
      new Notification('HybridTracker', { body: 'Teste concluído. As notificações estão autorizadas.' });
    }
  };

  const toggleActivity = (id: string) => {
    setActivities((current) => current.map((activity) => (
      activity.id === id ? { ...activity, completed: !activity.completed } : activity
    )));
  };

  const categories = ['mobility', 'breathing', 'stretching', 'contrast', 'sleep'] as const;
  const readiness = calculateReadiness(dailyCheckin.sleep, dailyCheckin.energy, dailyCheckin.pain);
  const recommendation = getReadinessRecommendation({ ...dailyCheckin, readiness });
  const recommendationText = recommendation.band === 'ready'
    ? { title: tr('Pronto para o treino planejado', 'Ready for the planned workout', 'Bereit für das geplante Training'), description: tr('Os seus registros de hoje permitem manter a sessão como planejada.', "Today's check-in supports keeping the session as planned.", 'Dein heutiger Check-in spricht dafür, die Einheit wie geplant durchzuziehen.') }
    : recommendation.band === 'adjusted'
      ? { title: tr('Ajuste recomendado', 'Adjustment recommended', 'Anpassung empfohlen'), description: tr('Reduza o volume ou a intensidade de acordo com a sua recuperação de hoje.', 'Reduce volume or intensity based on your recovery today.', 'Reduziere Umfang oder Intensität passend zu deiner heutigen Erholung.') }
      : { title: tr('Priorize a recuperação', 'Prioritize recovery', 'Priorisiere die Regeneration'), description: tr('Considere descanso ou uma sessão leve e procure avaliação se a dor persistir.', 'Consider rest or a light session, and seek assessment if pain persists.', 'Erwäge Ruhe oder eine leichte Einheit und lass dich untersuchen, falls der Schmerz anhält.') };

  const saveDailyCheckin = () => {
    const updated = { ...dailyCheckin, date: new Date().toISOString().slice(0, 10), readiness };
    localStorage.setItem(READINESS_STORAGE_KEY, JSON.stringify(updated));
    setDailyCheckin(updated);
    setCheckinSaved(true);
  };

  return (
    <div className="container px-4 py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-7 w-7 text-rose-500" />
          {t.recovery.title}
        </h1>
        <p className="text-muted-foreground mt-1">{t.recovery.subtitle}</p>
      </div>

      <Card className="mb-8 overflow-hidden border-orange-500/25">
        <CardHeader className="bg-gradient-to-r from-orange-500/10 to-transparent">
          <CardTitle className="flex items-center gap-2 text-lg"><Gauge className="h-5 w-5 text-orange-500" /> {tr('Check-in diário', 'Daily check-in', 'Täglicher Check-in')}</CardTitle>
          <p className="text-sm text-muted-foreground">{tr('Informe como você está hoje para o app ajustar a sugestão sem apagar o treino planejado.', 'Tell us how you feel today so the app can adjust the suggestion without removing your planned workout.', 'Sag uns, wie du dich heute fühlst, damit die App den Vorschlag anpassen kann, ohne dein geplantes Training zu löschen.')}</p>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <ReadinessRange label={tr('Sono', 'Sleep', 'Schlaf')} value={dailyCheckin.sleep} min={1} max={10} suffix="/10" onChange={(sleep) => { setDailyCheckin(current => ({ ...current, sleep })); setCheckinSaved(false); }} />
            <ReadinessRange label={tr('Energia', 'Energy', 'Energie')} value={dailyCheckin.energy} min={1} max={10} suffix="/10" onChange={(energy) => { setDailyCheckin(current => ({ ...current, energy })); setCheckinSaved(false); }} />
            <ReadinessRange label={tr('Dor ou desconforto', 'Pain or discomfort', 'Schmerz oder Unwohlsein')} value={dailyCheckin.pain} min={0} max={10} suffix="/10" onChange={(pain) => { setDailyCheckin(current => ({ ...current, pain })); setCheckinSaved(false); }} />
          </div>
          <label className="grid gap-2 text-sm font-medium">
            <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-orange-500" /> {tr('Tempo disponível hoje', 'Time available today', 'Heute verfügbare Zeit')}</span>
            <select className="h-10 rounded-md border border-input bg-background px-3" value={dailyCheckin.availableMinutes} onChange={(event) => { setDailyCheckin(current => ({ ...current, availableMinutes: Number(event.target.value) })); setCheckinSaved(false); }}>
              {[20, 30, 45, 60, 75, 90].map(minutes => <option key={minutes} value={minutes}>{minutes} {tr('minutos', 'minutes', 'Minuten')}</option>)}
            </select>
          </label>
          <div className={`rounded-xl border p-4 ${recommendation.band === 'ready' ? 'border-emerald-500/25 bg-emerald-500/10' : recommendation.band === 'adjusted' ? 'border-orange-500/25 bg-orange-500/10' : 'border-rose-500/25 bg-rose-500/10'}`}>
            <div className="flex items-start justify-between gap-4"><div><p className="font-bold">{recommendationText.title}</p><p className="mt-1 text-sm text-muted-foreground">{recommendationText.description}</p></div><Badge variant="secondary" className="shrink-0">{readiness}%</Badge></div>
            {dailyCheckin.pain >= 7 && <p className="mt-3 text-xs text-rose-300">{tr('Dor elevada não deve ser ignorada. Evite intensidade e procure avaliação se persistir, piorar ou limitar seus movimentos.', 'High pain should not be ignored. Avoid intensity and seek assessment if it persists, worsens or limits movement.', 'Starke Schmerzen solltest du nicht ignorieren. Vermeide hohe Intensität und lass dich untersuchen, falls sie anhalten, sich verschlimmern oder deine Bewegung einschränken.')}</p>}
          </div>
          <Button className="w-full" onClick={saveDailyCheckin}>{checkinSaved ? tr('Check-in de hoje salvo', "Today's check-in saved", 'Heutiger Check-in gespeichert') : tr('Salvar e ajustar o Treino do Dia', "Save and adjust today's workout", 'Speichern und das Training des Tages anpassen')}</Button>
          <p className="text-xs text-muted-foreground">{tr('O índice organiza a sua percepção de sono, energia e dor. Ele não é diagnóstico médico nem substitui sua decisão sobre treinar.', 'The score organizes your perception of sleep, energy and pain. It is not a medical diagnosis and does not replace your decision about training.', 'Der Wert fasst deine Wahrnehmung von Schlaf, Energie und Schmerz zusammen. Er ist keine medizinische Diagnose und ersetzt nicht deine Entscheidung übers Training.')}</p>
        </CardContent>
      </Card>

      <Card className="mb-8 border-orange-500/20">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Gauge className="h-5 w-5 text-orange-500" />{tr('Nível do atleta', 'Athlete level', 'Athletenlevel')}</CardTitle><p className="text-sm text-muted-foreground">{tr('Atualize quando sua experiência e capacidade tiverem evoluído. Os próximos planos usarão o novo nível.', 'Update this when your experience and capacity improve. Future plans will use the new level.', 'Aktualisiere dies, wenn sich deine Erfahrung und Leistungsfähigkeit weiterentwickelt haben. Künftige Pläne nutzen das neue Level.')}</p></CardHeader>
        <CardContent className="space-y-4"><div className="grid gap-2 sm:grid-cols-3">{[
          ['Iniciante', 'Beginner', 'Anfänger'], ['Intermediário', 'Intermediate', 'Fortgeschritten'], ['Avançado', 'Advanced', 'Erfahren'],
        ].map(([value, english, german]) => <Button key={value} type="button" variant={athleteLevel === value ? 'default' : 'outline'} onClick={() => { setAthleteLevel(value); setLevelSaved(false); }}>{tr(value, english, german)}</Button>)}</div>
        <Button className="w-full" onClick={saveAthleteLevel}>{levelSaved ? tr('Nível atualizado', 'Level updated', 'Level aktualisiert') : tr('Salvar novo nível', 'Save new level', 'Neues Level speichern')}</Button>
        <p className="text-xs text-muted-foreground">{tr('Ao mudar de nível, gere novamente o plano no Dashboard para aplicar volumes e intensidades compatíveis.', 'After changing level, generate the plan again in the Dashboard to apply suitable volume and intensity.', 'Erzeuge den Plan nach einem Levelwechsel im Dashboard neu, damit passende Umfänge und Intensitäten angewendet werden.')}</p></CardContent>
      </Card>

      <Card className="mb-8 border-orange-500/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-orange-500" />
            {tr('Preferências de lembretes', 'Reminder preferences', 'Erinnerungseinstellungen')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4">
            <div className="flex gap-3">
              {notificationPermission === 'granted' ? <Bell className="h-5 w-5 text-green-500" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
              <div>
                <p className="font-medium text-sm">{tr('Notificações no dispositivo', 'Device notifications', 'Gerätebenachrichtigungen')}</p>
                <p className="text-xs text-muted-foreground">
                  {notificationPermission === 'granted' && tr('Autorizadas neste dispositivo.', 'Allowed on this device.', 'Auf diesem Gerät erlaubt.')}
                  {notificationPermission === 'default' && tr('Toque em ativar para autorizar os avisos.', 'Select enable to allow notifications.', 'Tippe auf Aktivieren, um Benachrichtigungen zu erlauben.')}
                  {notificationPermission === 'denied' && tr('Bloqueadas. Altere a permissão nas configurações do navegador.', 'Blocked. Change the permission in your browser settings.', 'Blockiert. Ändere die Berechtigung in den Browsereinstellungen.')}
                  {notificationPermission === 'unsupported' && tr('Este navegador não oferece notificações web.', 'This browser does not support web notifications.', 'Dieser Browser unterstützt keine Web-Benachrichtigungen.')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {notificationPermission === 'default' && <Button size="sm" onClick={requestNotifications}>{tr('Ativar', 'Enable', 'Aktivieren')}</Button>}
              {notificationPermission === 'granted' && <Button size="sm" variant="outline" onClick={sendTestNotification}>{tr('Testar', 'Test', 'Testen')}</Button>}
            </div>
          </div>

          <div className="grid gap-4">
            <PreferenceSwitch icon={<Droplets className="h-5 w-5 text-blue-500" />} title={tr('Hidratação', 'Hydration', 'Flüssigkeitszufuhr')} description={tr(`Lembrete a cada ${preferences.hydrationInterval} horas.`, `Reminder every ${preferences.hydrationInterval} hours.`, `Erinnerung alle ${preferences.hydrationInterval} Stunden.`)} checked={preferences.hydration} onChange={(value) => updatePreference('hydration', value)} />
            <PreferenceSwitch icon={<Activity className="h-5 w-5 text-emerald-500" />} title={tr('Dicas de nutrição', 'Nutrition tips', 'Ernährungstipps')} description={tr('Conteúdo educativo relacionado ao treino e à recuperação.', 'Educational content related to training and recovery.', 'Lehrreiche Inhalte rund um Training und Regeneration.')} checked={preferences.nutrition} onChange={(value) => updatePreference('nutrition', value)} />
            <PreferenceSwitch icon={<Moon className="h-5 w-5 text-indigo-500" />} title={tr('Rotina de sono', 'Sleep routine', 'Schlafroutine')} description={tr('Aviso antes do horário de descanso.', 'Reminder before your scheduled rest time.', 'Erinnerung vor deiner geplanten Ruhezeit.')} checked={preferences.sleep} onChange={(value) => updatePreference('sleep', value)} />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <label className="grid gap-1.5 text-sm">
              {tr('Intervalo de hidratação', 'Hydration interval', 'Trinkintervall')}
              <select className="h-10 rounded-md border border-input bg-background px-3" value={preferences.hydrationInterval} onChange={(event) => updatePreference('hydrationInterval', Number(event.target.value))}>
                {[1,2,3,4].map(hours => <option key={hours} value={hours}>{tr(`A cada ${hours} hora${hours > 1 ? 's' : ''}`, `Every ${hours} hour${hours > 1 ? 's' : ''}`, `Alle ${hours} Stunde${hours > 1 ? 'n' : ''}`)}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              {tr('Silenciar a partir de', 'Quiet hours start', 'Ruhezeit ab')}
              <Input type="time" value={preferences.quietStart} onChange={(event) => updatePreference('quietStart', event.target.value)} />
            </label>
            <label className="grid gap-1.5 text-sm">
              {tr('Retomar às', 'Resume at', 'Fortsetzen um')}
              <Input type="time" value={preferences.quietEnd} onChange={(event) => updatePreference('quietEnd', event.target.value)} />
            </label>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <PreferenceSwitch icon={<Mail className="h-5 w-5 text-orange-500" />} title={tr('Receber também por e-mail', 'Also receive by email', 'Auch per E-Mail erhalten')} description={tr('Alternativa para dispositivos sem push ou sem o app instalado.', 'Alternative for devices without push notifications or the installed app.', 'Alternative für Geräte ohne Push-Benachrichtigungen oder ohne installierte App.')} checked={preferences.emailEnabled} onChange={(value) => updatePreference('emailEnabled', value)} />
            {preferences.emailEnabled && <Input type="email" placeholder={tr('seu@email.com', 'your@email.com', 'deine@email.com')} value={preferences.email} onChange={(event) => updatePreference('email', event.target.value)} />}
          </div>

          <p className="text-xs text-muted-foreground">
            {tr('As preferências já ficam salvas neste dispositivo. O envio automático em segundo plano e por e-mail será ativado quando a conta estiver conectada ao servidor.', 'Preferences are saved on this device. Automatic background and email delivery will be enabled when the account is connected to the server.', 'Die Einstellungen werden bereits auf diesem Gerät gespeichert. Der automatische Versand im Hintergrund und per E-Mail wird aktiviert, sobald das Konto mit dem Server verbunden ist.')}
          </p>
        </CardContent>
      </Card>

      {categories.map((category) => {
        const categoryActivities = activities.filter((activity) => activity.category === category);
        const Icon = categoryIcons[category] || Activity;
        return (
          <div key={category} className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              {t.recovery.categories[category]}
            </h2>
            <div className="grid gap-2">
              {categoryActivities.map((activity) => { const display = en ? { ...activity, ...activityEnglish[activity.id] } : lang === 'de' ? { ...activity, ...activityGerman[activity.id] } : activity; return (
                <Card key={activity.id} className={activity.completed ? 'opacity-60' : ''}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <Checkbox checked={activity.completed} onCheckedChange={() => toggleActivity(activity.id)} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{display.title}</span>
                          <Badge variant="secondary" className="text-xs">{activity.duration} min</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{display.desc}</p>
                      </div>
                      {activity.completed && <CheckCircle2 className="h-4 w-4 text-green-500 mt-1" />}
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          </div>
        );
      })}

      <Card className="mt-8">
        <CardHeader><CardTitle className="text-lg">{t.recovery.weeklyCheckin}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{tr('Você sentiu alguma dor ou desconforto esta semana?', 'Did you feel any pain or discomfort this week?', 'Hattest du diese Woche Schmerzen oder Unwohlsein?')}</p>
          <div className="flex flex-wrap gap-2">
            {['Nenhuma', 'Leve', 'Moderada', 'Intensa'].map((level) => (
              <Button key={level} variant={checkin === level ? 'default' : 'outline'} size="sm" onClick={() => setCheckin(level)}>{en ? ({ Nenhuma: 'None', Leve: 'Mild', Moderada: 'Moderate', Intensa: 'Severe' }[level] || level) : lang === 'de' ? ({ Nenhuma: 'Keine', Leve: 'Leicht', Moderada: 'Mäßig', Intensa: 'Stark' }[level] || level) : level}</Button>
            ))}
          </div>
          {checkin && checkin !== 'Nenhuma' && (
            <p className="mt-3 text-sm text-orange-600">{tr('Considere reduzir a intensidade e procure avaliação profissional se a dor persistir ou piorar.', 'Consider reducing intensity and seek professional assessment if the pain persists or worsens.', 'Erwäge, die Intensität zu reduzieren, und lass dich fachlich untersuchen, falls der Schmerz anhält oder sich verschlimmert.')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PreferenceSwitch({ icon, title, description, checked, onChange }: { icon: React.ReactNode; title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}

function ReadinessRange({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (value: number) => void }) {
  return <label className="grid gap-2 text-sm"><span className="flex justify-between font-medium"><span>{label}</span><strong className="text-orange-500">{value}{suffix}</strong></span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-orange-500" /></label>;
}
