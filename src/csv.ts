import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getAllEntries } from './db/entries';
import { todayIso } from './format';
import { WORK_TYPE_LABEL } from './types';

/**
 * Zapis datoteke u cache. Expo je u novijim SDK-ovima uveo File/Paths API,
 * a stari (writeAsStringAsync) je preseljen u 'expo-file-system/legacy'.
 * Ovaj shim pokriva oba slučaja pa radi neovisno o verziji SDK-a.
 */
async function writeCacheFile(name: string, content: string): Promise<string> {
  const FS: any = require('expo-file-system');
  if (FS?.File && FS?.Paths) {
    const file = new FS.File(FS.Paths.cache, name);
    if (file.exists) file.delete();
    file.create();
    file.write(content);
    return file.uri;
  }
  let Legacy: any;
  try {
    Legacy = require('expo-file-system/legacy');
  } catch {
    Legacy = FS;
  }
  const uri = `${Legacy.cacheDirectory}${name}`;
  await Legacy.writeAsStringAsync(uri, content, { encoding: 'utf8' });
  return uri;
}

const cell = (v: string) => v.replace(/;/g, ',').replace(/\r?\n/g, ' ');
const num = (v: number | null) => (v === null ? '' : String(v).replace('.', ','));

/** Vraća true ako je export pokrenut, false ako nema podataka. */
export async function exportCsv(db: SQLiteDatabase): Promise<boolean> {
  const entries = await getAllEntries(db);
  if (entries.length === 0) return false;

  const lines = ['Datum;Radilo se;Tip;Opis;Sati;Zarada (EUR);Isplaćeno;Datum isplate'];
  for (const e of entries) {
    lines.push(
      [
        e.date,
        e.worked ? 'DA' : 'NE',
        e.workType ? WORK_TYPE_LABEL[e.workType] : '',
        cell(e.description),
        num(e.hours),
        num(e.earnings),
        e.isPaid ? 'DA' : 'NE',
        e.paidDate ?? '',
      ].join(';'),
    );
  }

  // BOM da Excel ispravno prepozna UTF-8 (č, ć, š, ž, đ)
  const csv = '\uFEFF' + lines.join('\n') + '\n';
  const uri = await writeCacheFile(`radni_dnevnik_${todayIso()}.csv`, csv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Izvezi radni dnevnik',
      UTI: 'public.comma-separated-values-text',
    });
  }
  return true;
}
