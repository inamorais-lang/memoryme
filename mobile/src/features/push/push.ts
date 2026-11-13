import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { backend } from '@/features/backend';
import { currentLanguage, currentMarket } from '@/i18n';
import { kv } from '@/lib/kv';

/**
 * Push notifications (owner-approved): "picture ready", the owner's news and a one-time
 * credits reminder. Asked for on the waiting screen, switched off in Settings.
 * KEY holds the person's own choice: '1' on, '0' off, 'declined' said "not now" on our card.
 */
const KEY = 'push.choice';

export const pushSupported = Platform.OS === 'ios' && Device.isDevice && backend.mode === 'remote';

// While the app is open the picture shows up on screen: no banner on top of it.
if (pushSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function token(): Promise<string | null> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  try {
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return null;
  }
}

async function register(enabled: boolean): Promise<void> {
  const t = await token();
  if (t) await backend.registerPush(t, currentLanguage(), currentMarket(), enabled).catch(() => {});
}

/** Show our "let us tell you when it is ready" card? Only once, before Apple's own prompt. */
export async function shouldOfferPush(): Promise<boolean> {
  if (!pushSupported) return false;
  if (await kv.getItem(KEY)) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'undetermined';
}

/** "Yes, tell me": Apple's prompt, then this device is registered. */
export async function enablePush(): Promise<boolean> {
  if (!pushSupported) return false;
  const { granted } = await Notifications.requestPermissionsAsync();
  await kv.setItem(KEY, granted ? '1' : '0');
  if (granted) await register(true);
  return granted;
}

export async function declinePushOffer(): Promise<void> {
  await kv.setItem(KEY, 'declined');
}

/** Settings: 'on', 'off', or 'blocked' (refused in iOS Settings; only the iPhone can change it). */
export async function pushStatus(): Promise<'on' | 'off' | 'blocked'> {
  if (!pushSupported) return 'off';
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'denied') return 'blocked';
  return status === 'granted' && (await kv.getItem(KEY)) === '1' ? 'on' : 'off';
}

export async function setPushOn(on: boolean): Promise<'on' | 'off' | 'blocked'> {
  if (!pushSupported) return 'off';
  if (on) {
    const granted = await enablePush();
    return granted ? 'on' : 'blocked';
  }
  await kv.setItem(KEY, '0');
  await register(false);
  return 'off';
}

/** On every launch with a session: keeps the token, language and country up to date. */
export async function syncPush(): Promise<void> {
  if (!pushSupported) return;
  backend.touchSeen().catch(() => {});
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted' && (await kv.getItem(KEY)) === '1') await register(true);
}

/** Before signing out: this device stops getting the account's notifications. */
export async function forgetPush(): Promise<void> {
  if (!pushSupported) return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;
  const t = await token();
  if (t) await backend.unregisterPush(t).catch(() => {});
}

/** Tapping a "picture ready" notification opens that picture. */
export function onPushTap(open: (generationId: string) => void): () => void {
  if (!pushSupported) return () => {};
  const handle = (r: Notifications.NotificationResponse | null) => {
    const id = r?.notification.request.content.data?.generationId;
    if (typeof id === 'string') open(id);
  };
  Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
