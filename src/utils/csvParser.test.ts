import { describe, it, expect } from 'vitest';
import { parseCSV } from './csvParser';

function makeFile(content: string) {
  return new File([content], 'test.csv', { type: 'text/csv' });
}

const AM_COL = 'AM: Think about your tasks coming up today. How do you think you will use LLMs?';
const PM_COL = 'PM: How did you use LLMs today? Were there any moments that stood out to you, e.g., successful usage, or frustrating usage?';

function makeCSV(rows: { am?: string; pm?: string; date?: string; id?: string }[]) {
  const header = `Id,Start time,Completion time,Email,Name,${AM_COL},${PM_COL}`;
  const body = rows.map(({ am = '', pm = '', date = '6/2/2026', id = '1' }) =>
    `${id},${date} 8:00:00 AM,${date} 8:05:00 AM,user@example.com,Test,"${am}","${pm}"`
  );
  return [header, ...body].join('\n');
}

describe('parseCSV', () => {
  it('creates separate AM and PM entries from a single row', async () => {
    const file = makeFile(makeCSV([{ am: 'Morning plan', pm: 'Evening review' }]));
    const entries = await parseCSV(file);

    expect(entries).toHaveLength(2);
    expect(entries.find((e) => e.type === 'AM')!.text).toBe('Morning plan');
    expect(entries.find((e) => e.type === 'PM')!.text).toBe('Evening review');
  });

  it('skips empty AM cells', async () => {
    const file = makeFile(makeCSV([{ am: '', pm: 'PM only' }]));
    const entries = await parseCSV(file);

    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('PM');
  });

  it('skips empty PM cells', async () => {
    const file = makeFile(makeCSV([{ am: 'AM only', pm: '' }]));
    const entries = await parseCSV(file);

    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('AM');
  });

  it('parses MM/DD/YYYY dates from the completion time', async () => {
    const file = makeFile(makeCSV([{ am: 'text', date: '6/15/2026' }]));
    const entries = await parseCSV(file);

    expect(entries[0].date).toBe('2026-06-15');
    expect(entries[0].originalDate).toBe('2026-06-15');
  });

  it('sets dateModified to false on import', async () => {
    const file = makeFile(makeCSV([{ am: 'text' }]));
    const [entry] = await parseCSV(file);

    expect(entry.dateModified).toBe(false);
  });

  it('correctly preserves the row index', async () => {
    const file = makeFile(makeCSV([
      { id: '1', am: 'first' },
      { id: '2', am: 'second' },
    ]));
    const entries = await parseCSV(file);

    expect(entries.find((e) => e.text === 'first')!.rowIndex).toBe(0);
    expect(entries.find((e) => e.text === 'second')!.rowIndex).toBe(1);
  });

  it('returns an empty array for a CSV with no AM or PM content', async () => {
    const file = makeFile(makeCSV([{ am: '', pm: '' }]));
    const entries = await parseCSV(file);

    expect(entries).toHaveLength(0);
  });

  it('handles multiple rows', async () => {
    const file = makeFile(makeCSV([
      { am: 'Day 1 AM', date: '6/1/2026' },
      { pm: 'Day 2 PM', date: '6/2/2026' },
      { am: 'Day 3 AM', pm: 'Day 3 PM', date: '6/3/2026' },
    ]));
    const entries = await parseCSV(file);

    expect(entries).toHaveLength(4);
  });
});
