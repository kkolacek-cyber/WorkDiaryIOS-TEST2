/**
 * Dizajn tokeni — "Molten Ember" tema.
 * Dark-first, topla narančasta, Apple Liquid Glass materijali.
 */
export const Colors = {
  // Pozadina (od vrha prema dnu)
  bgTop: '#331104',
  bgMid: '#170903',
  bgBottom: '#070301',

  // Ambijentalni blobovi svjetla iza glassa
  blobOrange: '#FF7A1A',
  blobAmber: '#FFAE42',
  blobRust: '#B33A05',

  // Statusi
  paid: '#3DDC97',
  waiting: '#FFC94A',
  neutral: '#8F7A6B',

  // Akcent
  accent: '#FF8A3D',
  accentDeep: '#E85D04',

  // Tekst
  textPrimary: '#FFF4EA',
  textSecondary: '#C2A78F',

  glass: '#FFFFFF',
  danger: '#FF7B6B',
};

export const Radius = {
  card: 28,
  field: 16,
  pill: 999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

/** rgba helper za bijelu s alfom */
export const white = (alpha: number) => `rgba(255, 255, 255, ${alpha})`;

/** rgba helper za akcent s alfom */
export const accentA = (alpha: number) => `rgba(255, 138, 61, ${alpha})`;

/**
 * Tipografska skala. Naslovi su tijesno rezani (negativan letterSpacing,
 * kao SF Display), eyebrow natpisi su mali, uppercase i široko razmaknuti —
 * to je glavni "potpis" tipografije u cijeloj aplikaciji.
 */
export const Type = {
  hero: {
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    color: Colors.textPrimary,
  },
  bigNumber: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  title: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    color: Colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
};

/** Meka narančasta "glow" sjena za istaknute elemente (FAB, Spremi). */
export const glowShadow = {
  shadowColor: Colors.accentDeep,
  shadowOpacity: 0.45,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 10,
};
