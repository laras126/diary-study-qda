import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportView } from './ImportView';
import { useStore } from '../store/useStore';
import { Entry } from '../types';

// Column names recognised by detectColumns (starts with "am:" / "pm:")
const AM_COL = 'am: How did you plan to use LLMs today?';
const PM_COL = 'pm: How did you use LLMs today?';

function makeCSVFile(rows: { am?: string; pm?: string }[]) {
  const header = `"${AM_COL}","${PM_COL}"`;
  const body = rows.map(({ am = '', pm = '' }) => `"${am}","${pm}"`);
  return new File([[header, ...body].join('\n')], 'entries.csv', { type: 'text/csv' });
}

function makeUnmappedCSVFile() {
  // Column names that detectColumns won't recognise → no auto-detected mapping
  const header = '"Question 1","Question 2"';
  return new File([header + '\n"morning","evening"'], 'entries.csv', { type: 'text/csv' });
}

function makeJSONFile(data: object) {
  return new File([JSON.stringify(data)], 'backup.json', { type: 'application/json' });
}

function getFileInput() {
  return document.querySelector<HTMLInputElement>('input[type="file"]')!;
}

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: crypto.randomUUID(),
    originalId: '1',
    rowIndex: 0,
    startTime: '',
    completionTime: '',
    type: 'AM',
    text: 'Existing entry.',
    date: '2026-06-01',
    originalDate: '2026-06-01',
    dateModified: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Initial render
// ---------------------------------------------------------------------------
describe('ImportView – initial render', () => {
  it('renders the drop zone with a file chooser', () => {
    render(<ImportView />);
    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument();
    expect(screen.getByText(/choose file/i)).toBeInTheDocument();
  });

  it('shows a "Continue working" link when entries are already loaded', () => {
    useStore.setState({ entries: [makeEntry()] });
    render(<ImportView />);
    expect(screen.getByRole('button', { name: /continue working/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// CSV flow
// ---------------------------------------------------------------------------
describe('ImportView – CSV upload', () => {
  it('shows the column mapping UI after selecting a CSV file', async () => {
    const user = userEvent.setup();
    render(<ImportView />);

    await user.upload(getFileInput(), makeCSVFile([{ am: 'Morning', pm: 'Evening' }]));

    await waitFor(() => expect(screen.getByText(/map your columns/i)).toBeInTheDocument());
    expect(screen.getByText(/am entries/i)).toBeInTheDocument();
    expect(screen.getByText(/pm entries/i)).toBeInTheDocument();
  });

  it('"Preview entries" button is disabled when AM and PM columns are not detected', async () => {
    const user = userEvent.setup();
    render(<ImportView />);

    await user.upload(getFileInput(), makeUnmappedCSVFile());

    await waitFor(() => expect(screen.getByText(/map your columns/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /preview entries/i })).toBeDisabled();
  });

  it('"Preview entries" button is enabled when recognised columns are auto-detected', async () => {
    const user = userEvent.setup();
    render(<ImportView />);

    await user.upload(getFileInput(), makeCSVFile([{ am: 'Morning', pm: 'Evening' }]));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /preview entries/i })).not.toBeDisabled()
    );
  });

  it('shows entry counts in the preview after confirming column mapping', async () => {
    const user = userEvent.setup();
    render(<ImportView />);

    await user.upload(getFileInput(), makeCSVFile([
      { am: 'Day 1 morning', pm: 'Day 1 evening' },
      { am: 'Day 2 morning' },
    ]));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /preview entries/i })).not.toBeDisabled()
    );
    await user.click(screen.getByRole('button', { name: /preview entries/i }));

    await waitFor(() => expect(screen.getByText(/preview/i)).toBeInTheDocument());
    expect(screen.getByText('3')).toBeInTheDocument(); // total entries
  });

  it('imports all entries and navigates to the Clean view', async () => {
    const user = userEvent.setup();
    render(<ImportView />);

    await user.upload(getFileInput(), makeCSVFile([{ am: 'Morning', pm: 'Evening' }]));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /preview entries/i })).not.toBeDisabled()
    );
    await user.click(screen.getByRole('button', { name: /preview entries/i }));
    await waitFor(() => screen.getByRole('button', { name: /import & continue/i }));

    await user.click(screen.getByRole('button', { name: /import & continue/i }));

    expect(useStore.getState().entries).toHaveLength(2);
    expect(useStore.getState().currentView).toBe('clean');
  });
});

// ---------------------------------------------------------------------------
// Deduplication (add-new-only)
// ---------------------------------------------------------------------------
describe('ImportView – deduplication', () => {
  it('shows deduplication message when re-uploading an already-imported file', async () => {
    // Pre-seed an entry with originalId "1" and type "AM" — matches row 0 of the CSV
    useStore.setState({ entries: [makeEntry({ originalId: '1', type: 'AM' })] });

    const user = userEvent.setup();
    render(<ImportView />);

    await user.upload(getFileInput(), makeCSVFile([{ am: 'Morning', pm: 'Evening' }]));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /preview entries/i })).not.toBeDisabled()
    );
    await user.click(screen.getByRole('button', { name: /preview entries/i }));

    // Button text "Add 1 new to 1 existing" confirms the dedup logic ran correctly
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /add 1 new to 1 existing/i })).toBeInTheDocument()
    );
  });

  it('"Add new" merges without replacing existing entries', async () => {
    const existing = makeEntry({ id: 'existing-1', originalId: 'existing-1', type: 'AM', text: 'Keep me.' });
    useStore.setState({ entries: [existing] });

    const user = userEvent.setup();
    render(<ImportView />);

    // Upload a CSV whose rows get originalId "1" and "2" — neither matches "existing-1"
    await user.upload(getFileInput(), makeCSVFile([{ am: 'New AM' }, { pm: 'New PM' }]));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /preview entries/i })).not.toBeDisabled()
    );
    await user.click(screen.getByRole('button', { name: /preview entries/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /add .* new to .* existing/i })).toBeInTheDocument()
    );

    await user.click(screen.getByRole('button', { name: /add .* new to .* existing/i }));

    const entries = useStore.getState().entries;
    expect(entries.some((e) => e.id === existing.id)).toBe(true);
    expect(entries.length).toBeGreaterThan(1);
    expect(useStore.getState().currentView).toBe('clean');
  });
});

// ---------------------------------------------------------------------------
// JSON backup restore
// ---------------------------------------------------------------------------
describe('ImportView – JSON backup', () => {
  it('shows a backup preview with entry, tag, and snippet counts', async () => {
    const user = userEvent.setup();
    render(<ImportView />);

    const backup = { entries: [makeEntry()], tags: [{ id: 't1', name: 'Tag', color: '#aaa' }], snippets: [] };
    await user.upload(getFileInput(), makeJSONFile(backup));

    await waitFor(() =>
      expect(screen.getByText(/ready to restore from backup/i)).toBeInTheDocument()
    );
    // Counts are rendered as "<strong>1</strong> entries" — check the container's textContent
    const restoreDiv = screen.getByText(/ready to restore from backup/i).closest('div')!;
    expect(restoreDiv.textContent).toContain('1 entries');
    expect(restoreDiv.textContent).toContain('1 tags');
  });

  it('shows an error for a JSON file missing required keys', async () => {
    const user = userEvent.setup();
    render(<ImportView />);

    await user.upload(getFileInput(), makeJSONFile({ wrong: 'shape' }));

    await waitFor(() =>
      expect(screen.getByText(/invalid backup file/i)).toBeInTheDocument()
    );
  });

  it('restores all data and hides the preview on confirm', async () => {
    const user = userEvent.setup();
    render(<ImportView />);

    const entry = makeEntry();
    const backup = { entries: [entry], tags: [], snippets: [] };
    await user.upload(getFileInput(), makeJSONFile(backup));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /restore all data/i })).toBeInTheDocument()
    );
    await user.click(screen.getByRole('button', { name: /restore all data/i }));

    expect(useStore.getState().entries).toHaveLength(1);
    expect(screen.queryByText(/ready to restore from backup/i)).not.toBeInTheDocument();
  });
});
