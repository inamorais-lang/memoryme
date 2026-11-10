import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, border, Button, colors, radius, Screen, shadow, space } from '@/design';
import { backend, type TranslationView } from '@/features/backend';
import { findPersonality } from '@/features/personalities/data';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<TranslationView[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      backend
        .listHistory()
        .then(setItems)
        .catch(() => setItems([]));
    }, []),
  );

  if (items === null) return <Screen>{null}</Screen>;

  if (items.length === 0) {
    return (
      <Screen footer={<Button label={t('history.emptyAction')} onPress={() => router.dismissAll()} />}>
        <AppText variant="title">{t('history.emptyTitle')}</AppText>
        <AppText color={colors.inkMuted}>{t('history.emptyBody')}</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.grid}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            testID={`history-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={item.phrase ?? ''}
            onPress={() => router.push({ pathname: '/result', params: { id: item.id } })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <Image source={{ uri: item.imageUri }} style={styles.photo} contentFit="cover" />
            <View style={styles.caption}>
              <AppText variant="smallStrong" numberOfLines={3}>
                {item.phrase}
              </AppText>
              <AppText variant="small" color={colors.inkMuted}>
                {findPersonality(item.personalityId)?.name}
              </AppText>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  card: {
    width: '47.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: border.width,
    borderColor: border.color,
    boxShadow: shadow.sm,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  photo: { width: '100%', aspectRatio: 1, borderBottomWidth: border.width, borderColor: border.color },
  caption: { padding: space.md, gap: space.xs },
});
