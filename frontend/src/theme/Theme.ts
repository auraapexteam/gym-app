import { colors } from './tokens';

export const LightColors = {
  primary: colors.accent,
  primarySoft: colors.accentDim,
  secondary: '#fbbf24',
  secondarySoft: 'rgba(251, 191, 36, 0.12)',
  background: '#F5F5F0',                  // Light cream background matching Page 32
  surface: '#FFFFFF',                     // Pure white card
  surfaceDark: '#EFEFEA',                 // Faint grey container
  foreground: '#0A0A0A',                  // Dark text
  mutedForeground: '#6B7280',             // Subtitle text
  border: '#E0E0D8',                      // Soft border
  destructive: colors.danger,
  destructiveSoft: colors.dangerBg,
  success: colors.accent,
  successSoft: colors.accentDim,
  info: '#0d94f8',
  infoSoft: 'rgba(13, 148, 248, 0.18)',
};

export const DarkColors = {
  primary: colors.accent,                 // Neon Lime #B6FF00
  primarySoft: colors.accentDim,
  secondary: '#fbbf24',
  secondarySoft: 'rgba(251, 191, 36, 0.16)',
  background: colors.bg,                  // #0A0A0A
  surface: colors.bgElevated,             // #141414
  surfaceDark: colors.surface,            // #1A1A1A
  foreground: colors.textPrimary,         // #FFFFFF
  mutedForeground: colors.textSecondary,  // #9CA3AF
  border: colors.surfaceBorder,           // #2A2A2A
  destructive: colors.danger,
  destructiveSoft: colors.dangerBg,
  success: colors.accent,
  successSoft: colors.accentDim,
  info: '#0d94f8',
  infoSoft: 'rgba(13, 148, 248, 0.18)',
};

export const Theme = {
  colors: DarkColors,
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    round: 999,
  },
  shadow: {
    soft: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 2,
    },
    lift: {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 4,
    },
  },
};

