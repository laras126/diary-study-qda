import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalysisView } from './AnalysisView';
import { useStore } from '../store/useStore';

function seed() {
  const { addTag, addSnippet, setEntries } = useStore.getState();

  setEntries([{
    id: 'e1', originalId: '1', rowIndex: 0,
    startTime: '', completionTime: '6/2/2026 8:05:00 AM',
    type: 'AM', text: 'I used Claude for drafting.',
    date: '2026-06-02', originalDate: '2026-06-02',
    dateModified: false,
  }]);

  const t1 = addTag('Success');
  const t2 = addTag('Frustration');

  addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 6, text: 'I used', tagIds: [t1.id], note: 'good moment' });
  addSnippet({ entryId: 'e1', startOffset: 7, endOffset: 13, text: 'Claude', tagIds: [t2.id], note: '' });

  return { t1, t2 };
}

describe('AnalysisView', () => {
  it('shows all snippets when no tag filter is active', () => {
    seed();
    render(<AnalysisView />);

    expect(screen.getByText(/"I used"/i)).toBeInTheDocument();
    expect(screen.getByText(/"Claude"/i)).toBeInTheDocument();
    expect(screen.getByText(/2 snippets total/i)).toBeInTheDocument();
  });

  it('filters snippets when a tag is selected', async () => {
    const user = userEvent.setup();
    seed();
    render(<AnalysisView />);

    await user.click(screen.getByRole('button', { name: /success/i }));

    expect(screen.getByText(/"I used"/i)).toBeInTheDocument();
    expect(screen.queryByText(/"Claude"/i)).not.toBeInTheDocument();
    expect(screen.getByText(/1 snippet matching/i)).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: /success/i }));
    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(screen.getByText(/2 snippets total/i)).toBeInTheDocument();
  });

  it('applies a preset tag filter when navigated from Tag Manager', () => {
    const { t2 } = seed();
    useStore.setState({ analysisPresetTagIds: [t2.id] });

    render(<AnalysisView />);

    // Should show only the Frustration snippet
    expect(screen.getByText(/"Claude"/i)).toBeInTheDocument();
    expect(screen.queryByText(/"I used"/i)).not.toBeInTheDocument();
    // Preset should be cleared after consumption
    expect(useStore.getState().analysisPresetTagIds).toHaveLength(0);
  });

  it('navigates to Coding and selects the entry when View in context is clicked', async () => {
    const user = userEvent.setup();
    seed();
    render(<AnalysisView />);

    const links = screen.getAllByRole('button', { name: /view in context/i });
    await user.click(links[0]);

    expect(useStore.getState().currentView).toBe('code');
    expect(useStore.getState().selectedEntryId).toBe('e1');
  });

  it('shows an empty state when no snippets exist', () => {
    useStore.getState().setEntries([{
      id: 'e1', originalId: '1', rowIndex: 0,
      startTime: '', completionTime: '',
      type: 'AM', text: 'text',
      date: '2026-06-01', originalDate: '2026-06-01',
      dateModified: false,
    }]);

    render(<AnalysisView />);

    expect(screen.getByText(/no snippets yet/i)).toBeInTheDocument();
  });

  it('shows Any/All toggle only when two or more tags are selected', async () => {
    const user = userEvent.setup();
    seed();
    render(<AnalysisView />);

    // One tag selected — no toggle
    await user.click(screen.getByRole('button', { name: /success/i }));
    expect(screen.queryByRole('button', { name: /any tag/i })).not.toBeInTheDocument();

    // Second tag selected — toggle appears
    await user.click(screen.getByRole('button', { name: /frustration/i }));
    expect(screen.getByRole('button', { name: /any tag/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /all tags/i })).toBeInTheDocument();
  });
});
