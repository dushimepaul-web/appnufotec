import { createContext, useContext, useState } from 'react';
import { palette as lightPalette, darkPalette } from '../utils/theme';

const ThemeContext = createContext({
  isDark: false,
  palette: lightPalette,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(prev => !prev);

  const palette = isDark ? darkPalette : lightPalette;

  return (
    <ThemeContext.Provider value={{ isDark, palette, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
