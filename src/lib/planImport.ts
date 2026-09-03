import type { WorkoutDay } from '@/types';

// Athletes (or their coach) fill out a spreadsheet and export it as CSV. This module turns that
// CSV back into WorkoutDay entries. Column headers and value synonyms are accepted in PT/EN/DE
// since either the coach or the athlete may write the file in whichever language they use.

export type ImportedRow = WorkoutDay & { rowNumber: number };
export type ImportError = { rowNumber: number; message: string };
export type ImportResult = { rows: ImportedRow[]; errors: ImportError[] };

const TYPE_SYNONYMS: Record<string, WorkoutDay['type']> = {
  descanso: 'rest', rest: 'rest', ruhetag: 'rest', ruhe: 'rest',
  'força': 'strength', forca: 'strength', strength: 'strength', kraft: 'strength',
  corrida: 'run', run: 'run', running: 'run', lauf: 'run', laufen: 'run',
  'estações': 'metcon', estacoes: 'metcon', metcon: 'metcon', stations: 'metcon', 'estação': 'metcon', estacao: 'metcon', station: 'metcon', stationen: 'metcon',
  'híbrido': 'hybrid', hibrido: 'hybrid', hybrid: 'hybrid',
  'recuperação': 'recovery', recuperacao: 'recovery', recovery: 'recovery', erholung: 'recovery',
};

const INTENSITY_SYNONYMS: Record<string, NonNullable<WorkoutDay['intensity']>> = {
  leve: 'low', light: 'low', low: 'low', niedrig: 'low', leicht: 'low',
  moderada: 'moderate', moderate: 'moderate', moderat: 'moderate', media: 'moderate', 'média': 'moderate',
  alta: 'high', high: 'high', hoch: 'high',
};

const norm = (value: string) => value
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .trim().toLowerCase();

// Minimal quoted-CSV parser: handles commas/semicolons inside quotes and doubled quotes ("").
export function parseCsv(text: string): string[][] {
  const delimiter = (text.split('\n')[0]?.split(';').length ?? 1) > (text.split('\n')[0]?.split(',').length ?? 1) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };
  const clean = text.replace(/\r\n/g, '\n').replace(/^﻿/, '');
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (inQuotes) {
      if (char === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += char;
    } else if (char === '"') inQuotes = true;
    else if (char === delimiter) pushField();
    else if (char === '\n') pushRow();
    else field += char;
  }
  if (field.length > 0 || row.length > 0) pushRow();
  return rows.filter(cols => cols.some(cell => cell.trim() !== ''));
}

function parseDate(raw: string): string | null {
  const value = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const br = value.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;
  const us = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (us) return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
  return null;
}

// Matches a header cell (already normalized) against known column names in pt/en/de.
const HEADER_ALIASES: Record<string, string[]> = {
  date: ['data', 'date', 'datum'],
  type: ['tipo', 'type', 'typ'],
  title: ['titulo', 'título', 'title', 'titel'],
  description: ['descricao', 'descrição', 'description', 'beschreibung'],
  duration: ['duracao', 'duração', 'duracao (min)', 'duration', 'duration (min)', 'dauer', 'dauer (min)'],
  intensity: ['intensidade', 'intensity', 'intensitat', 'intensität', 'intensitaet'],
};

function findColumn(headerRow: string[], key: keyof typeof HEADER_ALIASES): number {
  const aliases = HEADER_ALIASES[key];
  return headerRow.findIndex(cell => aliases.includes(norm(cell)));
}

export function parseWorkoutPlanCsv(text: string): ImportResult {
  const table = parseCsv(text);
  const rows: ImportedRow[] = [];
  const errors: ImportError[] = [];
  if (table.length === 0) return { rows, errors: [{ rowNumber: 0, message: 'empty_file' }] };

  const header = table[0];
  const columns = {
    date: findColumn(header, 'date'),
    type: findColumn(header, 'type'),
    title: findColumn(header, 'title'),
    description: findColumn(header, 'description'),
    duration: findColumn(header, 'duration'),
    intensity: findColumn(header, 'intensity'),
  };
  if (columns.date === -1 || columns.title === -1) {
    return { rows, errors: [{ rowNumber: 0, message: 'missing_columns' }] };
  }

  for (let i = 1; i < table.length; i++) {
    const cols = table[i];
    const rowNumber = i + 1; // 1-indexed, matches what a spreadsheet app shows
    const rawDate = cols[columns.date] || '';
    const date = parseDate(rawDate);
    if (!date) { errors.push({ rowNumber, message: 'invalid_date' }); continue; }
    const title = (cols[columns.title] || '').trim();
    if (!title) { errors.push({ rowNumber, message: 'missing_title' }); continue; }

    const rawType = columns.type >= 0 ? norm(cols[columns.type] || '') : '';
    const type = TYPE_SYNONYMS[rawType] || (rawType ? null : 'hybrid');
    if (type === null) { errors.push({ rowNumber, message: 'unknown_type' }); continue; }

    const rawIntensity = columns.intensity >= 0 ? norm(cols[columns.intensity] || '') : '';
    const intensity = rawIntensity ? (INTENSITY_SYNONYMS[rawIntensity] || 'moderate') : 'moderate';

    const rawDuration = columns.duration >= 0 ? (cols[columns.duration] || '').replace(/[^0-9]/g, '') : '';
    const duration = rawDuration ? Number(rawDuration) : undefined;

    rows.push({
      rowNumber,
      date,
      type,
      title,
      description: columns.description >= 0 ? (cols[columns.description] || '').trim() : '',
      completed: false,
      duration,
      intensity,
    });
  }

  return { rows, errors };
}

// Merges imported rows into the existing plan: entries on imported dates are replaced (keeping
// their previous `completed` flag when the title/description didn't change), everything else in
// the current plan is left untouched.
export function mergeImportedPlan(currentPlan: WorkoutDay[], imported: ImportedRow[]): WorkoutDay[] {
  const byDate = new Map(currentPlan.map(w => [w.date, w]));
  for (const row of imported) {
    const { rowNumber: _rowNumber, ...workout } = row;
    const existing = byDate.get(workout.date);
    const unchanged = existing && existing.title === workout.title && existing.description === workout.description;
    byDate.set(workout.date, unchanged ? { ...workout, completed: existing.completed } : workout);
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function buildTemplateCsv(lang: 'pt' | 'en' | 'de'): string {
  const headers: Record<'pt' | 'en' | 'de', string[]> = {
    pt: ['Data', 'Tipo', 'Titulo', 'Descricao', 'Duracao (min)', 'Intensidade'],
    en: ['Date', 'Type', 'Title', 'Description', 'Duration (min)', 'Intensity'],
    de: ['Datum', 'Typ', 'Titel', 'Beschreibung', 'Dauer (min)', 'Intensitaet'],
  };
  const example: Record<'pt' | 'en' | 'de', string[][]> = {
    pt: [
      ['2026-09-08', 'Força', 'Força de pernas', 'Agachamento 4x8, levantamento terra romeno 4x8', '50', 'Moderada'],
      ['2026-09-09', 'Descanso', 'Descanso', 'Recuperação ativa: caminhada leve e mobilidade', '0', 'Leve'],
      ['2026-09-10', 'Corrida', 'Intervalado', '6 x 600m em ritmo forte, 90s de recuperação', '40', 'Alta'],
    ],
    en: [
      ['2026-09-08', 'Strength', 'Leg strength', 'Back squat 4x8, Romanian deadlift 4x8', '50', 'Moderate'],
      ['2026-09-09', 'Rest', 'Rest day', 'Active recovery: easy walk and mobility', '0', 'Light'],
      ['2026-09-10', 'Run', 'Intervals', '6 x 600m at hard pace, 90s recovery', '40', 'High'],
    ],
    de: [
      ['2026-09-08', 'Kraft', 'Beinkraft', 'Kniebeuge 4x8, rumaenisches Kreuzheben 4x8', '50', 'Moderat'],
      ['2026-09-09', 'Ruhetag', 'Ruhetag', 'Aktive Erholung: lockerer Spaziergang und Mobilitaet', '0', 'Leicht'],
      ['2026-09-10', 'Lauf', 'Intervalle', '6 x 600m im hohen Tempo, 90s Pause', '40', 'Hoch'],
    ],
  };
  const rows = [headers[lang], ...example[lang]];
  return rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\r\n');
}
