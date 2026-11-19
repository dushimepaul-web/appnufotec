// ─── Charte graphique NUFOTEC : 5 couleurs, toutes tirées du logo ─────
//   vert   : l'anneau « Nutrition and Food Technology for Health »
//   or     : les lauriers
//   rouge  : le ruban « NUFOTEC » (réservé aux alertes et aux badges)
//   encre  : vert presque noir, pour le texte et les fonds sombres
//   blanc  : surfaces
// Toutes les autres nuances sont des mélanges de ces 5 couleurs.
export const BRAND = {
  green: '#1A7F3C',
  gold: '#CFA93A',
  red: '#B5121B',
  ink: '#0F2417',
  white: '#FFFFFF',
};

// Mélange linéaire de deux couleurs hexadécimales (ratio = part de `b`).
export function mix(a, b, ratio) {
  const pa = a.replace('#', ''), pb = b.replace('#', '');
  const ch = (h, i) => parseInt(h.slice(i, i + 2), 16);
  const out = [0, 2, 4].map((i) => Math.round(ch(pa, i) * (1 - ratio) + ch(pb, i) * ratio));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

const { green, gold, red, ink, white } = BRAND;

export const palette = {
  green,
  greenLight: mix(green, white, 0.18),
  greenDark: mix(green, ink, 0.55),
  greenSoft: mix(green, white, 0.91),
  gold,
  goldLight: mix(gold, white, 0.4),
  goldDark: mix(gold, ink, 0.3),
  red,
  redLight: mix(red, white, 0.2),
  redDark: mix(red, ink, 0.3),
  redSoft: mix(red, white, 0.92),
  white,
  whiteOff: mix(green, white, 0.965),
  grey: mix(ink, white, 0.55),
  greyDark: mix(ink, white, 0.35),
  greyLight: mix(ink, white, 0.9),
  dark: ink,
  darkLight: mix(ink, white, 0.18),
  darkCard: mix(ink, white, 0.08),
  darkElevated: mix(ink, white, 0.14),
  media: ink, // fond des lecteurs vidéo/audio
  whatsapp: green, // les boutons WhatsApp restent dans la charte
};

export const darkPalette = {
  green: mix(green, white, 0.22),
  greenLight: mix(green, white, 0.35),
  greenDark: green,
  greenSoft: mix(ink, green, 0.25),
  gold,
  goldLight: mix(gold, white, 0.4),
  goldDark: mix(gold, ink, 0.2),
  red: mix(red, white, 0.15),
  redLight: mix(red, white, 0.3),
  redDark: red,
  redSoft: mix(ink, red, 0.2),
  white: mix(ink, '#000000', 0.35),
  whiteOff: ink,
  grey: mix(ink, white, 0.42),
  greyDark: mix(ink, white, 0.62),
  greyLight: mix(ink, white, 0.16),
  dark: mix(white, green, 0.04),
  darkLight: mix(white, ink, 0.2),
  darkCard: ink,
  darkElevated: mix(ink, white, 0.1),
  media: mix(ink, '#000000', 0.35),
  whatsapp: mix(green, white, 0.22),
};

export const colors = {
  bg: palette.white,
  bgCard: palette.whiteOff,
  bgElevated: palette.greyLight,
  bgOverlay: 'rgba(15,36,23,0.05)',

  accent: palette.green,
  accentSoft: palette.greenLight,
  accentGlow: 'rgba(26,127,60,0.1)',

  gold: palette.gold,
  goldSoft: 'rgba(207,169,58,0.1)',

  red: palette.red,
  redSoft: palette.redSoft,

  text: palette.dark,
  textSub: palette.greyDark,
  textMuted: palette.grey,

  border: palette.greyLight,
  borderLight: palette.greyLight,

  chip: palette.greyLight,
  chipActive: palette.green,
  chipTextActive: palette.white,

  gradientStart: palette.whiteOff,
  gradientEnd: palette.white,

  tabBg: palette.white,
  tabBorder: palette.greyLight,
  tabActive: palette.green,
  tabInactive: palette.grey,
};

export const typography = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const shadow = {
  card: {
    shadowColor: '#1A1D21',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  accent: {
    shadowColor: palette.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  gold: {
    shadowColor: palette.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
};
