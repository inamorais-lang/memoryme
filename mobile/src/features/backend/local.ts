import { addTranslation, getTranslation, loadHistory, newId, updateTranslation, type Translation } from '@/features/history/history';
import { findPersonality, personalitiesForMarket } from '@/features/personalities/data';
import { translatePhoto } from '@/features/translate/translate';
import { persistPhoto } from '@/lib/photos';

import type { Backend, TranslationView } from './types';

/** Phase 1 behaviour: local phrases, original photo, history on the device. */
function toView(t: Translation): TranslationView {
  return {
    id: t.id,
    status: 'succeeded',
    personalityId: t.personalityId,
    imageUri: t.photoUri,
    width: t.photoWidth,
    height: t.photoHeight,
    phrase: t.phrase,
    freePhraseUsed: t.freeRetryUsed,
    balloonPosition: t.balloonPosition,
    customPhrase: t.customPhrase,
    balloonX: t.balloonX,
    balloonY: t.balloonY,
    createdAt: t.createdAt,
    cost: 1,
  };
}

export const localBackend: Backend = {
  mode: 'local',
  async listPersonalities(market) {
    return personalitiesForMarket(market).map(({ id, name, tagline }) => ({ id, name, tagline }));
  },
  // Without the server there is no image model, so no scenes.
  async listScenes() {
    return [];
  },
  async createTranslation(photo, personalityId) {
    const id = newId();
    const [{ phrase }, photoUri] = await Promise.all([
      translatePhoto({ photoUri: photo.uri, personalityId }),
      persistPhoto(photo.uri, id),
    ]);
    await addTranslation({
      id,
      createdAt: Date.now(),
      photoUri,
      photoWidth: photo.width,
      photoHeight: photo.height,
      personalityId,
      phrase,
      shownPhrases: [phrase],
      freeRetryUsed: false,
      balloonPosition: 'top',
    });
    return id;
  },
  async getTranslation(id) {
    const t = await getTranslation(id);
    return t ? toView(t) : null;
  },
  async newPhrase(id) {
    const t = await getTranslation(id);
    if (!t || t.freeRetryUsed || !findPersonality(t.personalityId)) throw new Error('no_free_phrase');
    const { phrase } = await translatePhoto({ photoUri: t.photoUri, personalityId: t.personalityId, exclude: t.shownPhrases });
    await updateTranslation(id, { phrase, shownPhrases: [...t.shownPhrases, phrase], freeRetryUsed: true });
    return phrase;
  },
  async setBalloonSpot(id, x, y) {
    await updateTranslation(id, { balloonX: x, balloonY: y });
  },
  async setCustomPhrase(id, text) {
    await updateTranslation(id, { customPhrase: text ?? undefined });
  },
  async listHistory() {
    return (await loadHistory()).map(toView);
  },
};
