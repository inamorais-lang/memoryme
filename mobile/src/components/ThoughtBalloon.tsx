import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, colors, shadow, space, type } from '@/design';

type Props = {
  text: string;
  /** Where the trail points: down (balloon on top) or up (balloon at the bottom). */
  tail?: 'down' | 'up';
  /** 1 = full size; smaller for previews. */
  scale?: number;
  /** Which side the trail hangs from (towards the pet). */
  trailSide?: 'left' | 'right';
  /** Index into colors.balloonTints. */
  tint?: number;
  /** Tapping the balloon (e.g. to change its colour). */
  onPress?: () => void;
  /** false: no dots (the photo canvas draws them itself, aimed at the pet). */
  trail?: boolean;
};

/** Dot sizes of the trail at scale 1, biggest next to the bubble. */
export const TRAIL_DOTS = [20, 13, 8];

/** Pick a stable tint for an id, so a translation keeps its colour. */
export function tintFor(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash) % colors.balloonTints.length;
}

/**
 * A classic thought bubble: a trail of three dots that grow from the pet
 * up to the big rounded bubble holding the text. Soft pastel, never white.
 */
export function ThoughtBalloon({ text, tail = 'down', trailSide = 'right', scale = 1, tint = 0, onPress, trail = true }: Props) {
  // Short lines get big type; longer ones shrink so the bubble stays compact.
  const base = text.length > 70 ? 16 : text.length > 45 ? 18 : type.balloon.fontSize;
  const fontSize = Math.round(base * scale);
  const fill = { backgroundColor: colors.balloonTints[tint % colors.balloonTints.length] };

  // Biggest dot next to the bubble, smallest next to the pet.
  const sizes = TRAIL_DOTS.map((s) => s * scale);
  const dots = sizes.map((size, i) => (
    <View
      key={size}
      style={[
        styles.dot,
        fill,
        { width: size, height: size, borderRadius: size / 2 },
        trailSide === 'right' ? { marginRight: `${16 + i * 6}%` } : { marginLeft: `${16 + i * 6}%` },
      ]}
    />
  ));

  const trailAlign = { alignItems: trailSide === 'right' ? ('flex-end' as const) : ('flex-start' as const) };

  const bubble = (
    <View
      style={[
        styles.bubble,
        fill,
        { paddingVertical: space.lg * scale, paddingHorizontal: space.xl * scale, borderRadius: 999 },
      ]}>
      <AppText variant="balloon" align="center" style={{ fontSize, lineHeight: Math.round(fontSize * 1.22) }}>
        {text}
      </AppText>
    </View>
  );

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
      testID="thought-balloon">
      {trail && tail === 'up' ? <View style={[styles.trail, trailAlign]}>{[...dots].reverse()}</View> : null}
      {bubble}
      {trail && tail === 'down' ? <View style={[styles.trail, trailAlign]}>{dots}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bubble: {
    boxShadow: shadow.balloon,
  },
  trail: {
    gap: space.xs,
    paddingVertical: space.xs,
  },
  dot: {
    boxShadow: shadow.balloon,
  },
});
