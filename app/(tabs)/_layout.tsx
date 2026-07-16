import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Colors, white } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        // Slabo proziran, kao što smo popravili i na Androidu
        tabBarBackground: () => (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Početna',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="kalendar"
        options={{
          title: 'Kalendar',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="postavke"
        options={{
          title: 'Postavke',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    backgroundColor: `${Colors.tabBar}F0`,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: white(0.12),
    elevation: 0,
  },
  label: { fontSize: 11, fontWeight: '600' },
});
