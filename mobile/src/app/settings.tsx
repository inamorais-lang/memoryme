import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText, border, Button, colors, radius, Screen, space } from '@/design';
import { useAuth } from '@/features/auth/AuthContext';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const auth = useAuth();
  const [deleting, setDeleting] = useState(false);

  function confirmDelete() {
    Alert.alert(t('settings.deleteTitle'), t('settings.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.deleteConfirm'), style: 'destructive', onPress: deleteAccount },
    ]);
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await auth.deleteAccount();
      Alert.alert(t('settings.deleted'));
      router.dismissAll();
    } catch {
      Alert.alert(t('settings.deleteError'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.card}>
        <AppText variant="smallStrong" color={colors.inkMuted}>
          {t('settings.credits')}
        </AppText>
        <AppText variant="title">{auth.credits ?? 0}</AppText>
      </View>

      <View style={styles.card}>
        <AppText variant="smallStrong" color={colors.inkMuted}>
          {t('settings.account')}
        </AppText>
        <AppText>{auth.session ? t('settings.signedIn') : t('settings.signedOut')}</AppText>
        {auth.session ? (
          <>
            <Button testID="sign-out" variant="secondary" label={t('settings.signOut')} onPress={auth.signOut} />
            <Button
              testID="delete-account"
              variant="ghost"
              label={t('settings.deleteAccount')}
              onPress={confirmDelete}
              loading={deleting}
            />
          </>
        ) : (
          <Button testID="sign-in" variant="secondary" label={t('settings.signIn')} onPress={() => router.push('/sign-in')} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.sm,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: border.width,
    borderColor: border.color,
  },
});
