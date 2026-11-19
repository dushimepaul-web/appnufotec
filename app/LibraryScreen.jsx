import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Header from '../src/components/Header';
import { useSettings } from '../src/contexts/SettingsContext';
import { useTheme } from '../src/contexts/ThemeContext';
import api from '../src/utils/api';
import { radius, spacing, typography } from '../src/utils/theme';

export default function LibraryScreen() {
  const { palette } = useTheme();
  const styles = useMemo(() => cs(palette), [palette]);
  const COLOR_MAP = { gold: palette.gold, red: palette.red, green: palette.green };
  const s = useSettings().library;
  const [playlists, setPlaylists] = useState([]);
  const menuItems = s.menu_items.map(item => ({
    ...item,
    color: COLOR_MAP[item.color] || palette.green,
  }));

  useEffect(() => {
    api.getPlaylists()
      .then(res => { if (res.success) setPlaylists(res.data || []); })
      .catch(() => {});
  }, []);

  const handlePlaylistsPress = () => {
    if (playlists.length === 0) {
      Alert.alert('Playlists', 'Aucune playlist disponible pour le moment.');
      return;
    }
    Alert.alert('Playlists', `${playlists.length} playlist(s) disponible(s).`);
  };

  return (
    <View style={styles.root}>
      <Header title={s.title} />

      <View style={styles.loginPrompt}>
        <View style={styles.avatarLarge}>
          <Ionicons name="person" size={36} color={palette.white} />
        </View>
        <Text style={styles.promptTitle}>{s.login_title}</Text>
        <Text style={styles.promptSub}>{s.login_subtitle}</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
          <Ionicons name="log-in-outline" size={18} color={palette.green} />
          <Text style={styles.loginBtnText}>{s.login_button}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.menuWrap}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.row}
            activeOpacity={0.7}
            onPress={item.label === 'Playlists' ? handlePlaylistsPress : undefined}
          >
            <View style={[styles.iconBox, { backgroundColor: `${item.color}12` }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowSub}>
                {item.label === 'Playlists'
                  ? (playlists.length > 0 ? `${playlists.length} playlist(s)` : item.subtitle)
                  : item.subtitle}
              </Text>
            </View>
            <View style={[styles.chevronCircle, { borderColor: palette.greyLight }]}>
              <Ionicons name="chevron-forward" size={16} color={palette.grey} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const cs = (p) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.white },
  loginPrompt: {
    alignItems: 'center', padding: spacing.xl, gap: spacing.sm,
    marginHorizontal: spacing.lg, marginTop: spacing.lg,
    backgroundColor: p.white, borderRadius: radius.xl,
    borderWidth: 1, borderColor: p.greyLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3,
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: p.green, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: `${p.green}30`,
    shadowColor: p.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  promptTitle: { color: p.dark, fontSize: typography.xl, fontWeight: '800', marginTop: spacing.sm },
  promptSub: { color: p.greyDark, fontSize: typography.sm, textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.lg },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1.5, borderColor: p.green, borderRadius: radius.full,
    paddingHorizontal: spacing.xl, paddingVertical: 10, marginTop: spacing.sm,
  },
  loginBtnText: { color: p.green, fontWeight: '700', fontSize: typography.base },
  divider: { height: 8, backgroundColor: p.whiteOff, marginVertical: spacing.md },
  menuWrap: { paddingHorizontal: spacing.base, gap: spacing.xs },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.md,
    backgroundColor: p.white, borderRadius: radius.md,
    marginBottom: spacing.xs,
    borderWidth: 1, borderColor: p.greyLight,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  rowInfo: { flex: 1 },
  rowLabel: { color: p.dark, fontSize: typography.base, fontWeight: '600' },
  rowSub: { color: p.greyDark, fontSize: typography.sm, marginTop: 2 },
  chevronCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
});
