export const Theme = {
  colors: {
    primary: '#00A383',          // oklch(0.63 0.13 168) - Custom Mint Green
    primarySoft: '#E5FAF5',      // Soft primary tint
    secondary: '#D97706',        // Amber/Warning
    secondarySoft: '#FFFBEB',
    background: '#F4F5F2',       // Neutral grayish green background
    surface: '#FFFFFF',          // Card/Box surface
    surfaceDark: '#1E1E1E',      // Dark Mode surface
    foreground: '#1F2937',       // Dark slate text
    mutedForeground: '#6B7280',  // Gray subtext
    border: '#E5E7EB',           // Light gray border
    destructive: '#DC2626',      // Red
    destructiveSoft: '#FEE2E2',  // Soft red tint
    success: '#10B981',          // Success Green
    successSoft: '#D1FAE5',
    info: '#3B82F6',             // Info Blue
    infoSoft: '#DBEAFE',
  },
  radius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    round: 9999,
  },
  shadow: {
    soft: {
      shadowColor: '#0F0F0F',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    lift: {
      shadowColor: '#0F0F0F',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 4,
    },
  },
};
