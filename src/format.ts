import { format, parseISO } from 'date-fns';
import { hr } from 'date-fns/locale';

/** "2026-07-16" -> Date */
export const toDate = (iso: string) => parseISO(iso);

/** Date -> "2026-07-16" (lokalno, bez UTC pomaka) */
export function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const todayIso = () => toIso(new Date());

export function addDaysIso(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

/** "Ponedjeljak, 30.06." */
export function formatDayHeader(iso: string): string {
  const d = parseISO(iso);
  const name = format(d, 'EEEE', { locale: hr });
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}, ${format(d, 'dd.MM.')}`;
}

/** "16.07.2026." */
export const formatFullDate = (iso: string) => format(parseISO(iso), 'dd.MM.yyyy.');

/** "Srpanj 2026" */
export function formatMonthYear(year: number, month0: number): string {
  const name = format(new Date(year, month0, 1), 'LLLL', { locale: hr });
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

/** Kratki naziv mjeseca, npr. "srp" */
export const formatMonthShort = (year: number, month0: number) =>
  format(new Date(year, month0, 1), 'LLL', { locale: hr });

/** 1234.5 -> "1.234,50 €" (hrvatski format, bez oslanjanja na Intl) */
export function formatCurrency(amount: number): string {
  const fixed = Math.abs(amount).toFixed(2);
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = amount < 0 ? '-' : '';
  return `${sign}${grouped},${dec} €`;
}

/** 8 -> "8", 7.5 -> "7,5" */
export function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
}

/** "7,5" -> 7.5 ; "" -> null */
export function parseNumber(text: string): number | null {
  if (!text.trim()) return null;
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
