import { createContext, useContext, useState, type ReactNode } from 'react';

import type { PickedPhoto } from '@/lib/photos';

/** The photo and personality being chosen before a translation exists. */
type Draft = {
  photo: PickedPhoto | null;
  personalityId: string | null;
};

type DraftApi = Draft & {
  setPhoto(photo: PickedPhoto): void;
  setPersonality(id: string): void;
  reset(): void;
};

const DraftContext = createContext<DraftApi | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>({ photo: null, personalityId: null });

  const api: DraftApi = {
    ...draft,
    setPhoto: (photo) => setDraft((d) => ({ ...d, photo })),
    setPersonality: (personalityId) => setDraft((d) => ({ ...d, personalityId })),
    reset: () => setDraft({ photo: null, personalityId: null }),
  };

  return <DraftContext.Provider value={api}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraft must be used inside DraftProvider');
  return ctx;
}
