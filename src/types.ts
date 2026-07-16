export type WorkType = 'USLUZNO' | 'OBITELJSKI';

export const WORK_TYPE_LABEL: Record<WorkType, string> = {
  USLUZNO: 'Uslužno',
  OBITELJSKI: 'Obiteljski',
};

/** Jedan dan u dnevniku. `date` je uvijek ISO string "YYYY-MM-DD". */
export interface WorkEntry {
  date: string;
  worked: boolean;
  workType: WorkType | null;
  description: string;
  hours: number | null;
  earnings: number | null;
  isPaid: boolean;
  paidDate: string | null;
  lastModified: number;
}

export type DayStatus = 'PAID' | 'WAITING' | 'NOT_WORKED';

export function statusOf(entry: WorkEntry): DayStatus {
  if (entry.worked && entry.isPaid) return 'PAID';
  if (entry.worked) return 'WAITING';
  return 'NOT_WORKED';
}

export function emptyEntry(date: string): WorkEntry {
  return {
    date,
    worked: false,
    workType: null,
    description: '',
    hours: null,
    earnings: null,
    isPaid: false,
    paidDate: null,
    lastModified: Date.now(),
  };
}
