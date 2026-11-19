import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../src/components/BottomNav';
import { useSettings } from '../src/contexts/SettingsContext';
import { useTheme } from '../src/contexts/ThemeContext';
import api from '../src/utils/api';
import { adaptProduct, adaptProductCategory } from '../src/utils/adapters';
import { radius, spacing, typography } from '../src/utils/theme';

export default function ProduitsScreen() {
  const { palette } = useTheme();
  const styles = useMemo(() => cs(palette), [palette]);
  const insets = useSafeAreaInsets();
  const s = useSettings().products;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const inputRef = useRef(null);
  const searchTimer = useRef(null);
  const searchReq = useRef(0);

  useEffect(() => {
    api.getProductCategories()
      .then(res => { if (res.success) setCategories((res.data || []).map(adaptProductCategory)); })
      .catch(() => {});
    api.getFeaturedProducts(6)
      .then(res => { if (res.success) setFeatured((res.data?.items || []).map((item) => adaptProduct(item))); })
      .catch(() => {});
  }, []);

  const handleCategorySelect = (catSlug) => {
    if (catSlug === selectedCategory) return;
    setSelectedCategory(catSlug);
    setPage(1);
    setProducts([]);
    setFetchError(null);
    setLoading(true);
  };

  const loadProducts = useCallback(async () => {
    try {
      const response = await api.getProducts({
        page, perPage: 10,
        categorie: selectedCategory === 'all' ? undefined : selectedCategory,
      });
      if (response.success) {
        const items = (response.data?.items || []).map((item) => adaptProduct(item));
        setProducts(prev => page === 1 ? items : [...prev, ...items]);
        setTotalPages(response.data?.meta?.pages ?? 1);
      }
    } catch (error) { setFetchError(error.message); console.error('Erreur chargement produits:', error);
    } finally { setLoading(false); }
  }, [page, selectedCategory]);

  useEffect(() => {
    Promise.resolve().then(() => { if (!isSearchMode) loadProducts(); });
  }, [isSearchMode, loadProducts]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    clearTimeout(searchTimer.current);
    if (text.length < 2) {
      searchReq.current += 1;
      setSearching(false);
      if (isSearchMode) { setPage(1); setProducts([]); setLoading(true); }
      setSearchResults([]);
      setIsSearchMode(false);
      return;
    }
    setIsSearchMode(true);
    setSearching(true);
    const reqId = ++searchReq.current;
    searchTimer.current = setTimeout(async () => {
      try {
        const response = await api.getProducts({ q: text, perPage: 30 });
        if (reqId !== searchReq.current) return;
        if (response.success) setSearchResults((response.data?.items || []).map((item) => adaptProduct(item)));
      } catch (e) { console.error('Erreur recherche:', e);
      } finally { if (reqId === searchReq.current) setSearching(false); }
    }, 350);
  };

  const clearSearch = () => {
    clearTimeout(searchTimer.current);
    searchReq.current += 1;
    setSearching(false);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchMode(false);
    setPage(1);
    setProducts([]);
    setLoading(true);
    Keyboard.dismiss();
  };

  const handleProductPress = (product) => {
    router.push({ pathname: '/product-detail', params: { slug: product.slug || product.id } });
  };

  const loadMore = () => { if (!loading && page < totalPages) { setLoading(true); setPage(prev => prev + 1); } };

  const renderProduct = ({ item }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => handleProductPress(item)} activeOpacity={0.85}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
        {item.in_vedette === 1 && (
          <View style={[styles.featuredBadge, { backgroundColor: palette.gold }]}>
            <Ionicons name="star" size={11} color={palette.white} />
            <Text style={styles.featuredText}>{s.featured_text}</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.productPrice}>{item.price}</Text>
        <TouchableOpacity style={styles.detailBtn} onPress={() => handleProductPress(item)}>
          <Text style={styles.detailBtnText}>{s.detail_button}</Text>
          <Ionicons name="arrow-forward" size={14} color={palette.green} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const displayData = isSearchMode ? searchResults : products;

  const ListHeader = () => (
    <View>
      {featured.length > 0 && !isSearchMode && (
        <View style={styles.featuredSection}>
          <Text style={styles.featuredTitle}>En vedette</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
            {featured.map((item) => (
              <TouchableOpacity key={String(item.slug || item.id)} style={styles.featuredCard} onPress={() => handleProductPress(item)} activeOpacity={0.85}>
                <Image source={{ uri: item.image }} style={styles.featuredImage} />
                <View style={styles.featuredOverlay} />
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredCardTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.featuredCardPrice}>{item.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {categories.length > 0 && !isSearchMode && (
        <View style={styles.catRow}>
          <TouchableOpacity
            style={[styles.catChip, selectedCategory === 'all' && styles.catChipActive]}
            onPress={() => handleCategorySelect('all')}
            activeOpacity={0.75}
          >
            <Text style={[styles.catChipText, selectedCategory === 'all' && styles.catChipTextActive]}>Tout</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={String(cat.slug || cat.id)}
              style={[styles.catChip, selectedCategory === cat.slug && styles.catChipActive]}
              onPress={() => handleCategorySelect(cat.slug)}
              activeOpacity={0.75}
            >
              <Text style={[styles.catChipText, selectedCategory === cat.slug && styles.catChipTextActive]}>{cat.name}</Text>
              {cat.product_count ? (
                <Text style={[styles.catChipCount, selectedCategory === cat.slug && styles.catChipCountActive]}>{cat.product_count}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  if (loading && page === 1 && !isSearchMode) {
    return (
      <View style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <Text style={styles.headerTitle}>{s.title}</Text>
        </View>
        <View style={styles.centerWhite}><ActivityIndicator size="large" color={palette.green} /></View>
        <BottomNav />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>{s.title}</Text>
              <Text style={styles.headerSub}>Découvrez notre gamme</Text>
            </View>
          </View>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={palette.grey} />
            <TextInput ref={inputRef} style={styles.searchInput} placeholder={s.search_placeholder}
              placeholderTextColor={palette.grey} value={searchQuery} onChangeText={handleSearch}
              returnKeyType="search" onSubmitEditing={Keyboard.dismiss} clearButtonMode="never" />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color={palette.grey} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.whiteArea}>
          {searching ? (
            <View style={styles.centerWhite}><ActivityIndicator size="large" color={palette.green} /></View>
          ) : isSearchMode && searchResults.length === 0 ? (
            <View style={styles.centerWhite}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="search-outline" size={36} color={palette.grey} />
              </View>
              <Text style={styles.emptyText}>Aucun résultat pour « {searchQuery} »</Text>
            </View>
          ) : (
            <FlatList
              data={displayData} keyExtractor={(item, index) => (item.id != null ? String(item.id) : `idx-${index}`)} renderItem={renderProduct}
              onEndReached={!isSearchMode ? loadMore : undefined} onEndReachedThreshold={0.5}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={ListHeader}
              ListFooterComponent={loading && page > 1 && !isSearchMode
                ? <ActivityIndicator style={styles.footerLoader} color={palette.green} />
                : <View style={{ height: 80 }} />}
              ListEmptyComponent={!loading ? (
                <View style={styles.centerWhite}>
                  <View style={[styles.emptyIconBox, { backgroundColor: fetchError ? `${palette.red}08` : palette.whiteOff }]}>
                    <Ionicons name={fetchError ? 'cloud-offline-outline' : 'cube-outline'} size={36} color={fetchError ? palette.red : palette.grey} />
                  </View>
                  <Text style={styles.emptyText}>{fetchError ? 'Vous êtes hors connexion' : 'Aucun produit disponible'}</Text>
                  {fetchError ? <Text style={[styles.emptyText, { fontSize: 12, color: palette.grey }]}>Connectez-vous à Internet pour voir les produits</Text> : null}
                </View>
              ) : null}
              contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}
            />
          )}
        </View>
        <BottomNav />
      </View>
    </View>
  );
}

const cs = (p) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: p.white },
  container: { flex: 1, backgroundColor: p.white },
  header: { backgroundColor: p.white, paddingHorizontal: spacing.base, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: p.greyLight },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  headerTitle: { fontSize: typography.xl, fontWeight: '800', color: p.dark },
  headerSub: { fontSize: typography.xs, color: p.greyDark, marginTop: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: p.whiteOff, borderRadius: radius.full, paddingHorizontal: spacing.md, height: 40, borderWidth: 1, borderColor: p.greyLight, gap: 6 },
  searchInput: { flex: 1, color: p.dark, fontSize: typography.sm, paddingVertical: 0 },
  clearBtn: { padding: 2 },
  whiteArea: { flex: 1, backgroundColor: p.white },
  featuredSection: { marginBottom: spacing.sm },
  featuredTitle: { fontSize: typography.base, fontWeight: '700', color: p.dark, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  featuredRow: { paddingHorizontal: spacing.md, gap: spacing.sm },
  featuredCard: { width: 220, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: p.white, borderWidth: 1, borderColor: p.greyLight },
  featuredImage: { width: '100%', height: 110, resizeMode: 'cover' },
  featuredOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: 'rgba(0,0,0,0.35)' },
  featuredInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.sm },
  featuredCardTitle: { color: '#fff', fontSize: typography.sm, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  featuredCardPrice: { color: '#fff', fontSize: typography.sm, fontWeight: '800', marginTop: 2 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: p.whiteOff, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderWidth: 1, borderColor: p.greyLight,
  },
  catChipActive: { backgroundColor: p.green, borderColor: p.green },
  catChipText: { color: p.greyDark, fontSize: typography.sm, fontWeight: '600' },
  catChipTextActive: { color: p.white, fontWeight: '700' },
  catChipCount: { color: p.grey, fontSize: typography.xs, fontWeight: '600' },
  catChipCountActive: { color: 'rgba(255,255,255,0.8)' },
  centerWhite: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, backgroundColor: p.white },
  listContent: { padding: spacing.md, paddingBottom: 80 },
  productCard: {
    backgroundColor: p.white, borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden',
    borderWidth: 1, borderColor: p.greyLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  imageWrap: { position: 'relative' },
  productImage: { width: '100%', height: 200, resizeMode: 'cover' },
  featuredBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  featuredText: { color: p.white, fontSize: 10, fontWeight: '700' },
  productInfo: { padding: spacing.md },
  productTitle: { fontSize: typography.base, fontWeight: '700', color: p.dark, marginBottom: spacing.xs, lineHeight: 20 },
  productPrice: { fontSize: typography.lg, fontWeight: '800', color: p.green, marginBottom: spacing.sm },
  detailBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: p.whiteOff, paddingVertical: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: p.greyLight },
  detailBtnText: { color: p.green, fontSize: typography.sm, fontWeight: '600' },
  footerLoader: { paddingVertical: spacing.lg },
  emptyIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: p.whiteOff, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: p.greyLight },
  emptyText: { color: p.grey, fontSize: 15, textAlign: 'center' },
});
