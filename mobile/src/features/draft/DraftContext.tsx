import { createContext, useContext, useState, type ReactNode } from 'react';

import type { PickedPhoto } from '@/lib/photos';

/** What the picture starts from: a mode, a scene (Natal, beach…) or a scene typed by the person. */
export type DraftChoice = { kind: 'mode'; id: string } | { kind: 'scene'; id: string } | { kind: 'custom' };

/** The photo and choices made before a translation exists. */
type Draft = {
  photo: PickedPhoto | null;
  choice: DraftChoice | null;
  /** Optional funny extra (glasses, big nose…), free. */
  comicId: string | null;
  customScene: string;
};

const EMPTY: Draft = { photo: null, choice: null, comicId: null, customScene: '' };

type DraftApi = Draft & {
  setPhoto(photo: PickedPhoto): void;
  setChoice(choice: DraftChoice): void;
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
