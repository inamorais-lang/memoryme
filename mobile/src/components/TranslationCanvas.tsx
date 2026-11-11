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

import { bestSpot, trailDots, type Box } from "./balloonLayout";
import { ThoughtBalloon, TRAIL_DOTS } from "./ThoughtBalloon";

export type CanvasRef = React.ComponentRef<typeof View>;

/** Top-left corner of the balloon as a fraction (0..1) of the image. */
export type BalloonSpot = { x: number; y: number };

const MARGIN = 0.03;
/** Height kept free at the bottom for the watermark (pt); the balloon never covers it. */
const WATERMARK_ROOM = 34;
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
  /** Where the user put the balloon; when missing, the corner farthest from the head. */
  balloonSpot?: BalloonSpot;
  /** Pet's head (x, y, w, h as fractions of the image), from the AI. */
  head?: [number, number, number, number];
  /** Main prop of the scene (TV remote, glass…), same format; avoided after the head. */
  prop?: [number, number, number, number];
  /** When set, the balloon can be dragged; called when the drag ends. */
  onBalloonMove?: (spot: BalloonSpot) => void;
  /** Keeps the whole image on screen; the width shrinks to respect it. */
  maxHeight?: number;
  /** Balloon colour (index into colors.balloonTints) and what tapping it does. */
  balloonTint?: number;
  onBalloonPress?: () => void;
  /** false only while waiting, when the photo shown is still the original (not made with AI). */
  watermark?: boolean;
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
  head,
  prop,
  onBalloonMove,
  maxHeight,
  balloonTint,
  onBalloonPress,
  watermark = true,
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

  // Without a head box (older translations), aim at the middle of the photo.
  const headBox: Box = head
    ? { x: head[0] * frame.w, y: head[1] * frame.h, w: head[2] * frame.w, h: head[3] * frame.h }
    : { x: 0.4 * frame.w, y: 0.45 * frame.h, w: 0.2 * frame.w, h: 0.2 * frame.h };
  const propBox: Box | undefined = prop
    ? { x: prop[0] * frame.w, y: prop[1] * frame.h, w: prop[2] * frame.w, h: prop[3] * frame.h }
    : undefined;
  const base = balloonSpot ?? autoSpot(headBox, propBox, frame, bubble);
  const spot = fit(drag ?? base, frame, bubble);

  // Native gestures: a drag moves the balloon, a tap changes its colour.
  // (Gesture handler wins over the page scroll on iOS.)
  const start = fit(base, frame, bubble);
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

  // Dots point from the bubble towards the head and stop before it.
  const dots = phrase
    ? trailDots(
        { x: spot.x * frame.w, y: spot.y * frame.h, w: bubble.w, h: bubble.h },
        headBox,
        TRAIL_DOTS,
        balloonScale,
      )
    : [];
  const tintColor = colors.balloonTints[(balloonTint ?? 0) % colors.balloonTints.length];

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
      {dots.map((d, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[
            styles.dot,
            {
              left: d.cx - d.size / 2,
              top: d.cy - d.size / 2,
              width: d.size,
              height: d.size,
              borderRadius: d.size / 2,
              backgroundColor: tintColor,
            },
          ]}
        />
      ))}
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
              trail={false}
              scale={balloonScale}
              tint={balloonTint}
            />
          </View>
        </GestureDetector>
      ) : null}
      {/* Always on the exported image: marks it as AI-generated (EU AI Act) and credits the app. */}
      {watermark ? (
        <View style={styles.watermark} pointerEvents="none" testID="watermark">
          <AppText variant="small" color={colors.onPrimary} style={styles.watermarkText}>
            {t("result.watermark")}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

/** The corner whose balloon covers the least of the head (top-left on a tie). */
function autoSpot(head: Box, prop: Box | undefined, frame: Size, bubble: Size): BalloonSpot {
  const spots = BALLOON_CORNERS.map((c) => fit(c, frame, bubble));
  const boxes = spots.map((s) => ({ x: s.x * frame.w, y: s.y * frame.h, w: bubble.w, h: bubble.h }));
  return spots[bestSpot(boxes, head, prop)];
}

/** Keeps the balloon fully inside the photo, with a small margin. */
function fit(spot: BalloonSpot, frame: Size, bubble: Size): BalloonSpot {
  const maxX = Math.max(MARGIN, 1 - bubble.w / frame.w - MARGIN);
  const maxY = Math.max(MARGIN, 1 - (bubble.h + WATERMARK_ROOM) / frame.h);
  return { x: clamp(spot.x, MARGIN, maxX), y: clamp(spot.y, MARGIN, maxY) };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  dot: { position: "absolute", boxShadow: shadow.balloon },
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
