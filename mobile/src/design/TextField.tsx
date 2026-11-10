import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from './AppText';
import { colors, fonts, radius, space } from './tokens';

type Props = Omit<TextInputProps, 'style'> & {
  maxLength: number;
  /** Shown under the field, e.g. "12 caracteres restantes". */
  counterLabel?: string;
};

/** Single text field of the design system: no outline, soft fill, big type. */
export function TextField({ counterLabel, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        placeholderTextColor={colors.inkMuted}
        selectionColor={colors.primary}
        style={styles.input}
        {...rest}
      />
      {counterLabel ? (
        <AppText variant="small" color={colors.inkMuted} align="right">
          {counterLabel}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  input: {
    minHeight: 56,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 17,
  },
});
