import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import { Platform, Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import type { CanvasRef } from '@/components/TranslationCanvas';

/** Renders the canvas view to a PNG. Returns a file URI (phone) or data URI (web). */
export async function renderToImage(ref: RefObject<CanvasRef | null>): Promise<string> {
  if (!ref.current) throw new Error('Canvas not ready');
  return captureRef(ref, {
    format: 'png',
    quality: 1,
    result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
  });
}

export type ShareOutcome = 'shared' | 'unavailable';

/** `message` (e.g. the App Store link) goes with the picture where the target app accepts text. */
export async function shareImage(uri: string, fileName: string, message?: string): Promise<ShareOutcome> {
  if (Platform.OS === 'web') return shareOnWeb(uri, fileName);
  if (message && Platform.OS === 'ios') {
    await Share.share({ url: uri, message });
    return 'shared';
  }
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
  return 'shared';
}

export type SaveOutcome = 'saved' | 'denied';

export async function saveImageToLibrary(uri: string, fileName = 'pet-thought.png'): Promise<SaveOutcome> {
  if (Platform.OS === 'web') {
    downloadOnWeb(uri, fileName);
    return 'saved';
  }
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) return 'denied';
  await MediaLibrary.Asset.create(uri);
  return 'saved';
}

/** Web: native share sheet when the browser supports files, otherwise a download. */
async function shareOnWeb(dataUri: string, fileName: string): Promise<ShareOutcome> {
  const blob = await (await fetch(dataUri)).blob();
  const file = new File([blob], fileName, { type: 'image/png' });
  const nav = globalThis.navigator as Navigator | undefined;
  if (nav?.canShare?.({ files: [file] })) {
    await nav.share({ files: [file] });
    return 'shared';
  }
  downloadOnWeb(dataUri, fileName);
  return 'shared';
}

function downloadOnWeb(dataUri: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = fileName;
  link.click();
}
