import type { SQLiteDatabase } from 'expo-sqlite';
import { addDaysIso, toIso } from '../format';
import { emptyEntry, type WorkEntry, type WorkType } from '../types';

interface Row {
  date: string;
  worked: number;
  workType: string | null;
  description: string;
  hours: number | null;
  earnings: number | null;
  isPaid: number;
  paidDate: string | null;
  lastModified: number;
}

const fromRow = (r: Row): WorkEntry => ({
  date: r.date,
  worked: r.worked === 1,
  workType: (r.workType as WorkType) ?? null,
  description: r.description ?? '',
  hours: r.hours,
  earnings: r.earnings,
  isPaid: r.isPaid === 1,
  paidDate: r.paidDate,
  lastModified: r.lastModified,
});

export async function getEntry(db: SQLiteDatabase, date: string): Promise<WorkEntry | null> {
  const row = await db.getFirstAsync<Row>('SELECT * FROM work_entries WHERE date = ?', date);
  return row ? fromRow(row) : null;
}

export async function getRange(db: SQLiteDatabase, start: string, end: string): Promise<WorkEntry[]> {
  const rows = await db.getAllAsync<Row>(
    'SELECT * FROM work_entries WHERE date BETWEEN ? AND ? ORDER BY date DESC',
    start,
    end,
  );
  return rows.map(fromRow);
}

/**
 * Vraća zapis za SVAKI dan u rasponu (silazno). Dani kojih nema u bazi
 * se generiraju u memoriji kao prazni (worked = false) — nikad nema "rupa",
 * a u bazu se piše tek kad korisnik nešto stvarno upiše.
 */
export async function getFilledRange(
  db: SQLiteDatabase,
  start: string,
  end: string,
): Promise<WorkEntry[]> {
  const stored = await getRange(db, start, end);
  const byDate = new Map(stored.map((e) => [e.date, e]));
  const out: WorkEntry[] = [];
  let cursor = end;
  while (cursor >= start) {
    out.push(byDate.get(cursor) ?? emptyEntry(cursor));
    cursor = addDaysIso(cursor, -1);
  }
  return out;
}

export async function getAllEntries(db: SQLiteDatabase): Promise<WorkEntry[]> {
  const rows = await db.getAllAsync<Row>('SELECT * FROM work_entries ORDER BY date ASC');
  return rows.map(fromRow);
}

export async function getUnpaidEntries(db: SQLiteDatabase): Promise<WorkEntry[]> {
  const rows = await db.getAllAsync<Row>(
    'SELECT * FROM work_entries WHERE worked = 1 AND isPaid = 0 ORDER BY date ASC',
  );
  return rows.map(fromRow);
}

/** Datumi koji postoje u bazi unutar raspona (za sinkronizaciju notifikacija). */
export async function getExistingDates(
  db: SQLiteDatabase,
  start: string,
  end: string,
): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ date: string }>(
    'SELECT date FROM work_entries WHERE date BETWEEN ? AND ?',
    start,
    end,
  );
  return new Set(rows.map((r) => r.date));
}

export async function saveEntry(db: SQLiteDatabase, entry: WorkEntry): Promise<void> {
  await db.runAsync(
    `INSERT INTO work_entries
       (date, worked, workType, description, hours, earnings, isPaid, paidDate, lastModified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       worked = excluded.worked,
       workType = excluded.workType,
       description = excluded.description,
       hours = excluded.hours,
       earnings = excluded.earnings,
       isPaid = excluded.isPaid,
       paidDate = excluded.paidDate,
       lastModified = excluded.lastModified`,
    entry.date,
    entry.worked ? 1 : 0,
    entry.worked ? entry.workType : null,
    entry.worked ? entry.description.trim() : '',
    entry.worked ? entry.hours : null,
    entry.worked ? entry.earnings : null,
    entry.worked && entry.isPaid ? 1 : 0,
    entry.worked && entry.isPaid ? entry.paidDate : null,
    Date.now(),
  );
}

export async function deleteEntry(db: SQLiteDatabase, date: string): Promise<void> {
  await db.runAsync('DELETE FROM work_entries WHERE date = ?', date);
}

/** Brzo označavanje isplate s Home ekrana. */
export async function markPaid(db: SQLiteDatabase, date: string, paid: boolean): Promise<void> {
  await db.runAsync(
    'UPDATE work_entries SET isPaid = ?, paidDate = ?, lastModified = ? WHERE date = ?',
    paid ? 1 : 0,
    paid ? toIso(new Date()) : null,
    Date.now(),
    date,
  );
}

export interface MonthTotal {
  year: number;
  month0: number;
  total: number;
}

/** Zarada po mjesecima za zadnjih `count` mjeseci (za mini graf). */
export async function getMonthlyTotals(db: SQLiteDatabase, count: number): Promise<MonthTotal[]> {
  const rows = await db.getAllAsync<{ ym: string; total: number }>(
    `SELECT substr(date, 1, 7) AS ym, SUM(COALESCE(earnings, 0)) AS total
     FROM work_entries WHERE worked = 1
     GROUP BY ym`,
  );
  const map = new Map(rows.map((r) => [r.ym, r.total]));
  const out: MonthTotal[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ year: d.getFullYear(), month0: d.getMonth(), total: map.get(ym) ?? 0 });
  }
  return out;
}
