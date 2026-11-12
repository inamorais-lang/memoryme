import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AppText, colors, radius, shadow, space } from "@/design";

import { ThoughtBalloon } from "./ThoughtBalloon";

/** Real pictures made with the app (chosen by the product owner); lines in i18n `home.examples`, same order. */
const PICTURES = [
  require("../../assets/home/sleep.jpg"),
  require("../../assets/home/diva.jpg"),
  require("../../assets/home/drag.jpg"),
  require("../../assets/home/critic.jpg"),
  require("../../assets/home/snowboard.jpg"),
  require("../../assets/home/rapper.jpg"),
  require("../../assets/home/shopping.jpg"),
  require("../../assets/home/christmas.jpg"),
];
const EVERY_MS = 3000;

/** Home screen: one example picture at a time, each with its line in the person's language. */
export function HomeShowcase() {
  const { t } = useTranslation();
  const lines = t("home.examples", { returnObjects: true }) as string[];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % PICTURES.length),
      EVERY_MS,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.root} testID="home-showcase">
      <View style={styles.card}>
        <Image
          source={PICTURES[index]}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={350}
        />
        <View style={styles.balloon}>
          <ThoughtBalloon
            text={lines[index % lines.length]}
            scale={0.62}
            tint={index}
            trail={false}
          />
        </View>
        <View style={styles.watermark} pointerEvents="none">
          <AppText
            variant="small"
            color={colors.onPrimary}
            style={styles.watermarkText}
          >
            {t("result.watermark")}
          </AppText>
        </View>
      </View>
      <View style={styles.dots}>
        {PICTURES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, alignItems: "center", gap: space.sm },
  card: {
    flex: 1,
    aspectRatio: 2 / 3,
    maxWidth: "100%",
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.inkFaint,
    boxShadow: shadow.md,
    transform: [{ rotate: "-2deg" }],
  },
  balloon: {
    position: "absolute",
    top: space.sm,
    left: space.sm,
    right: space.sm,
  },
  watermark: {
    position: "absolute",
    right: space.sm,
    bottom: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
  },
  watermarkText: { fontSize: 9, lineHeight: 12 },
  dots: { flexDirection: "row", gap: space.xs },
  dot: {
    width: space.xs + space.xxs,
    height: space.xs + space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.inkFaint,
  },
  dotOn: { width: space.lg, backgroundColor: colors.primary },
});
