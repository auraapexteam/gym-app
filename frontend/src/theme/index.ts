import { darkColors, lightColors } from './colors';
import { typography, fontFamily } from './typography';
import { spacing } from './spacing';
import { radii } from './radii';
import { makeShadows } from './shadows';

export const darkTheme = {
  mode: 'dark' as const,
  colors: darkColors,
  typography,
  fontFamily,
  spacing,
  radii,
  shadows: makeShadows(darkColors),
};

export const lightTheme = {
  mode: 'light' as const,
  colors: lightColors,
  typography,
  fontFamily,
  spacing,
  radii,
  shadows: makeShadows(lightColors),
};

export type Theme = typeof darkTheme | typeof lightTheme;

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radii';
export * from './shadows';
