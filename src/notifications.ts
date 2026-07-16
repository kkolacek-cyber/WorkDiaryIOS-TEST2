import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import { getExistingDates, getUnpaidEntries } from './db/entries';
import { addDaysIso, formatFullDate, todayIso, toDate } from './format';
import type { AppSettings } from './settings';

/**
 * ZAŠTO OVAKO:
 * Android verzija je koristila WorkManager koji se svaki dan budi i provjerava bazu.
 * iOS ne dopušta pouzdano periodično buđenje u pozadini, pa je ovdje pristup obrnut
 * i zapravo bolji: notifikacije se ZAKAZUJU UNAPRIJED na točan datum i sat, a cijeli
 * raspored se ponovno izgradi (rescheduleAll) svaki put kad se nešto promijeni —
 * pri pokretanju appa, nakon spremanja/brisanja zapisa i nakon izmjene postavki.
 * Nema pozadinskog posla, nema trošenja baterije, i točno je do sekunde.
 *
 * iOS dopušta max 64 zakazane notifikacije po aplikaciji, pa je broj ograničen niže.
 */

const MISSING_DAYS_AHEAD = 14; // koliko dana unaprijed pratimo "dan nije upisan"
const MAX_UNPAID = 30;

Notifications.setNotificationHandler({
  // shouldShowAlert je stari ključ, shouldShowBanner/List novi —
  // navedeni su svi da radi neovisno o verziji Expo SDK-a.
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }) as any,
});

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const res = await Notifications.requestPermissionsAsync();
    status = res.status;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('podsjetnici', {
      name: 'Podsjetnici',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return status === 'granted';
}

/** Datum + sat -> Date; vraća null ako je već prošlo. */
function triggerDate(iso: string, hour: number): Date | null {
  const d = toDate(iso);
  d.setHours(hour, 0, 0, 0);
  return d.getTime() > Date.now() + 60_000 ? d : null;
}

async function schedule(id: string, title: string, body: string, when: Date, date: string) {
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title,
      body,
      data: { date },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      channelId: 'podsjetnici',
    },
  });
}

/**
 * Briše sve zakazane notifikacije i ponovno ih izgradi iz trenutnog stanja baze.
 * Idempotentno — sigurno je pozvati koliko god puta.
 */
export async function rescheduleAll(db: SQLiteDatabase, settings: AppSettings): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const hour = settings.notificationHour;
    const today = todayIso();

    // 1) Neplaćeno: podsjetnik 7 dana nakon datuma rada
    if (settings.unpaidNotifEnabled) {
      const unpaid = await getUnpaidEntries(db);
      const recent = unpaid.slice(-MAX_UNPAID);
      for (const entry of recent) {
        const when = triggerDate(addDaysIso(entry.date, 7), hour);
        if (!when) continue;
        const suffix = entry.description ? ` (${entry.description.slice(0, 40)})` : '';
        await schedule(
          `unpaid-${entry.date}`,
          'Čeka isplatu',
          `Stavka od ${formatFullDate(entry.date)}${suffix} još nije isplaćena.`,
          when,
          entry.date,
        );
      }
    }

    // 2) Neupisani dani: za svaki od sljedećih N dana zakaži podsjetnik
    //    koji stiže dan poslije — ako dan u međuvremenu bude upisan,
    //    idući rescheduleAll ga jednostavno više neće zakazati.
    if (settings.missingNotifEnabled) {
      const start = addDaysIso(today, -1);
      const end = addDaysIso(today, MISSING_DAYS_AHEAD);
      const existing = await getExistingDates(db, start, end);
      for (let i = -1; i < MISSING_DAYS_AHEAD; i++) {
        const day = addDaysIso(today, i);
        if (existing.has(day)) continue;
        const when = triggerDate(addDaysIso(day, 1), hour);
        if (!when) continue;
        await schedule(
          `missing-${day}`,
          'Dan nije upisan',
          `Dan ${formatFullDate(day)} nije upisan. Jesi li radio taj dan?`,
          when,
          day,
        );
      }
    }
  } catch (e) {
    // Notifikacije nikad ne smiju srušiti aplikaciju
    console.warn('rescheduleAll failed', e);
  }
}
