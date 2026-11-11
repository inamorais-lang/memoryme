import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { legalUrl } from '@/config';
import { Button, space } from '@/design';
import { currentLanguage } from '@/i18n';

/** "Termos e condições" and "Política de privacidade", opened inside the app. */
export function LegalLinks() {
  const { t } = useTranslation();
  const open = (page: 'terms' | 'privacy') => WebBrowser.openBrowserAsync(legalUrl(page, currentLanguage()));
  return (
    <View style={styles.row}>
      <Button testID="open-terms" variant="tertiary" label={t('legal.terms')} onPress={() => open('terms')} />
      <Button testID="open-privacy" variant="tertiary" label={t('legal.privacy')} onPress={() => open('privacy')} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
});
