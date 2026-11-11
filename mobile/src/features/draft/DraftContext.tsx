import { createContext, useContext, useState, type ReactNode } from 'react';

import type { PickedPhoto } from '@/lib/photos';

/** Scene on top of the mood: the mood's own, a preset, or one typed by the user. */
export type DraftScene = { kind: 'mood' } | { kind: 'preset'; id: string } | { kind: 'custom' };

/** The photo, personality and scene being chosen before a translation exists. */
type Draft = {
  photo: PickedPhoto | null;
  personalityId: string | null;
  scene: DraftScene;
  customScene: string;
};

const EMPTY: Draft = { photo: null, personalityId: null, scene: { kind: 'mood' }, customScene: '' };

type DraftApi = Draft & {
  setPhoto(photo: PickedPhoto): void;
  setPersonality(id: string): void;
  setScene(scene: DraftScene): void;
  setCustomScene(text: string): void;
  reset(): void;
};

const DraftContext = createContext<DraftApi | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(EMPTY);

  const api: DraftApi = {
    ...draft,
    setPhoto: (photo) => setDraft((d) => ({ ...d, photo })),
    setPersonality: (personalityId) => setDraft((d) => ({ ...d, personalityId })),
    setScene: (scene) => setDraft((d) => ({ ...d, scene })),
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
