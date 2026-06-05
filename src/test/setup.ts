import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';

// ── idb-keyval mock (in-memory, resets between tests) ──────────────────────
const idbMap = new Map<string, unknown>();

vi.mock('idb-keyval', () => ({
  get: vi.fn((key: string) => Promise.resolve(idbMap.get(key))),
  set: vi.fn((key: string, value: unknown) => {
    idbMap.set(key, value);
    return Promise.resolve();
  }),
  del: vi.fn((key: string) => {
    idbMap.delete(key);
    return Promise.resolve();
  }),
}));

// ── Reset store + idb between every test ───────────────────────────────────
const EMPTY_STATE = {
  entries: [],
  tags: [],
  snippets: [],
  currentView: 'home' as const,
  selectedEntryId: null,
  analysisPresetTagIds: [],
};

beforeEach(() => {
  idbMap.clear();
  // Merge (not replace) so action functions defined in the store are preserved.
  useStore.setState(EMPTY_STATE);
});
