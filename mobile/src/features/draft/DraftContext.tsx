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
  /** The picture just made from this photo: only it offers "Novo modo" (the photo is still on the phone). */
  lastId: string | null;
};

const EMPTY: Draft = { photo: null, choice: null, recipient: '', comicId: null, customScene: '', lastId: null };

type DraftApi = Draft & {
  setPhoto(photo: PickedPhoto): void;
  setChoice(choice: StyleChoice): void;
  setRecipient(name: string): void;
  setComic(id: string | null): void;
  setCustomScene(text: string): void;
  setLastId(id: string): void;
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
    setLastId: (lastId) => setDraft((d) => ({ ...d, lastId })),
    reset: () => setDraft(EMPTY),
  };

  return <DraftContext.Provider value={api}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraft must be used inside DraftProvider');
  return ctx;
}
