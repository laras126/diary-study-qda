import Papa from 'papaparse';
import { format } from 'date-fns';
import { Entry } from '../types';

function parseDate(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return format(d, 'yyyy-MM-dd');
  // Try MM/DD/YYYY HH:MM:SS AM/PM (Excel / Forms export)
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  return raw.split(/[T ]/)[0] ?? '';
}

export interface ColumnMap {
  am: string;
  pm: string;
  completionTime: string;
  startTime: string;
  id: string;
}

export function readCSVHeaders(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      preview: 1,
      complete: (results) => resolve(results.meta.fields ?? []),
      error: (err) => reject(err),
    });
  });
}

// Only AM and PM are auto-detected; all other columns are left blank for user selection.
export function detectColumns(headers: string[]): ColumnMap {
  const find = (tests: ((h: string) => boolean)[]) =>
    headers.find((h) => tests.some((t) => t(h.toLowerCase()))) ?? '';

  return {
    am: find([
      (h) => h.startsWith('am:'),
      (h) => h === 'am',
      (h) => h.includes('morning'),
      (h) => h.includes('before'),
    ]),
    pm: find([
      (h) => h.startsWith('pm:'),
      (h) => h === 'pm',
      (h) => h.includes('evening'),
      (h) => h.includes('after'),
    ]),
    completionTime: '',
    startTime: '',
    id: '',
  };
}

export function parseCSV(file: File, mapping: ColumnMap): Promise<Entry[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        const { am: amCol, pm: pmCol, completionTime: completionCol, startTime: startCol, id: idCol } = mapping;
        const entries: Entry[] = [];

        rows.forEach((row, rowIndex) => {
          const completionTime = row[completionCol] ?? '';
          const startTime = row[startCol] ?? '';
          const dateStr = parseDate(completionTime);
          const amText = (row[amCol] ?? '').trim();
          const pmText = (row[pmCol] ?? '').trim();
          const originalId = (idCol ? row[idCol] : '') || String(rowIndex + 1);

          if (amText) {
            entries.push({
              id: crypto.randomUUID(),
              originalId,
              rowIndex,
              startTime,
              completionTime,
              type: 'AM',
              text: amText,
              date: dateStr,
              originalDate: dateStr,
              dateModified: false,
            });
          }

          if (pmText) {
            entries.push({
              id: crypto.randomUUID(),
              originalId,
              rowIndex,
              startTime,
              completionTime,
              type: 'PM',
              text: pmText,
              date: dateStr,
              originalDate: dateStr,
              dateModified: false,
            });
          }
        });

        resolve(entries);
      },
      error: (err) => reject(err),
    });
  });
}
