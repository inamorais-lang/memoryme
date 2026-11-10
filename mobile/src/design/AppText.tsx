import { Text, type TextProps } from 'react-native';

import { colors, type, type TypeVariant } from './tokens';

type Props = TextProps & {
  variant?: TypeVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
};

export function AppText({ variant = 'body', color = colors.ink, align, style, ...rest }: Props) {
  return <Text style={[type[variant], { color, textAlign: align }, style]} {...rest} />;
}
