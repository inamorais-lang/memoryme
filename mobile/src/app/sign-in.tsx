import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { AppText, colors, layout, radius, Screen, space } from '@/design';
import { useAuth } from '@/features/auth/AuthContext';

export default function SignInScreen() {
  const { t } = useTranslation();
  const auth = useAuth();
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    try {
      if ((await auth.signInWithApple()) === 'signed_in') router.back();
    } catch {
      Alert.alert(t('signIn.error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <AppText variant="title">{t('signIn.title')}</AppText>
      <AppText color={colors.inkMuted}>{t('signIn.body')}</AppText>
      <View style={styles.button}>
        {busy ? (
          <ActivityIndicator color={colors.ink} />
        ) : auth.appleAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={radius.md}
            style={styles.apple}
            onPress={signIn}
          />
        ) : (
          <AppText variant="smallStrong" testID="apple-unavailable">
            {t('signIn.unavailable')}
          </AppText>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: { marginTop: space.lg, alignItems: 'stretch' },
  apple: { height: layout.buttonHeight, width: '100%' },
});
