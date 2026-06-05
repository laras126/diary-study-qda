import { describe, it, expect } from 'vitest';
import { buildSegments } from './highlights';
import { Snippet } from '../types';

function makeSnippet(id: string, start: number, end: number, tagIds = ['t1']): Snippet {
  return { id, entryId: 'e1', startOffset: start, endOffset: end, text: '', tagIds, note: '', createdAt: '' };
}

describe('buildSegments', () => {
  it('returns the whole text as one unhighlighted segment when there are no snippets', () => {
    const segs = buildSegments('Hello world', []);
    expect(segs).toHaveLength(1);
    expect(segs[0].text).toBe('Hello world');
    expect(segs[0].snippets).toHaveLength(0);
  });

  it('splits text into before / highlight / after for a single snippet', () => {
    const segs = buildSegments('Hello world today', [makeSnippet('s1', 6, 11)]);
    expect(segs).toHaveLength(3);
    expect(segs[0].text).toBe('Hello ');
    expect(segs[0].snippets).toHaveLength(0);
    expect(segs[1].text).toBe('world');
    expect(segs[1].snippets[0].id).toBe('s1');
    expect(segs[2].text).toBe(' today');
    expect(segs[2].snippets).toHaveLength(0);
  });

  it('handles a snippet that starts at position 0', () => {
    const segs = buildSegments('Hello world', [makeSnippet('s1', 0, 5)]);
    expect(segs).toHaveLength(2);
    expect(segs[0].text).toBe('Hello');
    expect(segs[0].snippets[0].id).toBe('s1');
    expect(segs[1].text).toBe(' world');
  });

  it('handles a snippet that ends at the last character', () => {
    // Snippet covers the last word — no trailing plain segment
    const segs = buildSegments('Hello world', [makeSnippet('s1', 6, 11)]);
    expect(segs).toHaveLength(2);
    expect(segs[0].text).toBe('Hello ');
    expect(segs[1].text).toBe('world');
    expect(segs[1].snippets[0].id).toBe('s1');
  });

  it('places two non-overlapping snippets in their own segments', () => {
    const segs = buildSegments('one two three', [
      makeSnippet('s1', 0, 3),
      makeSnippet('s2', 4, 7),
    ]);
    const highlighted = segs.filter((s) => s.snippets.length > 0);
    expect(highlighted).toHaveLength(2);
    expect(highlighted[0].snippets[0].id).toBe('s1');
    expect(highlighted[1].snippets[0].id).toBe('s2');
  });

  it('marks an overlapping zone as covered by both snippets', () => {
    // s1: 0-10, s2: 5-15 — overlap at 5-10
    const segs = buildSegments('abcdefghijklmnop', [
      makeSnippet('s1', 0, 10),
      makeSnippet('s2', 5, 15),
    ]);
    const overlap = segs.find((s) => s.snippets.length === 2);
    expect(overlap).toBeDefined();
    expect(overlap!.snippets.map((s) => s.id).sort()).toEqual(['s1', 's2']);
  });

  it('does not produce empty segments', () => {
    const segs = buildSegments('hello', [makeSnippet('s1', 0, 5)]);
    expect(segs.every((s) => s.text.length > 0)).toBe(true);
  });

  it('handles adjacent (touching) snippets without gaps or overlaps', () => {
    const segs = buildSegments('abcdef', [
      makeSnippet('s1', 0, 3),
      makeSnippet('s2', 3, 6),
    ]);
    const s1Seg = segs.find((s) => s.snippets[0]?.id === 's1');
    const s2Seg = segs.find((s) => s.snippets[0]?.id === 's2');
    expect(s1Seg!.text).toBe('abc');
    expect(s2Seg!.text).toBe('def');
    expect(segs.filter((s) => s.snippets.length === 2)).toHaveLength(0);
  });
});
