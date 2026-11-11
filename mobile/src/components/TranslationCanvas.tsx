import { Image } from "expo-image";
import { useState, type Ref } from "react";
import { StyleSheet, View } from "react-native";
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  useTapGesture,
} from "react-native-gesture-handler";

import { useTranslation } from "react-i18next";

import { AppText, colors, radius, shadow, space } from "@/design";

import { ThoughtBalloon } from "./ThoughtBalloon";

export type CanvasRef = React.ComponentRef<typeof View>;

/** Top-left corner of the balloon as a fraction (0..1) of the image. */
export type BalloonSpot = { x: number; y: number };

const MARGIN = 0.03;
/** The four corners "Mover balão" cycles through (clamped to fit). */
export const BALLOON_CORNERS: BalloonSpot[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

type Props = {
  ref?: Ref<CanvasRef>;
  photoUri: string;
  /** Unknown for remote images until they load. */
  photoWidth?: number;
  photoHeight?: number;
  phrase?: string;
  balloonSpot: BalloonSpot;
  /** When set, the balloon can be dragged; called when the drag ends. */
  onBalloonMove?: (spot: BalloonSpot) => void;
  /** Keeps the whole image on screen; the width shrinks to respect it. */
  maxHeight?: number;
  /** Balloon colour (index into colors.balloonTints) and what tapping it does. */
  balloonTint?: number;
  onBalloonPress?: () => void;
};

type Size = { w: number; h: number };

/** Photo + balloon. This exact view is captured as the image people share. */
export function TranslationCanvas({
  ref,
  photoUri,
  photoWidth,
  photoHeight,
  phrase,
  balloonSpot,
  onBalloonMove,
  maxHeight,
  balloonTint,
  onBalloonPress,
}: Props) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const aspectRatio = clamp(
    (photoWidth ?? loaded?.width ?? 4) / (photoHeight ?? loaded?.height ?? 5),
    0.56,
    1.5,
  );
  const sizing = maxHeight
    ? { maxWidth: maxHeight * aspectRatio, alignSelf: "center" as const }
    : null;

  const [frame, setFrame] = useState<Size>({ w: 360, h: 450 });
  const [bubble, setBubble] = useState<Size>({ w: 250, h: 120 });
  const [drag, setDrag] = useState<BalloonSpot | null>(null);

  // The balloon is designed for a ~360pt-wide photo and scales with it.
  const balloonScale = Math.min(1, Math.max(0.6, frame.w / 360));
  const spot = fit(drag ?? balloonSpot, frame, bubble);

  // Native gestures: a drag moves the balloon, a tap changes its colour.
  // (Gesture handler wins over the page scroll on iOS.)
  const start = fit(balloonSpot, frame, bubble);
  const moved = (dx: number, dy: number) => ({
    x: start.x + dx / frame.w,
    y: start.y + dy / frame.h,
  });
  const pan = usePanGesture({
    enabled: !!onBalloonMove,
    minDistance: 4,
    runOnJS: true,
    onUpdate: (e) => setDrag(moved(e.translationX, e.translationY)),
    onDeactivate: (e) => {
      if (!e.canceled)
        onBalloonMove?.(
          fit(moved(e.translationX, e.translationY), frame, bubble),
        );
    },
    onFinalize: () => setDrag(null),
  });
  const tap = useTapGesture({
    enabled: !!onBalloonPress,
    runOnJS: true,
    onDeactivate: (e) => {
      if (!e.canceled) onBalloonPress?.();
    },
  });
  const gesture = useExclusiveGestures(pan, tap);

  // Trail points from the bubble towards the middle of the photo (the pet).
  const centreX = spot.x + bubble.w / frame.w / 2;
  const centreY = spot.y + bubble.h / frame.h / 2;

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.frame, { aspectRatio }, sizing]}
      testID="translation-canvas"
      onLayout={(e) =>
        setFrame({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
    >
      <Image
        source={{ uri: photoUri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        onLoad={(e) =>
          setLoaded({ width: e.source.width, height: e.source.height })
        }
      />
      {/* Always on the exported image: marks it as AI-generated (EU AI Act) and credits the app. */}
      <View style={styles.watermark} pointerEvents="none" testID="watermark">
        <AppText variant="small" color={colors.onPrimary} style={styles.watermarkText}>
          {t("result.watermark")}
        </AppText>
      </View>
      {phrase ? (
        <GestureDetector gesture={gesture}>
          <View
            style={[
              styles.balloon,
              { left: spot.x * frame.w, top: spot.y * frame.h },
            ]}
            onLayout={(e) =>
              setBubble({
                w: e.nativeEvent.layout.width,
                h: e.nativeEvent.layout.height,
              })
            }
          >
            <ThoughtBalloon
              text={phrase}
              tail={centreY < 0.5 ? "down" : "up"}
              trailSide={centreX < 0.5 ? "right" : "left"}
              scale={balloonScale}
              tint={balloonTint}
            />
          </View>
        </GestureDetector>
      ) : null}
    </View>
  );
}

/** Keeps the balloon fully inside the photo, with a small margin. */
function fit(spot: BalloonSpot, frame: Size, bubble: Size): BalloonSpot {
  const maxX = Math.max(MARGIN, 1 - bubble.w / frame.w - MARGIN);
  const maxY = Math.max(MARGIN, 1 - bubble.h / frame.h - MARGIN);
  return { x: clamp(spot.x, MARGIN, maxX), y: clamp(spot.y, MARGIN, maxY) };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  watermark: {
    position: "absolute",
    right: space.sm,
    bottom: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
  },
  watermarkText: { fontSize: 10, lineHeight: 14 },
  frame: {
    width: "100%",
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: colors.inkFaint,
    boxShadow: shadow.md,
  },
  // Narrow enough to leave the pet's face visible.
  // touchAction stops the mobile browser from scrolling while dragging (web only).
  balloon: { position: "absolute", width: "68%", touchAction: "none" },
});
