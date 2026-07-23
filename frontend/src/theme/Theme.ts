export const LightColors = {
  primary: '#4f46e5',                      // Darker indigo for readability
  primarySoft: 'rgba(79, 70, 229, 0.12)',
  secondary: '#d97706',                    // Amber
  secondarySoft: 'rgba(217, 119, 6, 0.1)',
  background: '#f7f8fc',                   // Light base background
  surface: '#ffffff',                      // Pure white card
  surfaceDark: '#eef0f7',                  // Slightly darker grey container
  foreground: '#14161f',                   // Dark text
  mutedForeground: '#5b5f70',              // Subtitle text
  border: 'rgba(15, 17, 26, 0.08)',        // Soft border
  destructive: '#dc2626',                  // Dark red
  destructiveSoft: 'rgba(220, 38, 38, 0.1)',
  success: '#059669',                      // Emerald green
  successSoft: 'rgba(5, 150, 105, 0.1)',
  info: '#0b7dd1',                         // Standard blue
  infoSoft: 'rgba(11, 125, 209, 0.1)',
};

export const DarkColors = {
  primary: '#6366f1',                      // Indigo accent
  primarySoft: 'rgba(99, 102, 241, 0.18)',
  secondary: '#fbbf24',                    // Amber
  secondarySoft: 'rgba(251, 191, 36, 0.16)',
  background: '#0b0f19',                   // Dark base background
  surface: '#141a2a',                      // Card surface
  surfaceDark: '#0f1424',                  // Darker elevated surface
  foreground: '#f5f6fa',                   // Light text
  mutedForeground: '#a1a5b7',              // Subtitle text
  border: 'rgba(255, 255, 255, 0.1)',      // Soft border
  destructive: '#f87171',                  // Soft red
  destructiveSoft: 'rgba(248, 113, 113, 0.16)',
  success: '#10b981',                      // Mint green
  successSoft: 'rgba(16, 185, 129, 0.18)',
  info: '#0d94f8',                         // Cyan blue
  infoSoft: 'rgba(13, 148, 248, 0.18)',
};

export const Theme = {
  colors: DarkColors, // Default fallback (Dark theme is original design style)
  radius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    round: 9999,
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
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 4,
    },
  },
};
