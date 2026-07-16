import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Radius, white } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: number;
  onPress?: () => void;
  onLongPress?: () => void;
}

/**
 * Glassmorphism kartica. Za razliku od Android verzije (gdje je efekt bio
 * simuliran poluprozirnim gradijentom), ovdje BlurView radi PRAVI zamućeni
 * backdrop — to je nativna iOS mogućnost i izgleda točno kao sistemski
 * "Liquid Glass" materijal.
 */
export function GlassCard({ children, style, intensity = 28, tint = 0.1, onPress, onLongPress }: Props) {
  const inner = (
    <BlurView intensity={intensity} tint="dark" style={[styles.blur, style]}>
      <View style={[styles.overlay, { backgroundColor: white(tint) }]}>{children}</View>
    </BlurView>
  );

  if (!onPress && !onLongPress) return inner;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      onLongPress={
        onLongPress
          ? () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onLongPress();
            }
          : undefined
      }
      style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  blur: {
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: white(0.18),
  },
  overlay: { flex: 1 },
});
