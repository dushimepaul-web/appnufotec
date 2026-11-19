// Couleurs alignées sur le site nufotec.com (vert forêt + or).
export const palette = {
  green: '#075A20',
  greenLight: '#0B8A30',
  greenDark: '#053D16',
  greenSoft: '#E9F6E6',
  gold: '#C9A646',
  goldLight: '#E2CD7E',
  goldDark: '#A8862E',
  red: '#D92D4A',
  redLight: '#F04A66',
  redDark: '#B81E38',
  white: '#FFFFFF',
  whiteOff: '#F4F7F3',
  grey: '#9AA5A0',
  greyDark: '#56645A',
  greyLight: '#E3EAE2',
  dark: '#1A1A1A',
  darkLight: '#1D2A20',
  darkCard: '#24282E',
  darkElevated: '#333940',
  whatsapp: '#25D366',
};

export const darkPalette = {
  green: '#2FB257',
  greenLight: '#4CC870',
  greenDark: '#0B8A30',
  greenSoft: '#16261A',
  gold: '#C9A646',
  goldLight: '#E2CD7E',
  goldDark: '#A8862E',
  red: '#D92D4A',
  redLight: '#F04A66',
  redDark: '#B81E38',
  white: '#121418',
  whiteOff: '#1C1E24',
  grey: '#5A6068',
  greyDark: '#8A9098',
  greyLight: '#2A2D35',
  dark: '#F0F2F5',
  darkLight: '#C8CCD0',
  darkCard: '#24282E',
  darkElevated: '#333940',
  whatsapp: '#25D366',
};

export const colors = {
  bg: palette.white,
  bgCard: palette.whiteOff,
  bgElevated: palette.greyLight,
  bgOverlay: 'rgba(0,0,0,0.05)',

  accent: palette.green,
  accentSoft: palette.greenLight,
  accentGlow: 'rgba(12,123,69,0.1)',

  gold: palette.gold,
  goldSoft: 'rgba(212,168,67,0.1)',

  red: palette.red,
  redSoft: 'rgba(217,45,74,0.08)',

  text: palette.dark,
  textSub: '#5A6068',
  textMuted: palette.grey,

  border: palette.greyLight,
  borderLight: '#EEF0F2',

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
