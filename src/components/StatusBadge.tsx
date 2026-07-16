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
    <View style={[styles.pill, { backgroundColor: `${color}26` }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-end',
  },
  text: { fontSize: 12, fontWeight: '600' },
});
