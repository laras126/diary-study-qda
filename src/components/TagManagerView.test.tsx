import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagManagerView } from './TagManagerView';
import { useStore } from '../store/useStore';

function renderTagManager() {
  return render(<TagManagerView />);
}

describe('TagManagerView', () => {
  it('shows an empty state message when there are no tags', () => {
    renderTagManager();
    expect(screen.getByText(/no tags yet/i)).toBeInTheDocument();
  });

  it('creates a tag when the user types a name and clicks Create', async () => {
    const user = userEvent.setup();
    renderTagManager();

    await user.type(screen.getByPlaceholderText(/tag name/i), 'Frustration');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(useStore.getState().tags).toHaveLength(1);
    expect(useStore.getState().tags[0].name).toBe('Frustration');
    expect(screen.getByText('Frustration')).toBeInTheDocument();
  });

  it('creates a tag when the user presses Enter', async () => {
    const user = userEvent.setup();
    renderTagManager();

    await user.type(screen.getByPlaceholderText(/tag name/i), 'Quick tag{Enter}');

    expect(useStore.getState().tags[0].name).toBe('Quick tag');
  });

  it('shows existing tags with their snippet counts', () => {
    const { addTag, addSnippet } = useStore.getState();
    const tag = addTag('Successful use');
    addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 5, text: 'hi', tagIds: [tag.id], note: '' });
    addSnippet({ entryId: 'e1', startOffset: 10, endOffset: 15, text: 'there', tagIds: [tag.id], note: '' });

    renderTagManager();

    expect(screen.getByText('Successful use')).toBeInTheDocument();
    expect(screen.getByText(/2 snippets/i)).toBeInTheDocument();
  });

  it('enters edit mode when Rename is clicked', async () => {
    const user = userEvent.setup();
    useStore.getState().addTag('Original');
    renderTagManager();

    await user.click(screen.getByRole('button', { name: /rename/i }));

    expect(screen.getByDisplayValue('Original')).toBeInTheDocument();
  });

  it('saves a renamed tag and updates the store', async () => {
    const user = userEvent.setup();
    useStore.getState().addTag('Old name');
    renderTagManager();

    await user.click(screen.getByRole('button', { name: /rename/i }));
    const input = screen.getByDisplayValue('Old name');
    await user.clear(input);
    await user.type(input, 'New name');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(useStore.getState().tags[0].name).toBe('New name');
    expect(screen.getByText('New name')).toBeInTheDocument();
  });

  it('discards a rename when Escape is pressed', async () => {
    const user = userEvent.setup();
    useStore.getState().addTag('Keep this');
    renderTagManager();

    await user.click(screen.getByRole('button', { name: /rename/i }));
    await user.keyboard('{Escape}');

    expect(screen.getByText('Keep this')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Keep this')).not.toBeInTheDocument();
  });

  it('navigates to Analysis view when a tag row is clicked', async () => {
    const user = userEvent.setup();
    const tag = useStore.getState().addTag('My tag');
    renderTagManager();

    await user.click(screen.getByTitle(/view.*snippet.*my tag/i));

    expect(useStore.getState().currentView).toBe('analysis');
    expect(useStore.getState().analysisPresetTagIds).toEqual([tag.id]);
  });

  it('deletes a tag after confirmation', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    useStore.getState().addTag('ToDelete');
    renderTagManager();

    // Use exact text to avoid matching the tag's title attribute ("…ToDelete")
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(useStore.getState().tags).toHaveLength(0);
  });
});
