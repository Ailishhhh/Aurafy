import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { View, type TextStyle } from 'react-native';
import { Txt } from './Txt';
import { gradients, type TypeVariant } from '@/theme';

type GradientTextProps = {
  children: string;
  variant?: TypeVariant;
  colors?: readonly [string, string, ...string[]];
  style?: TextStyle;
};

/**
 * Renders text filled with a gradient by masking a LinearGradient with the
 * glyphs. Used for the wordmark and hero accents. We render an invisible copy
 * of the text as the mask, then paint the gradient through it.
 */
export function GradientText({
  children,
  variant = 'display',
  colors = gradients.aura,
  style,
}: GradientTextProps) {
  return (
    <MaskedView
      maskElement={
        <View style={{ backgroundColor: 'transparent' }}>
          <Txt variant={variant} style={[style, { opacity: 1 }]}>
            {children}
          </Txt>
        </View>
      }
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }}>
        <Txt variant={variant} style={[style, { opacity: 0 }]}>
          {children}
        </Txt>
      </LinearGradient>
    </MaskedView>
  );
}
