import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../theme';

/**
 * Pozadina cijele aplikacije: topli narančasti gradijent + tri meka
 * "bloba" svjetla, da glass kartice imaju što zamutiti.
 */
export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.bgTop, Colors.bgMid, Colors.bgBottom]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Blob color={Colors.blobOrange} size={460} top={-150} left={-130} strength={0.38} />
      <Blob color={Colors.blobAmber} size={400} top={230} left={190} strength={0.26} />
      <Blob color={Colors.blobRust} size={520} top={580} left={-170} strength={0.3} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const RINGS = 6;

/**
 * expo-linear-gradient nema radijalni gradijent, pa je meki glow
 * složen od nekoliko koncentričnih krugova sve manje neprozirnosti.
 * Jeftino i izgleda kao pravi radial blur.
 */
function Blob({
  color,
  size,
  top,
  left,
  strength,
}: {
  color: string;
  size: number;
  top: number;
  left: number;
  strength: number;
}) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top, left, width: size, height: size }}>
      {Array.from({ length: RINGS }).map((_, i) => {
        const ratio = 1 - i / RINGS; // 1 -> najmanji krug (najjači)
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgMid },
  content: { flex: 1 },
});
