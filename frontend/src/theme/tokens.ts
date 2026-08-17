import { darkColors } from './colors';

export const colors = darkColors;

export const radii = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };

export const spacing = (n: number) => n * 4; // 4px base grid

export const typography = {
  fontFamily: 'System',
  h1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '800' as const },
  h3: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  button: { fontSize: 16, fontWeight: '700' as const },
};

// Backward-compatibility aliases for existing imports
export const COLORS = {
  background: colors.bg,
  surface: colors.bgElevated,
  primary: colors.accent,
  primaryLight: colors.accentDim,
  success: colors.accent,
  warning: '#fbbf24',
  danger: colors.danger,
  textPrimary: colors.textPrimary,
  textSecondary: colors.textSecondary,
  border: colors.surfaceBorder,
  darkBackground: colors.bg,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
};

