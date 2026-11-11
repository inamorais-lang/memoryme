import type { BalloonPosition } from '@/features/history/history';
import type { AppLanguage, Market } from '@/i18n';
import type { PickedPhoto } from '@/lib/photos';

export type PersonalityInfo = { id: string; name: string; tagline: string };

/** Preset scene chosen on top of the mood (e.g. fake teeth, glasses). */
export type SceneInfo = {
  id: string;
  name: string;
  /** e.g. 'natal': shown as its own group at the top. */
  category?: string | null;
};

/** Scene for a new translation: a preset (1 credit) or one typed by the user (2 credits). */
export type SceneChoice = { sceneId?: string; customScene?: string };

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
  personalityId: string;
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
  /** Preset scenes; empty when the app runs without the server. */
  listScenes(language: AppLanguage): Promise<SceneInfo[]>;
  /** Spends credits (remote) and starts the translation. Returns its id. */
  createTranslation(photo: PickedPhoto, personalityId: string, scene?: SceneChoice): Promise<string>;
  getTranslation(id: string): Promise<TranslationView | null>;
  newPhrase(id: string): Promise<string>;
  setBalloonSpot(id: string, x: number, y: number): Promise<void>;
  setCustomPhrase(id: string, text: string | null): Promise<void>;
  listHistory(): Promise<TranslationView[]>;
  /** Deletes one picture (image, line, history entry). */
  deleteTranslation(id: string): Promise<void>;
}
