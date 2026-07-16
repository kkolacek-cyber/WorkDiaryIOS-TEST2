import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, white } from '../theme';
import { WORK_TYPE_LABEL, type WorkType } from '../types';

const TYPES: WorkType[] = ['USLUZNO', 'OBITELJSKI'];

export function WorkTypeChip({
  selected,
  onSelect,
}: {
  selected: WorkType | null;
  onSelect: (t: WorkType) => void;
}) {
  return (
    <View style={styles.row}>
      {TYPES.map((type) => {
        const active = selected === type;
        return (
          <Pressable
            key={type}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(type);
            }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{WORK_TYPE_LABEL[type]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: white(0.06),
    borderRadius: Radius.field + 4,
    padding: 4,
    gap: 4,
  },
  chip: { flex: 1, borderRadius: Radius.field, paddingVertical: 10, alignItems: 'center' },
  chipActive: { backgroundColor: `${Colors.accent}59` },
  label: { color: Colors.textSecondary, fontWeight: '600', fontSize: 15 },
  labelActive: { color: Colors.textPrimary },
});
