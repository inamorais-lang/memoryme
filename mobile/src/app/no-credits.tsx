import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, colors, Screen } from '@/design';

/** Shown when a translation needs a credit and there is none. The paywall replaces it in Phase 3. */
export default function NoCreditsScreen() {
  const { t } = useTranslation();
  return (
    <Screen footer={<Button label={t('noCredits.back')} onPress={() => router.back()} />}>
      <AppText variant="title" testID="no-credits-title">
        {t('noCredits.title')}
      </AppText>
      <AppText color={colors.inkMuted}>{t('noCredits.body')}</AppText>
    </Screen>
  );
}
