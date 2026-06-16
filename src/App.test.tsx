import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useStore } from './store/useStore';
import { Entry } from './types';

const LS_SEEN_NOTICE = 'diary-qual-seen-notice';
const LS_LAST_EXPORT = 'diary-qual-last-export';

function makeEntry(id = 'e1'): Entry {
  return {
    id,
    originalId: id,
    rowIndex: 0,
    startTime: '',
    completionTime: '',
    type: 'AM',
    text: 'Test entry.',
    date: '2026-06-02',
    originalDate: '2026-06-02',
    dateModified: false,
  };
}

beforeEach(() => {
  localStorage.setItem(LS_SEEN_NOTICE, '1'); // suppress the first-time notice banner
  localStorage.removeItem(LS_LAST_EXPORT);
});

// ---------------------------------------------------------------------------
// Change-count backup banner
// ---------------------------------------------------------------------------
describe('App – change count backup banner', () => {
  it('does not show the banner when fewer than 20 changes have been made', async () => {
    render(<App />);
    await act(async () => {
      for (let i = 0; i < 10; i++) useStore.getState().addTag(`Code ${i}`);
    });
    expect(screen.queryByText(/changes since your last backup/i)).not.toBeInTheDocument();
  });

  it('shows the banner after 20 or more changes', async () => {
    render(<App />);
    await act(async () => {
      for (let i = 0; i < 20; i++) useStore.getState().addTag(`Code ${i}`);
    });
    expect(screen.getByText(/20 changes since your last backup/i)).toBeInTheDocument();
  });

  it('hides the banner and resets the count when Export backup is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await act(async () => {
      for (let i = 0; i < 20; i++) useStore.getState().addTag(`Code ${i}`);
    });
    // Multiple Export backup buttons may exist (header + banner); all call handleExport.
    await user.click(screen.getAllByRole('button', { name: /export backup/i })[0]);
    expect(screen.queryByText(/changes since your last backup/i)).not.toBeInTheDocument();
  });

  it('hides the banner and resets the count when Dismiss is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await act(async () => {
      for (let i = 0; i < 20; i++) useStore.getState().addTag(`Code ${i}`);
    });
    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByText(/changes since your last backup/i)).not.toBeInTheDocument();
  });

  it('counts a snippet note change once per snippet, not once per update call', async () => {
    // Seed entry + snippet before render so they are captured in the baseline.
    useStore.setState({ entries: [makeEntry('e1')] });
    const tag = useStore.getState().addTag('Baseline');
    useStore.getState().addSnippet({
      entryId: 'e1', startOffset: 0, endOffset: 5, text: 'Hello', tagIds: [tag.id], note: '',
    });
    const snippetId = useStore.getState().snippets[0].id;

    render(<App />);

    // 18 structural (tag) changes.
    await act(async () => {
      for (let i = 0; i < 18; i++) useStore.getState().addTag(`Code ${i}`);
    });

    // 10 updates to the same snippet note — only the first diverges from baseline.
    await act(async () => {
      for (let i = 0; i < 10; i++) {
        useStore.getState().updateSnippetNote(snippetId, `Note version ${i}`);
      }
    });

    // 18 tags + 1 note = 19, still below the threshold of 20.
    expect(screen.queryByText(/changes since your last backup/i)).not.toBeInTheDocument();

    // One more structural change tips the total to exactly 20.
    await act(async () => { useStore.getState().addTag('Final'); });
    expect(screen.getByText(/20 changes since your last backup/i)).toBeInTheDocument();
  });

  it('counts note changes on two different snippets as two separate changes', async () => {
    useStore.setState({ entries: [makeEntry('e1')] });
    const tag = useStore.getState().addTag('Baseline');
    useStore.getState().addSnippet({
      entryId: 'e1', startOffset: 0, endOffset: 5, text: 'Hello', tagIds: [tag.id], note: '',
    });
    useStore.getState().addSnippet({
      entryId: 'e1', startOffset: 6, endOffset: 11, text: 'World', tagIds: [tag.id], note: '',
    });
    const [s1, s2] = useStore.getState().snippets;

    render(<App />);

    // 18 tag changes.
    await act(async () => {
      for (let i = 0; i < 18; i++) useStore.getState().addTag(`Code ${i}`);
    });

    // Note on first snippet → total 19, still under threshold.
    await act(async () => { useStore.getState().updateSnippetNote(s1.id, 'Note A'); });
    expect(screen.queryByText(/changes since your last backup/i)).not.toBeInTheDocument();

    // Note on second snippet → total 20, banner appears.
    await act(async () => { useStore.getState().updateSnippetNote(s2.id, 'Note B'); });
    expect(screen.getByText(/20 changes since your last backup/i)).toBeInTheDocument();
  });
});
