import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalysisView } from './AnalysisView';
import { useStore } from '../store/useStore';

const BASE_ENTRY = {
  originalId: '1', rowIndex: 0, startTime: '', completionTime: '',
  dateModified: false as const,
};

function makeEntry(overrides: Partial<typeof BASE_ENTRY & { id: string; type: 'AM' | 'PM'; date: string; text: string }>) {
  return { ...BASE_ENTRY, id: 'e1', type: 'AM' as const, date: '2026-06-02', text: 'Entry text.', ...overrides };
}

/** Basic two-snippet, one-entry seed used by most existing tests. */
function seed() {
  const { addTag, addSnippet, setEntries } = useStore.getState();
  setEntries([makeEntry({ id: 'e1', type: 'AM', date: '2026-06-02', text: 'I used Claude for drafting.' })]);
  const t1 = addTag('Success');
  const t2 = addTag('Frustration');
  addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 6, text: 'I used', tagIds: [t1.id], note: 'good moment' });
  addSnippet({ entryId: 'e1', startOffset: 7, endOffset: 13, text: 'Claude', tagIds: [t2.id], note: '' });
  return { t1, t2 };
}

/** Two entries on the same day (AM + PM) each with their own snippet. */
function seedAMPM() {
  const { addTag, addSnippet, setEntries } = useStore.getState();
  setEntries([
    makeEntry({ id: 'e1', type: 'AM', date: '2026-06-02', text: 'Morning reflection.' }),
    makeEntry({ id: 'e2', type: 'PM', date: '2026-06-02', text: 'Evening reflection.' }),
  ]);
  const t1 = addTag('Reflection');
  const t2 = addTag('Failure');
  addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 7, text: 'Morning', tagIds: [t1.id], note: '' });
  addSnippet({ entryId: 'e2', startOffset: 0, endOffset: 7, text: 'Evening', tagIds: [t2.id], note: '' });
  return { t1, t2 };
}

/** Returns the filter-bar container so clicks can be scoped away from code pills. */
function getFilterBar() {
  return screen.getByText('Filter by code').closest('div[class]')!.parentElement!;
}

beforeEach(() => {
  useStore.setState({
    entries: [], tags: [], snippets: [],
    analysisPresetTagIds: [],
    analysisSelectedTagIds: [],
    analysisMode: 'any',
    analysisCompareMode: false,
  });
});

// ---------------------------------------------------------------------------
// Existing filter behaviour
// ---------------------------------------------------------------------------
describe('AnalysisView – basic filtering', () => {
  it('shows all snippets when no code filter is active', () => {
    seed();
    render(<AnalysisView />);
    expect(screen.getByText(/"I used"/i)).toBeInTheDocument();
    expect(screen.getByText(/"Claude"/i)).toBeInTheDocument();
    expect(screen.getByText(/2 snippets total/i)).toBeInTheDocument();
  });

  it('filters snippets when a code is selected', async () => {
    const user = userEvent.setup();
    seed();
    render(<AnalysisView />);
    await user.click(within(getFilterBar()).getByRole('button', { name: /success/i }));
    expect(screen.getByText(/"I used"/i)).toBeInTheDocument();
    expect(screen.queryByText(/"Claude"/i)).not.toBeInTheDocument();
  });

  it('shows the snippet note in the card', () => {
    seed();
    render(<AnalysisView />);
    expect(screen.getByText('good moment')).toBeInTheDocument();
  });

  it('clears the filter when Clear is clicked', async () => {
    const user = userEvent.setup();
    seed();
    render(<AnalysisView />);
    await user.click(within(getFilterBar()).getByRole('button', { name: /success/i }));
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.getByText(/2 snippets total/i)).toBeInTheDocument();
  });

  it('applies a preset code filter when navigated from Codebook', () => {
    const { t2 } = seed();
    useStore.setState({ analysisPresetTagIds: [t2.id] });
    render(<AnalysisView />);
    expect(screen.getByText(/"Claude"/i)).toBeInTheDocument();
    expect(screen.queryByText(/"I used"/i)).not.toBeInTheDocument();
    expect(useStore.getState().analysisPresetTagIds).toHaveLength(0);
  });

  it('shows an empty state when no snippets exist', () => {
    useStore.getState().setEntries([makeEntry({ id: 'e1' })]);
    render(<AnalysisView />);
    expect(screen.getByText(/no snippets yet/i)).toBeInTheDocument();
  });

  it('shows Any/All toggle only when two or more codes are selected', async () => {
    const user = userEvent.setup();
    seed();
    render(<AnalysisView />);
    const filterBar = getFilterBar();
    await user.click(within(filterBar).getByRole('button', { name: /success/i }));
    expect(screen.queryByRole('button', { name: /any code/i })).not.toBeInTheDocument();
    await user.click(within(filterBar).getByRole('button', { name: /frustration/i }));
    expect(screen.getByRole('button', { name: /any code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /all codes in snippet/i })).toBeInTheDocument();
  });

  it('navigates to Coding and selects the entry when View in context is clicked', async () => {
    const user = userEvent.setup();
    seed();
    render(<AnalysisView />);
    await user.click(screen.getAllByRole('button', { name: /view in context/i })[0]);
    expect(useStore.getState().currentView).toBe('code');
    expect(useStore.getState().selectedEntryId).toBe('e1');
  });

  it('sets pendingFocusSnippetId for the first snippet', async () => {
    const user = userEvent.setup();
    seed();
    const snippets = useStore.getState().snippets;
    render(<AnalysisView />);
    await user.click(screen.getAllByRole('button', { name: /view in context/i })[0]);
    expect(useStore.getState().pendingFocusSnippetId).toBe(snippets[0].id);
  });

  it('sets a different pendingFocusSnippetId for the second snippet', async () => {
    const user = userEvent.setup();
    seed();
    const snippets = useStore.getState().snippets;
    render(<AnalysisView />);
    await user.click(screen.getAllByRole('button', { name: /view in context/i })[1]);
    expect(useStore.getState().pendingFocusSnippetId).toBe(snippets[1].id);
  });
});

// ---------------------------------------------------------------------------
// "All codes in snippet" filter
// ---------------------------------------------------------------------------
describe('AnalysisView – All codes in snippet', () => {
  it('shows snippets from an entry where both selected codes appear across separate snippets', () => {
    const { t1, t2 } = seed();
    // e1 has "I used" (Success) and "Claude" (Frustration) as separate snippets
    useStore.setState({ analysisSelectedTagIds: [t1.id, t2.id], analysisMode: 'all' });
    render(<AnalysisView />);
    expect(screen.getByText(/"I used"/i)).toBeInTheDocument();
    expect(screen.getByText(/"Claude"/i)).toBeInTheDocument();
  });

  it('hides snippets from entries where only one of the selected codes is present', () => {
    const { addTag, addSnippet, setEntries } = useStore.getState();
    setEntries([
      makeEntry({ id: 'e1', date: '2026-06-02', text: 'Entry one.' }),
      makeEntry({ id: 'e2', date: '2026-06-03', text: 'Entry two.' }),
    ]);
    const t1 = addTag('Reflection');
    const t2 = addTag('Failure');
    // e1 has only Reflection
    addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 5, text: 'Entry', tagIds: [t1.id], note: '' });
    // e2 has both Reflection and Failure
    addSnippet({ entryId: 'e2', startOffset: 0, endOffset: 5, text: 'Entry', tagIds: [t1.id], note: '' });
    addSnippet({ entryId: 'e2', startOffset: 6, endOffset: 9, text: 'two', tagIds: [t2.id], note: '' });

    useStore.setState({ analysisSelectedTagIds: [t1.id, t2.id], analysisMode: 'all' });
    render(<AnalysisView />);

    // e2 snippets visible — it has both codes
    expect(screen.getAllByText(/"Entry"/i)).toHaveLength(1); // only e2's Entry snippet
    expect(screen.getByText(/"two"/i)).toBeInTheDocument();
  });

  it('returns no snippets when no entry has all selected codes', () => {
    const { t1, t2 } = seed();
    const t3 = useStore.getState().addTag('Unrelated');
    useStore.setState({ analysisSelectedTagIds: [t1.id, t2.id, t3.id], analysisMode: 'all' });
    render(<AnalysisView />);
    expect(screen.getByText(/no snippets match/i)).toBeInTheDocument();
  });

  it('in "any code" mode still shows snippets that have either selected code', () => {
    const { t1, t2 } = seed();
    useStore.setState({ analysisSelectedTagIds: [t1.id, t2.id], analysisMode: 'any' });
    render(<AnalysisView />);
    expect(screen.getByText(/"I used"/i)).toBeInTheDocument();
    expect(screen.getByText(/"Claude"/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AM ↔ PM compare mode
// ---------------------------------------------------------------------------
describe('AnalysisView – AM ↔ PM compare mode', () => {
  it('shows the AM ↔ PM button when snippets exist', () => {
    seed();
    render(<AnalysisView />);
    expect(screen.getByRole('button', { name: /am.*pm/i })).toBeInTheDocument();
  });

  it('does not show the AM ↔ PM button when there are no snippets', () => {
    useStore.getState().setEntries([makeEntry({ id: 'e1' })]);
    render(<AnalysisView />);
    expect(screen.queryByRole('button', { name: /am.*pm/i })).not.toBeInTheDocument();
  });

  it('enables compare mode when the AM ↔ PM button is clicked', async () => {
    const user = userEvent.setup();
    seedAMPM();
    render(<AnalysisView />);
    await user.click(screen.getByRole('button', { name: /am.*pm/i }));
    // Date header should now be visible
    expect(screen.getByText(/tuesday, june 2, 2026/i)).toBeInTheDocument();
  });

  it('shows AM and PM column headers in compare mode', async () => {
    const user = userEvent.setup();
    seedAMPM();
    render(<AnalysisView />);
    await user.click(screen.getByRole('button', { name: /am.*pm/i }));
    // Multiple "AM"/"PM" labels are expected (column header + snippet type badge)
    expect(screen.getAllByText('AM').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PM').length).toBeGreaterThanOrEqual(1);
  });

  it('places AM snippets in the AM column and PM snippets in the PM column', async () => {
    const user = userEvent.setup();
    seedAMPM();
    render(<AnalysisView />);
    await user.click(screen.getByRole('button', { name: /am.*pm/i }));
    // Both snippets should appear
    expect(screen.getByText(/"Morning"/i)).toBeInTheDocument();
    expect(screen.getByText(/"Evening"/i)).toBeInTheDocument();
  });

  it('shows a placeholder for a day that has no PM snippets', async () => {
    const user = userEvent.setup();
    // Only an AM entry
    const { addTag, addSnippet, setEntries } = useStore.getState();
    setEntries([makeEntry({ id: 'e1', type: 'AM', date: '2026-06-02', text: 'AM only.' })]);
    const t = addTag('Reflection');
    addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 2, text: 'AM', tagIds: [t.id], note: '' });

    render(<AnalysisView />);
    await user.click(screen.getByRole('button', { name: /am.*pm/i }));
    expect(screen.getByText(/no pm snippets this day/i)).toBeInTheDocument();
  });

  it('shows a placeholder for a day that has no AM snippets', async () => {
    const user = userEvent.setup();
    const { addTag, addSnippet, setEntries } = useStore.getState();
    setEntries([makeEntry({ id: 'e1', type: 'PM', date: '2026-06-02', text: 'PM only.' })]);
    const t = addTag('Reflection');
    addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 2, text: 'PM', tagIds: [t.id], note: '' });

    render(<AnalysisView />);
    await user.click(screen.getByRole('button', { name: /am.*pm/i }));
    expect(screen.getByText(/no am snippets this day/i)).toBeInTheDocument();
  });

  it('groups snippets from separate days into separate date sections', async () => {
    const user = userEvent.setup();
    const { addTag, addSnippet, setEntries } = useStore.getState();
    setEntries([
      makeEntry({ id: 'e1', type: 'AM', date: '2026-06-02', text: 'Day one.' }),
      makeEntry({ id: 'e2', type: 'AM', date: '2026-06-03', text: 'Day two.' }),
    ]);
    const t = addTag('Note');
    addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 3, text: 'Day', tagIds: [t.id], note: '' });
    addSnippet({ entryId: 'e2', startOffset: 0, endOffset: 3, text: 'Day', tagIds: [t.id], note: '' });

    render(<AnalysisView />);
    await user.click(screen.getByRole('button', { name: /am.*pm/i }));

    expect(screen.getByText(/tuesday, june 2/i)).toBeInTheDocument();
    expect(screen.getByText(/wednesday, june 3/i)).toBeInTheDocument();
  });

  it('disables compare mode when the button is clicked again', async () => {
    const user = userEvent.setup();
    seedAMPM();
    render(<AnalysisView />);
    const btn = screen.getByRole('button', { name: /am.*pm/i });
    await user.click(btn);
    await user.click(btn);
    expect(screen.queryByText(/tuesday, june 2, 2026/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Filter state persistence in the store
// ---------------------------------------------------------------------------
describe('AnalysisView – filter state persisted in store', () => {
  it('reads selectedTagIds from the store on mount', () => {
    const { t1 } = seed();
    useStore.setState({ analysisSelectedTagIds: [t1.id] });
    render(<AnalysisView />);
    // Only the Success snippet should be visible
    expect(screen.getByText(/"I used"/i)).toBeInTheDocument();
    expect(screen.queryByText(/"Claude"/i)).not.toBeInTheDocument();
  });

  it('writes selectedTagIds back to the store when a code is toggled', async () => {
    const user = userEvent.setup();
    const { t1 } = seed();
    render(<AnalysisView />);
    await user.click(within(getFilterBar()).getByRole('button', { name: /success/i }));
    expect(useStore.getState().analysisSelectedTagIds).toContain(t1.id);
  });

  it('writes compareMode back to the store when AM ↔ PM is toggled', async () => {
    const user = userEvent.setup();
    seed();
    render(<AnalysisView />);
    await user.click(screen.getByRole('button', { name: /am.*pm/i }));
    expect(useStore.getState().analysisCompareMode).toBe(true);
  });
});
