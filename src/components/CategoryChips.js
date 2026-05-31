import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing, typography } from '../utils/theme';

const TABS = [
  { key: 'all', label: 'Tout' },
  { key: 'video', label: 'Vidéos' },
  { key: 'audio', label: 'Audio' },
  { key: 'pdf', label: 'PDF' },
];

export default function CategoryChips({ selected, onSelect, categories = [] }) {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  const allChips = [
    ...TABS,
    ...categories.map(c => ({ key: c.nom, label: c.nom, count: c.total })),
  ];

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {allChips.map(chip => {
          const active = selected === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelect(chip.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {chip.label}
              </Text>
              {chip.count ? (
                <Text style={[styles.chipCount, active && styles.chipCountActive]}>
                  {chip.count}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = (p) => StyleSheet.create({
  wrapper: {
    backgroundColor: p.white,
    borderBottomWidth: 1,
    borderBottomColor: p.greyLight,
  },
  container: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: p.whiteOff,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: p.greyLight,
  },
  chipActive: {
    backgroundColor: p.green,
    borderColor: p.green,
  },
  chipText: {
    color: p.greyDark,
    fontSize: typography.sm,
    fontWeight: '600',
  },
  chipTextActive: {
    color: p.white,
    fontWeight: '700',
  },
  chipCount: {
    color: p.grey,
    fontSize: typography.xs,
    fontWeight: '600',
  },
  chipCountActive: {
    color: 'rgba(255,255,255,0.8)',
  },
});
