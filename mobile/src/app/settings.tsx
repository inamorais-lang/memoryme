import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, StyleSheet, View } from "react-native";

import {
  AppText,
  Button,
  colors,
  radius,
  Screen,
  shadow,
  space,
} from "@/design";
import { LegalLinks } from "@/components/LegalLinks";
import { useAuth } from "@/features/auth/AuthContext";
import { hasAiConsent, setAiConsent } from "@/features/consent/aiConsent";
import { creditStore } from "@/features/store/creditStore";
import { pushStatus, pushSupported, setPushOn } from "@/features/push/push";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const auth = useAuth();
  const [deleting, setDeleting] = useState(false);

  const { refreshCredits } = auth;
  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  const [aiConsent, setAiConsentState] = useState(false);
  useEffect(() => {
    hasAiConsent().then(setAiConsentState);
  }, []);

  const [push, setPush] = useState<"on" | "off" | "blocked">("off");
  useEffect(() => {
    pushStatus().then(setPush);
  }, []);

  async function togglePush() {
    if (push === "blocked") {
      Linking.openSettings();
      return;
    }
    setPush(await setPushOn(push !== "on"));
  }

  async function withdraw() {
    await setAiConsent(false);
    setAiConsentState(false);
    Alert.alert(t("consent.withdrawn"));
  }

  // A voucher (Apple offer code) needs an account to receive the credits.
  async function redeemCode() {
    if (!auth.session) {
      router.push("/sign-in");
      return;
    }
    try {
      await creditStore.redeemCode();
    } catch {
      Alert.alert(t("paywall.unavailable"));
    }
  }

  function confirmDelete() {
    Alert.alert(t("settings.deleteTitle"), t("settings.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.deleteConfirm"),
        style: "destructive",
        onPress: deleteAccount,
      },
    ]);
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await auth.deleteAccount();
      Alert.alert(t("settings.deleted"));
      router.dismissAll();
    } catch {
      Alert.alert(t("settings.deleteError"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.card}>
        <AppText variant="smallStrong" color={colors.inkMuted}>
          {t("settings.credits")}
        </AppText>
        <AppText variant="title">{auth.credits ?? 0}</AppText>
        <Button
          testID="buy-credits"
          label={t("settings.buyCredits")}
          onPress={() => router.push("/credits")}
        />
        {creditStore.available ? (
          <Button
            testID="redeem-code"
            variant="secondary"
            label={t("settings.redeemCode")}
            onPress={redeemCode}
          />
        ) : null}
      </View>

      <View style={styles.card}>
        <AppText variant="smallStrong" color={colors.inkMuted}>
          {t("settings.account")}
        </AppText>
        <AppText>
          {auth.session ? t("settings.signedIn") : t("settings.signedOut")}
        </AppText>
        {auth.accountCode ? (
          <View style={styles.accountCode}>
            <AppText variant="small" color={colors.inkMuted}>
              {t("settings.accountCode")}
            </AppText>
            <AppText variant="heading" selectable testID="account-code">
              {auth.accountCode}
            </AppText>
          </View>
        ) : null}
        {auth.session ? (
          <>
            <Button
              testID="sign-out"
              variant="secondary"
              label={t("settings.signOut")}
              onPress={auth.signOut}
            />
            <Button
              testID="delete-account"
              variant="tertiary"
              label={t("settings.deleteAccount")}
              onPress={confirmDelete}
              loading={deleting}
            />
          </>
        ) : (
          <Button
            testID="sign-in"
            variant="secondary"
            label={t("settings.signIn")}
            onPress={() => router.push("/sign-in")}
          />
        )}
      </View>

      {pushSupported && auth.session ? (
        <View style={styles.card}>
          <AppText variant="smallStrong" color={colors.inkMuted}>
            {t("settings.push.title")}
          </AppText>
          <AppText variant="small" color={colors.inkMuted}>
            {t(`settings.push.${push}`)}
          </AppText>
          <Button
            testID="push-toggle"
            variant="tertiary"
            label={t(push === "on" ? "settings.push.turnOff" : push === "off" ? "settings.push.turnOn" : "settings.push.openSettings")}
            onPress={togglePush}
          />
        </View>
      ) : null}

      <View style={styles.card}>
        <AppText variant="smallStrong" color={colors.inkMuted}>
          {t("legal.title")}
        </AppText>
        <AppText variant="small" color={colors.inkMuted}>
          {t("legal.owner")}
        </AppText>
        <LegalLinks />
        {aiConsent ? (
          <Button
            testID="withdraw-consent"
            variant="tertiary"
            label={t("consent.withdraw")}
            onPress={withdraw}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  accountCode: { gap: space.xxs },
  card: {
    gap: space.sm,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    boxShadow: shadow.sm,
  },
});
