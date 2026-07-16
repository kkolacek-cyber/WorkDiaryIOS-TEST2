import type { SQLiteDatabase } from 'expo-sqlite';

export const DB_NAME = 'radni_dnevnik.db';

/**
 * Migracije se izvršavaju automatski kroz <SQLiteProvider onInit={migrate}>.
 * Verzija se čuva u SQLite pragmi `user_version`.
 */
export async function migrate(db: SQLiteDatabase): Promise<void> {
  const LATEST = 1;
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  if (version >= LATEST) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS work_entries (
        date          TEXT PRIMARY KEY NOT NULL,
        worked        INTEGER NOT NULL DEFAULT 0,
        workType      TEXT,
        description   TEXT NOT NULL DEFAULT '',
        hours         REAL,
        earnings      REAL,
        isPaid        INTEGER NOT NULL DEFAULT 0,
        paidDate      TEXT,
        lastModified  INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_entries_unpaid
        ON work_entries (isPaid, worked);
    `);
    version = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${LATEST}`);
}
