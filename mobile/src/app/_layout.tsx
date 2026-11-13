import "@/i18n";

import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/bricolage-grotesque";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors, fonts } from "@/design";
import { AuthProvider } from "@/features/auth/AuthContext";
import { DraftProvider } from "@/features/draft/DraftContext";
import { onPushTap } from "@/features/push/push";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { t } = useTranslation();
  const [loaded, error] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // Tapping "your picture is ready" opens that picture.
  useEffect(
    () => onPushTap((id) => router.push({ pathname: "/result", params: { id } })),
    [],
  );

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <DraftProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.paper },
                headerTintColor: colors.ink,
                headerTitleStyle: { fontFamily: fonts.bodyBold },
                headerBackButtonDisplayMode: "minimal",
                contentStyle: { backgroundColor: colors.paper },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen
                name="personality"
                options={{ title: t("personality.screenTitle") }}
              />
              <Stack.Screen
                name="result"
                options={{ title: t("result.screenTitle") }}
              />
              <Stack.Screen
                name="history"
                options={{ title: t("history.screenTitle") }}
              />
              <Stack.Screen
                name="settings"
                options={{ title: t("settings.screenTitle") }}
              />
              <Stack.Screen
                name="ai-consent"
                options={{
                  title: t("consent.screenTitle"),
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="sign-in"
                options={{
                  title: t("signIn.screenTitle"),
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="credits"
                options={{
                  title: t("paywall.screenTitle"),
                  presentation: "modal",
                }}
              />
            </Stack>
          </DraftProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
