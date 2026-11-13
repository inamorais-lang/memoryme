import { Image } from "expo-image";
import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { Animated, StyleSheet, View } from "react-native";
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  useTapGesture,
} from "react-native-gesture-handler";

import { useTranslation } from "react-i18next";

import { AppText, colors, layout, radius, shadow, space } from "@/design";

import { bestSpot, trailDots, type Box } from "./balloonLayout";
import { ThoughtBalloon, TRAIL_DOTS } from "./ThoughtBalloon";
import { haptics } from "@/lib/haptics";

export type CanvasRef = React.ComponentRef<typeof View>;

/** Top-left corner of the balloon as a fraction (0..1) of the image. */
export type BalloonSpot = { x: number; y: number };

const MARGIN = 0.03;
/** Height kept free at the bottom for the watermark (pt); the balloon never covers it. */
const WATERMARK_ROOM = 34;
/** The four corners "Mover balão" cycles through (clamped to fit). */
/** Balloon size relative to the original design (1 = the first, bigger version). */
const BALLOON_SIZE = 0.8;

export const BALLOON_CORNERS: BalloonSpot[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

type Props = {
  ref?: Ref<CanvasRef>;
  photoUri: string;
  /** Bundled image (e.g. paywall examples); used instead of photoUri when set. */
  photoSource?: number;
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
  /** The pet's whole body, same format; avoided after the head, before the prop. */
  body?: [number, number, number, number];
  /** When set, the balloon can be dragged; called when the drag ends. */
  onBalloonMove?: (spot: BalloonSpot) => void;
  /** Keeps the whole image on screen; the width shrinks to respect it. */
  maxHeight?: number;
  /** Balloon colour (index into colors.balloonTints) and what tapping it does. */
  balloonTint?: number;
  onBalloonPress?: () => void;
  /** false only while waiting, when the photo shown is still the original (not made with AI). */
  watermark?: boolean;
  /** Shown under the picture, on its right edge; never part of the exported image. */
  below?: ReactNode;
};

type Size = { w: number; h: number };

/** Photo + balloon. This exact view is captured as the image people share. */
export function TranslationCanvas({
  ref,
  photoUri,
  photoSource,
  photoWidth,
  photoHeight,
  phrase,
  balloonSpot,
  head,
  prop,
  body,
  onBalloonMove,
  maxHeight,
  below,
  balloonTint,
  onBalloonPress,
  watermark = true,
}: Props) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState<{
    width: number;
    height: number;
  } | null>(null);
  // Every picture is 4:5 (Instagram feed, whole in a WhatsApp chat). The photo is trimmed
  // to that shape around the pet's head, never across it.
  const aspectRatio = SHARE_ASPECT;
  const imageAspect =
    (photoWidth ?? loaded?.width ?? 4) / (photoHeight ?? loaded?.height ?? 5);
  const crop = cropWindow(imageAspect, head);
  // Exact width and height: on iOS, aspectRatio + maxWidth lets a tall photo
  // grow past maxHeight (under the buttons, hiding a balloon placed low).
  const [available, setAvailable] = useState(0);
  const width = Math.min(
    available,
    maxHeight ? (maxHeight - (below ? BELOW_ROOM : 0)) * aspectRatio : Infinity,
  );
  const sizing =
    width > 0
      ? { width, height: width / aspectRatio }
      : { width: "100%" as const, aspectRatio };

  const [frame, setFrame] = useState<Size>({ w: 360, h: 450 });
  const [bubble, setBubble] = useState<Size>({ w: 250, h: 120 });
  const [drag, setDrag] = useState<BalloonSpot | null>(null);

  // Owner-approved motion: the new picture fades in with a slight zoom (the "wow" moment),
  // and the balloon pops in, its dots appearing one by one. Both settle before any export.
  const [reveal] = useState(() => new Animated.Value(1));
  const [pop] = useState(() => new Animated.Value(1));
  const shownUri = useRef<string | null>(null);
  const revealPicture = () => {
    if (shownUri.current === photoUri) return;
    shownUri.current = photoUri;
    reveal.setValue(0);
    Animated.timing(reveal, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  };
  useEffect(() => {
    if (!phrase) return;
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 9 }).start();
  }, [phrase, pop]);

  // The balloon is designed for a ~360pt-wide photo and scales with it.
  // Same proportions at any size: the shared picture looks like the one on screen.
  // Owner: a bit smaller than full size (between the result and the home carousel).
  const balloonScale = BALLOON_SIZE * Math.min(1, Math.max(0.4, frame.w / 360));

  // Without a head box (older translations), aim at the middle of the photo.
  const headBox: Box = head
    ? {
        x: ((head[0] - crop.x) / crop.w) * frame.w,
        y: ((head[1] - crop.y) / crop.h) * frame.h,
        w: (head[2] / crop.w) * frame.w,
        h: (head[3] / crop.h) * frame.h,
      }
    : {
        x: 0.4 * frame.w,
        y: 0.45 * frame.h,
        w: 0.2 * frame.w,
        h: 0.2 * frame.h,
      };
  const propBox: Box | undefined = prop
    ? {
        x: ((prop[0] - crop.x) / crop.w) * frame.w,
        y: ((prop[1] - crop.y) / crop.h) * frame.h,
        w: (prop[2] / crop.w) * frame.w,
        h: (prop[3] / crop.h) * frame.h,
      }
    : undefined;
  const bodyBox: Box | undefined = body
    ? {
        x: ((body[0] - crop.x) / crop.w) * frame.w,
        y: ((body[1] - crop.y) / crop.h) * frame.h,
        w: (body[2] / crop.w) * frame.w,
        h: (body[3] / crop.h) * frame.h,
      }
    : undefined;
  const base =
    balloonSpot ?? autoSpot(headBox, propBox, bodyBox, frame, bubble);
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
      if (e.canceled) return;
      haptics.select();
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
      if (e.canceled) return;
      haptics.select();
      onBalloonPress?.();
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
  const tintColor =
    colors.balloonTints[(balloonTint ?? 0) % colors.balloonTints.length];

  return (
    <View
      style={styles.slot}
      onLayout={(e) => setAvailable(e.nativeEvent.layout.width)}
    >
      <View
        ref={ref}
        collapsable={false}
        style={[styles.frame, sizing]}
        testID="translation-canvas"
        onLayout={(e) =>
          setFrame({
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
          })
        }
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: reveal,
              transform: [
                { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [1.04, 1] }) },
              ],
            },
          ]}
        >
          <Image
            source={photoSource ?? { uri: photoUri }}
            style={{
              position: "absolute",
              width: frame.w / crop.w,
              height: frame.h / crop.h,
              left: (-crop.x * frame.w) / crop.w,
              top: (-crop.y * frame.h) / crop.h,
            }}
            contentFit="cover"
            onLoad={(e) => {
              setLoaded({ width: e.source.width, height: e.source.height });
              revealPicture();
            }}
          />
        </Animated.View>
        {dots.map((d, i) => (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              {
                opacity: pop.interpolate({
                  inputRange: [0, 0.3 + i * 0.2, 0.5 + i * 0.2, 2],
                  outputRange: [0, 0, 1, 1],
                }),
              },
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
            <Animated.View
              style={[
                styles.balloon,
                {
                  left: spot.x * frame.w,
                  top: spot.y * frame.h,
                  opacity: pop.interpolate({ inputRange: [0, 0.4, 2], outputRange: [0, 1, 1] }),
                  transform: [{ scale: pop.interpolate({ inputRange: [0, 1, 2], outputRange: [0.8, 1, 1.2] }) }],
                },
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
            </Animated.View>
          </GestureDetector>
        ) : null}
        {/* Always on the exported image: marks it as AI-generated (EU AI Act) and credits the app. */}
        {watermark ? (
          <View
            style={styles.watermark}
            pointerEvents="none"
            testID="watermark"
          >
            <AppText
              variant="small"
              color={colors.onPrimary}
              style={styles.watermarkText}
            >
              {t("result.watermark")}
            </AppText>
          </View>
        ) : null}
      </View>
      {below && width > 0 ? (
        <View style={[styles.below, { width }]}>{below}</View>
      ) : null}
    </View>
  );
}

/** Room kept under the picture for `below` (a small button). */
const BELOW_ROOM = layout.buttonHeightMini + space.xs;

/** Width / height of every picture: 2:3, room for the balloon above the pet (decision of the product owner). */
export const SHARE_ASPECT = 2 / 3;

/**
 * Part of the image (fractions 0..1) shown in the 2:3 frame. A taller picture keeps its top
 * (the free space where the balloon goes) and loses only what is needed below the head; a
 * wider one is trimmed at the sides, centred on the head.
 */
export function cropWindow(
  imageAspect: number,
  head?: [number, number, number, number],
): { x: number; y: number; w: number; h: number } {
  const w = imageAspect > SHARE_ASPECT ? SHARE_ASPECT / imageAspect : 1;
  const h = imageAspect > SHARE_ASPECT ? 1 : imageAspect / SHARE_ASPECT;
  const cx = head ? head[0] + head[2] / 2 : 0.5;
  // Lowest point that must stay visible: just below the head.
  const keepBottom = head ? head[1] + head[3] + 0.05 : 0.75;
  return {
    x: clamp(cx - w / 2, 0, 1 - w),
    y: clamp(keepBottom - h, 0, 1 - h),
    w,
    h,
  };
}

/** The corner whose balloon covers the least of the head (top-left on a tie). */
function autoSpot(
  head: Box,
  prop: Box | undefined,
  body: Box | undefined,
  frame: Size,
  bubble: Size,
): BalloonSpot {
  const spots = BALLOON_CORNERS.map((c) => fit(c, frame, bubble));
  const boxes = spots.map((s) => ({
    x: s.x * frame.w,
    y: s.y * frame.h,
    w: bubble.w,
    h: bubble.h,
  }));
  return spots[bestSpot(boxes, head, prop, body)];
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
  slot: { width: "100%", alignItems: "center" },
  below: { alignItems: "flex-end", marginTop: space.xs },
  frame: {
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: colors.inkFaint,
    boxShadow: shadow.md,
  },
  // Narrow enough to leave the pet's face visible.
  // touchAction stops the mobile browser from scrolling while dragging (web only).
  balloon: { position: "absolute", width: "58%", touchAction: "none" },
});
