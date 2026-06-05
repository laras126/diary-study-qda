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

    // One-time migration from localStorage → IndexedDB
    if (value === undefined) {
      const lsValue = localStorage.getItem(name);
      if (lsValue !== null) {
        await set(name, lsValue);
        localStorage.removeItem(name);
        console.info('[diary-qual] Migrated data from localStorage → IndexedDB');
        value = lsValue;
      }
    }

    return value ?? null;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },

  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};
