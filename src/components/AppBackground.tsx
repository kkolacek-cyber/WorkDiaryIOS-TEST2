import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../theme';

/**
 * Pozadina koja "diše": topli gradijent + tri ambijentalna bloba svjetla
 * koji vrlo sporo lebde i pulsiraju. Dovoljno suptilno da ne odvlači
 * pažnju, dovoljno živo da glass materijal iznad ima što lomiti.
 * Uz iOS "Reduce Motion" blobovi miruju.
 */
export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.bgTop, Colors.bgMid, Colors.bgBottom]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <DriftingBlob color={Colors.blobOrange} size={460} top={-150} left={-130} strength={0.42} driftX={40} driftY={26} period={9000} />
      <DriftingBlob color={Colors.blobAmber} size={400} top={210} left={190} strength={0.28} driftX={-32} driftY={38} period={12000} />
      <DriftingBlob color={Colors.blobRust} size={540} top={560} left={-180} strength={0.34} driftX={28} driftY={-30} period={15000} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const RINGS = 6;

function DriftingBlob({
  color,
  size,
  top,
  left,
  strength,
  driftX,
  driftY,
  period,
}: {
  color: string;
  size: number;
  top: number;
  left: number;
  strength: number;
  driftX: number;
  driftY: number;
  period: number;
}) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    t.value = withRepeat(
      withTiming(1, { duration: period, easing: Easing.inOut(Easing.sin) }),
      -1,
      true, // yoyo: tamo-natrag, bez skoka
    );
  }, [reduced, period, t]);

  const drift = useAnimatedStyle(() => ({
    transform: [
      { translateX: t.value * driftX },
      { translateY: t.value * driftY },
      { scale: 1 + t.value * 0.08 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top, left, width: size, height: size }, drift]}
    >
      {/* Meki radijalni glow složen od koncentričnih krugova */}
      {Array.from({ length: RINGS }).map((_, i) => {
        const ratio = 1 - i / RINGS;
        const d = size * ratio;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: (size - d) / 2,
              left: (size - d) / 2,
              width: d,
              height: d,
              borderRadius: d / 2,
              backgroundColor: color,
              opacity: (strength / RINGS) * 1.2,
            }}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgMid },
  content: { flex: 1 },
});
