import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, FlatList, Keyboard, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import BottomNav from '../src/components/BottomNav';
import CategoryChips from '../src/components/CategoryChips';
import MediaCard from '../src/components/MediaCard';
import { useSettings } from '../src/contexts/SettingsContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { useMedias } from '../src/hooks/useMedias';
import { spacing, typography } from '../src/utils/theme';

const TYPE_TABS = ['all', 'video', 'audio', 'pdf'];

function SearchBar({ query, onChange, onSearch, onClose, palette }) {
  const inputRef = useRef(null);
  const slideAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1, useNativeDriver: true, friction: 9, tension: 50,
    }).start();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [slideAnim]);

  const onClosePress = () => {
    Animated.timing(slideAnim, {
      toValue: 0, duration: 180, useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <Animated.View style={{
      paddingHorizontal: spacing.lg, marginBottom: spacing.md, marginTop: spacing.sm,
      transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      opacity: slideAnim,
    }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: palette.whiteOff, borderRadius: 14,
        height: 48, borderWidth: 1, borderColor: palette.greyLight,
      }}>
        <TouchableOpacity onPress={onSearch} activeOpacity={0.7} style={{ paddingLeft: 14, paddingRight: 6, height: 48, justifyContent: 'center' }}>
          <Ionicons name="search" size={20} color={palette.green} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={onChange}
          placeholder="Rechercher un média..."
          placeholderTextColor={palette.grey}
          returnKeyType="search"
          onSubmitEditing={onSearch}
          style={{ flex: 1, paddingHorizontal: 8, color: palette.dark, fontSize: 14, fontWeight: '500', height: 48 }}
        />
        <TouchableOpacity activeOpacity={0.7} style={{
          flexDirection: 'row', alignItems: 'center', gap: 5,
          backgroundColor: palette.white, borderRadius: 10,
          paddingHorizontal: 12, paddingVertical: 8, marginRight: 5,
          borderWidth: 1, borderColor: palette.greyLight,
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
        }}>
          <Ionicons name="options-outline" size={16} color={palette.green} />
          <Text style={{ color: palette.dark, fontSize: 12, fontWeight: '600' }}>Filtrer</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClosePress} activeOpacity={0.7} style={{ paddingHorizontal: 10, height: 48, justifyContent: 'center' }}>
          <Ionicons name="close" size={20} color={palette.grey} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function MediasScreen() {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  const m = useSettings().media;
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  const isTypeTab = TYPE_TABS.includes(selectedTab);
  const typeParam = isTypeTab ? selectedTab : 'all';
  const categoryParam = !isTypeTab ? selectedTab : undefined;

  const { data = [], loading, refreshing, loadingMore, error: fetchError, refresh, loadMore } = useMedias({
    type: typeParam,
    category: categoryParam,
    limit: 20,
    q: searchTerm || undefined,
  });

  const handlePress = useCallback((item) => {
    router.push({
      pathname: '/PlayerScreen',
      params: { slug: item.slug || item.id_media },
    });
  }, []);

  const handleSearch = useCallback(() => {
    Keyboard.dismiss();
    setSearchTerm(searchQuery.trim());
  }, [searchQuery]);

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
    if (searchTerm.trim() && data.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIconBox, { backgroundColor: `${palette.gold}10` }]}>
            <Ionicons name="search-outline" size={32} color={palette.gold} />
          </View>
          <Text style={[styles.emptyTitle, { color: palette.dark }]}>Aucun résultat</Text>
          <Text style={styles.emptySub}>Aucun média trouvé pour « {searchTerm} »</Text>
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
      <CategoryChips selected={selectedTab} onSelect={setSelectedTab} onSearchPress={() => setSearchVisible(v => !v)} searchActive={searchVisible} />
    ),
    [selectedTab, searchVisible]
  );

  return (
    <View style={styles.root}>
      <View style={styles.topSection}>
        <Text style={styles.pageTitle}>{m.title}</Text>
        <Text style={styles.pageSub}>{m.subtitle}</Text>
      </View>

      {searchVisible && <SearchBar query={searchQuery} onChange={setSearchQuery} onSearch={handleSearch} onClose={() => { setSearchQuery(''); setSearchTerm(''); setSearchVisible(false); }} palette={palette} />}

      <FlatList
        data={data}
        keyExtractor={(item, index) => (item.slug ? String(item.slug) : `idx-${index}`)}
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

      <TouchableOpacity onPress={() => router.push('/login')} activeOpacity={0.85} style={{
        position: 'absolute', bottom: 120, right: 20,
        width: 54, height: 54, borderRadius: 27,
        backgroundColor: palette.green,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: palette.green, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
        zIndex: 999,
      }}>
        <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
      </TouchableOpacity>
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
  list: { paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  footerLoader: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.xl },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${p.green}08`, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontSize: typography.lg, fontWeight: '700', color: p.dark, marginBottom: spacing.xs, textAlign: 'center' },
  emptySub: { fontSize: typography.sm, color: p.greyDark, textAlign: 'center', lineHeight: 18 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: p.white },
});

