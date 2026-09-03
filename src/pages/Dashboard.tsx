import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/i18n/I18nContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Dumbbell,
  Footprints,
  Heart,
  Flame,
  Timer,
  Zap,
  Pencil,
  Trash2,
  Plus,
  Info,
  Eye,
  Play,
  Upload,
  Download,
  AlertTriangle,
} from 'lucide-react';
import type { WorkoutDay } from '@/types';
import { toLocalDateKey } from '@/lib/dates';
import { RpeHelp } from '@/components/RpeHelp';
import { parseWorkoutPlanCsv, mergeImportedPlan, buildTemplateCsv, type ImportResult } from '@/lib/planImport';

const typeIcons: Record<string, any> = {
  run: Footprints,
  strength: Dumbbell,
  metcon: Flame,
  recovery: Heart,
  rest: Circle,
  hybrid: Zap,
};

const typeColors: Record<string, string> = {
  run: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  strength: 'bg-red-500/10 text-red-400 border-red-500/20',
  metcon: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  recovery: 'bg-green-500/10 text-green-400 border-green-500/20',
  rest: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  hybrid: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const intensityOptions = [
  { value: 'low', label: 'Leve' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'high', label: 'Alta' },
];

const typeOptions = [
  { value: 'run', label: 'Corrida' },
  { value: 'strength', label: 'Força' },
  { value: 'metcon', label: 'Metcon' },
  { value: 'recovery', label: 'Recuperação' },
  { value: 'rest', label: 'Descanso' },
  { value: 'hybrid', label: 'Híbrido' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const tr = (pt: string, en: string, de: string) => lang === 'en' ? en : lang === 'de' ? de : pt;
  const localizeWorkoutText = (value: string) => {
    if (lang === 'pt') return value;
    if (lang === 'en') {
      const exact: Record<string, string> = {
        'Força funcional': 'Functional strength',
        'Força + técnica de corrida': 'Strength + running technique',
        'Corrida leve · base aeróbia': 'Easy run · aerobic base',
        'Corrida intervalada controlada': 'Controlled interval run',
        'Técnica e resistência nas estações': 'Station technique and endurance',
        'Corrida sob fadiga · simulado progressivo': 'Running under fatigue · progressive simulation',
        'Corrida sob fadiga · treino híbrido': 'Running under fatigue · hybrid workout',
        'Descanso': 'Rest day',
      };
      if (exact[value]) return exact[value];
      return value
        .replace(/ em RPE /g, ' at RPE ')
        .replace(/, com (\d+) s de recuperação/g, ', with $1 s recovery')
        .replace(/Recupere-se, hidrate-se e priorize o sono\./g, 'Recover, hydrate and prioritize sleep.')
        .replace(/Se desejar, faça caminhada ou mobilidade leve\./g, 'Add an easy walk or mobility work if desired.')
        .replace(/Corrida/g, 'Running').replace(/corrida/g, 'running')
        .replace(/estações/g, 'stations').replace(/Descanso/g, 'Rest');
    }
    const exactDe: Record<string, string> = {
      'Força funcional': 'Funktionelle Kraft',
      'Força + técnica de corrida': 'Kraft + Lauftechnik',
      'Corrida leve · base aeróbia': 'Lockerer Lauf · aerobe Basis',
      'Corrida intervalada controlada': 'Kontrollierter Intervalllauf',
      'Técnica e resistência nas estações': 'Stationstechnik und Ausdauer',
      'Corrida sob fadiga · simulado progressivo': 'Laufen unter Ermüdung · progressive Simulation',
      'Corrida sob fadiga · treino híbrido': 'Laufen unter Ermüdung · Hybrid-Workout',
      'Descanso': 'Ruhetag',
    };
    if (exactDe[value]) return exactDe[value];
    return value
      .replace(/ em RPE /g, ' bei RPE ')
      .replace(/, com (\d+) s de recuperação/g, ', mit $1 s Pause')
      .replace(/Recupere-se, hidrate-se e priorize o sono\./g, 'Erhole dich, trinke ausreichend und priorisiere den Schlaf.')
      .replace(/Se desejar, faça caminhada ou mobilidade leve\./g, 'Bei Bedarf ein lockerer Spaziergang oder leichte Mobilisation.')
      .replace(/Corrida/g, 'Laufen').replace(/corrida/g, 'Laufen')
      .replace(/estações/g, 'Stationen').replace(/Descanso/g, 'Ruhetag');
  };
  const localizedIntensityOptions = intensityOptions.map(item => ({ ...item, label: item.value === 'low' ? tr('Leve', 'Low', 'Niedrig') : item.value === 'moderate' ? tr('Moderada', 'Moderate', 'Moderat') : tr('Alta', 'High', 'Hoch') }));
  const localizedTypeOptions = typeOptions.map(item => ({ ...item, label: t.dashboard.workoutTypes[item.value as keyof typeof t.dashboard.workoutTypes] }));
  const { state, setWorkoutPlan, generatePlan, toggleWorkoutComplete, updateWorkout, deleteWorkout, addWorkout } = useApp();
  const today = toLocalDateKey();
  const [editingWorkout, setEditingWorkout] = useState<WorkoutDay | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportResult | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [viewingWorkout, setViewingWorkout] = useState<WorkoutDay | null>(null);
  const [planMessage, setPlanMessage] = useState('');
  const athleteProfile = (() => { try { const saved = localStorage.getItem('hybridtracker-athlete-profile'); return saved ? JSON.parse(saved) as { goal: string; level: string; days: number; equipment: string[]; runReference: string } : null; } catch { return null; } })();
  const usesBodyweightAdaptation = athleteProfile ? !athleteProfile.equipment.some(item => ['Academia completa', 'Sled', 'SkiErg', 'Remo ergométrico', 'Halteres e kettlebells'].includes(item)) : false;
  const [newWorkout, setNewWorkout] = useState<Partial<WorkoutDay>>({
    date: today,
    type: 'hybrid',
    title: '',
    description: '',
    completed: false,
    duration: 60,
    intensity: 'moderate',
  });

  const todayWorkout = state.workoutPlan.find((w) => w.date === today);

  const handleSaveEdit = () => {
    if (editingWorkout) {
      updateWorkout(editingWorkout.date, editingWorkout);
      setEditingWorkout(null);
    }
  };

  const handleAddWorkout = () => {
    if (newWorkout.date && newWorkout.title) {
      addWorkout(newWorkout as WorkoutDay);
      setIsAddDialogOpen(false);
      setNewWorkout({
        date: today,
        type: 'hybrid',
        title: '',
        description: '',
        completed: false,
        duration: 60,
        intensity: 'moderate',
      });
    }
  };

  const startWorkout = (workout: WorkoutDay) => {
    localStorage.setItem('hybridtracker-selected-workout', JSON.stringify(workout));
    localStorage.removeItem('hybridtracker-last-timer');
    setViewingWorkout(null);
    navigate('/treino');
  };

  const handleGeneratePlan = () => {
    generatePlan();
    setPlanMessage(athleteProfile
      ? tr(`Plano de 14 dias criado para ${athleteProfile.level.toLowerCase()}, com ${athleteProfile.days} treinos por semana${usesBodyweightAdaptation ? ', adaptado aos recursos declarados, sem estações ou cargas' : ' e equipamentos compatíveis com seu perfil'}.`, `Your 14-day plan was created with ${athleteProfile.days} workouts per week${usesBodyweightAdaptation ? ', adapted to your available resources without stations or loads' : ' and equipment compatible with your profile'}.`, `Dein 14-Tage-Plan wurde für ${athleteProfile.level.toLowerCase()} erstellt, mit ${athleteProfile.days} Workouts pro Woche${usesBodyweightAdaptation ? ', angepasst an deine angegebenen Ressourcen, ohne Stationen oder Lasten' : ' und Equipment passend zu deinem Profil'}.`)
      : tr('Plano inicial criado. Configure seu perfil para personalizar nível, frequência e equipamentos.', 'Initial plan created. Complete your profile to customize level, frequency, and equipment.', 'Erster Plan erstellt. Richte dein Profil ein, um Level, Häufigkeit und Equipment anzupassen.'));
  };

  const handleDownloadTemplate = () => {
    const csv = buildTemplateCsv(lang);
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = tr('modelo-plano-hybridtracker.csv', 'hybridtracker-plan-template.csv', 'hybridtracker-plan-vorlage.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelected = (file: File) => {
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setImportPreview(parseWorkoutPlanCsv(text));
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleConfirmImport = () => {
    if (!importPreview || importPreview.rows.length === 0) return;
    setWorkoutPlan(mergeImportedPlan(state.workoutPlan, importPreview.rows));
    setIsImportDialogOpen(false);
    setImportPreview(null);
    setImportFileName('');
    setPlanMessage(tr(
      `Plano importado: ${importPreview.rows.length} treino(s) adicionado(s) ou atualizado(s).`,
      `Plan imported: ${importPreview.rows.length} workout(s) added or updated.`,
      `Plan importiert: ${importPreview.rows.length} Workout(s) hinzugefügt oder aktualisiert.`
    ));
  };

  const importErrorLabels: Record<string, string> = {
    empty_file: tr('Arquivo vazio.', 'Empty file.', 'Datei ist leer.'),
    missing_columns: tr('Não encontrei as colunas "Data" e "Título" no cabeçalho.', 'Could not find the "Date" and "Title" columns in the header.', 'Die Spalten "Datum" und "Titel" wurden in der Kopfzeile nicht gefunden.'),
    invalid_date: tr('data inválida (use AAAA-MM-DD ou DD/MM/AAAA)', 'invalid date (use YYYY-MM-DD or MM/DD/YYYY)', 'ungültiges Datum (JJJJ-MM-TT oder TT.MM.JJJJ verwenden)'),
    missing_title: tr('sem título', 'missing title', 'kein Titel'),
    unknown_type: tr('tipo não reconhecido (use Descanso, Força, Corrida, Estações, Híbrido ou Recuperação)', 'unrecognized type (use Rest, Strength, Run, Stations, Hybrid or Recovery)', 'unbekannter Typ (Ruhetag, Kraft, Lauf, Stationen, Hybrid oder Erholung verwenden)'),
  };

  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-orange-500" />
          {t.dashboard.title}
        </h1>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
                <Plus className="h-4 w-4 mr-1" />
                {tr('Adicionar', 'Add', 'Hinzufügen')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-orange-500/20">
              <DialogHeader>
                <DialogTitle className="text-white">{tr('Novo Treino', 'New Workout', 'Neues Workout')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">{tr('Data', 'Date', 'Datum')}</Label>
                  <Input
                    type="date"
                    value={newWorkout.date}
                    onChange={(e) => setNewWorkout({ ...newWorkout, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">{tr('Tipo', 'Type', 'Typ')}</Label>
                  <Select value={newWorkout.type} onValueChange={(v) => setNewWorkout({ ...newWorkout, type: v as WorkoutDay['type'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {localizedTypeOptions.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">{tr('Título', 'Title', 'Titel')}</Label>
                  <Input
                    value={newWorkout.title}
                    onChange={(e) => setNewWorkout({ ...newWorkout, title: e.target.value })}
                    placeholder={tr('Ex: Treino de Força', 'Example: Strength Workout', 'Z. B.: Krafttraining')}
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">{tr('Descrição', 'Description', 'Beschreibung')}</Label>
                  <Input
                    value={newWorkout.description}
                    onChange={(e) => setNewWorkout({ ...newWorkout, description: e.target.value })}
                    placeholder="Ex: 5 rounds de 400m"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">{tr('Duração (min)', 'Duration (min)', 'Dauer (Min.)')}</Label>
                    <Input
                      type="number"
                      value={newWorkout.duration}
                      onChange={(e) => setNewWorkout({ ...newWorkout, duration: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{tr('Intensidade', 'Intensity', 'Intensität')}</Label>
                    <Select value={newWorkout.intensity} onValueChange={(v) => setNewWorkout({ ...newWorkout, intensity: v as WorkoutDay['intensity'] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {localizedIntensityOptions.map((i) => (
                          <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddWorkout} className="w-full bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  {tr('Adicionar Treino', 'Add Workout', 'Workout hinzufügen')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={handleGeneratePlan} variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-1" />
            {tr('Gerar Plano', 'Generate Plan', 'Plan erstellen')}
          </Button>
          <Dialog open={isImportDialogOpen} onOpenChange={(open) => { setIsImportDialogOpen(open); if (!open) { setImportPreview(null); setImportFileName(''); } }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
                <Upload className="h-4 w-4 mr-1" />
                {tr('Importar Plano', 'Import Plan', 'Plan importieren')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-orange-500/20 max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">{tr('Importar plano de treino', 'Import training plan', 'Trainingsplan importieren')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {tr('Recebeu o plano do seu coach em uma planilha, ou montou o seu próprio? Baixe o modelo, preencha no Excel/Google Sheets, exporte como CSV e envie aqui.', 'Got your plan from a coach as a spreadsheet, or built your own? Download the template, fill it in Excel/Google Sheets, export as CSV and upload it here.', 'Hast du deinen Plan von einem Coach als Tabelle bekommen oder selbst erstellt? Lade die Vorlage herunter, fülle sie in Excel/Google Sheets aus, exportiere sie als CSV und lade sie hier hoch.')}
                </p>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  {tr('Baixar modelo (CSV)', 'Download template (CSV)', 'Vorlage herunterladen (CSV)')}
                </Button>
                <div>
                  <Label className="text-muted-foreground">{tr('Arquivo CSV', 'CSV file', 'CSV-Datei')}</Label>
                  <Input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelected(file); }}
                  />
                  {importFileName && <p className="mt-1 text-xs text-muted-foreground">{importFileName}</p>}
                </div>
                {importPreview && (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
                    {importPreview.rows.length > 0 && (
                      <p className="text-sm font-semibold text-emerald-400">
                        {tr(`${importPreview.rows.length} treino(s) prontos para importar.`, `${importPreview.rows.length} workout(s) ready to import.`, `${importPreview.rows.length} Workout(s) bereit zum Importieren.`)}
                      </p>
                    )}
                    {importPreview.rows.length > 0 && (
                      <ul className="max-h-40 overflow-y-auto space-y-1 text-xs text-muted-foreground">
                        {importPreview.rows.map((row) => (
                          <li key={row.rowNumber} className="flex items-center justify-between gap-2 rounded bg-white/[.03] px-2 py-1">
                            <span>{row.date} · {row.title}</span>
                            <Badge variant="outline" className={typeColors[row.type]}>{localizedTypeOptions.find(o => o.value === row.type)?.label || row.type}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                    {importPreview.errors.length > 0 && (
                      <div className="flex flex-col gap-1 text-xs text-amber-400">
                        <div className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> {tr('Linhas ignoradas:', 'Skipped rows:', 'Übersprungene Zeilen:')}</div>
                        {importPreview.errors.map((err, index) => (
                          <span key={index}>{tr('Linha', 'Row', 'Zeile')} {err.rowNumber}: {importErrorLabels[err.message] || err.message}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <Button onClick={handleConfirmImport} disabled={!importPreview || importPreview.rows.length === 0} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40">
                  <Upload className="h-4 w-4 mr-2" />
                  {tr('Importar para o meu plano', 'Import into my plan', 'In meinen Plan importieren')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {planMessage && <div className="mb-6 flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300 sm:flex-row sm:items-center sm:justify-between"><span>{planMessage}</span><Button variant="ghost" size="sm" onClick={() => navigate('/configurar')} className="text-emerald-300 hover:bg-emerald-500/10">{tr('Revisar perfil', 'Review profile', 'Profil überprüfen')}</Button></div>}

      {state.workoutPlan.length > 0 && (
        <Card className="mb-6 border-orange-500/20 bg-gradient-to-r from-orange-500/[.08] to-transparent">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
              <div>
                <h2 className="font-black text-white">{tr('Por que o plano combina corridas diferentes?', 'Why does the plan combine different types of running?', 'Warum kombiniert der Plan verschiedene Laufarten?')}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{tr('A corrida aparece em três contextos complementares: base aeróbia, intervalos controlados e corrida sob fadiga após as estações. Força e técnica sustentam esses estímulos, enquanto os dias leves ajudam a absorver a carga.', 'Running appears in three complementary contexts: aerobic base, controlled intervals and running under fatigue after stations. Strength and technique support these sessions, while easier days help you absorb the training load.', 'Laufen taucht in drei sich ergänzenden Kontexten auf: aerobe Basis, kontrollierte Intervalle und Laufen unter Ermüdung nach den Stationen. Kraft und Technik stützen diese Reize, während leichtere Tage helfen, die Belastung zu verarbeiten.')}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <RpeHelp />
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-300">{tr('Base', 'Base', 'Basis')} · RPE 3–4</span>
                  <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-sky-300">{tr('Intervalos', 'Intervals', 'Intervalle')} · RPE 4–8</span>
                  <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-orange-300">{tr('Sob fadiga', 'Under fatigue', 'Unter Ermüdung')} · RPE 6–7</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today highlight */}
      {todayWorkout && (
        <Card className="mb-6 border-l-4 border-l-orange-500 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge className={typeColors[todayWorkout.type]}>
                {t.dashboard.workoutTypes[todayWorkout.type as keyof typeof t.dashboard.workoutTypes]}
              </Badge>
              <span className="text-sm text-muted-foreground">{t.dashboard.today}</span>
            </div>
            <CardTitle className="mt-2 flex items-center gap-2 text-xl text-white">{localizeWorkoutText(todayWorkout.title)}{todayWorkout.type === 'metcon' && <MetconHelp />}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{localizeWorkoutText(todayWorkout.description)}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Timer className="h-4 w-4" />
                {todayWorkout.duration} min
              </span>
              <span className="flex items-center gap-1">
                <Flame className="h-4 w-4" />
                {todayWorkout.intensity}
              </span>
              <span className="flex items-center gap-1">
                {todayWorkout.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                {todayWorkout.completed ? tr('Concluído', 'Completed', 'Abgeschlossen') : tr('Pendente', 'Pending', 'Ausstehend')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly plan */}
      {state.workoutPlan.length === 0 ? (
        <Card className="p-8 text-center bg-card">
          <p className="text-muted-foreground">{t.dashboard.noPlan}</p>
          <Button onClick={handleGeneratePlan} className="mt-4 bg-orange-500 hover:bg-orange-600">
            {tr('Gerar Plano', 'Generate Plan', 'Plan erstellen')}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {state.workoutPlan.map((day) => {
            const Icon = typeIcons[day.type] || Circle;
            const isToday = day.date === today;
            return (
              <Card
                key={day.date}
                className={`transition-colors ${isToday ? 'bg-orange-500/5 border-orange-500/30' : 'bg-card'}`}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleWorkoutComplete(day.date)}
                      className="shrink-0"
                    >
                      {day.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 hover:text-green-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-orange-400" />
                      )}
                    </button>
                    <div className={`p-2 rounded-lg shrink-0 ${typeColors[day.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`flex items-center gap-1.5 font-medium text-sm ${day.completed ? 'line-through text-muted-foreground' : 'text-white'}`}>
                          {localizeWorkoutText(day.title)}{day.type === 'metcon' && <MetconHelp />}
                        </span>
                        <Badge variant="outline" className="text-xs border-orange-500/20">
                          {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{localizeWorkoutText(day.description)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-zinc-400 hover:bg-orange-500/10 hover:text-orange-300"
                          aria-label={`${tr('Abrir detalhes de', 'Open details for', 'Details öffnen für')} ${localizeWorkoutText(day.title)}`}
                      onClick={() => setViewingWorkout(day)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {/* Edit button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                          onClick={() => setEditingWorkout({ ...day })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-orange-500/20">
                        <DialogHeader>
                          <DialogTitle className="text-white">{tr('Editar treino', 'Edit workout', 'Workout bearbeiten')}</DialogTitle>
                        </DialogHeader>
                        {editingWorkout && editingWorkout.date === day.date && (
                          <div className="space-y-4">
                            <div>
                              <Label className="text-muted-foreground">{tr('Título', 'Title', 'Titel')}</Label>
                              <Input
                                value={editingWorkout.title}
                                onChange={(e) => setEditingWorkout({ ...editingWorkout, title: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label className="text-muted-foreground">{tr('Descrição', 'Description', 'Beschreibung')}</Label>
                              <Input
                                value={editingWorkout.description}
                                onChange={(e) => setEditingWorkout({ ...editingWorkout, description: e.target.value })}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground">{tr('Duração (min)', 'Duration (min)', 'Dauer (Min.)')}</Label>
                                <Input
                                  type="number"
                                  value={editingWorkout.duration}
                                  onChange={(e) => setEditingWorkout({ ...editingWorkout, duration: parseInt(e.target.value) })}
                                />
                              </div>
                              <div>
                                <Label className="text-muted-foreground">{tr('Intensidade', 'Intensity', 'Intensität')}</Label>
                                <Select
                                  value={editingWorkout.intensity}
                                  onValueChange={(v) => setEditingWorkout({ ...editingWorkout, intensity: v as WorkoutDay['intensity'] })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {localizedIntensityOptions.map((i) => (
                                      <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <Button onClick={handleSaveEdit} className="w-full bg-orange-500 hover:bg-orange-600">
                              <Pencil className="h-4 w-4 mr-2" />
                              {tr('Salvar alterações', 'Save changes', 'Änderungen speichern')}
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => deleteWorkout(day.date)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog open={Boolean(viewingWorkout)} onOpenChange={(open) => !open && setViewingWorkout(null)}>
        <DialogContent className="border-orange-500/20 bg-card">
          <DialogHeader><DialogTitle className="text-white">{tr('Detalhes da sessão', 'Session details', 'Sitzungsdetails')}</DialogTitle></DialogHeader>
          {viewingWorkout && <div className="space-y-5">
            <div><div className="flex flex-wrap gap-2"><Badge className={typeColors[viewingWorkout.type]}>{t.dashboard.workoutTypes[viewingWorkout.type as keyof typeof t.dashboard.workoutTypes]}</Badge>{usesBodyweightAdaptation && viewingWorkout.type !== 'rest' && <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-300">{tr('Adaptado: sem estações ou cargas', 'Adapted: no stations or loads', 'Angepasst: ohne Stationen oder Lasten')}</Badge>}</div><h2 className="mt-3 flex items-center gap-2 text-2xl font-black text-white">{localizeWorkoutText(viewingWorkout.title)}{viewingWorkout.type === 'metcon' && <MetconHelp />}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{localizeWorkoutText(viewingWorkout.description)}</p>{usesBodyweightAdaptation && viewingWorkout.type !== 'rest' && <p className="mt-3 rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs leading-relaxed text-sky-200"><strong>{tr('Plano adaptado ao equipamento disponível:', 'Plan adapted to your available equipment:', 'Plan an dein verfügbares Equipment angepasst:')}</strong> {tr('estas sessões usam corrida, caso marcada no perfil, e movimentos que não exigem equipamentos. Atualize seu perfil e gere um novo plano quando tiver acesso a outros equipamentos.', 'these sessions use running, when selected in your profile, and movements that require no equipment. Update your profile and generate a new plan when you gain access to other equipment.', 'Diese Einheiten nutzen Laufen, sofern in deinem Profil ausgewählt, und Übungen, die kein Equipment erfordern. Aktualisiere dein Profil und erstelle einen neuen Plan, sobald du Zugang zu weiterem Equipment hast.')}</p>}</div>
            <div className="grid grid-cols-3 gap-2"><PlanDetail label={tr('Data', 'Date', 'Datum')} value={new Date(`${viewingWorkout.date}T12:00:00`).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'de' ? 'de-DE' : 'pt-BR')} /><PlanDetail label={tr('Duração', 'Duration', 'Dauer')} value={`${viewingWorkout.duration || 0} min`} /><PlanDetail label={tr('Intensidade', 'Intensity', 'Intensität')} value={localizedIntensityOptions.find(item => item.value === viewingWorkout.intensity)?.label || '—'} /></div>
            {viewingWorkout.type === 'rest' ? <p className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-zinc-400">{tr('Este é um dia de descanso planejado. Não há sessão para iniciar.', 'This is a planned rest day. There is no session to start.', 'Dies ist ein geplanter Ruhetag. Es gibt keine Einheit zu starten.')}</p> : <Button onClick={() => startWorkout(viewingWorkout)} className="w-full bg-orange-500 font-black text-black hover:bg-orange-400"><Play className="mr-2 h-4 w-4 fill-current" /> {tr('Abrir e iniciar este treino', 'Open and start this workout', 'Dieses Workout öffnen und starten')}</Button>}
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanDetail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center"><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">{label}</p><p className="mt-1 text-sm font-bold text-zinc-200">{value}</p></div>;
}

function MetconHelp() {
  return (
    <details className="group relative inline-block normal-case">
      <summary
        aria-label="O que significa Metcon?"
        className="grid h-5 w-5 cursor-pointer list-none place-items-center rounded-full border border-white/10 text-zinc-500 transition hover:border-orange-500/40 hover:text-orange-400"
        onClick={(event) => event.stopPropagation()}
      >
        <Info className="h-3 w-3" />
      </summary>
      <div className="absolute left-0 top-7 z-40 w-72 rounded-xl border border-orange-500/20 bg-[#1a1a1a] p-4 text-left text-xs font-normal leading-relaxed text-zinc-300 shadow-2xl">
        <strong className="block text-sm text-white">O que é Metcon?</strong>
        <p className="mt-2">Metcon é a abreviação de condicionamento metabólico: uma sessão que combina movimentos e esforço cardiovascular para desenvolver resistência e capacidade de sustentar intensidade.</p>
        <p className="mt-2"><strong className="text-orange-400">AMRAP 20 min</strong> significa realizar o maior número possível de voltas ou repetições em 20 minutos, mantendo técnica e ritmo controlado.</p>
      </div>
    </details>
  );
}
