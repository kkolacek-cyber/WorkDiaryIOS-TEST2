import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Koliko se element "utisne" na dodir (1 = bez efekta). */
  pressScale?: number;
  haptic?: boolean;
  disabled?: boolean;
}

/**
 * Pressable sa spring "utiskivanjem" — svaki dodirljivi element u aplikaciji
 * reagira fizikalno, kao native iOS kontrola, umjesto pukim opacity fadeom.
 */
export function AnimatedPressable({
  children,
  onPress,
  onLongPress,
  style,
  pressScale = 0.97,
  haptic = true,
  disabled,
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(pressScale, { damping: 18, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 320 });
      }}
      onPress={
        onPress
          ? () => {
              if (haptic) Haptics.selectionAsync();
              onPress();
            }
          : undefined
      }
      onLongPress={
        onLongPress
          ? () => {
              if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onLongPress();
            }
          : undefined
      }
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressableBase>
  );
}
