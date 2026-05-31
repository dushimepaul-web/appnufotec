import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing } from '../utils/theme';

export default function ThemeToggle() {
  const insets = useSafeAreaInsets();
  const { isDark, palette, toggleTheme } = useTheme();
  const anim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isDark ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isDark, anim]);

  return (
    <TouchableOpacity
      style={[styles.btn, { top: insets.top + 8, backgroundColor: palette.white, borderColor: palette.greyLight }]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? palette.gold : palette.greyDark} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute', right: spacing.base, zIndex: 9999,
    width: 38, height: 38, borderRadius: radius.full,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
  },
});
