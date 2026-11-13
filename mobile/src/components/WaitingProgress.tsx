import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { AppText, Button, colors, radius, shadow, space } from "@/design";
import { declinePushOffer, enablePush, shouldOfferPush } from "@/features/push/push";

export type WaitStage = "checking" | "painting" | "writing";

const ORDER: WaitStage[] = ["checking", "painting", "writing"];
// Where the bar starts and how far it may go while each step runs (fractions of the bar).
const RANGE: Record<WaitStage, [number, number, number]> = {
  // [start, end, seconds to get most of the way]
  checking: [0.04, 0.15, 6],
  painting: [0.15, 0.82, 40],
  writing: [0.82, 0.96, 12],
};
const ICONS: Record<WaitStage, string> = {
  checking: "🔍",
  painting: "🎨",
  writing: "💭",
};
const JOKE_MS = 4500;

/**
 * Waiting screen: the real steps of the server (with ✓ when done), a progress bar
 * and funny lines that change every few seconds. The bar never reaches the end
 * before the picture is ready.
 */
export function WaitingProgress({ stage = "checking" }: { stage?: WaitStage }) {
  const { t } = useTranslation();
  const [progress] = useState(() => new Animated.Value(RANGE.checking[0]));
  const [joke, setJoke] = useState(0);
  const current = ORDER.indexOf(stage);

  // Owner-approved: the only place the app offers notifications, once, before Apple's prompt.
  const [offer, setOffer] = useState(false);
  useEffect(() => {
    shouldOfferPush().then(setOffer);
  }, []);

  // Each step eases the bar towards its end; a new step starts from its own start.
  useEffect(() => {
    const [start, end, seconds] = RANGE[stage];
    progress.stopAnimation((value) => {
      progress.setValue(Math.max(value, start));
      Animated.timing(progress, {
        toValue: end,
        duration: seconds * 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
  }, [stage, progress]);

  useEffect(() => {
    const timer = setInterval(() => setJoke((n) => n + 1), JOKE_MS);
    return () => clearInterval(timer);
  }, []);

  const jokes = t(`result.wait.jokes.${stage}`, {
    returnObjects: true,
  }) as string[];
  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.root} testID="result-loading">
      <View style={styles.bar}>
        <Animated.View style={[styles.fill, { width }]} />
      </View>
      <View style={styles.steps}>
        {ORDER.map((step, index) => {
          const done = index < current;
          const now = index === current;
          return (
            <View key={step} style={styles.step} testID={`wait-${step}`}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  now && styles.dotNow,
                ]}
              >
                <AppText variant="smallStrong" color={colors.ink}>
                  {done ? "✓" : ICONS[step]}
                </AppText>
              </View>
              <AppText
                variant="bodyStrong"
                color={done || now ? colors.ink : colors.inkMuted}
              >
                {t(`result.wait.${done ? "done" : "steps"}.${step}`)}
              </AppText>
            </View>
          );
        })}
      </View>
      <AppText variant="heading" align="center" style={styles.joke}>
        {`“${jokes[joke % jokes.length]}”`}
      </AppText>
      <AppText variant="small" color={colors.inkMuted} align="center">
        {t("result.wait.hint")}
      </AppText>
      {offer ? (
        <View style={styles.offer} testID="push-offer">
          <AppText variant="bodyStrong" align="center">
            {t("result.wait.pushOffer")}
          </AppText>
          <View style={styles.offerButtons}>
            <View style={styles.flex}>
              <Button
                variant="secondary"
                label={t("result.wait.pushYes")}
                onPress={() => {
                  setOffer(false);
                  enablePush();
                }}
              />
            </View>
            <View style={styles.flex}>
              <Button
                variant="tertiary"
                label={t("result.wait.pushNo")}
                onPress={() => {
                  setOffer(false);
                  declinePushOffer();
                }}
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const DOT = space.xl + space.xxs;

const styles = StyleSheet.create({
  root: { gap: space.lg, paddingTop: space.lg },
  offer: {
    gap: space.md,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    boxShadow: shadow.sm,
  },
  offerButtons: { flexDirection: "row", gap: space.sm },
  flex: { flex: 1 },
  bar: {
    height: space.md,
    borderRadius: radius.pill,
    backgroundColor: colors.tertiary,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  steps: { gap: space.sm },
  step: { flexDirection: "row", alignItems: "center", gap: space.md },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inkFaint,
  },
  dotDone: { backgroundColor: colors.secondary },
  dotNow: { backgroundColor: colors.balloonTints[0] },
  joke: { minHeight: space.xxxl },
});
