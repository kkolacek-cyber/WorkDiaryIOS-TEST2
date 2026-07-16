import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatMonthShort } from '../format';
import { Colors, white } from '../theme';
import type { MonthTotal } from '../db/entries';

/**
 * Mali stupčasti graf zarade po mjesecima. Bez ijedne biblioteke —
 * samo View-ovi visine proporcionalne iznosu.
 */
export function MiniBarChart({ data }: { data: MonthTotal[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <View style={styles.row}>
      {data.map((d) => {
        const ratio = d.total / max;
        const isCurrent = d === data[data.length - 1];
        return (
          <View key={`${d.year}-${d.month0}`} style={styles.col}>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.max(ratio * 100, d.total > 0 ? 6 : 2)}%`,
                    backgroundColor: isCurrent ? Colors.accent : `${Colors.accent}66`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.label, isCurrent && { color: Colors.accent }]}>
              {formatMonthShort(d.year, d.month0)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  track: {
    height: 64,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: white(0.05),
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: { width: '100%', borderRadius: 6 },
  label: { color: Colors.textSecondary, fontSize: 10, textTransform: 'capitalize' },
});
