import Storage from 'expo-sqlite/kv-store';

/** Tiny key-value store. Phone: SQLite. Web: see kv.web.ts. */
export const kv = {
  getItem: (key: string) => Storage.getItemAsync(key),
  setItem: (key: string, value: string) => Storage.setItemAsync(key, value),
};
