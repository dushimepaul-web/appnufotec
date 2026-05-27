// app/produits.jsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Keyboard,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../src/components/BottomNav';
import api from '../src/utils/api';
import { colors, radius, spacing, typography } from '../src/utils/theme';

export default function ProduitsScreen() {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const inputRef = useRef(null);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (!isSearchMode) loadProducts();
  }, [page, isSearchMode]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await api.getProducts({ page, limit: 10 });
      if (response.success) {
        setProducts(prev => page === 1 ? response.data : [...prev, ...response.data]);
        setTotalPages(response.pagination.total_pages);
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    clearTimeout(searchTimer.current);
    if (text.length < 2) {
      setSearchResults([]);
      setIsSearchMode(false);
      return;
    }
    setIsSearchMode(true);
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const response = await api.getProducts({ search: text, limit: 30 });
        if (response.success) setSearchResults(response.data);
      } catch (e) {
        console.error('Erreur recherche:', e);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchMode(false);
    Keyboard.dismiss();
  };

  const handleProductPress = (product) => {
    router.push({ pathname: '/product-detail', params: { id: product.id, slug: product.slug } });
  };

  const loadMore = () => {
    if (!loading && page < totalPages) setPage(prev => prev + 1);
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => handleProductPress(item)} activeOpacity={0.85}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      {item.in_vedette === 1 && (
        <View style={styles.featuredBadge}>
          <Ionicons name="star" size={10} color="#fff" />
          <Text style={styles.featuredText}>Vedette</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.productPrice}>{item.price} BIF</Text>
        <TouchableOpacity style={styles.detailBtn} onPress={() => handleProductPress(item)}>
          <Text style={styles.detailBtnText}>Voir les détails</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.accent} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const displayData = isSearchMode ? searchResults : products;

  // Loader initial
  if (loading && page === 1 && !isSearchMode) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Produits</Text>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un produit…"
                placeholderTextColor={colors.textMuted}
                editable={false}
              />
            </View>
          </View>
        </View>
        <View style={styles.centerWhite}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Chargement des produits…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Header noir */}
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Produits</Text>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder="Rechercher un produit…"
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={handleSearch}
                returnKeyType="search"
                onSubmitEditing={Keyboard.dismiss}
                clearButtonMode="never"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Zone blanche */}
        <View style={styles.whiteArea}>
          {searching ? (
            <View style={styles.centerWhite}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : isSearchMode && searchResults.length === 0 ? (
            <View style={styles.centerWhite}>
              <Ionicons name="search-outline" size={52} color="#ccc" />
              <Text style={styles.emptyText}>Aucun résultat pour « {searchQuery} »</Text>
            </View>
          ) : (
            <FlatList
              data={displayData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderProduct}
              onEndReached={!isSearchMode ? loadMore : undefined}
              onEndReachedThreshold={0.5}
              keyboardShouldPersistTaps="handled"
              ListFooterComponent={
                loading && page > 1 && !isSearchMode
                  ? <ActivityIndicator style={styles.footerLoader} color={colors.accent} />
                  : <View style={{ height: 80 }} />
              }
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.centerWhite}>
                    <Text style={styles.emptyText}>Aucun produit disponible</Text>
                  </View>
                ) : null
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },

  // Header noir
  header: {
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.xl,
    fontWeight: '800',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sm,
    paddingVertical: 0,
  },
  clearBtn: { padding: 2 },

  // Zone blanche sous le header
  whiteArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerWhite: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#f5f5f5',
  },

  listContent: {
    padding: spacing.md,
    paddingBottom: 80,
  },

  // Carte produit
  productCard: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  featuredText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  productInfo: { padding: spacing.md },
  productTitle: {
    fontSize: typography.base,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: typography.lg,
    fontWeight: '800',
    color: '#4CAF50',
    marginBottom: spacing.sm,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f5f5f5',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  detailBtnText: {
    color: colors.accent,
    fontSize: typography.sm,
    fontWeight: '600',
  },

  footerLoader: { paddingVertical: spacing.lg },
  loadingText: { color: '#666', marginTop: spacing.sm },
  emptyText: { color: '#999', fontSize: 15, textAlign: 'center' },
});
