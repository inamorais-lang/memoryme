import * as Haptics from "expo-haptics";
import { haptics } from "@/lib/haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { TranslationCanvas } from "@/components/TranslationCanvas";
import {
  AppText,
  border,
  Button,
  colors,
  radius,
  Screen,
  shadow,
  space,
} from "@/design";
import { useAuth } from "@/features/auth/AuthContext";
import { backend, BackendError } from "@/features/backend";
import { creditStore } from "@/features/store/creditStore";
import type { StorePack } from "@/features/store/types";

/** Pack shown as "Most popular" (decision of the product owner). */
const POPULAR_CREDITS = 10;

/** Pictures made with the owner's dog: the paywall shows what a credit buys. */
const EXAMPLES = [
  {
    key: "diva",
    source: require("../../assets/examples/diva.jpg"),
    head: [0.26, 0.19, 0.52, 0.29],
  },
  {
    key: "esfomeado",
    source: require("../../assets/examples/esfomeado.jpg"),
    head: [0.3, 0.21, 0.45, 0.32],
  },
  {
    key: "caotico",
    source: require("../../assets/examples/caotico.jpg"),
    head: [0.26, 0.06, 0.49, 0.47],
  },
] as const;
const EXAMPLE_PHOTO = { width: 640, height: 861 };
// Drawn at full size and scaled down, so the balloon keeps its real proportions.
const EXAMPLE_FULL = 340;
const EXAMPLE_SCALE = 0.48;

/** Packs from our server with their App Store prices; error when the store did not answer. */
async function fetchPacks(): Promise<{
  packs: StorePack[] | null;
  error: boolean;
}> {
  try {
    const list = await backend.listPacks();
    const prices = creditStore.available
      ? await creditStore.prices(list.map((p) => p.productId))
      : {};
    const packs = list.map((p) => ({ ...p, price: prices[p.productId] }));
    return { packs, error: packs.length === 0 || packs.some((p) => !p.price) };
  } catch {
    return { packs: null, error: true };
  }
}

/** Paywall: the 4 credit packs, bought through the App Store and checked by our server. */
export default function CreditsScreen() {
  const { t } = useTranslation();
  const auth = useAuth();
  const [packs, setPacks] = useState<StorePack[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [storeError, setStoreError] = useState(false);
  const [buying, setBuying] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const apply = useCallback(
    (result: { packs: StorePack[] | null; error: boolean }) => {
      setPacks((current) => result.packs ?? current ?? []);
      setStoreError(result.error);
      if (!result.packs) return;
      const list = result.packs;
      setSelected(
        (current) =>
          current ??
          (list.find((p) => p.credits === POPULAR_CREDITS) ?? list[0])
            ?.productId ??
          null,
      );
    },
    [],
  );

  useEffect(() => {
    fetchPacks().then(apply);
  }, [apply]);

  // The balance may have changed elsewhere (gift from the owner, another device).
  const { refreshCredits } = auth;
  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  const pack = packs?.find((p) => p.productId === selected);
  const verify = (signed: string) => backend.verifyPurchase(signed);

  async function buy() {
    if (!pack) return;
    if (!auth.session) {
      router.push("/sign-in");
      return;
    }
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setBuying(true);
    try {
      const outcome = await creditStore.buy(
        pack.productId,
        auth.session.user.id,
        verify,
      );
      if (outcome.status === "purchased") {
        await auth.refreshCredits();
        haptics.success();
        Alert.alert(t("paywall.success", { count: outcome.creditsAdded }));
        router.back();
      } else if (outcome.status === "pending") {
        Alert.alert(t("paywall.pending"));
      }
    } catch (e) {
      // Paid but our server could not confirm it: the transaction stays open and is
      // handed over again on the next launch (or "Restore purchases").
      haptics.error();
      Alert.alert(
        t(
          e instanceof BackendError ? "paywall.notConfirmed" : "paywall.failed",
        ),
      );
    } finally {
      setBuying(false);
    }
  }

  async function restore() {
    if (!auth.session) {
      router.push("/sign-in");
      return;
    }
    setRestoring(true);
    try {
      const added = await creditStore.restore(verify);
      await auth.refreshCredits();
      Alert.alert(
        added > 0
          ? t("paywall.restored", { count: added })
          : t("paywall.restoredNone"),
      );
    } catch {
      Alert.alert(t("paywall.unavailable"));
    } finally {
      setRestoring(false);
    }
  }

  const buyLabel = !auth.session
    ? t("paywall.signInToBuy")
    : pack?.price
      ? t("paywall.buy", { price: pack.price })
      : t("paywall.buyNoPrice");

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            testID="buy"
            label={buyLabel}
            disabled={!pack || (!!auth.session && !pack.price)}
            loading={buying}
            onPress={buy}
          />
          <Button
            testID="restore"
            variant="tertiary"
            label={t("paywall.restore")}
            loading={restoring}
            disabled={!creditStore.available}
            onPress={restore}
          />
        </View>
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.examples}
        style={styles.examplesRow}
      >
        {EXAMPLES.map((ex) => {
          return (
            <View key={ex.key} style={styles.example} pointerEvents="none">
              <View style={styles.exampleInner}>
                <TranslationCanvas
                  photoUri=""
                photoSource={ex.source}
                  photoWidth={EXAMPLE_PHOTO.width}
                  photoHeight={EXAMPLE_PHOTO.height}
                  phrase={t(`paywall.examples.${ex.key}`)}
                  head={[...ex.head]}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.headerText}>
        <AppText variant="title" testID="paywall-title">
          {t("paywall.title")}
        </AppText>
        <View style={styles.steps}>
          {(["step1", "step2", "step3"] as const).map((key, i) => (
            <View key={key} style={styles.step}>
              <View style={styles.stepNumber}>
                <AppText variant="smallStrong" color={colors.onPrimary}>
                  {i + 1}
                </AppText>
              </View>
              <AppText style={styles.stepText}>{t(`paywall.${key}`)}</AppText>
            </View>
          ))}
        </View>
        {auth.session && auth.credits !== null ? (
          <AppText variant="smallStrong" testID="balance">
            {t("paywall.balance", { count: auth.credits })}
          </AppText>
        ) : null}
      </View>

      {packs === null ? <ActivityIndicator color={colors.ink} /> : null}

      <View style={styles.packs}>
        {(packs ?? []).map((p, index) => {
          const isSelected = p.productId === selected;
          const popular = p.credits === POPULAR_CREDITS;
          return (
            <Pressable
              key={p.productId}
              testID={`pack-${p.credits}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setSelected(p.productId);
              }}
              style={({ pressed }) => [
                styles.pack,
                {
                  backgroundColor:
                    colors.accents[index % colors.accents.length],
                },
                isSelected && styles.packSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.packText}>
                {popular ? (
                  <View style={styles.badge}>
                    <AppText variant="smallStrong" color={colors.onPrimary}>
                      {t("paywall.popular")}
                    </AppText>
                  </View>
                ) : null}
                <AppText variant="heading">
                  {t("paywall.packCredits", { count: p.credits })}
                </AppText>
                <AppText variant="small" color={colors.ink}>
                  {t("paywall.packWhat", { count: p.credits })}
                </AppText>
              </View>
              {p.price ? <AppText variant="heading">{p.price}</AppText> : null}
            </Pressable>
          );
        })}
      </View>

      {storeError ? (
        <View style={styles.error}>
          <AppText color={colors.inkMuted}>{t("paywall.unavailable")}</AppText>
          <Button
            variant="secondary"
            label={t("paywall.retry")}
            onPress={() => {
              setStoreError(false);
              fetchPacks().then(apply);
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { gap: space.sm },
  examplesRow: { marginHorizontal: -space.lg },
  examples: {
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  example: {
    width: EXAMPLE_FULL * EXAMPLE_SCALE,
    height:
      ((EXAMPLE_FULL * EXAMPLE_PHOTO.height) / EXAMPLE_PHOTO.width) *
      EXAMPLE_SCALE,
  },
  exampleInner: {
    width: EXAMPLE_FULL,
    transformOrigin: "top left",
    transform: [{ scale: EXAMPLE_SCALE }],
  },
  headerText: { gap: space.sm },
  steps: { gap: space.sm, marginTop: space.xs },
  step: { flexDirection: "row", alignItems: "center", gap: space.sm },
  stepNumber: {
    width: space.xl,
    height: space.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { flex: 1 },
  packs: { gap: space.md },
  pack: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: border.widthBold,
    borderColor: "transparent",
  },
  packSelected: {
    borderColor: border.color,
    boxShadow: shadow.md,
  },
  packText: { gap: space.xs, flexShrink: 1 },
  pressed: { opacity: 0.85 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  error: { gap: space.sm },
});
