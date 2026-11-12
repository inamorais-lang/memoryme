import type { BalloonPosition } from '@/features/history/history';
import type { AppLanguage, Market } from '@/i18n';
import type { PickedPhoto } from '@/lib/photos';

export type PersonalityInfo = { id: string; name: string; tagline: string };

/** Server scene: 'place' is chosen instead of a mode (Natal, beach…); 'comic' is the optional funny extra. */
export type SceneInfo = {
  id: string;
  name: string;
  kind: 'place' | 'comic';
  /** e.g. 'natal': shown as its own group at the top. */
  category?: string | null;
};

/**
 * What a new translation starts from: a mode, a place scene or a scene typed by the person
 * (2 credits), plus an optional free funny extra.
 */
/** A mode, a scene (or one typed by the person), or both together; at least one of them. */
export type TranslationChoice = {
  personalityId?: string;
  sceneId?: string;
  customScene?: string;
  comicId?: string;
  /** Optional, from the owner, for the line only. */
  petSex?: 'male' | 'female';
};

/** Limits of a scene typed by the user (also enforced in the database). */
export const CUSTOM_SCENE_MIN = 3;
export const CUSTOM_SCENE_MAX = 80;

/** Max length of a line written by the user (also enforced in the database). */
export const CUSTOM_PHRASE_MAX = 45;

export type TranslationStatus = 'pending' | 'succeeded' | 'failed';

/** What the screens need to show one translation, wherever it lives. */
export type TranslationView = {
  id: string;
  status: TranslationStatus;
  /** While pending: the step the server is at (waiting screen). */
  stage?: 'checking' | 'painting' | 'writing';
  /** Absent when no mode was chosen. */
  personalityId?: string;
  /** Scene chosen in step 1, if any. */
  sceneId?: string;
  imageUri?: string;
  /** Known for local photos; remote images report their size when loaded. */
  width?: number;
  height?: number;
  phrase?: string;
  freePhraseUsed: boolean;
  balloonPosition: BalloonPosition;
  /** Line written by the user; shown instead of `phrase` when set. */
  customPhrase?: string;
  balloonX?: number;
  balloonY?: number;
  /** Pet's head in the image (x, y, w, h as fractions), from the AI. Keeps the balloon off the face. */
  head?: [number, number, number, number];
  /** Main prop of the scene (TV remote, glass…), same format. The balloon avoids it too. */
  prop?: [number, number, number, number];
  /** The pet's whole body, same format. The balloon avoids it after the face. */
  body?: [number, number, number, number];
  failureReason?: string;
  /** Credits spent (1, or 2 for a scene typed by the user). */
  cost: number;
  createdAt: number;
};

export type BackendErrorCode =
  | 'auth_required'
  | 'insufficient_credits'
  | 'rate_limited'
  | 'daily_limit'
  | 'no_free_phrase'
  | 'invalid_scene'
  | 'purchase_rejected'
  | 'network'
  | 'server_error';

export class BackendError extends Error {
  constructor(public code: BackendErrorCode) {
    super(code);
  }
}

export interface Backend {
  mode: 'local' | 'remote';
  listPersonalities(market: Market): Promise<PersonalityInfo[]>;
  /** Server scenes for this language and country (trending topics differ by country); empty without the server. */
  listScenes(language: AppLanguage, market: Market): Promise<SceneInfo[]>;
  /** Spends credits (remote) and starts the translation. Returns its id. */
  createTranslation(photo: PickedPhoto, choice: TranslationChoice): Promise<string>;
  getTranslation(id: string): Promise<TranslationView | null>;
  newPhrase(id: string): Promise<string>;
  setBalloonSpot(id: string, x: number, y: number): Promise<void>;
  setCustomPhrase(id: string, text: string | null): Promise<void>;
  listHistory(): Promise<TranslationView[]>;
  /** Deletes one picture (image, line, history entry). */
  deleteTranslation(id: string): Promise<void>;
  /** Flags a picture as objectionable (the admin page lists it). No-op without the server. */
  reportTranslation(id: string): Promise<void>;
  /** Credit packs on sale (product id + credits), in display order; empty without the server. */
  listPacks(): Promise<{ productId: string; credits: number }[]>;
  /** Hands a signed App Store transaction to the server, which adds its credits once. */
  verifyPurchase(signedTransaction: string): Promise<{ creditsAdded: number }>;
}
