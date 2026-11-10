import type { BalloonPosition } from '@/features/history/history';
import type { Market } from '@/i18n';
import type { PickedPhoto } from '@/lib/photos';

export type PersonalityInfo = { id: string; name: string; tagline: string };

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
  setBalloon(id: string, position: BalloonPosition): Promise<void>;
  listHistory(): Promise<TranslationView[]>;
}
