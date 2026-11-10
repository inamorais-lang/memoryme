import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { TranslationCanvas, type CanvasRef } from '@/components/TranslationCanvas';
import { AppText, Button, colors, Screen, space } from '@/design';
import { useAuth } from '@/features/auth/AuthContext';
import { backend, type TranslationView } from '@/features/backend';
import { useDraft } from '@/features/draft/DraftContext';
import { findPersonality } from '@/features/personalities/data';
import { renderToImage, saveImageToLibrary, shareImage } from '@/lib/exportImage';

const POLL_MS = 2000;
const GIVE_UP_MS = 3 * 60 * 1000;

type Status = 'loading' | 'ready' | 'failed' | 'slow' | 'missing';

export default function ResultScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const draft = useDraft();
  const auth = useAuth();
  const canvasRef = useRef<CanvasRef>(null);
  // Header, pinned actions and the retry link take roughly half the screen.
  const canvasMaxHeight = useWindowDimensions().height * 0.5;

  const [item, setItem] = useState<TranslationView | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [busy, setBusy] = useState<'retry' | 'share' | 'save' | null>(null);
  const [saved, setSaved] = useState(false);
  const [loadingText] = useState(() => pickOne(t('result.loading', { returnObjects: true }) as string[]));

  // Load the translation; while the server is still working on it, poll.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const startedAt = Date.now();
    async function poll() {
      try {
        const found = await backend.getTranslation(id!);
        if (cancelled) return;
        if (!found) return setStatus('missing');
        setItem(found);
        if (found.status === 'succeeded') {
          setStatus('ready');
          auth.refreshCredits();
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return;
        }
        if (found.status === 'failed') {
          setStatus('failed');
          auth.refreshCredits();
          return;
        }
      } catch {
        // Network blip: keep polling until we give up.
      }
      if (Date.now() - startedAt > GIVE_UP_MS) return setStatus('slow');
      setTimeout(poll, POLL_MS);
    }
    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function newPhrase() {
    if (!item || item.freePhraseUsed) return;
    setBusy('retry');
    try {
      const phrase = await backend.newPhrase(item.id);
      setItem({ ...item, phrase, freePhraseUsed: true });
    } catch {
      Alert.alert(t('result.errorTitle'), t('result.errorBody'));
    } finally {
      setBusy(null);
    }
  }

  function moveBalloon() {
    if (!item) return;
    const balloonPosition = item.balloonPosition === 'top' ? 'bottom' : 'top';
    setItem({ ...item, balloonPosition });
    backend.setBalloon(item.id, balloonPosition).catch(() => {});
  }

  async function share() {
    setBusy('share');
    try {
      const uri = await renderToImage(canvasRef);
      const outcome = await shareImage(uri, `pet-thought-${item?.id}.png`);
      if (outcome === 'unavailable') Alert.alert(t('result.shareUnavailable'));
    } catch {
      // Closing the share sheet also lands here on some platforms; nothing to report.
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    setBusy('save');
    try {
      const uri = await renderToImage(canvasRef);
      const outcome = await saveImageToLibrary(uri);
      if (outcome === 'denied') {
        Alert.alert(t('permissions.saveTitle'), t('permissions.saveBody'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.openSettings'), onPress: () => Linking.openSettings() },
        ]);
      } else {
        setSaved(true);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert(t('result.errorTitle'), t('result.errorBody'));
    } finally {
      setBusy(null);
    }
  }

  function newPhoto() {
    draft.reset();
    router.dismissAll();
  }

  if (!id || status === 'missing' || status === 'failed' || status === 'slow') {
    const message =
      !id || status === 'missing'
        ? t('result.notFound')
        : status === 'slow'
          ? t('result.slow')
          : item?.failureReason === 'not_a_pet'
            ? t('result.notAPet')
            : t('result.failedRefunded');
    return (
      <Screen footer={<Button testID="new-photo" label={t('result.newPhoto')} onPress={newPhoto} />}>
        <AppText variant="heading" testID="result-message">
          {message}
        </AppText>
      </Screen>
    );
  }

  if (status === 'loading' || !item?.imageUri) {
    const photo = draft.photo;
    return (
      <Screen scroll={false}>
        {photo ? (
          <View style={styles.dimmed}>
            <TranslationCanvas
              photoUri={photo.uri}
              photoWidth={photo.width}
              photoHeight={photo.height}
              balloonPosition="top"
              maxHeight={canvasMaxHeight}
            />
          </View>
        ) : null}
        <View style={styles.loading} testID="result-loading">
          <ActivityIndicator color={colors.ink} />
          <AppText variant="bodyStrong">{loadingText}</AppText>
          {backend.mode === 'remote' ? (
            <AppText variant="small" color={colors.inkMuted}>
              {t('result.loadingHint')}
            </AppText>
          ) : null}
        </View>
      </Screen>
    );
  }

  const personality = findPersonality(item.personalityId);
  const isWeb = Platform.OS === 'web';

  return (
    <Screen
      footer={
        <>
          <Button testID="share" label={t('result.share')} onPress={share} loading={busy === 'share'} />
          <View style={styles.row}>
            {!isWeb ? (
              <View style={styles.flex}>
                <Button
                  testID="save"
                  variant="secondary"
                  label={saved ? t('result.saved') : t('result.save')}
                  onPress={save}
                  loading={busy === 'save'}
                  disabled={saved}
                />
              </View>
            ) : null}
            <View style={styles.flex}>
              <Button testID="move-balloon" variant="secondary" label={t('result.moveBalloon')} onPress={moveBalloon} />
            </View>
          </View>
          <View style={styles.secondary}>
            {!item.freePhraseUsed ? (
              <Button
                testID="retry"
                variant="tertiary"
                label={t('result.retryFree')}
                onPress={newPhrase}
                loading={busy === 'retry'}
              />
            ) : null}
            <Button testID="new-photo" variant="tertiary" label={t('result.newPhoto')} onPress={newPhoto} />
          </View>
        </>
      }>
      <TranslationCanvas
        ref={canvasRef}
        photoUri={item.imageUri}
        photoWidth={item.width}
        photoHeight={item.height}
        phrase={item.phrase}
        balloonPosition={item.balloonPosition}
        maxHeight={canvasMaxHeight}
      />
      {personality ? (
        <AppText variant="smallStrong" color={colors.inkMuted} align="center">
          {personality.name}
        </AppText>
      ) : null}
    </Screen>
  );
}

function pickOne<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

const styles = StyleSheet.create({
  dimmed: { opacity: 0.6 },
  loading: { alignItems: 'center', gap: space.md, paddingTop: space.xl },
  row: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
  secondary: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: space.sm },
});
