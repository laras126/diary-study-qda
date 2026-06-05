import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Entry, Tag, Snippet, ViewType } from '../types';

const TAG_COLORS = [
  '#e05252', '#e08a52', '#c9b835', '#52a852', '#52a8a8',
  '#5270e0', '#9052e0', '#d052a8', '#6b8f71', '#4a7fa5',
  '#c4622d', '#7a6b8a',
];

interface Store {
  entries: Entry[];
  tags: Tag[];
  snippets: Snippet[];
  currentView: ViewType;
  selectedEntryId: string | null;

  setEntries: (entries: Entry[]) => void;
  updateEntryDate: (entryId: string, newDate: string) => void;

  addTag: (name: string) => Tag;
  renameTag: (tagId: string, newName: string) => void;
  deleteTag: (tagId: string) => void;

  addSnippet: (data: Omit<Snippet, 'id' | 'createdAt'>) => void;
  deleteSnippet: (snippetId: string) => void;
  updateSnippetTags: (snippetId: string, tagIds: string[]) => void;
  updateSnippetNote: (snippetId: string, note: string) => void;

  setCurrentView: (view: ViewType) => void;
  setSelectedEntry: (entryId: string | null) => void;
  analysisPresetTagIds: string[];
  setAnalysisPreset: (tagIds: string[]) => void;
  clearAll: () => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      entries: [],
      tags: [],
      snippets: [],
      currentView: 'home',
      selectedEntryId: null,
      analysisPresetTagIds: [],

      setEntries: (entries) => set({ entries }),

      updateEntryDate: (entryId, newDate) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === entryId
              ? { ...e, date: newDate, dateModified: e.originalDate !== newDate }
              : e
          ),
        })),

      addTag: (name) => {
        const usedColors = get().tags.map((t) => t.color);
        const color =
          TAG_COLORS.find((c) => !usedColors.includes(c)) ??
          TAG_COLORS[get().tags.length % TAG_COLORS.length];
        const tag: Tag = { id: crypto.randomUUID(), name, color };
        set((state) => ({ tags: [...state.tags, tag] }));
        return tag;
      },

      renameTag: (tagId, newName) =>
        set((state) => ({
          tags: state.tags.map((t) => (t.id === tagId ? { ...t, name: newName } : t)),
        })),

      deleteTag: (tagId) =>
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== tagId),
          snippets: state.snippets
            .map((s) => ({ ...s, tagIds: s.tagIds.filter((id) => id !== tagId) }))
            .filter((s) => s.tagIds.length > 0),
        })),

      addSnippet: (data) => {
        const snippet: Snippet = {
          ...data,
          note: data.note ?? '',
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ snippets: [...state.snippets, snippet] }));
      },

      deleteSnippet: (snippetId) =>
        set((state) => ({
          snippets: state.snippets.filter((s) => s.id !== snippetId),
        })),

      updateSnippetTags: (snippetId, tagIds) =>
        set((state) => ({
          snippets: state.snippets.map((s) =>
            s.id === snippetId ? { ...s, tagIds } : s
          ),
        })),

      updateSnippetNote: (snippetId, note) =>
        set((state) => ({
          snippets: state.snippets.map((s) =>
            s.id === snippetId ? { ...s, note } : s
          ),
        })),

      setCurrentView: (view) => {
        // Keep URL hash in sync so the browser back/forward stack works
        const hash = `#/${view}`;
        if (window.location.hash !== hash) window.location.hash = hash;
        set({ currentView: view });
      },
      setSelectedEntry: (entryId) => set({ selectedEntryId: entryId }),
      setAnalysisPreset: (tagIds) => set({ analysisPresetTagIds: tagIds }),
      clearAll: () =>
        set({ entries: [], tags: [], snippets: [], currentView: 'home', selectedEntryId: null }),
    }),
    { name: 'diary-qual-storage' }
  )
);
