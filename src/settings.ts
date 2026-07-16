import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  notificationHour: number;   // sat kad se šalju podsjetnici (0–23)
  unpaidNotifEnabled: boolean;
  missingNotifEnabled: boolean;
  hourlyRate: number;         // €/h, 0 = nije postavljena
}

export const DEFAULT_SETTINGS: AppSettings = {
  notificationHour: 20,
  unpaidNotifEnabled: true,
  missingNotifEnabled: true,
  hourlyRate: 0,
};

const KEY = 'settings.v1';

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
