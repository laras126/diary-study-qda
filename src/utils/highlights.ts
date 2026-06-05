import { Snippet } from '../types';

/** Walk all text nodes in `container` to find the absolute char offset of `targetNode` at `offsetInNode`. */
export function getTextOffset(container: Element, targetNode: Node, offsetInNode: number): number {
  let count = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node === targetNode) return count + offsetInNode;
    count += (node as Text).length;
    node = walker.nextNode();
  }
  return count + offsetInNode;
}

export interface TextSegment {
  text: string;
  snippets: Snippet[]; // empty = unhighlighted; 1+ = covered by these snippets
}

/**
 * Split `text` into segments at every snippet boundary.
 * Each segment knows all snippets that cover it, enabling overlap rendering.
 */
export function buildSegments(text: string, snippets: Snippet[]): TextSegment[] {
  if (!snippets.length) return [{ text, snippets: [] }];

  // Collect every start/end position as a breakpoint
  const positions = new Set<number>([0, text.length]);
  for (const s of snippets) {
    const lo = Math.max(0, Math.min(s.startOffset, text.length));
    const hi = Math.max(0, Math.min(s.endOffset, text.length));
    positions.add(lo);
    positions.add(hi);
  }

  const sorted = [...positions].sort((a, b) => a - b);
  const result: TextSegment[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const lo = sorted[i];
    const hi = sorted[i + 1];
    if (lo >= hi) continue;
    // A snippet covers this segment if it starts at or before lo AND ends at or after hi
    const covering = snippets.filter((s) => s.startOffset <= lo && s.endOffset >= hi);
    result.push({ text: text.slice(lo, hi), snippets: covering });
  }

  return result.filter((seg) => seg.text.length > 0);
}
