import { kv } from '@/lib/kv';

/**
 * Apple 5.1.2(i) + GDPR: before the first picture, the person explicitly agrees
 * that the photo is sent to third-party AI services. Kept on the device; the
 * server also records the date of the first consented picture.
 */
const KEY = 'ai-consent-v1';

export async function hasAiConsent(): Promise<boolean> {
  try {
    return (await kv.getItem(KEY)) === 'yes';
  } catch {
    return false;
  }
}

export async function setAiConsent(granted: boolean): Promise<void> {
  await kv.setItem(KEY, granted ? 'yes' : 'no');
}
