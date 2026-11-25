import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Keyboard, Linking, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Image from '../src/components/CachedImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../src/components/BottomNav';
import { useSettings } from '../src/contexts/SettingsContext';
import { useTheme } from '../src/contexts/ThemeContext';
import api, { whatsappUrl } from '../src/utils/api';
import { adaptProduct, adaptProductCategory } from '../src/utils/adapters';
import { radius, spacing, typography } from '../src/utils/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const GAP = spacing.md;
const CARD_W = Math.min((SCREEN_W - spacing.md * 2 - GAP) / 2, 260);
const PER_PAGE = 12;

function ProductCard({ item, styles, palette, onOpen, onOrder }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onOpen(item)} activeOpacity={0.9}>
      <View style={styles.cardImageWrap}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="contain" />
        ) : (
          <Ionicons name="leaf-outline" size={40} color={palette.green} />
        )}
        <View style={styles.badges}>
          {item.vedette ? <Text style={[styles.badge, styles.badgeGold]}>Vedette</Text> : null}
          {item.is_new ? <Text style={[styles.badge, styles.badgeGreen]}>Nouveau</Text> : null}
        </View>
        {!item.in_stock ? <View style={styles.outOfStock}><Text style={styles.outOfStockText}>Rupture de stock</Text></View> : null}
      </View>
      <View style={styles.cardBody}>
        {item.category_name ? <Text style={styles.cardCat} numberOfLines={1}>{item.category_name}</Text> : null}
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={[styles.cardPrice, !item.has_price && styles.cardPriceAsk]} numberOfLines={1}>{item.price}</Text>
        <Text style={styles.cardPrice2} numberOfLines={1}>{item.price_secondary || ' '}</Text>
        <TouchableOpacity style={styles.orderBtn} onPress={() => onOrder(item)} activeOpacity={0.85}>
          <Ionicons name="logo-whatsapp" size={15} color="#fff" />
          <Text style={styles.orderText}>Commander</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function ProduitsScreen() {
  const { palette } = useTheme();
  const styles = useMemo(() => cs(palette), [palette]);
  const insets = useSafeAreaInsets();
  const settings = useSettings();

  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const reqId = useRef(0);
  const debounce = useRef(null);

  useEffect(() => {
    api.getProductCategories()
      .then((res) => { if (res?.success) setCategories((res.data || []).map(adaptProductCategory).filter((c) => c.product_count > 0)); })
      .catch(() => {});
    api.getFeaturedProducts(8)
      .then((res) => { if (res?.success) setFeatured((res.data?.items || []).map((item) => adaptProduct(item))); })
      .catch(() => {});
  }, []);

  const load = useCallback(async (pageToLoad) => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProducts({
        page: pageToLoad, perPage: PER_PAGE, tri: 'recent',
        categorie: category === 'all' ? undefined : category,
        q: search || undefined,
      });
      if (id !== reqId.current) return;
      if (res?.success) {
        const items = (res.data?.items || []).map((item) => adaptProduct(item));
        setProducts((prev) => (pageToLoad === 1 ? items : [...prev, ...items]));
        setPages(res.data?.meta?.pages ?? 1);
        setTotal(res.data?.meta?.total ?? items.length);
        setPage(pageToLoad);
      }
    } catch (e) {
      if (id === reqId.current) setError(e.message);
    } finally {
      if (id === reqId.current) { setLoading(false); setRefreshing(false); }
    }
  }, [category, search]);

  useEffect(() => { Promise.resolve().then(() => load(1)); }, [load]);

  const onChangeQuery = (text) => {
    setQuery(text);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setSearch(text.trim().length >= 2 ? text.trim() : ''), 400);
  };

  const clearQuery = () => { clearTimeout(debounce.current); setQuery(''); setSearch(''); Keyboard.dismiss(); };

  const open = (item) => router.push({ pathname: '/product-detail', params: { slug: item.slug || item.id } });
  const order = (item) => router.push({ pathname: '/product-detail', params: { slug: item.slug || item.id, commander: '1' } });

  const askAdvice = () => {
    const msg = `Bonjour ${settings.app_name} ${settings.app_subtitle}, j'aimerais un conseil pour choisir un produit.`;
    Linking.openURL(whatsappUrl(settings.contact?.whatsapp, msg)).catch(() => {});
  };

  const loadMore = () => { if (!loading && page < pages) load(page + 1); };
  const filtering = category !== 'all' || !!search;

  const header = (
    <View>
      <View style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroKicker}>Boutique</Text>
            <Text style={styles.heroTitle}>Notre catalogue</Text>
          </View>
          <TouchableOpacity style={styles.heroWa} onPress={askAdvice} activeOpacity={0.85}>
            <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.heroSub}>Des produits naturels à base de plantes médicinales, commandés en ligne et confirmés sur WhatsApp.</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={palette.greyDark} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit, une indication…"
            placeholderTextColor={palette.grey}
            value={query}
            onChangeText={onChangeQuery}
            returnKeyType="search"
            onSubmitEditing={() => { clearTimeout(debounce.current); setSearch(query.trim()); Keyboard.dismiss(); }}
          />
          {query ? (
            <TouchableOpacity onPress={clearQuery}><Ionicons name="close-circle" size={18} color={palette.grey} /></TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.trust}>
        {[['leaf-outline', 'Naturel'], ['shield-checkmark-outline', 'Certifié'], ['logo-whatsapp', 'Via WhatsApp']].map(([icon, label]) => (
          <View key={label} style={styles.trustItem}>
            <Ionicons name={icon} size={15} color={palette.green} />
            <Text style={styles.trustText}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {[{ slug: 'all', name: 'Tous', product_count: null }, ...categories].map((cat) => {
          const active = category === cat.slug;
          return (
            <TouchableOpacity key={cat.slug} style={[styles.chip, active && styles.chipActive]} onPress={() => setCategory(cat.slug)} activeOpacity={0.8}>
              {cat.slug === 'all' ? <Ionicons name="grid-outline" size={13} color={active ? '#fff' : palette.dark} /> : null}
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{cat.name}</Text>
              {cat.product_count ? <Text style={[styles.chipCount, active && styles.chipTextActive]}>{cat.product_count}</Text> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {!filtering && featured.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="star" size={16} color={palette.gold} />
            <Text style={styles.sectionTitle}>En vedette</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
            {featured.map((item) => (
              <TouchableOpacity key={item.slug || item.id} style={styles.featured} onPress={() => open(item)} activeOpacity={0.9}>
                <View style={styles.featuredImgWrap}>
                  {item.image ? <Image source={{ uri: item.image }} style={styles.featuredImg} resizeMode="contain" /> : null}
                </View>
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.featuredPrice}>{item.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {total != null ? `${total} produit${total > 1 ? 's' : ''}` : ''}
          {search ? ` pour « ${search} »` : ''}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item, index) => String(item.slug || item.id || index)}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <ProductCard item={item} styles={styles} palette={palette} onOpen={open} onOrder={order} />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color={palette.green} />
        ) : (
          <View style={styles.empty}>
            <Ionicons name={error ? 'cloud-offline-outline' : 'cube-outline'} size={40} color={error ? palette.red : palette.grey} />
            <Text style={styles.emptyText}>{error ? 'Vous êtes hors connexion' : 'Aucun produit trouvé'}</Text>
            {error ? (
              <TouchableOpacity style={styles.retry} onPress={() => load(1)}><Text style={styles.retryText}>Réessayer</Text></TouchableOpacity>
            ) : null}
          </View>
        )}
        ListFooterComponent={loading && products.length > 0
          ? <ActivityIndicator style={{ paddingVertical: spacing.lg }} color={palette.green} />
          : <View style={{ height: 100 }} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1); }} tintColor={palette.green} colors={[palette.green]} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      <BottomNav />
    </View>
  );
}

const cs = (p) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.whiteOff },
  hero: { backgroundColor: p.greenDark, paddingHorizontal: spacing.base, paddingBottom: spacing.xl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  heroKicker: { color: p.goldLight, fontSize: typography.sm, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 2 },
  heroWa: { width: 44, height: 44, borderRadius: 22, backgroundColor: p.whatsapp, justifyContent: 'center', alignItems: 'center' },
  heroSub: { color: 'rgba(255,255,255,0.82)', fontSize: typography.sm + 1, lineHeight: 19, marginTop: spacing.sm, marginBottom: spacing.md },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff',
    borderRadius: radius.full, paddingHorizontal: spacing.md, height: 46,
  },
  searchInput: { flex: 1, color: p.dark, fontSize: typography.base, paddingVertical: 0 },

  trust: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: p.white, marginHorizontal: spacing.md, marginTop: -16, borderRadius: radius.md, paddingVertical: 10, borderWidth: 1, borderColor: p.greyLight },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { color: p.darkLight, fontSize: typography.xs + 1, fontWeight: '600' },

  chips: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14,
    borderRadius: radius.full, backgroundColor: p.white, borderWidth: 1, borderColor: p.greyLight, maxWidth: 240,
  },
  chipActive: { backgroundColor: p.green, borderColor: p.green },
  chipText: { color: p.dark, fontSize: typography.sm + 1, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  chipCount: { color: p.greyDark, fontSize: typography.xs, fontWeight: '700' },

  section: { marginTop: spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  sectionTitle: { color: p.dark, fontSize: typography.lg, fontWeight: '800' },
  featuredRow: { gap: spacing.md, paddingHorizontal: spacing.md },
  featured: { width: 270, flexDirection: 'row', backgroundColor: p.white, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: `${p.gold}66` },
  featuredImgWrap: { width: 96, height: 96, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  featuredImg: { width: 88, height: 88 },
  featuredInfo: { flex: 1, padding: spacing.sm, justifyContent: 'center' },
  featuredTitle: { color: p.dark, fontSize: typography.sm + 1, fontWeight: '700' },
  featuredPrice: { color: p.green, fontSize: typography.base, fontWeight: '800', marginTop: 4 },

  countRow: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  countText: { color: p.greyDark, fontSize: typography.sm, fontWeight: '600' },

  row: { gap: GAP, paddingHorizontal: spacing.md, marginBottom: GAP },
  card: { width: CARD_W, backgroundColor: p.white, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: p.greyLight },
  cardImageWrap: { width: '100%', aspectRatio: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  cardImage: { width: '88%', height: '88%' },
  badges: { position: 'absolute', top: 8, right: 8, gap: 4, alignItems: 'flex-end' },
  badge: { fontSize: 10, fontWeight: '800', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, overflow: 'hidden', color: '#fff' },
  badgeGold: { backgroundColor: p.gold, color: p.dark },
  badgeGreen: { backgroundColor: p.greenLight },
  outOfStock: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 4 },
  outOfStockText: { color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  cardBody: { padding: spacing.sm + 2 },
  cardCat: { color: p.gold, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
  cardTitle: { color: p.dark, fontSize: typography.sm + 1, fontWeight: '700', lineHeight: 18, minHeight: 36 },
  cardPrice: { color: p.green, fontSize: typography.md + 1, fontWeight: '900', marginTop: 6 },
  cardPriceAsk: { color: p.goldDark, fontSize: typography.sm + 1 },
  cardPrice2: { color: p.greyDark, fontSize: typography.xs },
  orderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.sm,
    backgroundColor: p.whatsapp, borderRadius: radius.sm, paddingVertical: 9,
  },
  orderText: { color: '#fff', fontSize: typography.sm, fontWeight: '800' },

  empty: { alignItems: 'center', paddingTop: 40, gap: spacing.sm },
  emptyText: { color: p.greyDark, fontSize: typography.base },
  retry: { backgroundColor: p.green, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.full },
  retryText: { color: '#fff', fontWeight: '700' },
});
