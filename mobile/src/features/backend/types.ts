import type { BalloonPosition } from '@/features/history/history';
import type { Market } from '@/i18n';
import type { PickedPhoto } from '@/lib/photos';

export type PersonalityInfo = { id: string; name: string; tagline: string };

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
  failureReason?: string;
  createdAt: number;
};

export type BackendErrorCode =
  | 'auth_required'
  | 'insufficient_credits'
  | 'rate_limited'
  | 'daily_limit'
  | 'no_free_phrase'
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
  /** Spends a credit (remote) and starts the translation. Returns its id. */
  createTranslation(photo: PickedPhoto, personalityId: string): Promise<string>;
  getTranslation(id: string): Promise<TranslationView | null>;
  newPhrase(id: string): Promise<string>;
  setBalloonSpot(id: string, x: number, y: number): Promise<void>;
  setCustomPhrase(id: string, text: string | null): Promise<void>;
  listHistory(): Promise<TranslationView[]>;
}
