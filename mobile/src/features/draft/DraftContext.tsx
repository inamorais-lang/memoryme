import { createContext, useContext, useState, type ReactNode } from 'react';

import type { PickedPhoto } from '@/lib/photos';

/**
 * Everything is a "Modo" (product owner's decision): one list, one choice.
 * A mode (Diva, Chefe…), a scene shown as a mode (Compras, Aniversário, Praia…),
 * "Natal" (one Christmas scene at random), one typed by the person, or a surprise.
 */
export type StyleChoice =
  | { kind: 'surprise' }
  | { kind: 'mode'; id: string }
  | { kind: 'scene'; id: string }
  | { kind: 'natal' }
  | { kind: 'custom' };

/** The photo and choices made before a translation exists. */
type Draft = {
  photo: PickedPhoto | null;
  choice: StyleChoice | null;
  /** Aniversário: who the pet wishes a happy birthday to (optional). */
  recipient: string;
  /** Optional funny extra (glasses, big nose…), free. */
  comicId: string | null;
  customScene: string;
};

const EMPTY: Draft = { photo: null, choice: null, recipient: '', comicId: null, customScene: '' };

type DraftApi = Draft & {
  setPhoto(photo: PickedPhoto): void;
  setChoice(choice: StyleChoice): void;
  setRecipient(name: string): void;
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
    setChoice: (choice) => setDraft((d) => ({ ...d, choice })),
    setRecipient: (recipient) => setDraft((d) => ({ ...d, recipient })),
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
