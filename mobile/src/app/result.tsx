import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { TranslationCanvas, type CanvasRef } from '@/components/TranslationCanvas';
import { AppText, Button, colors, Screen, space } from '@/design';
import { useDraft } from '@/features/draft/DraftContext';
import {
  addTranslation,
  getTranslation,
  newId,
  updateTranslation,
  type Translation,
} from '@/features/history/history';
import { findPersonality } from '@/features/personalities/data';
import { translatePhoto } from '@/features/translate/translate';
import { renderToImage, saveImageToLibrary, shareImage } from '@/lib/exportImage';
import { persistPhoto } from '@/lib/photos';

type Status = 'loading' | 'ready' | 'error' | 'missing';

export default function ResultScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const draft = useDraft();
  const canvasRef = useRef<CanvasRef>(null);
  // Header, pinned actions and the retry link take roughly half the screen.
  const canvasMaxHeight = useWindowDimensions().height * 0.5;
  const started = useRef(false);

  const [item, setItem] = useState<Translation | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [busy, setBusy] = useState<'retry' | 'share' | 'save' | null>(null);
  const [saved, setSaved] = useState(false);
  const [loadingText] = useState(() => pickOne(t('result.loading', { returnObjects: true }) as string[]));

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (id) {
      getTranslation(id).then((found) => {
        setItem(found ?? null);
        setStatus(found ? 'ready' : 'missing');
      });
    } else {
      createFromDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createFromDraft() {
    const { photo, personalityId } = draft;
    if (!photo || !personalityId) {
      setStatus('missing');
      return;
    }
    setStatus('loading');
    try {
      const translationId = newId();
      const [{ phrase }, photoUri] = await Promise.all([
        translatePhoto({ photoUri: photo.uri, personalityId }),
        persistPhoto(photo.uri, translationId),
      ]);
      const created: Translation = {
        id: translationId,
        createdAt: Date.now(),
        photoUri,
        photoWidth: photo.width,
        photoHeight: photo.height,
        personalityId,
        phrase,
        shownPhrases: [phrase],
        freeRetryUsed: false,
        balloonPosition: 'top',
      };
      await addTranslation(created);
      setItem(created);
      setStatus('ready');
      router.setParams({ id: translationId });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setStatus('error');
    }
  }

  async function update(patch: Partial<Translation>) {
    if (!item) return;
    const next = { ...item, ...patch };
    setItem(next);
    await updateTranslation(item.id, patch);
  }

  async function retry() {
    if (!item || item.freeRetryUsed) return;
    setBusy('retry');
    try {
      const { phrase } = await translatePhoto({
        photoUri: item.photoUri,
        personalityId: item.personalityId,
        exclude: item.shownPhrases,
      });
      await update({ phrase, shownPhrases: [...item.shownPhrases, phrase], freeRetryUsed: true });
    } catch {
      Alert.alert(t('result.errorTitle'), t('result.errorBody'));
    } finally {
      setBusy(null);
    }
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

  if (status === 'missing') {
    return (
      <Screen footer={<Button label={t('result.newPhoto')} onPress={newPhoto} />}>
        <AppText variant="heading">{t('result.notFound')}</AppText>
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen footer={<Button label={t('result.retryFree')} onPress={createFromDraft} />}>
        <AppText variant="heading">{t('result.errorTitle')}</AppText>
        <AppText color={colors.inkMuted}>{t('result.errorBody')}</AppText>
      </Screen>
    );
  }

  if (status === 'loading' || !item) {
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
              <Button
                testID="move-balloon"
                variant="secondary"
                label={t('result.moveBalloon')}
                onPress={() => update({ balloonPosition: item.balloonPosition === 'top' ? 'bottom' : 'top' })}
              />
            </View>
          </View>
          <View style={styles.secondary}>
            {!item.freeRetryUsed ? (
              <Button
                testID="retry"
                variant="ghost"
                label={t('result.retryFree')}
                onPress={retry}
                loading={busy === 'retry'}
              />
            ) : null}
            <Button testID="new-photo" variant="ghost" label={t('result.newPhoto')} onPress={newPhoto} />
          </View>
        </>
      }>
      <TranslationCanvas
        ref={canvasRef}
        photoUri={item.photoUri}
        photoWidth={item.photoWidth}
        photoHeight={item.photoHeight}
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
