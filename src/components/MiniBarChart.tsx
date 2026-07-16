import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { formatMonthShort } from '../format';
import { accentA, Colors, white } from '../theme';
import type { MonthTotal } from '../db/entries';

/**
 * Stupčasti graf zarade po mjesecima — stupci "izrastu" spring animacijom,
 * jedan za drugim, kad se pojave na ekranu.
 */
export function MiniBarChart({ data }: { data: MonthTotal[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <View style={styles.row}>
      {data.map((d, i) => (
        <Bar
          key={`${d.year}-${d.month0}`}
          label={formatMonthShort(d.year, d.month0)}
          ratio={d.total / max}
          hasValue={d.total > 0}
          isCurrent={i === data.length - 1}
          delay={i * 70}
        />
      ))}
    </View>
  );
}

function Bar({
  label,
  ratio,
  hasValue,
  isCurrent,
  delay,
}: {
  label: string;
  ratio: number;
  hasValue: boolean;
  isCurrent: boolean;
  delay: number;
}) {
  const reduced = useReducedMotion();
  const target = Math.max(ratio, hasValue ? 0.06 : 0.02);
  const h = useSharedValue(reduced ? target : 0.02);

  useEffect(() => {
    h.value = reduced
      ? target
      : withDelay(delay, withSpring(target, { damping: 16, stiffness: 140 }));
  }, [target, delay, reduced, h]);

  const grow = useAnimatedStyle(() => ({ height: `${h.value * 100}%` }));

  return (
    <View style={styles.col}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.bar,
            { backgroundColor: isCurrent ? Colors.accent : accentA(0.4) },
            grow,
          ]}
        />
      </View>
      <Text style={[styles.label, isCurrent && { color: Colors.accent }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  track: {
    height: 68,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: white(0.05),
    borderRadius: 7,
    overflow: 'hidden',
  },
  bar: { width: '100%', borderRadius: 7 },
  label: { color: Colors.textSecondary, fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
});
