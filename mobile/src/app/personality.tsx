import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, border, Button, colors, radius, Screen, shadow, space } from '@/design';
import { useAuth } from '@/features/auth/AuthContext';
import { backend, BackendError, type PersonalityInfo } from '@/features/backend';
import { useDraft } from '@/features/draft/DraftContext';
import { currentMarket } from '@/i18n';

export default function PersonalityScreen() {
  const { t } = useTranslation();
  const draft = useDraft();
  const auth = useAuth();
  const [list, setList] = useState<PersonalityInfo[] | null>(null);
  const [starting, setStarting] = useState(false);
  const waitingForSignIn = useRef(false);

  useEffect(() => {
    backend
      .listPersonalities(currentMarket())
      .then(setList)
      .catch(() => setList([]));
  }, []);

  const start = useCallback(async () => {
    if (!draft.photo || !draft.personalityId) return;
    if (backend.mode === 'remote' && !auth.session) {
      waitingForSignIn.current = true;
      router.push('/sign-in');
      return;
    }
    setStarting(true);
    try {
      const id = await backend.createTranslation(draft.photo, draft.personalityId);
      router.push({ pathname: '/result', params: { id } });
    } catch (e) {
      const code = e instanceof BackendError ? e.code : 'server_error';
      if (code === 'insufficient_credits') router.push('/no-credits');
      else if (code === 'auth_required') router.push('/sign-in');
      else if (code === 'rate_limited') Alert.alert(t('result.rateLimited'));
      else if (code === 'daily_limit') Alert.alert(t('result.dailyLimit'));
      else if (code === 'network') Alert.alert(t('result.network'));
      else Alert.alert(t('result.errorTitle'), t('result.errorBody'));
    } finally {
      setStarting(false);
      auth.refreshCredits();
    }
  }, [draft.photo, draft.personalityId, auth, t]);

  // Coming back from "Sign in with Apple": carry on with the translation.
  useEffect(() => {
    if (waitingForSignIn.current && auth.session) {
      waitingForSignIn.current = false;
      start();
    }
  }, [auth.session, start]);

  if (!draft.photo) return <Redirect href="/" />;

  function select(id: string) {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    draft.setPersonality(id);
  }

  return (
    <Screen
      footer={
        <Button
          testID="translate"
          label={draft.personalityId ? t('personality.translate') : t('personality.pickFirst')}
          disabled={!draft.personalityId}
          loading={starting}
          onPress={start}
        />
      }>
      <View style={styles.header}>
        <Image source={{ uri: draft.photo.uri }} style={styles.thumb} contentFit="cover" />
        <View style={styles.headerText}>
          <AppText variant="title">{t('personality.title')}</AppText>
          <AppText color={colors.inkMuted}>{t('personality.subtitle')}</AppText>
        </View>
      </View>

      {list === null ? <ActivityIndicator color={colors.ink} /> : null}
      {list?.length === 0 ? <AppText color={colors.inkMuted}>{t('result.network')}</AppText> : null}

      <View style={styles.grid}>
        {(list ?? []).map((p, index) => {
          const selected = draft.personalityId === p.id;
          return (
            <Pressable
              key={p.id}
              testID={`personality-${p.id}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${p.name}. ${p.tagline}`}
              onPress={() => select(p.id)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.accents[index % colors.accents.length] },
                selected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}>
              <AppText variant="heading">{p.name}</AppText>
              <AppText variant="small" color={colors.ink}>
                {p.tagline}
              </AppText>
              {selected ? (
                <View style={styles.badge}>
                  <AppText variant="smallStrong" color={colors.onPrimary}>
                    {t('personality.selected')}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    transform: [{ rotate: '-4deg' }],
    boxShadow: shadow.md,
  },
  headerText: { flex: 1, gap: space.xs },
  grid: { gap: space.md },
  card: {
    padding: space.lg,
    gap: space.xs,
    borderRadius: radius.md,
    borderWidth: border.widthBold,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: border.color,
    boxShadow: shadow.md,
    transform: [{ scale: 1.02 }],
  },
  cardPressed: { opacity: 0.85 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
