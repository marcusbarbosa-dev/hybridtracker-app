import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Activity, BarChart3, CalendarDays, ChevronRight, Clock3, Dumbbell, Eye, Filter, Gauge, History, Info, Pencil, RefreshCw, Save, Target, Trash2, Trophy, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/i18n/I18nContext';

type Status = 'Rx' | 'Scaled' | 'Parcial' | 'Time Cap';
type WorkoutLog = { id?: string; workout_date?: string; workout_name: string; completion_status: Status; planned_rpe?: number; actual_rpe?: number; duration_minutes?: number; notes?: string; session_snapshot?: { clientId?: string; plannedDate?: string; workoutType?: string; level?: string; stationTitle?: string; run?: string; equipment?: string[] }; created_at: string };
type AthleteProfile = { training_days: number };

const statuses: Status[] = ['Rx', 'Scaled', 'Parcial', 'Time Cap'];
const statusColors: Record<Status, string> = {
  Rx: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', Scaled: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
  Parcial: 'bg-amber-500/15 text-amber-400 border-amber-500/25', 'Time Cap': 'bg-rose-500/15 text-rose-400 border-rose-500/25',
};
const translate = (value: string | undefined, en = false) => {
  const source = value || '';
  return en
    ? source.replaceAll('Corrida + Estações', 'Running + Stations').replaceAll('Empurrar trenó', 'Sled push').replaceAll('Caminhada do fazendeiro', "Farmer's carry").replaceAll('Deslocamento do urso', 'Bear crawl').replaceAll('burpee com salto em distância', 'burpee broad jump').replaceAll('Corrida intervalada controlada', 'Controlled interval run').replaceAll('Corrida sob fadiga - treino híbrido', 'Running under fatigue - hybrid workout').replaceAll('Descanso', 'Rest')
    : source.replaceAll('Engine + Stations', 'Corrida + Estações').replaceAll('Sled push', 'Empurrar trenó').replaceAll('Farmer carry', 'Caminhada do fazendeiro').replaceAll('Bear crawl', 'Deslocamento do urso').replaceAll('burpee broad jump', 'burpee com salto em distância');
};
const statusLabel = (status: string, en: boolean, de = false) => en && status === 'Parcial' ? 'Partial' : de && status === 'Parcial' ? 'Teilweise' : status;
const dateOf = (log: WorkoutLog) => new Date(`${log.workout_date || log.created_at.slice(0, 10)}T12:00:00`);
const weekStart = (date: Date) => { const result = new Date(date); const day = (result.getDay() + 6) % 7; result.setDate(result.getDate() - day); result.setHours(0, 0, 0, 0); return result; };

export default function WorkoutHistory() {
  const { state } = useApp();
  const { lang } = useI18n();
  const en = lang === 'en';
  const tr = (pt: string, english: string, german: string) => en ? english : lang === 'de' ? german : pt;
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [profile, setProfile] = useState<AthleteProfile>({ training_days: 4 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [period, setPeriod] = useState('30');
  const [source, setSource] = useState('local');
  const [selected, setSelected] = useState<WorkoutLog | null>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');

  const loadLogs = async () => {
    setLoading(true); setMessage('');
    let localLogs: WorkoutLog[] = [];
    try { localLogs = JSON.parse(localStorage.getItem('hybridtracker-workout-logs') || '[]'); } catch { localLogs = []; }
    if (supabase) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const [logsResult, profileResult] = await Promise.all([
          supabase.from('workout_logs').select('*').eq('user_id', authData.user.id).order('created_at', { ascending: false }).limit(200),
          supabase.from('athlete_profiles').select('training_days').eq('user_id', authData.user.id).maybeSingle(),
        ]);
        if (profileResult.data) setProfile(profileResult.data as AthleteProfile);
        if (!logsResult.error && logsResult.data) { setLogs(logsResult.data as WorkoutLog[]); setSource('nuvem'); setLoading(false); return; }
      }
    }
    setLogs(localLogs); setSource('local'); setLoading(false);
  };
  useEffect(() => { loadLogs(); }, []);

  const filteredLogs = useMemo(() => {
    const cutoff = period === 'all' ? 0 : Date.now() - Number(period) * 86400000;
    return logs.filter(log => (statusFilter === 'Todos' || log.completion_status === statusFilter) && (cutoff === 0 || new Date(log.created_at).getTime() >= cutoff));
  }, [logs, statusFilter, period]);

  const metrics = useMemo(() => {
    const sessions = filteredLogs.length;
    const minutes = filteredLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    const actual = filteredLogs.filter(log => log.actual_rpe);
    const planned = filteredLogs.filter(log => log.planned_rpe);
    const avgRpe = actual.length ? actual.reduce((sum, log) => sum + (log.actual_rpe || 0), 0) / actual.length : 0;
    const avgPlanned = planned.length ? planned.reduce((sum, log) => sum + (log.planned_rpe || 0), 0) / planned.length : 0;
    const rx = filteredLogs.filter(log => log.completion_status === 'Rx').length;
    return { sessions, minutes, avgRpe, avgPlanned, rxRate: sessions ? Math.round(rx / sessions * 100) : 0 };
  }, [filteredLogs]);

  const weekly = useMemo(() => {
    const now = weekStart(new Date());
    return Array.from({ length: 8 }, (_, index) => {
      const start = new Date(now); start.setDate(start.getDate() - (7 - index) * 7);
      const end = new Date(start); end.setDate(end.getDate() + 7);
      const items = logs.filter(log => { const d = dateOf(log); return d >= start && d < end; });
      return { label: index === 7 ? tr('Atual', 'Current', 'Aktuell') : `${start.getDate()}/${start.getMonth() + 1}`, sessions: items.length, minutes: items.reduce((sum, log) => sum + (log.duration_minutes || 0), 0), load: items.reduce((sum, log) => sum + (log.duration_minutes || 0) * (log.actual_rpe || 0), 0) };
    });
  }, [logs, lang]);
  const currentWeekStart = weekStart(new Date());
  const currentWeekEnd = new Date(currentWeekStart); currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);
  const plannedThisWeek = state.workoutPlan.filter(item => item.type !== 'rest' && new Date(`${item.date}T12:00:00`) >= currentWeekStart && new Date(`${item.date}T12:00:00`) < currentWeekEnd);
  const completedPlanDates = new Set(logs.map(log => log.session_snapshot?.plannedDate).filter(Boolean));
  const plannedCompleted = plannedThisWeek.filter(item => completedPlanDates.has(item.date) || item.completed).length;
  const plannedTarget = plannedThisWeek.length || profile.training_days;
  const adherence = Math.min(100, Math.round(plannedCompleted / Math.max(plannedTarget, 1) * 100));
  const distribution = statuses.map(status => ({ status, count: filteredLogs.filter(log => log.completion_status === status).length, percentage: filteredLogs.length ? Math.round(filteredLogs.filter(log => log.completion_status === status).length / filteredLogs.length * 100) : 0 }));

  const persistLocal = (next: WorkoutLog[]) => { setLogs(next); localStorage.setItem('hybridtracker-workout-logs', JSON.stringify(next)); };
  const saveEdit = async (updated: WorkoutLog) => {
    if (source === 'nuvem' && updated.id && supabase) {
      const { error } = await supabase.from('workout_logs').update({ workout_name: updated.workout_name, completion_status: updated.completion_status, actual_rpe: updated.actual_rpe, duration_minutes: updated.duration_minutes, notes: updated.notes }).eq('id', updated.id);
      if (error) { setMessage(`Não foi possível salvar: ${error.message}`); return; }
      setLogs(items => items.map(item => item.id === updated.id ? updated : item));
    } else persistLocal(logs.map(item => item.created_at === updated.created_at ? updated : item));
    setSelected(updated); setEditing(false); setMessage('Registro atualizado com sucesso.');
  };
  const removeLog = async (log: WorkoutLog) => {
    if (!window.confirm('Excluir este registro de treino? Essa ação não pode ser desfeita.')) return;
    if (source === 'nuvem' && log.id && supabase) {
      const { error } = await supabase.from('workout_logs').delete().eq('id', log.id);
      if (error) { setMessage(`Não foi possível excluir: ${error.message}`); return; }
      setLogs(items => items.filter(item => item.id !== log.id));
    } else persistLocal(logs.filter(item => item.created_at !== log.created_at));
    setSelected(null); setMessage('Registro excluído.');
  };

  return <div className="min-h-screen bg-[#090909] px-4 py-9 text-white"><main className="container">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-orange-500"><History className="h-4 w-4" /> {tr('Seus registros', 'Your records', 'Deine Einträge')}</div><h1 className="text-4xl font-black tracking-tight">{tr('Histórico de treinos', 'Workout history', 'Trainingsverlauf')}</h1><p className="mt-2 text-zinc-400">{tr('Acompanhe aderência, intensidade, carga e consistência.', 'Track adherence, intensity, training load and consistency.', 'Verfolge Adhärenz, Intensität, Trainingsbelastung und Konsistenz.')}</p></div><div className="flex items-center gap-2"><span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-xs text-zinc-500">{tr('Fonte', 'Source', 'Quelle')}: {source}</span><button onClick={loadLogs} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.035] text-zinc-400 hover:text-white" aria-label={tr('Atualizar histórico', 'Refresh history', 'Verlauf aktualisieren')}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div></header>
    {message && <p className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-300">{message}</p>}

    <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={Dumbbell} value={String(metrics.sessions)} label={tr('Sessões', 'Sessions', 'Einheiten')} /><Metric icon={Clock3} value={String(metrics.minutes)} label={tr('Minutos', 'Minutes', 'Minuten')} /><Metric icon={Gauge} value={metrics.avgRpe ? metrics.avgRpe.toFixed(1) : '—'} label={tr('RPE médio', 'Average RPE', 'Durchschnittlicher RPE')} help={tr('É a média do esforço percebido nos treinos registrados, em uma escala de 1 a 10.', 'The average perceived effort across recorded workouts, on a scale from 1 to 10.', 'Der durchschnittlich empfundene Anstrengungsgrad deiner erfassten Trainings, auf einer Skala von 1 bis 10.')} /><Metric icon={Target} value={`${metrics.avgPlanned ? metrics.avgPlanned.toFixed(1) : '—'} → ${metrics.avgRpe ? metrics.avgRpe.toFixed(1) : '—'}`} label={tr('Previsto → realizado', 'Planned → actual', 'Geplant → erreicht')} /><Metric icon={Trophy} value={`${metrics.rxRate}%`} label={tr('Realizados Rx', 'Completed Rx', 'Rx abgeschlossen')} /></section>

    <section className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]"><div className="rounded-2xl border border-white/10 bg-[#111] p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{tr('Aderência nesta semana', 'Adherence this week', 'Adhärenz diese Woche')}</p><div className="mt-3 flex items-end justify-between"><p className="text-4xl font-black">{adherence}%</p><p className="text-sm text-zinc-400">{plannedCompleted} {tr('de', 'of', 'von')} {plannedTarget} {tr('planejados', 'planned', 'geplant')}</p></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-orange-500" style={{ width: `${adherence}%` }} /></div><p className="mt-3 text-xs leading-relaxed text-zinc-500">{tr('Conta apenas treinos previstos no seu plano semanal e vinculados a um registro concluído.', 'Counts only workouts scheduled in your weekly plan and linked to a completed record.', 'Zählt nur Trainings, die in deinem Wochenplan vorgesehen und mit einem abgeschlossenen Eintrag verknüpft sind.')}</p></div><WeeklyChart data={weekly} /></section>

    <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]"><div><div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-sm font-bold text-zinc-300"><Filter className="h-4 w-4 text-orange-500" /> {tr('Filtrar registros', 'Filter records', 'Einträge filtern')}</div><div className="flex flex-wrap gap-2"><select value={period} onChange={e => setPeriod(e.target.value)} className="rounded-lg border border-white/10 bg-[#181818] px-3 py-2 text-xs outline-none"><option value="7">{tr('Últimos 7 dias', 'Last 7 days', 'Letzte 7 Tage')}</option><option value="30">{tr('Últimos 30 dias', 'Last 30 days', 'Letzte 30 Tage')}</option><option value="90">{tr('Últimos 90 dias', 'Last 90 days', 'Letzte 90 Tage')}</option><option value="all">{tr('Todo o período', 'All time', 'Gesamter Zeitraum')}</option></select><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-white/10 bg-[#181818] px-3 py-2 text-xs outline-none">{['Todos', ...statuses].map(status => <option key={status} value={status}>{status === 'Todos' ? tr('Todos', 'All', 'Alle') : statusLabel(status, en, lang === 'de')}</option>)}</select></div></div>
      {loading ? <Empty text={tr('Carregando seus registros...', 'Loading your records...', 'Deine Einträge werden geladen...')} /> : filteredLogs.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 bg-[#111] p-10 text-center"><Activity className="mx-auto h-9 w-9 text-zinc-700" /><h2 className="mt-4 font-black">{tr('Nenhum treino neste filtro', 'No workouts match this filter', 'Kein Training entspricht diesem Filter')}</h2><Link to="/treino" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black">{tr('Ir para o Treino do Dia', "Go to Today's Workout", 'Zum Training des Tages')} <ChevronRight className="h-4 w-4" /></Link></div> : <div className="space-y-3">{filteredLogs.map((log, index) => <WorkoutCard key={log.id || `${log.created_at}-${index}`} log={log} onOpen={() => { setSelected(log); setEditing(false); setMessage(''); }} />)}</div>}
    </div><aside className="h-fit rounded-2xl border border-white/10 bg-[#111] p-5"><h2 className="font-black">{tr('Como você realizou', 'How you completed them', 'Wie du sie absolviert hast')}</h2><p className="mt-1 text-xs text-zinc-500">{tr('Distribuição no período selecionado.', 'Distribution in the selected period.', 'Verteilung im ausgewählten Zeitraum.')}</p><div className="mt-6 space-y-5">{distribution.map(item => <div key={item.status}><div className="mb-2 flex justify-between text-xs"><span className="font-bold text-zinc-300">{statusLabel(item.status, en, lang === 'de')}</span><span className="text-zinc-500">{item.count} · {item.percentage}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-orange-500" style={{ width: `${item.percentage}%` }} /></div></div>)}</div></aside></section>
  </main>{selected && <DetailsModal log={selected} editing={editing} onEditing={setEditing} onClose={() => setSelected(null)} onSave={saveEdit} onDelete={removeLog} />}</div>;
}

function WeeklyChart({ data }: { data: { label: string; sessions: number; minutes: number; load: number }[] }) {
  const { lang } = useI18n(); const en = lang === 'en'; const tr = (pt: string, english: string, german: string) => en ? english : lang === 'de' ? german : pt;
  const maxMinutes = Math.max(...data.map(item => item.minutes), 1); const maxLoad = Math.max(...data.map(item => item.load), 1);
  return <div className="rounded-2xl border border-white/10 bg-[#111] p-5"><div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 font-black"><BarChart3 className="h-4 w-4 text-orange-500" /> {tr('Consistência semanal', 'Weekly consistency', 'Wöchentliche Konsistenz')}</h2><p className="mt-1 text-xs text-zinc-500">{tr('Minutos e carga (minutos × RPE) nas últimas 8 semanas.', 'Minutes and load (minutes × RPE) over the last 8 weeks.', 'Minuten und Belastung (Minuten × RPE) der letzten 8 Wochen.')}</p></div><div className="hidden gap-3 text-[10px] text-zinc-500 sm:flex"><span>● {tr('Minutos', 'Minutes', 'Minuten')}</span><span className="text-orange-400">● {tr('Carga', 'Load', 'Belastung')}</span></div></div><div className="mt-6 grid h-40 grid-cols-8 items-end gap-2">{data.map(item => <div key={item.label} className="flex h-full flex-col justify-end"><div className="flex flex-1 items-end justify-center gap-1"><div title={`${item.minutes} ${tr('minutos', 'minutes', 'Minuten')}`} className="w-2 rounded-t bg-zinc-600" style={{ height: `${Math.max(item.minutes / maxMinutes * 100, item.minutes ? 6 : 0)}%` }} /><div title={`${tr('Carga', 'Load', 'Belastung')} ${item.load}`} className="w-2 rounded-t bg-orange-500" style={{ height: `${Math.max(item.load / maxLoad * 100, item.load ? 6 : 0)}%` }} /></div><p className="mt-2 truncate text-center text-[10px] text-zinc-600">{item.label}</p></div>)}</div></div>;
}
function DetailsModal({ log, editing, onEditing, onClose, onSave, onDelete }: { log: WorkoutLog; editing: boolean; onEditing: (value: boolean) => void; onClose: () => void; onSave: (log: WorkoutLog) => void; onDelete: (log: WorkoutLog) => void }) {
  const [draft, setDraft] = useState(log);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={e => e.target === e.currentTarget && onClose()}><article className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#111] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-500">Detalhes completos</p>{editing ? <input value={draft.workout_name} onChange={e => setDraft({ ...draft, workout_name: e.target.value })} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-xl font-black" /> : <h2 className="mt-2 text-2xl font-black">{translate(log.workout_name)}</h2>}</div><button onClick={onClose} className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white"><X /></button></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2"><Field label="Data" value={new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(dateOf(log))} /><Field label="Nível" value={log.session_snapshot?.level || 'Não informado'} /><Field label="Corrida" value={log.session_snapshot?.run || 'Não informada'} /><Field label="Estações" value={translate(log.session_snapshot?.stationTitle) || 'Não informadas'} /></div>
    {editing ? <div className="mt-5 grid gap-4 sm:grid-cols-2"><EditField label="Como realizou"><select value={draft.completion_status} onChange={e => setDraft({ ...draft, completion_status: e.target.value as Status })}>{statuses.map(status => <option key={status}>{status}</option>)}</select></EditField><EditField label="RPE realizado"><input type="number" min="1" max="10" value={draft.actual_rpe || ''} onChange={e => setDraft({ ...draft, actual_rpe: Number(e.target.value) })} /></EditField><EditField label="Duração (minutos)"><input type="number" min="1" value={draft.duration_minutes || ''} onChange={e => setDraft({ ...draft, duration_minutes: Number(e.target.value) })} /></EditField><EditField label="Observações"><textarea value={draft.notes || ''} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></EditField></div> : <><div className="mt-5 grid gap-3 sm:grid-cols-3"><Field label="Conclusão" value={log.completion_status} /><Field label="RPE previsto" value={log.planned_rpe ? `${log.planned_rpe}/10` : '—'} /><Field label="RPE realizado" value={log.actual_rpe ? `${log.actual_rpe}/10` : '—'} /></div>{log.notes && <Field label="Observações" value={log.notes} wide />}</>}
    <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5"><button onClick={() => onDelete(log)} className="inline-flex items-center gap-2 rounded-xl border border-rose-500/25 px-4 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /> Excluir</button>{editing ? <div className="flex gap-2"><button onClick={() => { setDraft(log); onEditing(false); }} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold">Cancelar</button><button onClick={() => onSave(draft)} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-black"><Save className="h-4 w-4" /> Salvar</button></div> : <button onClick={() => onEditing(true)} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-black"><Pencil className="h-4 w-4" /> Editar registro</button>}</div>
  </article></div>;
}
function WorkoutCard({ log, onOpen }: { log: WorkoutLog; onOpen: () => void }) { const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(dateOf(log)); return <article className="rounded-2xl border border-white/10 bg-[#111] p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-xs text-zinc-500"><CalendarDays className="h-3.5 w-3.5" /> {date}</div><h2 className="mt-2 text-lg font-black">{translate(log.workout_name)}</h2><p className="mt-1 text-sm text-zinc-500">{log.session_snapshot?.run || 'Sessão registrada'}{log.session_snapshot?.stationTitle ? ` · ${translate(log.session_snapshot.stationTitle)}` : ''}</p></div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-3 py-1.5 text-xs font-black ${statusColors[log.completion_status]}`}>{log.completion_status}</span><span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-zinc-400">RPE {log.planned_rpe || '—'} → {log.actual_rpe || '—'}</span>{log.duration_minutes && <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-zinc-400">{log.duration_minutes} min</span>}<button onClick={onOpen} className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-500/10"><Eye className="h-3.5 w-3.5" /> Detalhes</button></div></div></article>; }
function Metric({ icon: Icon, value, label, help }: { icon: typeof Activity; value: string; label: string; help?: string }) { return <div className="relative rounded-2xl border border-white/10 bg-[#111] p-5"><div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">{label}{help && <details className="group relative normal-case tracking-normal"><summary aria-label={`O que significa ${label}?`} className="grid h-5 w-5 cursor-pointer list-none place-items-center rounded-full border border-white/10 text-zinc-500 transition hover:border-orange-500/40 hover:text-orange-400"><Info className="h-3 w-3" /></summary><div className="absolute left-0 top-7 z-30 w-72 rounded-xl border border-orange-500/20 bg-[#1a1a1a] p-4 text-xs font-normal leading-relaxed text-zinc-300 shadow-2xl">{help}<p className="mt-2 text-[11px] text-zinc-500">RPE representa percepção de esforço e não é a frequência cardíaca.</p></div></details>}</span><Icon className="h-4 w-4 text-orange-500" /></div><p className="mt-4 text-3xl font-black">{value}</p></div>; }
function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) { return <div className={`mt-${wide ? '5' : '0'} rounded-xl border border-white/10 bg-black/20 p-4`}><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">{label}</p><p className="mt-1 text-sm font-semibold text-zinc-300">{value}</p></div>; }
function EditField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}<div className="mt-2 [&>*]:min-h-11 [&>*]:w-full [&>*]:rounded-lg [&>*]:border [&>*]:border-white/10 [&>*]:bg-black/30 [&>*]:p-2 [&>*]:text-sm [&>*]:font-normal [&>*]:normal-case [&>*]:text-white">{children}</div></label>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-white/10 bg-[#111] p-10 text-center text-zinc-500">{text}</div>; }
