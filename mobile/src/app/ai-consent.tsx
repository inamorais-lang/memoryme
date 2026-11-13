import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { legalUrl } from '@/config';
import { AppText, Button, colors, Screen, space } from '@/design';
import { setAiConsent } from '@/features/consent/aiConsent';
import { currentLanguage } from '@/i18n';

/** Asked once, before the first picture: the photo goes to third-party AI services. */
export default function AiConsentScreen() {
  const { t } = useTranslation();

  async function accept() {
    await setAiConsent(true);
    router.back();
  }

  return (
    <Screen
      footer={
        <>
          <Button testID="consent-accept" label={t('consent.accept')} onPress={accept} />
          <View style={styles.row}>
            <Button
              testID="consent-policy"
              variant="tertiary"
              label={t('legal.privacy')}
              onPress={() => WebBrowser.openBrowserAsync(legalUrl('privacy', currentLanguage()))}
            />
            <Button testID="consent-cancel" variant="tertiary" label={t('consent.notNow')} onPress={() => router.back()} />
          </View>
        </>
      }>
      <AppText variant="title">{t('consent.title')}</AppText>
      <AppText>{t('consent.body')}</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
});
