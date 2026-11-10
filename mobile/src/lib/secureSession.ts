import * as SecureStore from 'expo-secure-store';

/**
 * Session storage for supabase-js on the phone, in the iOS Keychain.
 * SecureStore values are limited to ~2KB and a session is larger,
 * so each value is split into chunks.
 */
const CHUNK = 1800;
const countKey = (key: string) => `${key}.n`;
const chunkKey = (key: string, i: number) => `${key}.${i}`;
const safe = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

export const secureSession = {
  async getItem(rawKey: string): Promise<string | null> {
    const key = safe(rawKey);
    const n = Number(await SecureStore.getItemAsync(countKey(key)));
    if (!n) return null;
    const parts = await Promise.all(Array.from({ length: n }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i))));
    return parts.some((p) => p === null) ? null : parts.join('');
  },
  async setItem(rawKey: string, value: string): Promise<void> {
    const key = safe(rawKey);
    await this.removeItem(rawKey);
    const chunks = value.match(new RegExp(`[\\s\\S]{1,${CHUNK}}`, 'g')) ?? [];
    await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(chunkKey(key, i), c)));
    await SecureStore.setItemAsync(countKey(key), String(chunks.length));
  },
  async removeItem(rawKey: string): Promise<void> {
    const key = safe(rawKey);
    const n = Number(await SecureStore.getItemAsync(countKey(key)));
    await Promise.all(Array.from({ length: n || 0 }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i))));
    await SecureStore.deleteItemAsync(countKey(key));
  },
};
