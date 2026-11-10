import { kv } from '@/lib/kv';

export type BalloonPosition = 'top' | 'bottom';

export type Translation = {
  id: string;
  createdAt: number;
  photoUri: string;
  photoWidth: number;
  photoHeight: number;
  personalityId: string;
  phrase: string;
  /** Every phrase shown for this photo (for retries without repeats). */
  shownPhrases: string[];
  freeRetryUsed: boolean;
  balloonPosition: BalloonPosition;
};

const KEY = 'history.v1';

export async function loadHistory(): Promise<Translation[]> {
  const raw = await kv.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveHistory(items: Translation[]) {
  await kv.setItem(KEY, JSON.stringify(items));
}

export async function addTranslation(item: Translation) {
  const items = await loadHistory();
  await saveHistory([item, ...items.filter((i) => i.id !== item.id)]);
}

export async function updateTranslation(id: string, patch: Partial<Translation>) {
  const items = await loadHistory();
  await saveHistory(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
}

export async function getTranslation(id: string) {
  return (await loadHistory()).find((i) => i.id === id);
}

export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
