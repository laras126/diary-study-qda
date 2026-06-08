import { get, set, del } from 'idb-keyval';

/**
 * Zustand-compatible async storage backed by IndexedDB (via idb-keyval).
 *
 * On the first `getItem` call, if the key is missing from IDB but present in
 * localStorage (i.e. data was stored by the old implementation), the value is
 * transparently migrated and the localStorage copy is removed.
 */
export const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    let value = await get<string>(name);

    // IDB is empty — recover from localStorage backup if present
    if (value === undefined) {
      const lsValue = localStorage.getItem(name);
      if (lsValue !== null) {
        await set(name, lsValue);
        console.info('[diary-qual] Restored data from localStorage backup → IndexedDB');
        value = lsValue;
      }
    }

    return value ?? null;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
    // Mirror to localStorage as a backup; ignore quota errors so they don't break the primary write
    try {
      localStorage.setItem(name, value);
    } catch {
      // Storage quota exceeded or private browsing — non-fatal
    }
  },

  removeItem: async (name: string): Promise<void> => {
    await del(name);
    localStorage.removeItem(name);
  },
};
