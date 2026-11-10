import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, space } from './tokens';

type Props = {
  children: ReactNode;
  /** Pinned at the bottom, above the home indicator (main actions). */
  footer?: ReactNode;
  scroll?: boolean;
};

export function Screen({ children, footer, scroll = true }: Props) {
  const body = <View style={styles.inner}>{children}</View>;
  return (
    <SafeAreaView style={styles.root} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, styles.fill]}>{body}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  fill: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: layout.gutter, paddingVertical: space.lg },
  inner: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', gap: space.lg },
  footer: {
    width: '100%',
    maxWidth: layout.maxContentWidth + layout.gutter * 2,
    alignSelf: 'center',
    paddingHorizontal: layout.gutter,
    paddingTop: space.md,
    paddingBottom: space.md,
    gap: space.sm,
    backgroundColor: colors.paper,
  },
});
