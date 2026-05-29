// app/medias.jsx
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BottomNav from '../src/components/BottomNav';
import CategoryChips from '../src/components/CategoryChips';
import Header from '../src/components/Header';
import MediaCard from '../src/components/MediaCard';
import { useMedias } from '../src/hooks/useMedias';
import { colors, spacing } from '../src/utils/theme';

const TYPE_TABS = ['all', 'video', 'audio', 'pdf'];

export default function MediasScreen() {
  const [selectedTab, setSelectedTab] = useState('all');

  const isTypeTab = TYPE_TABS.includes(selectedTab);
  const typeParam     = isTypeTab ? selectedTab : 'all';
  const categoryParam = !isTypeTab ? selectedTab : undefined;

  const { data = [], loading, refreshing, loadingMore, refresh, loadMore } = useMedias({
    type: typeParam,
    category: categoryParam,
    limit: 20,
  });

  const handlePress = useCallback((item) => {
    if (item.type === 'document') {
      const url = item.fichier || item.lien;
      if (url) Linking.openURL(url);
    } else {
      router.push({
        pathname: '/PlayerScreen',
        params: { id: item.id_media, slug: item.slug },
      });
    }
  }, []);

  const renderItem = useCallback(
    ({ item }) => <MediaCard item={item} onPress={handlePress} />,
    [handlePress]
  );

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: spacing.xxl }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Aucun média disponible</Text>
      </View>
    );
  };

  // Pas de categories dynamiques → uniquement les 4 onglets fixes
  const ListHeader = useCallback(
    () => (
      <CategoryChips
        selected={selectedTab}
        onSelect={setSelectedTab}
      />
    ),
    [selectedTab]
  );

  return (
    <View style={styles.root}>
      <Header />

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id_media)}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        stickyHeaderIndices={[0]}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />

      {loading && data.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  list: {
    paddingTop: spacing.sm,
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
});