import { createContext, useContext, useState, type ReactNode } from 'react';

import type { PickedPhoto } from '@/lib/photos';

/**
 * Step 1, where the pet is: a scene (Natal, beach…), one typed by the person,
 * "at home" (no scene: the mode's own place) or a surprise.
 */
export type PlaceChoice = { kind: 'surprise' } | { kind: 'home' } | { kind: 'scene'; id: string } | { kind: 'custom' };

/** Step 2, the pet's mode, or a surprise. */
export type ModeChoice = { kind: 'surprise' } | { kind: 'mode'; id: string };

/** The photo and choices made before a translation exists. */
type Draft = {
  photo: PickedPhoto | null;
  place: PlaceChoice | null;
  mode: ModeChoice | null;
  /** Optional funny extra (glasses, big nose…), free. */
  comicId: string | null;
  customScene: string;
};

const EMPTY: Draft = { photo: null, place: null, mode: null, comicId: null, customScene: '' };

type DraftApi = Draft & {
  setPhoto(photo: PickedPhoto): void;
  setPlace(place: PlaceChoice): void;
  setMode(mode: ModeChoice): void;
  setComic(id: string | null): void;
  setCustomScene(text: string): void;
  reset(): void;
};

const DraftContext = createContext<DraftApi | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(EMPTY);

  const api: DraftApi = {
    ...draft,
    setPhoto: (photo) => setDraft((d) => ({ ...d, photo })),
    setPlace: (place) => setDraft((d) => ({ ...d, place })),
    setMode: (mode) => setDraft((d) => ({ ...d, mode })),
    setComic: (comicId) => setDraft((d) => ({ ...d, comicId })),
    setCustomScene: (customScene) => setDraft((d) => ({ ...d, customScene })),
    reset: () => setDraft(EMPTY),
  };

  return <DraftContext.Provider value={api}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraft must be used inside DraftProvider');
  return ctx;
}

/** Picks one item at random ("Surpreende-me"). */
export function pickRandom<T>(items: readonly T[]): T | undefined {
  return items.length ? items[Math.floor(Math.random() * items.length)] : undefined;
}
