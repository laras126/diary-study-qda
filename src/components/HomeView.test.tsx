import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeView } from './HomeView';
import { useStore } from '../store/useStore';
import { Entry } from '../types';

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: crypto.randomUUID(),
    originalId: '1',
    rowIndex: 0,
    startTime: '',
    completionTime: '6/2/2026 8:05:00 AM',
    type: 'AM',
    text: 'Test entry text.',
    date: '2026-06-02',
    originalDate: '2026-06-02',
    dateModified: false,
    ...overrides,
  };
}

describe('HomeView', () => {
  it('shows an empty state with an import CTA when there is no data', () => {
    render(<HomeView />);
    expect(screen.getByText(/no data loaded yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
  });

  it('navigates to Import when the Import CTA is clicked', async () => {
    const user = userEvent.setup();
    render(<HomeView />);

    await user.click(screen.getByRole('button', { name: /import data/i }));

    expect(useStore.getState().currentView).toBe('import');
  });

  it('shows entry, tag, and snippet counts in the stat strip', () => {
    const tag = useStore.getState().addTag('Test');
    const e1 = makeEntry({ id: 'e1' });
    const e2 = makeEntry({ id: 'e2', type: 'PM' });
    useStore.setState({ entries: [e1, e2] });
    useStore.getState().addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 4, text: 'Test', tagIds: [tag.id], note: '' });

    render(<HomeView />);

    expect(screen.getByText(/qualitative codes/i)).toBeInTheDocument();
    expect(screen.getByText(/text selections/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Entries
  });

  it('shows the coded percentage', () => {
    const tag = useStore.getState().addTag('T');
    const e1 = makeEntry({ id: 'e1' });
    const e2 = makeEntry({ id: 'e2' });
    useStore.setState({ entries: [e1, e2] });
    useStore.getState().addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 4, text: 'Test', tagIds: [tag.id], note: '' });

    render(<HomeView />);

    expect(screen.getByText(/50% of entries/i)).toBeInTheDocument();
  });

  it('shows the resume heading when an entry was previously selected', () => {
    const e1 = makeEntry({ id: 'e1', text: 'First entry' });
    const e2 = makeEntry({ id: 'e2', text: 'My selected entry' });
    useStore.setState({ entries: [e1, e2], selectedEntryId: 'e2' });

    render(<HomeView />);

    // The resume card heading (h2)
    expect(screen.getByText(/resume where you left off/i)).toBeInTheDocument();
    // The entry text appears in the card
    expect(screen.getAllByText(/my selected entry/i).length).toBeGreaterThan(0);
  });

  it('shows "Start coding" heading when no entry has been selected', () => {
    useStore.setState({ entries: [makeEntry({ id: 'e1' })], selectedEntryId: null });

    render(<HomeView />);

    expect(screen.getByText(/^start coding$/i)).toBeInTheDocument(); // h2 heading
    expect(screen.getByRole('button', { name: /start coding →/i })).toBeInTheDocument();
  });

  it('lists uncoded entries with their text', () => {
    const tag = useStore.getState().addTag('T');
    const e1 = makeEntry({ id: 'e1', text: 'Coded entry' });
    const e2 = makeEntry({ id: 'e2', text: 'Uncoded entry' });
    useStore.setState({ entries: [e1, e2] });
    useStore.getState().addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 5, text: 'Coded', tagIds: [tag.id], note: '' });

    render(<HomeView />);

    expect(screen.getByText(/uncoded entries/i)).toBeInTheDocument();
    // "Uncoded entry" appears in both the resume card and the list — check count
    expect(screen.getAllByText('Uncoded entry').length).toBeGreaterThan(0);
    // Coded entry has a snippet so it should not appear in the uncoded section
    expect(screen.queryByText('Coded entry')).not.toBeInTheDocument();
  });

  it('navigates to Coding with the correct entry when the continue button is clicked', async () => {
    const user = userEvent.setup();
    const e1 = makeEntry({ id: 'e1' });
    useStore.setState({ entries: [e1], selectedEntryId: 'e1' });

    render(<HomeView />);
    await user.click(screen.getByRole('button', { name: /continue coding →/i }));

    expect(useStore.getState().currentView).toBe('code');
    expect(useStore.getState().selectedEntryId).toBe('e1');
  });

  it('navigates to Tags when the Manage button in the tag breakdown is clicked', async () => {
    const user = userEvent.setup();
    useStore.setState({ entries: [makeEntry()] });

    render(<HomeView />);
    await user.click(screen.getByRole('button', { name: /manage →/i }));

    expect(useStore.getState().currentView).toBe('tags');
  });

  it('shows "All entries coded" when every entry has at least one snippet', () => {
    const tag = useStore.getState().addTag('T');
    const e1 = makeEntry({ id: 'e1' });
    useStore.setState({ entries: [e1] });
    useStore.getState().addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 4, text: 'Test', tagIds: [tag.id], note: '' });

    render(<HomeView />);

    expect(screen.getByText(/all entries coded/i)).toBeInTheDocument();
    expect(screen.queryByText(/uncoded entries/i)).not.toBeInTheDocument();
  });

  it('clicking a snippet count on a tag navigates to Analysis with that tag preset', async () => {
    const user = userEvent.setup();
    const tag = useStore.getState().addTag('Frustration');
    const e1 = makeEntry({ id: 'e1' });
    useStore.setState({ entries: [e1] });
    useStore.getState().addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 4, text: 'Test', tagIds: [tag.id], note: '' });

    render(<HomeView />);
    await user.click(screen.getByRole('button', { name: /1 snippet →/i }));

    expect(useStore.getState().currentView).toBe('analysis');
    expect(useStore.getState().analysisPresetTagIds).toEqual([tag.id]);
  });
});
