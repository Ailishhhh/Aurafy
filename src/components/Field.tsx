import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Txt } from './Txt';
import { palette, radius, spacing, fonts } from '@/theme';

type FieldProps = TextInputProps & {
  label?: string;
  /** Optional helper / error line below the field. */
  error?: string;
};

/**
 * Minimal, premium text input. Calm by default with a soft hairline; on focus
 * the border animates to the aura violet. Deliberately understated to match the
 * clean, Claude-style auth aesthetic.
 */
export function Field({ label, error, style, onFocus, onBlur, ...rest }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const f = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      f.value,
      [0, 1],
      [error ? palette.danger : 'rgba(255,255,255,0.12)', palette.violetBright],
    ),
  }));

  return (
    <View style={{ gap: spacing.sm }}>
      {!!label && (
        <Txt variant="label" color={palette.textSecondary}>
          {label}
        </Txt>
      )}
      <Animated.View style={[styles.wrap, borderStyle]}>
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            f.value = withTiming(1, { duration: 180 });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            f.value = withTiming(0, { duration: 180 });
            onBlur?.(e);
          }}
          placeholderTextColor={palette.textTertiary}
          selectionColor={palette.violetBright}
          style={[styles.input, style]}
        />
      </Animated.View>
      {!!error && (
        <Txt variant="caption" color={palette.danger}>
          {error}
        </Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  input: {
    height: 54,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 16,
    color: palette.textPrimary,
  },
});
