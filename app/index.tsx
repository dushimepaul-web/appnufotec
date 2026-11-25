import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Image from '../src/components/CachedImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../src/components/BottomNav';
import MediaCard from '../src/components/MediaCard';
import ThemeToggle from '../src/components/ThemeToggle';
import { useNotifications } from '../src/contexts/NotificationContext';
import { useSettings } from '../src/contexts/SettingsContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { useRecent } from '../src/hooks/useMedias';
import api, { whatsappUrl } from '../src/utils/api';
import { adaptProduct } from '../src/utils/adapters';
import { formatNumber } from '../src/utils/format';
import { BRAND, mix, radius, spacing, typography } from '../src/utils/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const LOGO = require('../assets/logo.png');

type Service = { key: string; title: string; desc: string; icon: string; route: string };
const SERVICES: Service[] = [
  { key: 'medias', title: 'Médias santé', desc: 'Vidéos, audios et documents', icon: 'play-circle-outline', route: '/medias' },
  { key: 'consultation', title: 'Consultation', desc: 'Parlez à un expert en santé naturelle', icon: 'medkit-outline', route: '/consultation' },
  { key: 'produits', title: 'Boutique', desc: 'Produits naturels livrés chez vous', icon: 'leaf-outline', route: '/produits' },
  { key: 'temoignages', title: 'Témoignages', desc: 'Ils ont retrouvé la santé', icon: 'chatbubbles-outline', route: '/temoignages' },
];

const SLIDE_W = SCREEN_W - spacing.lg * 2;

function SectionHeader({ title, action, onPress, styles }: any) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={onPress} style={styles.sectionAction} activeOpacity={0.7}>
          <Text style={styles.sectionActionText}>{action}</Text>
          <Ionicons name="chevron-forward" size={14} color={styles.sectionActionText.color} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const { palette } = useTheme();
  const styles = useMemo(() => cs(palette), [palette]);
  const insets = useSafeAreaInsets();
  const s = useSettings();
  const { unreadCount } = useNotifications();
  const { data: recent } = useRecent(10);

  const [mediaCount, setMediaCount] = useState<number | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  // Données réelles de l'API : compteurs, produits phares, témoignages.
  useEffect(() => {
    // Chaque bloc s'affiche d'abord avec la copie gardée (onCached), puis avec la version à jour.
    // Au démarrage, ces trois adresses sont servies par la requête groupée /accueil (api.warmup).
    const showCategories = (res: any) => {
      if (!res?.success || !Array.isArray(res.data)) return;
      setMediaCount(res.data.reduce((n: number, c: any) => n + (Number(c.medias) || 0), 0));
    };
    const showProducts = (res: any) => {
      if (!res?.success) return;
      setProducts((res.data?.items || []).map((p: any) => adaptProduct(p)));
      setProductCount(res.data?.meta?.total ?? null);
    };
    const showTestimonials = (res: any) => { if (res?.success && Array.isArray(res.data)) setTestimonials(res.data); };
    api.getMediaCategories({ onCached: showCategories }).then(showCategories).catch(() => {});
    api.getProducts({ perPage: 8 }, { onCached: showProducts }).then(showProducts).catch(() => {});
    api.getTestimonials({ onCached: showTestimonials }).then(showTestimonials).catch(() => {});
  }, []);

  const openWhatsApp = () => {
    const msg = `Bonjour ${s.app_name} ${s.app_subtitle}, je vous contacte depuis l'application.`;
    Linking.openURL(whatsappUrl(s.contact.whatsapp, msg)).catch(() => {});
  };

  const counts: Record<string, number | null> = {
    medias: mediaCount,
    produits: productCount,
    temoignages: testimonials.length || null,
  };

  const [slide, setSlide] = useState(0);
  const latestVideo: any = (recent as any[]).find((m: any) => m.thumbnail_url && m.type !== 'audio') || (recent as any[])[0];
  const featuredProduct = products.find((p: any) => p.vedette) || products[0];
  const slides = [
    latestVideo && {
      key: 'media', kicker: 'NOUVELLE ÉMISSION', title: latestVideo.titre, cta: 'Regarder', icon: 'play',
      image: latestVideo.type === 'audio' ? null : latestVideo.thumbnail_url, cover: true,
      onPress: () => router.push({ pathname: '/PlayerScreen', params: { slug: latestVideo.slug || latestVideo.id_media } }),
    },
    featuredProduct && {
      key: 'product', kicker: 'PRODUIT VEDETTE', title: featuredProduct.title, sub: featuredProduct.price, cta: 'Commander', icon: 'bag-handle',
      image: featuredProduct.image, cover: false,
      onPress: () => router.push({ pathname: '/product-detail', params: { slug: featuredProduct.slug || featuredProduct.id } }),
    },
    {
      key: 'consult', kicker: 'CONSULTATION', title: 'Parlez à un expert en santé naturelle', sub: `Burundi : ${s.consultation.local_price}`, cta: 'Réserver', icon: 'calendar',
      image: null, cover: false, onPress: () => router.push('/consultation'),
    },
  ].filter(Boolean) as any[];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* ─── En-tête ──────────────────────────────────── */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerRow}>
            <View style={styles.brandLogo}><Image source={LOGO} style={styles.brandLogoImg} resizeMode="contain" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandName}>{s.app_name} <Text style={{ color: palette.gold }}>{s.app_subtitle}</Text></Text>
              <Text style={styles.brandTag}>{s.tagline}</Text>
            </View>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/NotificationsScreen')}>
              <Ionicons name="notifications-outline" size={21} color={palette.dark} />
              {unreadCount > 0 ? <View style={styles.dot} /> : null}
            </TouchableOpacity>
            <ThemeToggle inline />
          </View>
          <TouchableOpacity style={styles.search} onPress={() => router.push('/SearchScreen')} activeOpacity={0.85}>
            <Ionicons name="search" size={18} color={palette.greyDark} />
            <Text style={styles.searchText}>Rechercher une émission, un remède…</Text>
          </TouchableOpacity>
        </View>

        {/* ─── À la une (carrousel) ─────────────────────── */}
        {slides.length > 0 ? (
          <View>
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast"
              snapToInterval={SLIDE_W + spacing.md} contentContainerStyle={styles.slides}
              onScroll={(e) => setSlide(Math.round(e.nativeEvent.contentOffset.x / (SLIDE_W + spacing.md)))}
              scrollEventThrottle={32}
            >
              {slides.map((sl) => (
                <TouchableOpacity key={sl.key} style={styles.slide} onPress={sl.onPress} activeOpacity={0.92}>
                  <LinearGradient colors={[palette.greenDark, BRAND.ink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  {sl.image && sl.cover ? <Image source={{ uri: sl.image }} style={styles.slideCover} resizeMode="cover" /> : null}
                  {sl.image && sl.cover ? (
                    <LinearGradient colors={['rgba(15,36,23,0)', 'rgba(15,36,23,0.92)']} style={StyleSheet.absoluteFill} />
                  ) : null}
                  {sl.image && !sl.cover ? (
                    <View style={styles.slideProduct}><Image source={{ uri: sl.image }} style={styles.slideProductImg} resizeMode="contain" thumb /></View>
                  ) : null}
                  {!sl.image ? <View style={styles.slideLogo}><Image source={LOGO} style={styles.slideLogoImg} resizeMode="contain" /></View> : null}
                  <View style={[styles.slideBody, !sl.cover && { right: sl.image ? '46%' : 150 }]}>
                    <Text style={styles.slideKicker}>{sl.kicker}</Text>
                    <Text style={styles.slideTitle} numberOfLines={2}>{sl.title}</Text>
                    {sl.sub ? <Text style={styles.slideSub} numberOfLines={1}>{sl.sub}</Text> : null}
                    <View style={styles.slideCta}>
                      <Ionicons name={sl.icon} size={14} color={BRAND.ink} />
                      <Text style={styles.slideCtaText}>{sl.cta}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.dots}>
              {slides.map((sl, i) => <View key={sl.key} style={[styles.dotItem, i === slide && styles.dotActive]} />)}
            </View>
          </View>
        ) : null}

        {/* ─── Services (liste) ─────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader title="Nos services" styles={styles} />
          <View style={styles.services}>
            {SERVICES.map((sv, i) => {
              const count = counts[sv.key];
              return (
                <TouchableOpacity
                  key={sv.key} style={[styles.serviceRow, i > 0 && styles.serviceRowBorder]}
                  onPress={() => router.push(sv.route as any)} activeOpacity={0.7}
                >
                  <View style={styles.serviceIcon}>
                    <Ionicons name={sv.icon as any} size={21} color={palette.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceTitle}>{sv.title}</Text>
                    <Text style={styles.serviceSub} numberOfLines={1}>{sv.desc}</Text>
                  </View>
                  {count ? (
                    <View style={styles.serviceCount}><Text style={styles.serviceCountText}>{formatNumber(count)}</Text></View>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color={palette.grey} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Derniers médias ─────────────────────────────── */}
        {recent.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Dernières émissions" action="Tout voir" onPress={() => router.push('/medias')} styles={styles} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {recent.map((item: any) => (
                <MediaCard
                  key={String(item.slug || item.id_media)} item={item} horizontal
                  onPress={(m: any) => router.push({ pathname: '/PlayerScreen', params: { slug: m.slug || m.id_media } })}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* ─── Produits phares ─────────────────────────────── */}
        {products.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Produits phares" action="Boutique" onPress={() => router.push('/produits')} styles={styles} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {products.map((p) => (
                <TouchableOpacity
                  key={p.slug || p.id} style={styles.product} activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/product-detail', params: { slug: p.slug || p.id } })}
                >
                  <View style={styles.productImgWrap}>
                    {p.image ? <Image source={{ uri: p.image }} style={styles.productImg} resizeMode="contain" thumb /> : null}
                    {p.vedette ? <Text style={styles.productBadge}>Vedette</Text> : null}
                  </View>
                  <View style={styles.productBody}>
                    <Text style={styles.productTitle} numberOfLines={2}>{p.title}</Text>
                    <Text style={styles.productPrice}>{p.price}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* ─── Témoignages ─────────────────────────────────── */}
        {testimonials.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Ils ont retrouvé la santé" action="Témoignages" onPress={() => router.push('/temoignages')} styles={styles} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {testimonials.slice(0, 8).map((t: any) => (
                <TouchableOpacity key={String(t.id)} style={styles.testi} onPress={() => router.push('/temoignages')} activeOpacity={0.9}>
                  <View style={styles.testiImgWrap}>
                    {t.miniature ? <Image source={{ uri: t.miniature }} style={styles.testiImg} resizeMode="cover" /> : null}
                    <View style={styles.testiPlay}><Ionicons name="play" size={18} color={BRAND.ink} style={{ marginLeft: 2 }} /></View>
                  </View>
                  <Text style={styles.testiTitle} numberOfLines={2}>{t.titre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* ─── Conseil WhatsApp ────────────────────────────── */}
        <View style={styles.wa}>
          <View style={styles.waIcon}><Ionicons name="logo-whatsapp" size={26} color={BRAND.ink} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.waTitle}>{s.banner.title}</Text>
            <Text style={styles.waText}>Un expert vous répond sur WhatsApp au {s.contact.phone}.</Text>
          </View>
          <TouchableOpacity style={styles.waBtn} onPress={openWhatsApp} activeOpacity={0.85}>
            <Text style={styles.waBtnText}>Écrire</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.footer} onPress={() => router.push('/profile')} activeOpacity={0.8}>
          <Image source={LOGO} style={styles.footerLogo} resizeMode="contain" />
          <Text style={styles.footerText}>{s.app_name} {s.app_subtitle} · {s.tagline}</Text>
          <Text style={styles.footerLink}>À propos et réseaux sociaux</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const cs = (p: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.whiteOff },

  header: { backgroundColor: p.white, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: p.gold },
  brandLogoImg: { width: 36, height: 36 },
  brandName: { color: p.dark, fontSize: typography.md, fontWeight: '900', letterSpacing: 0.2 },
  brandTag: { color: p.greyDark, fontSize: 11, marginTop: 1 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  dot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: p.red, borderWidth: 1.5, borderColor: p.white },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.md, height: 46, paddingHorizontal: spacing.md,
    borderRadius: radius.full, backgroundColor: p.whiteOff, borderWidth: 1, borderColor: p.greyLight,
  },
  searchText: { color: p.grey, fontSize: typography.base },

  slides: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  slide: { width: SLIDE_W, height: 190, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: p.greenDark },
  slideCover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  slideProduct: { position: 'absolute', right: 14, top: 14, bottom: 14, width: '40%', borderRadius: radius.md, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  slideProductImg: { width: '88%', height: '88%' },
  slideLogo: { position: 'absolute', right: 18, top: 35, width: 120, height: 120, borderRadius: 60, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: p.gold, justifyContent: 'center', alignItems: 'center' },
  slideLogoImg: { width: 92, height: 92 },
  slideBody: { position: 'absolute', left: 18, right: 18, bottom: 16 },
  slideKicker: { color: p.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  slideTitle: { color: '#FFFFFF', fontSize: typography.lg + 1, fontWeight: '900', lineHeight: 23, marginTop: 4 },
  slideSub: { color: 'rgba(255,255,255,0.8)', fontSize: typography.sm, marginTop: 2 },
  slideCta: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 10, backgroundColor: p.gold, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full },
  slideCtaText: { color: BRAND.ink, fontSize: typography.sm, fontWeight: '900' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  dotItem: { width: 6, height: 6, borderRadius: 3, backgroundColor: p.greyLight },
  dotActive: { width: 18, backgroundColor: p.green },

  services: {
    marginHorizontal: spacing.lg, backgroundColor: p.white, borderRadius: radius.lg, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: p.greyLight,
  },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 14 },
  serviceRowBorder: { borderTopWidth: 1, borderTopColor: p.greyLight },
  serviceIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: p.greenSoft, justifyContent: 'center', alignItems: 'center' },
  serviceTitle: { color: p.dark, fontSize: typography.md, fontWeight: '800' },
  serviceSub: { color: p.greyDark, fontSize: typography.sm, marginTop: 2 },
  serviceCount: { minWidth: 30, paddingHorizontal: 8, height: 24, borderRadius: 12, backgroundColor: mix(BRAND.gold, '#FFFFFF', 0.8), justifyContent: 'center', alignItems: 'center' },
  serviceCountText: { color: p.goldDark, fontSize: typography.xs + 1, fontWeight: '900' },

  section: { marginTop: spacing.xl },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionAccent: { width: 4, height: 20, borderRadius: 2, backgroundColor: p.gold },
  sectionTitle: { flex: 1, color: p.dark, fontSize: typography.lg + 1, fontWeight: '900', letterSpacing: -0.3 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText: { color: p.green, fontSize: typography.sm, fontWeight: '800' },
  row: { gap: spacing.md, paddingHorizontal: spacing.lg },

  product: { width: 150, backgroundColor: p.white, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: p.greyLight },
  productImgWrap: { width: '100%', height: 140, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  productImg: { width: '86%', height: '86%' },
  productBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: p.gold, color: BRAND.ink, fontSize: 10, fontWeight: '800', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  productBody: { padding: spacing.sm + 2 },
  productTitle: { color: p.dark, fontSize: typography.sm + 1, fontWeight: '700', minHeight: 36 },
  productPrice: { color: p.green, fontSize: typography.base, fontWeight: '900', marginTop: 4 },

  testi: { width: 220 },
  testiImgWrap: { width: 220, aspectRatio: 16 / 9, borderRadius: radius.md, overflow: 'hidden', backgroundColor: p.greenDark, justifyContent: 'center', alignItems: 'center' },
  testiImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  testiPlay: { width: 40, height: 40, borderRadius: 20, backgroundColor: p.gold, justifyContent: 'center', alignItems: 'center' },
  testiTitle: { color: p.dark, fontSize: typography.sm + 1, fontWeight: '700', marginTop: spacing.sm, lineHeight: 18 },

  wa: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.xl,
    padding: spacing.base, borderRadius: radius.lg, backgroundColor: p.greenDark,
  },
  waIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: p.gold, justifyContent: 'center', alignItems: 'center' },
  waTitle: { color: '#FFFFFF', fontSize: typography.base, fontWeight: '800' },
  waText: { color: 'rgba(255,255,255,0.78)', fontSize: typography.sm, marginTop: 2, lineHeight: 17 },
  waBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full },
  waBtnText: { color: p.greenDark, fontWeight: '900', fontSize: typography.sm },

  footer: { alignItems: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg, gap: 4 },
  footerLogo: { width: 44, height: 44, opacity: 0.9 },
  footerText: { color: p.greyDark, fontSize: typography.xs + 1, textAlign: 'center' },
  footerLink: { color: p.green, fontSize: typography.sm, fontWeight: '800' },
});
