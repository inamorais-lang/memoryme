import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, border, Button, colors, radius, Screen, shadow, space } from '@/design';
import { useDraft } from '@/features/draft/DraftContext';
import { personalitiesFor } from '@/features/personalities/data';
import { currentLanguage } from '@/i18n';

export default function PersonalityScreen() {
  const { t } = useTranslation();
  const draft = useDraft();
  const list = personalitiesFor(currentLanguage());

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
          onPress={() => router.push('/result')}
        />
      }>
      <View style={styles.header}>
        <Image source={{ uri: draft.photo.uri }} style={styles.thumb} contentFit="cover" />
        <View style={styles.headerText}>
          <AppText variant="title">{t('personality.title')}</AppText>
          <AppText color={colors.inkMuted}>{t('personality.subtitle')}</AppText>
        </View>
      </View>

      <View style={styles.grid}>
        {list.map((p, index) => {
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
    borderWidth: border.width,
    borderColor: border.color,
    transform: [{ rotate: '-3deg' }],
  },
  headerText: { flex: 1, gap: space.xs },
  grid: { gap: space.md },
  card: {
    padding: space.lg,
    gap: space.xs,
    borderRadius: radius.md,
    borderWidth: border.width,
    borderColor: border.color,
    boxShadow: shadow.sm,
  },
  cardSelected: {
    borderWidth: border.widthBold,
    boxShadow: shadow.md,
    transform: [{ translateX: -2 }, { translateY: -2 }],
  },
  cardPressed: { opacity: 0.85 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
});
