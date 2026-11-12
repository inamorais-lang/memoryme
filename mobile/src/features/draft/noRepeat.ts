import { kv } from "@/lib/kv";

/**
 * Picks at random among the options this person has not had yet in this group
 * (e.g. the Christmas scenes behind "Natal"). Once all were used, it starts again,
 * never repeating the last one. Pure: the caller keeps `used`.
 */
export function chooseFresh<T>(
  options: readonly T[],
  used: readonly T[],
  random: () => number = Math.random,
): { pick: T | undefined; used: T[] } {
  if (options.length === 0) return { pick: undefined, used: [...used] };
  let pool = options.filter((o) => !used.includes(o));
  let history = used.filter((u) => options.includes(u));
  if (pool.length === 0) {
    const last = history[history.length - 1];
    pool =
      options.length > 1 ? options.filter((o) => o !== last) : [...options];
    history = [];
  }
  const pick = pool[Math.floor(random() * pool.length)];
  return { pick, used: [...history, pick] };
}

const key = (group: string) => `no-repeat-v1:${group}`;

/** Same as chooseFresh, remembered on this device. */
export async function pickFresh(
  group: string,
  options: readonly string[],
): Promise<string | undefined> {
  let used: string[] = [];
  try {
    const raw = await kv.getItem(key(group));
    used = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    used = [];
  }
  const result = chooseFresh(options, used);
  try {
    await kv.setItem(key(group), JSON.stringify(result.used));
  } catch {
    // Only a convenience.
  }
  return result.pick;
}
