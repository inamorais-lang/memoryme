import type { Strings } from './pt-PT';

const en: Strings = {
  common: {
    back: 'Back',
    ok: 'OK',
    cancel: 'Cancel',
    openSettings: 'Open Settings',
  },
  home: {
    title: 'What is your pet really thinking?',
    subtitle: 'Snap your cat or dog and finally learn the truth.',
    sampleThought: 'Another photo? I charge by the hour.',
    takePhoto: 'Take a photo',
    pickPhoto: 'Choose from library',
    history_one: 'See your translation',
    history_other: 'See your {{count}} translations',
  },
  permissions: {
    cameraTitle: 'No camera access',
    cameraBody: 'To take a photo of your pet, allow camera access in Settings.',
    photosTitle: 'No photo access',
    photosBody: 'To choose a photo of your pet, allow photo access in Settings.',
    saveTitle: 'No photo access',
    saveBody: 'To save the translation to your camera roll, allow photo access in Settings.',
  },
  personality: {
    screenTitle: 'Personality',
    title: 'Who is your pet today?',
    subtitle: 'Pick the voice of the translation.',
    translate: 'Translate',
    pickFirst: 'Pick a personality',
    selected: 'Selected',
  },
  result: {
    screenTitle: 'Translation',
    loading: [
      'Listening to the purrs…',
      'Decoding the barks…',
      'Consulting the whiskers…',
      'Interpreting the look of disdain…',
    ],
    share: 'Share',
    save: 'Save to camera roll',
    saved: 'Saved to camera roll',
    moveBalloon: 'Move bubble',
    retryFree: 'Try again · free',
    newPhoto: 'New photo',
    errorTitle: 'Something went wrong',
    errorBody: "We couldn't translate this photo. Please try again.",
    shareUnavailable: 'Sharing is not available on this device.',
    notFound: 'This translation no longer exists.',
  },
  history: {
    screenTitle: 'Your translations',
    emptyTitle: "You haven't translated any pets yet.",
    emptyBody: 'Take the first photo and find out what they are thinking.',
    emptyAction: 'Translate your first pet',
  },
};

export default en;
