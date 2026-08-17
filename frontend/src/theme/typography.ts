export const fontFamily = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800' as const, letterSpacing: -0.6 },
  h1:      { fontSize: 28, lineHeight: 34, fontWeight: '800' as const, letterSpacing: -0.4 },
  h2:      { fontSize: 22, lineHeight: 28, fontWeight: '800' as const, letterSpacing: -0.2 },
  h3:      { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
  bodyLg:  { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  body:    { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  button:  { fontSize: 16, lineHeight: 20, fontWeight: '700' as const },
  statBig: { fontSize: 40, lineHeight: 44, fontWeight: '800' as const },
} as const;
