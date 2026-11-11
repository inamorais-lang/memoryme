import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { tintFor } from '@/components/ThoughtBalloon';
import {
  BALLOON_CORNERS,
  TranslationCanvas,
  type BalloonSpot,
  type CanvasRef,
} from '@/components/TranslationCanvas';
import { AppText, Button, colors, Screen, space, TextField } from '@/design';
import { useAuth } from '@/features/auth/AuthContext';
import { backend, CUSTOM_PHRASE_MAX, type TranslationView } from '@/features/backend';
import { useDraft } from '@/features/draft/DraftContext';
import { findPersonality } from '@/features/personalities/data';
import { APP_STORE_URL } from '@/config';
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
  const canvasMaxHeight = useWindowDimensions().height * 0.45;

  const [item, setItem] = useState<TranslationView | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [busy, setBusy] = useState<'retry' | 'share' | 'save' | null>(null);
  // What was in the gallery copy: any change to the picture (new line, balloon, colour) lets it be saved again.
  const [savedLook, setSavedLook] = useState<string | null>(null);
  // Each translation gets its own pastel; tapping the balloon cycles it.
  const [tintShift, setTintShift] = useState(0);
  const [corner, setCorner] = useState(0);
  // Some people want the picture alone: share and save it without the balloon.
  const [balloonHidden, setBalloonHidden] = useState(false);
  const look = JSON.stringify([
    item?.customPhrase ?? item?.phrase,
    item?.balloonX,
    item?.balloonY,
    tintShift,
    balloonHidden,
  ]);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState('');
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
      setItem({ ...item, phrase, customPhrase: undefined, freePhraseUsed: true });
      if (item.customPhrase) backend.setCustomPhrase(item.id, null).catch(() => {});
    } catch {
      Alert.alert(t('result.errorTitle'), t('result.errorBody'));
    } finally {
      setBusy(null);
    }
  }

  function placeBalloon(spot: BalloonSpot) {
    if (!item) return;
    setItem({ ...item, balloonX: spot.x, balloonY: spot.y });
    backend.setBalloonSpot(item.id, spot.x, spot.y).catch(() => {});
  }

  function nextCorner() {
    const next = (corner + 1) % BALLOON_CORNERS.length;
    setCorner(next);
    placeBalloon(BALLOON_CORNERS[next]);
  }

  function startWriting() {
    setDraftText(item?.customPhrase ?? '');
    setEditing(true);
  }

  function saveOwnLine() {
    if (!item) return;
    const text = draftText.replace(/\s+/g, ' ').trim().slice(0, CUSTOM_PHRASE_MAX);
    if (!text) return;
    setItem({ ...item, customPhrase: text });
    setEditing(false);
    backend.setCustomPhrase(item.id, text).catch(() => Alert.alert(t('result.network')));
  }

  function useAiLine() {
    if (!item) return;
    setItem({ ...item, customPhrase: undefined });
    backend.setCustomPhrase(item.id, null).catch(() => {});
  }

  async function share() {
    setBusy('share');
    try {
      const uri = await renderToImage(canvasRef);
      const message = APP_STORE_URL ? t('result.shareMessage', { url: APP_STORE_URL }) : undefined;
      const outcome = await shareImage(uri, `petbubble-${item?.id}.png`, message);
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
      const outcome = await saveImageToLibrary(uri, `petbubble-${item?.id}.png`);
      if (outcome === 'denied') {
        Alert.alert(t('permissions.saveTitle'), t('permissions.saveBody'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.openSettings'), onPress: () => Linking.openSettings() },
        ]);
      } else {
        setSavedLook(look);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert(t('result.errorTitle'), t('result.errorBody'));
    } finally {
      setBusy(null);
    }
  }

  function confirmDelete() {
    if (!item) return;
    Alert.alert(t('result.deleteTitle'), t('result.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('result.deleteConfirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            await backend.deleteTranslation(item.id);
            newPhoto();
          } catch {
            Alert.alert(t('result.deleteError'));
          }
        },
      },
    ]);
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
          : item?.failureReason === 'scene_rejected'
            ? t('result.sceneRejected', { count: item.cost })
            : item?.failureReason === 'not_a_pet'
              ? t('result.notAPet', { count: item.cost })
              : t('result.failedRefunded', { count: item?.cost ?? 1 });
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
              balloonSpot={BALLOON_CORNERS[0]}
              maxHeight={canvasMaxHeight}
              watermark={false}
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
  // No spot chosen yet: with the head box the canvas picks the corner away from the face.
  const spot: BalloonSpot | undefined =
    item.balloonX !== undefined && item.balloonY !== undefined
      ? { x: item.balloonX, y: item.balloonY }
      : item.head
        ? undefined
        : BALLOON_CORNERS[item.balloonPosition === 'bottom' ? 3 : 0];
  const shownPhrase = editing ? draftText || t('result.writePlaceholder') : (item.customPhrase ?? item.phrase);
  const saved = savedLook === look;
  const charsLeft = CUSTOM_PHRASE_MAX - draftText.length;

  const writingFooter = (
    <>
      <TextField
        testID="own-line-input"
        value={draftText}
        onChangeText={setDraftText}
        maxLength={CUSTOM_PHRASE_MAX}
        placeholder={t('result.writePlaceholder')}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={saveOwnLine}
        counterLabel={t('result.charsLeft', { count: charsLeft })}
      />
      <Button testID="use-own-line" label={t('result.useMine')} onPress={saveOwnLine} disabled={!draftText.trim()} />
      <View style={styles.secondary}>
        <Button testID="cancel-own-line" variant="tertiary" label={t('common.cancel')} onPress={() => setEditing(false)} />
      </View>
    </>
  );

  const actionsFooter = (
    <>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Button testID="share" label={t('result.share')} note={t('result.free')} onPress={share} loading={busy === 'share'} />
        </View>
        <View style={styles.flex}>
          <Button
            testID="save"
            variant="secondary"
            label={saved ? t('result.saved') : t('result.save')}
            note={t('result.free')}
            onPress={save}
            loading={busy === 'save'}
            disabled={saved}
          />
        </View>
      </View>
      <View style={styles.secondary}>
        {!balloonHidden ? (
          <>
            <Button testID="move-balloon" variant="tertiary" label={t('result.moveBalloon')} onPress={nextCorner} />
            <Button testID="write-own-line" variant="tertiary" label={t('result.writeOwn')} onPress={startWriting} />
          </>
        ) : null}
        <Button
          testID="toggle-balloon"
          variant="tertiary"
          label={balloonHidden ? t('result.showBalloon') : t('result.hideBalloon')}
          onPress={() => setBalloonHidden((h) => !h)}
        />
        {item.customPhrase && !balloonHidden ? (
          <Button testID="use-ai-line" variant="tertiary" label={t('result.useAi')} onPress={useAiLine} />
        ) : null}
        {!item.freePhraseUsed && !balloonHidden ? (
          <Button
            testID="retry"
            variant="tertiary"
            label={t('result.retryFree')}
            onPress={newPhrase}
            loading={busy === 'retry'}
          />
        ) : null}
        <Button testID="new-photo" variant="tertiary" label={t('result.newPhoto')} onPress={newPhoto} />
        <Button testID="delete-image" variant="tertiary" label={t('result.deleteImage')} onPress={confirmDelete} />
      </View>
    </>
  );

  return (
    // No scroll here: a vertical drag on the balloon must move the balloon, not the page.
    <Screen scroll={false} footer={editing ? writingFooter : actionsFooter}>
      <TranslationCanvas
        ref={canvasRef}
        photoUri={item.imageUri}
        photoWidth={item.width}
        photoHeight={item.height}
        phrase={balloonHidden ? undefined : shownPhrase}
        balloonSpot={spot}
        head={item.head}
        prop={item.prop}
        onBalloonMove={placeBalloon}
        maxHeight={canvasMaxHeight}
        balloonTint={tintFor(item.id) + tintShift}
        onBalloonPress={() => setTintShift((n) => n + 1)}
      />
      <AppText variant="small" color={colors.inkMuted} align="center">
        {personality ? `${personality.name} · ` : ''}
        {balloonHidden ? t('result.hiddenHint') : t('result.dragHint')}
      </AppText>
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
