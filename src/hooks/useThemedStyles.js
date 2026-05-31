import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export function useThemedStyles(createFn) {
  const { palette } = useTheme();
  return useMemo(() => createFn(palette), [palette, createFn]);
}
