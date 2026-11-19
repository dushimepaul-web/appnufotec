import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing, typography } from '../utils/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const TABS = [
  { key: 'all', label: 'Tout' },
  { key: 'video', label: 'Vidéos' },
  { key: 'audio', label: 'Audio' },
  { key: 'pdf', label: 'PDF' },
];

const NAV_CHIPS = [
  { key: 'temoignages', label: 'Témoignages', icon: 'star', route: '/temoignages' },
  { key: 'downloads', label: 'Téléchargés', icon: 'cloud-download', route: '/OfflineScreen' },
];

const SEARCH_BTN_W = 44;

export default function CategoryChips({ selected, onSelect, onSearchPress, searchActive }) {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {TABS.map(chip => {
          const active = selected === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              style={[styles.tabBtn, active && styles.tabActive]}
              onPress={() => onSelect(chip.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity onPress={onSearchPress} activeOpacity={0.7} style={[styles.searchBtn, searchActive && styles.searchActive]}>
          <Ionicons name={searchActive ? "close" : "search-outline"} size={20} color={searchActive ? '#fff' : palette.green} />
        </TouchableOpacity>
      </View>
      <View style={styles.extraRow}>
        {NAV_CHIPS.map(chip => (
          <TouchableOpacity
            key={chip.key}
            style={styles.navChip}
            onPress={() => router.push(chip.route)}
            activeOpacity={0.75}
          >
            <Ionicons name={chip.icon} size={12} color={palette.green} />
            <Text style={styles.navChipText}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const TAB_GAP = 8;
const TAB_W = (SCREEN_W - spacing.lg * 2 - TAB_GAP * TABS.length - SEARCH_BTN_W) / TABS.length;

const s = (p) => StyleSheet.create({
  wrapper: { backgroundColor: p.white, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: p.greyLight },
  row: {
    flexDirection: 'row', gap: TAB_GAP,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
  },
  tabBtn: {
    width: TAB_W,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: p.whiteOff,
    borderWidth: 1, borderColor: p.greyLight,
  },
  tabActive: {
    backgroundColor: p.green,
    borderColor: p.green,
  },
  tabText: {
    color: p.greyDark,
    fontSize: typography.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: p.white,
    fontWeight: '700',
  },
  searchBtn: {
    width: SEARCH_BTN_W, height: SEARCH_BTN_W,
    borderRadius: radius.md,
    backgroundColor: p.whiteOff,
    borderWidth: 1, borderColor: p.greyLight,
    justifyContent: 'center', alignItems: 'center',
  },
  searchActive: {
    backgroundColor: p.green,
    borderColor: p.green,
  },
  extraRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
  },
  navChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: `${p.green}0A`, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderWidth: 1, borderColor: `${p.green}20`,
  },
  navChipText: { color: p.green, fontSize: typography.sm, fontWeight: '700' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: p.whiteOff, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderWidth: 1, borderColor: p.greyLight,
  },
  chipActive: { backgroundColor: p.green, borderColor: p.green },
  chipText: { color: p.greyDark, fontSize: typography.sm, fontWeight: '600' },
  chipTextActive: { color: p.white, fontWeight: '700' },
  chipCount: { color: p.grey, fontSize: typography.xs, fontWeight: '600' },
  chipCountActive: { color: 'rgba(255,255,255,0.8)' },
});
