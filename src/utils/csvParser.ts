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

export function parseCSV(file: File): Promise<Entry[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        const headers = results.meta.fields ?? [];

        const col = (keyword: string) =>
          headers.find((h) => h.toLowerCase().includes(keyword.toLowerCase())) ?? '';

        const idCol = col('id');
        const startCol = col('start time');
        const completionCol = col('completion time');
        const amCol = headers.find((h) => h.toLowerCase().startsWith('am:')) ?? '';
        const pmCol = headers.find((h) => h.toLowerCase().startsWith('pm:')) ?? '';

        const entries: Entry[] = [];

        rows.forEach((row, rowIndex) => {
          const completionTime = row[completionCol] ?? '';
          const startTime = row[startCol] ?? '';
          const dateStr = parseDate(completionTime);

          const amText = (row[amCol] ?? '').trim();
          const pmText = (row[pmCol] ?? '').trim();
          const originalId = row[idCol] ?? String(rowIndex + 1);

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
