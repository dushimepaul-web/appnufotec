// src/utils/theme.js
export const colors = {
  // Fond principal — deep navy, pas noir pur
  bg: '#0D1117',
  bgCard: '#161B22',
  bgElevated: '#21262D',
  bgOverlay: 'rgba(13,17,23,0.85)',

  // Accent — rouge vif avec variantes
  accent: '#E63946',
  accentSoft: '#FF6B6B',
  accentGlow: 'rgba(230,57,70,0.25)',

  // Texte
  text: '#F0F6FC',
  textSub: '#8B949E',
  textMuted: '#484F58',

  // Bordures & séparateurs
  border: '#30363D',
  borderLight: '#21262D',

  // Chips / filtres
  chip: '#21262D',
  chipActive: '#E63946',
  chipTextActive: '#FFFFFF',

  // Gradient cards
  gradientStart: '#1C2128',
  gradientEnd: '#0D1117',

  // Tab bar
  tabBg: '#161B22',
  tabBorder: '#30363D',
  tabActive: '#E63946',
  tabInactive: '#8B949E',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  accent: {
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
};