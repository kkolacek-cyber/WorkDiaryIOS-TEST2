import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius } from '../theme';
import type { DayStatus } from '../types';

const MAP: Record<DayStatus, { color: string; label: string }> = {
  PAID: { color: Colors.paid, label: 'Isplaćeno' },
  WAITING: { color: Colors.waiting, label: 'Čeka isplatu' },
  NOT_WORKED: { color: Colors.neutral, label: 'Nije rađeno' },
};

export function StatusBadge({ status }: { status: DayStatus }) {
  const { color, label } = MAP[status];
  return (
    <View style={[styles.pill, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: 'flex-end',
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
});
