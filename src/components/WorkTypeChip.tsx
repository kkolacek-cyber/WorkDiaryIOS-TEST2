import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { accentA, Colors, Radius, white } from '../theme';
import { WORK_TYPE_LABEL, type WorkType } from '../types';

const TYPES: WorkType[] = ['USLUZNO', 'OBITELJSKI'];

/**
 * Segmented kontrola s klizećim glass "thumb-om" — kao nativni iOS
 * segmented control, samo u našem materijalu.
 */
export function WorkTypeChip({
  selected,
  onSelect,
}: {
  selected: WorkType | null;
  onSelect: (t: WorkType) => void;
}) {
  const [width, setWidth] = useState(0);
  const segment = width > 0 ? (width - 8) / TYPES.length : 0;
  const index = selected ? TYPES.indexOf(selected) : -1;

  const thumb = useAnimatedStyle(() => ({
    opacity: index < 0 ? 0 : 1,
    transform: [
      {
        translateX: withSpring(4 + Math.max(index, 0) * segment, {
          damping: 18,
          stiffness: 260,
        }),
      },
    ],
  }), [index, segment]);

  return (
    <View style={styles.row} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {segment > 0 && (
        <Animated.View style={[styles.thumb, { width: segment }, thumb]} />
      )}
      {TYPES.map((type) => {
        const active = selected === type;
        return (
          <Pressable
            key={type}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(type);
            }}
            style={styles.chip}
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: white(0.1),
    padding: 4,
  },
  thumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: Radius.field,
    backgroundColor: accentA(0.28),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: accentA(0.45),
  },
  chip: { flex: 1, paddingVertical: 11, alignItems: 'center' },
  label: { color: Colors.textSecondary, fontWeight: '600', fontSize: 15 },
  labelActive: { color: Colors.textPrimary },
});
