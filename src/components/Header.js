import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../contexts/SettingsContext';
import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography } from '../utils/theme';

export default function Header({ title, showBack = false }) {
  const insets = useSafeAreaInsets();
  const s = useSettings();
  const { palette } = useTheme();
  const styles = useMemo(() => s2(palette), [palette]);

  const displayTitle = title || `${s.app_name} ${s.app_subtitle}`;

  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={palette.dark} />
        </TouchableOpacity>
      ) : (
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.logoText}>{s.app_name} {s.app_subtitle}</Text>
            <Text style={styles.logoSub}>{s.tagline}</Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/SearchScreen')}>
          <Ionicons name="search-outline" size={20} color={palette.greyDark} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={20} color={palette.greyDark} />
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Ionicons name="person" size={14} color={palette.white} />
        </View>
      </View>
    </View>
  );
}

const s2 = (p) => StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingBottom: spacing.md,
    backgroundColor: p.white, borderBottomWidth: 1, borderBottomColor: p.greyLight,
  },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: p.green,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    borderWidth: 2, borderColor: p.gold,
  },
  logoImage: { width: 34, height: 34 },
  logoText: { color: p.dark, fontSize: typography.base, fontWeight: '800', letterSpacing: -0.3 },
  logoSub: { color: p.greyDark, fontSize: 9, fontWeight: '500' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: p.green,
    borderWidth: 1.5, borderColor: p.green,
    justifyContent: 'center', alignItems: 'center', marginLeft: 2,
  },
});
