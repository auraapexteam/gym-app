import React, { createContext, useContext, useMemo, useState } from 'react';
import { StatusBar } from 'react-native';
import { darkTheme, lightTheme, Theme } from './index';

type ThemeContextValue = {
  theme: Theme;
  colors: Theme['colors'];
  isDark: boolean;
  setTheme: (mode: 'dark' | 'light') => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true); // app defaults to dark mode
  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);

  const setTheme = (mode: 'dark' | 'light') => {
    setIsDark(mode === 'dark');
  };

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, colors: theme.colors, isDark, setTheme, toggleTheme }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.bg} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
