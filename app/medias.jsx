import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View,
} from 'react-native';
import BottomNav from '../src/components/BottomNav';
import CategoryChips from '../src/components/CategoryChips';
import MediaCard from '../src/components/MediaCard';
import { useSettings } from '../src/contexts/SettingsContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { useMedias } from '../src/hooks/useMedias';
import { spacing, typography } from '../src/utils/theme';

const TYPE_TABS = ['all', 'video', 'audio', 'pdf'];

export default function MediasScreen() {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  const m = useSettings().media;
  const [selectedTab, setSelectedTab] = useState('all');

  const isTypeTab = TYPE_TABS.includes(selectedTab);
  const typeParam = isTypeTab ? selectedTab : 'all';
  const categoryParam = !isTypeTab ? selectedTab : undefined;

  const { data = [], loading, refreshing, loadingMore, error: fetchError, refresh, loadMore } = useMedias({
    type: typeParam,
    category: categoryParam,
    limit: 20,
  });

  const handlePress = useCallback((item) => {
    router.push({
      pathname: '/PlayerScreen',
      params: { id: item.id_media, slug: item.slug },
    });
  }, []);

  const renderItem = useCallback(
    ({ item }) => <MediaCard item={item} onPress={handlePress} />,
    [handlePress]
  );

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: spacing.xxl }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={palette.green} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    if (fetchError) {
      return (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIconBox, { backgroundColor: `${palette.red}08` }]}>
            <Ionicons name="cloud-offline-outline" size={32} color={palette.red} />
          </View>
          <Text style={[styles.emptyTitle, { color: palette.dark }]}>Vous êtes hors connexion</Text>
          <Text style={styles.emptySub}>Connectez-vous à Internet pour voir les médias</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconBox}>
          <Text style={styles.emptyEmoji}>🎬</Text>
        </View>
        <Text style={styles.emptyTitle}>Aucun média disponible</Text>
        <Text style={styles.emptySub}>Explorez d&apos;autres catégories ou revenez plus tard</Text>
      </View>
    );
  };

  const ListHeader = useCallback(
    () => (
      <CategoryChips selected={selectedTab} onSelect={setSelectedTab} />
    ),
    [selectedTab]
  );

  return (
    <View style={styles.root}>
      <View style={styles.topSection}>
        <Text style={styles.pageTitle}>{m.title}</Text>
        <Text style={styles.pageSub}>{m.subtitle}</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id_media)}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={palette.green}
            colors={[palette.green]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />

      {loading && data.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={palette.green} />
        </View>
      )}

      <BottomNav />
    </View>
  );
}

const s = (p) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.white },
  topSection: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md,
    backgroundColor: p.white, borderBottomWidth: 1, borderBottomColor: p.greyLight,
  },
  pageTitle: { fontSize: 28, fontWeight: '900', color: p.dark, letterSpacing: 0.5 },
  pageSub: { fontSize: typography.sm, color: p.greyDark, marginTop: 2 },
  list: { paddingTop: spacing.sm },
  footerLoader: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 100, paddingHorizontal: spacing.xl },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${p.green}08`, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontSize: typography.lg, fontWeight: '700', color: p.dark, marginBottom: spacing.xs, textAlign: 'center' },
  emptySub: { fontSize: typography.sm, color: p.greyDark, textAlign: 'center', lineHeight: 18 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: p.white },
});

