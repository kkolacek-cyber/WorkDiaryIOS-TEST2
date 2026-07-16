import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { accentA, Colors, white } from '../theme';

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { active: 'home', inactive: 'home-outline', label: 'Početna' },
  kalendar: { active: 'calendar', inactive: 'calendar-outline', label: 'Kalendar' },
  postavke: { active: 'settings', inactive: 'settings-outline', label: 'Postavke' },
};

const H_MARGIN = 40;
const BAR_PADDING = 6;

/**
 * Plutajući glass tab bar — potpis dizajna. Zaobljena pilula od stakla
 * odvojena od ruba ekrana, s indikatorom koji spring animacijom klizi
 * ispod aktivnog taba.
 */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);

  const count = state.routes.length;
  const segment = barWidth > 0 ? (barWidth - BAR_PADDING * 2) / count : 0;

  const indicator = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(BAR_PADDING + state.index * segment, {
          damping: 17,
          stiffness: 220,
        }),
      },
    ],
  }), [state.index, segment]);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 6 }]}
    >
      <View
        style={styles.barBorder}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        <BlurView intensity={50} tint="dark" style={styles.bar}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(23, 9, 3, 0.72)' }]} />

          {segment > 0 && (
            <Animated.View style={[styles.indicator, { width: segment }, indicator]}>
              <View style={styles.indicatorFill} />
            </Animated.View>
          )}

          {state.routes.map((route, index) => {
            const icons = ICONS[route.name] ?? ICONS.index;
            const focused = state.index === index;
            return (
              <Pressable
                key={route.key}
                style={styles.tab}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) {
                    Haptics.selectionAsync();
                    navigation.navigate(route.name);
                  }
                }}
              >
                <Ionicons
                  name={focused ? icons.active : icons.inactive}
                  size={22}
                  color={focused ? Colors.accent : Colors.textSecondary}
                />
                <Text style={[styles.label, focused && styles.labelActive]}>{icons.label}</Text>
              </Pressable>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: H_MARGIN,
    right: H_MARGIN,
    alignItems: 'center',
  },
  barBorder: {
    alignSelf: 'stretch',
    borderRadius: 34,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: white(0.16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  bar: {
    flexDirection: 'row',
    paddingVertical: BAR_PADDING + 4,
    paddingHorizontal: BAR_PADDING,
  },
  indicator: {
    position: 'absolute',
    top: BAR_PADDING,
    bottom: BAR_PADDING,
    justifyContent: 'center',
  },
  indicatorFill: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 24,
    backgroundColor: accentA(0.16),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: accentA(0.3),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  labelActive: { color: Colors.accent },
});
