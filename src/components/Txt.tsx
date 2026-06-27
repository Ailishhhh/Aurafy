import { Text, type TextProps, type TextStyle } from 'react-native';
import { palette, typeScale, type TypeVariant } from '@/theme';

type TxtProps = TextProps & {
  variant?: TypeVariant;
  color?: string;
  center?: boolean;
  /** Convenience opacity for de-emphasized copy without new color tokens. */
  dim?: boolean;
};

/**
 * The single text primitive for the whole app. Funnelling every label through
 * one component guarantees the type scale + default color stay consistent and
 * makes future global tweaks a one-line change.
 */
export function Txt({
  variant = 'body',
  color = palette.textPrimary,
  center,
  dim,
  style,
  ...rest
}: TxtProps) {
  const base = typeScale[variant] as TextStyle;
  return (
    <Text
      {...rest}
      style={[
        base,
        { color, opacity: dim ? 0.6 : 1 },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
