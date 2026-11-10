import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, colors, shadow, space, type } from '@/design';

type Props = {
  text: string;
  /** Where the trail points: down (balloon on top) or up (balloon at the bottom). */
  tail?: 'down' | 'up';
  /** 1 = full size; smaller for previews. */
  scale?: number;
  /** Index into colors.balloonTints. */
  tint?: number;
  /** Tapping the balloon (e.g. to change its colour). */
  onPress?: () => void;
};

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
export function ThoughtBalloon({ text, tail = 'down', scale = 1, tint = 0, onPress }: Props) {
  const base = text.length > 90 ? 18 : text.length > 70 ? 20 : text.length > 45 ? type.balloon.fontSize : 25;
  const fontSize = Math.round(base * scale);
  const fill = { backgroundColor: colors.balloonTints[tint % colors.balloonTints.length] };

  // Biggest dot next to the bubble, smallest next to the pet.
  const sizes = [20, 13, 8].map((s) => s * scale);
  const dots = sizes.map((size, i) => (
    <View
      key={size}
      style={[styles.dot, fill, { width: size, height: size, borderRadius: size / 2, marginRight: `${18 + i * 5}%` }]}
    />
  ));

  const bubble = (
    <View
      style={[
        styles.bubble,
        fill,
        { paddingVertical: space.xl * scale, paddingHorizontal: space.xl * 1.25 * scale, borderRadius: 999 },
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
      {tail === 'up' ? <View style={styles.trail}>{[...dots].reverse()}</View> : null}
      {bubble}
      {tail === 'down' ? <View style={styles.trail}>{dots}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bubble: {
    boxShadow: shadow.balloon,
  },
  trail: {
    alignItems: 'flex-end',
    gap: space.xs,
    paddingVertical: space.xs,
  },
  dot: {
    boxShadow: shadow.balloon,
  },
});
