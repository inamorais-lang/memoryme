import { StyleSheet, View } from 'react-native';

import { AppText, border, colors, radius, shadow, space, type } from '@/design';

type Props = {
  text: string;
  /** Where the tail points: down (balloon on top) or up (balloon at the bottom). */
  tail?: 'down' | 'up';
  /** 1 = full size; smaller for previews. */
  scale?: number;
};

export function ThoughtBalloon({ text, tail = 'down', scale = 1 }: Props) {
  const base = text.length > 90 ? 18 : text.length > 60 ? 20 : type.balloon.fontSize;
  const fontSize = Math.round(base * scale);
  const big = <View style={[styles.dot, dotSize(18 * scale)]} />;
  const small = <View style={[styles.dot, dotSize(10 * scale), styles.smallOffset]} />;
  // The small dot is always the one closest to the animal.
  const dots = (
    <View style={styles.dots}>
      {tail === 'down' ? (
        <>
          {big}
          {small}
        </>
      ) : (
        <>
          {small}
          {big}
        </>
      )}
    </View>
  );

  return (
    <View accessible accessibilityRole="text" accessibilityLabel={text}>
      {tail === 'up' ? dots : null}
      <View style={[styles.bubble, { paddingVertical: space.lg * scale, paddingHorizontal: space.xl * scale }]}>
        <AppText
          variant="balloon"
          align="center"
          style={{ fontSize, lineHeight: Math.round(fontSize * 1.22) }}>
          {text}
        </AppText>
      </View>
      {tail === 'down' ? dots : null}
    </View>
  );
}

function dotSize(size: number) {
  return { width: size, height: size, borderRadius: size / 2 };
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: colors.surface,
    borderWidth: border.widthBold,
    borderColor: border.color,
    borderRadius: radius.balloon,
    boxShadow: shadow.md,
  },
  dots: {
    alignSelf: 'flex-end',
    marginRight: '22%',
    alignItems: 'flex-end',
    gap: space.xs,
    paddingVertical: space.xs,
  },
  dot: {
    backgroundColor: colors.surface,
    borderWidth: border.width,
    borderColor: border.color,
    boxShadow: shadow.sm,
  },
  smallOffset: { marginRight: -space.md },
});
