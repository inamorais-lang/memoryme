import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { border, colors, layout, motion, radius, shadow, space } from './tokens';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  hint?: string;
  testID?: string;
};

export function Button({ label, onPress, variant = 'primary', disabled, loading, hint, testID }: Props) {
  const inactive = disabled || loading;
  const isGhost = variant === 'ghost';
  const textColor = variant === 'primary' ? colors.onPrimary : colors.ink;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        !isGhost && styles.boxed,
        isGhost && styles.ghost,
        variant === 'primary' && { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
        variant === 'secondary' && { backgroundColor: colors.surface },
        !isGhost && { boxShadow: pressed ? 'none' : shadow.md },
        pressed && !isGhost && styles.pressed,
        inactive && styles.inactive,
      ]}>
      <View style={styles.content}>
        {loading ? <ActivityIndicator color={textColor} /> : null}
        <AppText variant="button" color={textColor} style={isGhost && styles.ghostText}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.buttonHeight,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxed: {
    borderWidth: border.width,
    borderColor: border.color,
  },
  pressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }, { scale: motion.pressScale }],
  },
  inactive: {
    opacity: 0.45,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  ghost: {
    minHeight: layout.minTap,
    paddingHorizontal: space.md,
  },
  ghostText: {
    textDecorationLine: 'underline',
  },
});
