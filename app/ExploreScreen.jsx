import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Header from '../src/components/Header';
import MediaCard from '../src/components/MediaCard';
import { SkeletonGrid, SkeletonCarousel } from '../src/components/SkeletonLoader';
import { useSettings } from '../src/contexts/SettingsContext';
import { usePopular } from '../src/hooks/useMedias';
import { radius, spacing, typography } from '../src/utils/theme';
import { useMemo } from 'react';
import { useTheme } from '../src/contexts/ThemeContext';

export default function ExploreScreen() {
  const { palette } = useTheme();
  const p = useSettings().media;
  const styles = useMemo(() => s(palette), [palette]);
  const { data: popular, loading, error: popError } = usePopular();

  const handlePress = (item) => {
    router.push({ pathname: '/PlayerScreen', params: { slug: item.slug || item.id_media } });
  };

  return (
    <View style={styles.root}>
      <Header title={p.trending} />

      {loading ? (
        <View style={{ paddingTop: spacing.lg, gap: spacing.lg }}>
          <SkeletonCarousel />
          <SkeletonGrid />
        </View>
      ) : popError ? (
        <View style={styles.center}>
          <View style={[styles.emptyIconBox, { backgroundColor: `${palette.red}08` }]}>
            <Ionicons name="cloud-offline-outline" size={36} color={palette.red} />
          </View>
          <Text style={{ color: palette.dark, fontSize: 16, fontWeight: '700' }}>Vous êtes hors connexion</Text>
          <Text style={{ color: palette.grey, fontSize: 13, marginTop: 4 }}>Connectez-vous à Internet pour découvrir du contenu</Text>
        </View>
      ) : (
        <FlatList
          data={popular}
          keyExtractor={(item, index) => (item.slug ? String(item.slug) : `idx-${index}`)}
          renderItem={({ item, index }) => (
            <View>
              {index === 0 && (
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionAccent} />
                  <Ionicons name="flame" size={18} color={palette.green} />
                  <Text style={styles.sectionTitle}>{p.trending}</Text>
                  <View style={styles.sectionCount}><Text style={styles.sectionCountText}>{popular.length}</Text></View>
                </View>
              )}
              <MediaCard item={item} onPress={handlePress} />
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = (p) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingTop: spacing.sm, paddingBottom: 80 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: p.greyLight,
    marginBottom: spacing.sm,
  },
  sectionAccent: { width: 4, height: 20, borderRadius: 2, backgroundColor: p.green },
  sectionTitle: { color: p.dark, fontSize: typography.lg, fontWeight: '700', flex: 1 },
  sectionCount: { backgroundColor: `${p.green}10`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  sectionCountText: { color: p.green, fontSize: typography.xs, fontWeight: '700' },
  emptyIconBox: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
});
