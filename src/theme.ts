/**
 * Narančasta paleta. Dark-first, kao i Android verzija,
 * samo je plavi/ljubičasti gradijent zamijenjen toplim narančastim.
 */
export const Colors = {
  // Pozadinski gradijent (od vrha prema dnu)
  bgTop: '#3B1607',
  bgMid: '#1A0B04',
  bgBottom: '#080402',

  // Meki "blobovi" iza glass kartica
  blobOrange: '#F97316',
  blobAmber: '#F59E0B',
  blobRust: '#C2410C',

  // Statusi
  paid: '#34D399',      // zelena — isplaćeno
  waiting: '#FCD34D',   // žuta — čeka isplatu
  neutral: '#8B7365',   // topla siva — nije rađeno

  // Akcent / interakcija
  accent: '#FB923C',
  accentDeep: '#EA580C',

  // Tekst
  textPrimary: '#FDF4EC',
  textSecondary: '#B9A597',

  // Glass
  glass: '#FFFFFF',
  danger: '#F87171',

  // Donji izbornik (namjerno slabo proziran)
  tabBar: '#251109',
};

export const Radius = {
  card: 26,
  field: 14,
  pill: 999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

/** rgba helper za bijelu s alfom */
export const white = (alpha: number) => `rgba(255, 255, 255, ${alpha})`;
