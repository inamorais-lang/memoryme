import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type PickedPhoto = { uri: string; width: number; height: number };

export type PickOutcome =
  | { status: 'picked'; photo: PickedPhoto }
  | { status: 'cancelled' }
  | { status: 'denied' };

const options: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.85,
  allowsEditing: false,
};

export async function takePhoto(): Promise<PickOutcome> {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };
  }
  return toOutcome(await ImagePicker.launchCameraAsync(options));
}

export async function pickPhoto(): Promise<PickOutcome> {
  // iOS 14+ uses the limited picker, which needs no permission prompt.
  return toOutcome(await ImagePicker.launchImageLibraryAsync(options));
}

function toOutcome(result: ImagePicker.ImagePickerResult): PickOutcome {
  if (result.canceled || !result.assets?.[0]) return { status: 'cancelled' };
  const { uri, width, height } = result.assets[0];
  return { status: 'picked', photo: { uri, width: width || 1, height: height || 1 } };
}

/**
 * Copies the photo out of the temporary cache so history keeps working.
 * On the web the URI is already a data/blob URL, so it is kept as is.
 */
export async function persistPhoto(uri: string, id: string): Promise<string> {
  if (Platform.OS === 'web') return uri;
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true });
  const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
  const dest = new File(dir, `${id}.${ext}`);
  await new File(uri).copy(dest);
  return dest.uri;
}
