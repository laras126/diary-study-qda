import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';

// Store is reset to empty in setup.ts before every test.

describe('tag management', () => {
  it('addTag creates a tag with the given name and a unique colour', () => {
    const tag = useStore.getState().addTag('Frustration');
    expect(tag.name).toBe('Frustration');
    expect(tag.color).toBeTruthy();
    expect(useStore.getState().tags).toHaveLength(1);
  });

  it('addTag assigns distinct colours to successive tags', () => {
    const t1 = useStore.getState().addTag('A');
    const t2 = useStore.getState().addTag('B');
    expect(t1.color).not.toBe(t2.color);
  });

  it('renameTag updates the tag name everywhere', () => {
    const tag = useStore.getState().addTag('Old name');
    useStore.getState().renameTag(tag.id, 'New name');
    expect(useStore.getState().tags.find((t) => t.id === tag.id)!.name).toBe('New name');
  });

  it('deleteTag removes the tag and any snippets that relied solely on it', () => {
    const tag = useStore.getState().addTag('ToDelete');
    useStore.getState().addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 5, text: 'hello', tagIds: [tag.id], note: '' });

    useStore.getState().deleteTag(tag.id);

    expect(useStore.getState().tags).toHaveLength(0);
    expect(useStore.getState().snippets).toHaveLength(0);
  });

  it('deleteTag keeps snippets that also belong to another tag', () => {
    const t1 = useStore.getState().addTag('T1');
    const t2 = useStore.getState().addTag('T2');
    useStore.getState().addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 5, text: 'hi', tagIds: [t1.id, t2.id], note: '' });

    useStore.getState().deleteTag(t1.id);

    const snippets = useStore.getState().snippets;
    expect(snippets).toHaveLength(1);
    expect(snippets[0].tagIds).toEqual([t2.id]);
  });
});

describe('snippet management', () => {
  it('addSnippet stores the snippet with a generated id', () => {
    const tag = useStore.getState().addTag('T');
    useStore.getState().addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 10, text: 'some text', tagIds: [tag.id], note: '' });

    const snippets = useStore.getState().snippets;
    expect(snippets).toHaveLength(1);
    expect(snippets[0].id).toBeTruthy();
    expect(snippets[0].text).toBe('some text');
  });

  it('deleteSnippet removes only the targeted snippet', () => {
    const tag = useStore.getState().addTag('T');
    useStore.getState().addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 5, text: 'first', tagIds: [tag.id], note: '' });
    useStore.getState().addSnippet({ entryId: 'e1', startOffset: 10, endOffset: 15, text: 'second', tagIds: [tag.id], note: '' });

    const [first] = useStore.getState().snippets;
    useStore.getState().deleteSnippet(first.id);

    const remaining = useStore.getState().snippets;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].text).toBe('second');
  });

  it('updateSnippetNote persists the note on the correct snippet', () => {
    const tag = useStore.getState().addTag('T');
    useStore.getState().addSnippet({ entryId: 'e1', startOffset: 0, endOffset: 5, text: 'hi', tagIds: [tag.id], note: '' });

    const { id } = useStore.getState().snippets[0];
    useStore.getState().updateSnippetNote(id, 'This is my annotation');

    expect(useStore.getState().snippets[0].note).toBe('This is my annotation');
  });
});

describe('entry date management', () => {
  it('updateEntryDate changes date and sets dateModified=true when date changes', () => {
    useStore.setState({
      entries: [{
        id: 'e1', originalId: '1', rowIndex: 0,
        startTime: '', completionTime: '',
        type: 'AM', text: 'hello',
        date: '2026-06-01', originalDate: '2026-06-01',
        dateModified: false,
      }],
    });

    useStore.getState().updateEntryDate('e1', '2026-05-31');

    const entry = useStore.getState().entries[0];
    expect(entry.date).toBe('2026-05-31');
    expect(entry.dateModified).toBe(true);
    expect(entry.originalDate).toBe('2026-06-01'); // unchanged
  });

  it('updateEntryDate sets dateModified=false when moved back to original date', () => {
    useStore.setState({
      entries: [{
        id: 'e1', originalId: '1', rowIndex: 0,
        startTime: '', completionTime: '',
        type: 'AM', text: 'hello',
        date: '2026-05-31', originalDate: '2026-06-01',
        dateModified: true,
      }],
    });

    useStore.getState().updateEntryDate('e1', '2026-06-01');

    expect(useStore.getState().entries[0].dateModified).toBe(false);
  });
});

describe('analysis preset', () => {
  it('setAnalysisPreset stores the tag ids', () => {
    useStore.getState().setAnalysisPreset(['t1', 't2']);
    expect(useStore.getState().analysisPresetTagIds).toEqual(['t1', 't2']);
  });

  it('setAnalysisPreset can be cleared with an empty array', () => {
    useStore.getState().setAnalysisPreset(['t1']);
    useStore.getState().setAnalysisPreset([]);
    expect(useStore.getState().analysisPresetTagIds).toHaveLength(0);
  });
});
