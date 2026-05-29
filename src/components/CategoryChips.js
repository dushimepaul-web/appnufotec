// src/components/CategoryChips.js
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../utils/theme';

const TABS = [
  { key: 'all',   label: 'Tout' },
  { key: 'video', label: '▶  Vidéos' },
  { key: 'audio', label: '♪  Audio' },
  { key: 'pdf',   label: '📄  PDF' },   // ← ajouté
];

export default function CategoryChips({ selected, onSelect, categories = [] }) {
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

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textSub,
    fontSize: typography.sm,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  chipCount: {
    color: colors.textMuted,
    fontSize: typography.xs,
    fontWeight: '600',
  },
  chipCountActive: {
    color: 'rgba(255,255,255,0.8)',
  },
});