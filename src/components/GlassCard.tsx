import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { Radius, white } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: number;
  onPress?: () => void;
  onLongPress?: () => void;
}

/**
 * Liquid Glass kartica, v2:
 *  - pravi backdrop blur (nativni iOS materijal)
 *  - gradijentni hairline rub — svjetliji na vrhu, kao da svjetlo pada odozgo
 *  - "sheen" odsjaj u gornjoj trećini stakla
 *  - spring utiskivanje na dodir (preko AnimatedPressable)
 */
export function GlassCard({ children, style, intensity = 32, tint = 0.1, onPress, onLongPress }: Props) {
  const body = (
    <LinearGradient
      colors={[white(0.34), white(0.1), white(0.05)]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[styles.border, style]}
    >
      <BlurView intensity={intensity} tint="dark" style={styles.blur}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: white(tint) }]} />
        <LinearGradient
          pointerEvents="none"
          colors={[white(0.12), white(0)]}
          style={styles.sheen}
        />
        {children}
      </BlurView>
    </LinearGradient>
  );

  if (!onPress && !onLongPress) return body;

  return (
    <AnimatedPressable onPress={onPress} onLongPress={onLongPress}>
      {body}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  border: {
    borderRadius: Radius.card,
    padding: StyleSheet.hairlineWidth * 2, // debljina gradijentnog ruba
  },
  blur: {
    borderRadius: Radius.card - 1,
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
  },
});
