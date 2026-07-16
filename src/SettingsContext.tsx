import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { rescheduleAll } from './notifications';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type AppSettings } from './settings';

interface Ctx {
  settings: AppSettings;
  update: (patch: Partial<AppSettings>) => Promise<void>;
  /** Pozvati nakon svake promjene podataka da se raspored notifikacija osvježi. */
  refreshNotifications: () => Promise<void>;
  ready: boolean;
}

const SettingsContext = createContext<Ctx>({
  settings: DEFAULT_SETTINGS,
  update: async () => {},
  refreshNotifications: async () => {},
  ready: false,
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const loaded = await loadSettings();
      setSettings(loaded);
      setReady(true);
      await rescheduleAll(db, loaded);
    })();
  }, [db]);

  const update = useCallback(
    async (patch: Partial<AppSettings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      await saveSettings(next);
      await rescheduleAll(db, next);
    },
    [settings, db],
  );

  const refreshNotifications = useCallback(async () => {
    await rescheduleAll(db, settings);
  }, [db, settings]);

  return (
    <SettingsContext.Provider value={{ settings, update, refreshNotifications, ready }}>
      {children}
    </SettingsContext.Provider>
  );
}
