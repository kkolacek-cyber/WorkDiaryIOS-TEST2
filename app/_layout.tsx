import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import React, { Suspense, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppBackground } from '../src/components/AppBackground';
import { DB_NAME, migrate } from '../src/db/database';
import { requestPermissions } from '../src/notifications';
import { SettingsProvider } from '../src/SettingsContext';
import { Colors } from '../src/theme';

export default function RootLayout() {
  useEffect(() => {
    requestPermissions();

    // Tap na notifikaciju -> otvori taj dan
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const date = response.notification.request.content.data?.date;
      if (typeof date === 'string') {
        router.push(`/dan/${date}`);
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Suspense fallback={<Loading />}>
          <SQLiteProvider databaseName={DB_NAME} onInit={migrate} useSuspense>
            <SettingsProvider>
              <AppBackground>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: 'transparent' },
                    animation: 'slide_from_right',
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="dan/[date]" options={{ animation: 'slide_from_bottom' }} />
                </Stack>
              </AppBackground>
            </SettingsProvider>
          </SQLiteProvider>
        </Suspense>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgMid, justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.accent} />
    </View>
  );
}
