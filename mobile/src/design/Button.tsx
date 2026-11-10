import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { colors, layout, motion, radius, space } from './tokens';

/** Every button is filled with colour: primary (pink), secondary (lime), tertiary (lilac, small). */
type Variant = 'primary' | 'secondary' | 'tertiary';

const palette: Record<Variant, { bg: string; pressed: string; text: string }> = {
  primary: { bg: colors.primary, pressed: colors.primaryPressed, text: colors.onPrimary },
  secondary: { bg: colors.secondary, pressed: colors.secondaryPressed, text: colors.onSecondary },
  tertiary: { bg: colors.tertiary, pressed: colors.tertiaryPressed, text: colors.onTertiary },
};

type Props = {
  label: string;
  /** Small second line under the label, e.g. "grátis". */
  note?: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  hint?: string;
  testID?: string;
};

export function Button({ label, note, onPress, variant = 'primary', disabled, loading, hint, testID }: Props) {
  const inactive = disabled || loading;
  const small = variant === 'tertiary';
  const c = palette[variant];

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={note ? `${label}, ${note}` : label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        { backgroundColor: pressed ? c.pressed : c.bg },
        pressed && styles.pressed,
        inactive && styles.inactive,
      ]}>
      <View style={styles.content}>
        {loading ? <ActivityIndicator color={c.text} /> : null}
        <View style={styles.labels}>
          <AppText variant={small ? 'buttonSmall' : 'button'} color={c.text} align="center" numberOfLines={1}>
            {label}
          </AppText>
          {note ? (
            <AppText variant="smallStrong" color={c.text} align="center" style={styles.note}>
              {note}
            </AppText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.buttonHeight,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  small: {
    minHeight: layout.buttonHeightSmall,
    paddingHorizontal: space.lg,
  },
  pressed: {
    transform: [{ scale: motion.pressScale }],
  },
  inactive: {
    opacity: 0.4,
  },
  labels: { alignItems: 'center' },
  note: { opacity: 0.75, marginTop: -2 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
});
