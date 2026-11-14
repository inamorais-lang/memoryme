import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeShowcase } from '@/components/HomeShowcase';
import { AppText, Button, colors, layout, radius, space } from '@/design';
import { useAuth } from '@/features/auth/AuthContext';
import { backend } from '@/features/backend';
import { useDraft } from '@/features/draft/DraftContext';
import { pickPhoto, takePhoto, type PickOutcome } from '@/lib/photos';

export default function Home() {
  const { t } = useTranslation();
  const draft = useDraft();
  const auth = useAuth();
  const [historyCount, setHistoryCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      backend
        .listHistory()
        .then((items) => setHistoryCount(items.length))
        .catch(() => setHistoryCount(0));
      auth.refreshCredits();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.session]),
  );

  async function handle(outcome: PickOutcome, deniedTitle: string, deniedBody: string) {
    if (outcome.status === 'denied') {
      Alert.alert(deniedTitle, deniedBody, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.openSettings'), onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    if (outcome.status !== 'picked') return;
    draft.reset();
    draft.setPhoto(outcome.photo);
    router.push('/personality');
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.inner}>
        {auth.enabled ? (
          <View style={styles.topBar}>
            {auth.credits !== null ? (
              // Owner: tapping the balance opens the credits page (balance + packs).
              <Pressable
                style={({ pressed }) => [styles.creditPill, pressed && styles.creditPillPressed]}
                testID="credits"
                accessibilityRole="button"
                onPress={() => router.push('/credits')}>
                <AppText variant="smallStrong">{t('home.credits', { count: auth.credits })}</AppText>
              </Pressable>
            ) : (
              <View />
            )}
            <Button testID="open-settings" variant="tertiary" label={t('home.settings')} onPress={() => router.push('/settings')} />
          </View>
        ) : null}
        <View style={styles.hero}>
          <AppText variant="hero" accessibilityLabel={t('home.title')}>
            {t('home.titleStart')}
            <AppText variant="hero" style={styles.highlight}>
              {` ${t('home.titleHighlight')} `}
            </AppText>
            {t('home.titleEnd')}
          </AppText>
          <AppText color={colors.inkMuted}>{t('home.subtitle')}</AppText>
          <HomeShowcase />
        </View>

        <View style={styles.actions}>
          <Button
            testID="take-photo"
            label={t('home.takePhoto')}
            onPress={async () =>
              handle(await takePhoto(), t('permissions.cameraTitle'), t('permissions.cameraBody'))
            }
          />
          <Button
            testID="pick-photo"
            variant="secondary"
            label={t('home.pickPhoto')}
            onPress={async () =>
              handle(await pickPhoto(), t('permissions.photosTitle'), t('permissions.photosBody'))
            }
          />
          {historyCount > 0 ? (
            <Button
              testID="open-history"
              variant="tertiary"
              label={t('home.history', { count: historyCount })}
              onPress={() => router.push('/history')}
            />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.gutter,
    paddingVertical: space.xl,
    justifyContent: 'space-between',
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  creditPill: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
  },
  creditPillPressed: { backgroundColor: colors.secondaryPressed },
  hero: { flex: 1, gap: space.sm, paddingTop: space.md, paddingBottom: space.md },
  actions: { gap: space.md },
  highlight: { backgroundColor: colors.secondary },
});
