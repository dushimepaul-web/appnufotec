import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { BRAND, radius, spacing, typography } from '../src/utils/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const LOGO = require('../assets/logo.png');

const SERVICES = [
  { title: 'Médias', sub: 'Émissions santé', icon: 'play-circle', route: '/medias' },
  { title: 'Consultation', sub: 'Avis d\'expert', icon: 'medkit', route: '/consultation' },
  { title: 'Boutique', sub: 'Produits naturels', icon: 'leaf', route: '/produits' },
  { title: 'Hors-ligne', sub: 'Mes téléchargements', icon: 'cloud-download', route: '/OfflineScreen' },
];

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
    api.getMediaCategories()
      .then((res: any) => {
        if (!res?.success || !Array.isArray(res.data)) return;
        setMediaCount(res.data.reduce((n: number, c: any) => n + (Number(c.medias) || 0), 0));
      })
      .catch(() => {});
    api.getProducts({ perPage: 8 })
      .then((res: any) => {
        if (!res?.success) return;
        setProducts((res.data?.items || []).map((p: any) => adaptProduct(p)));
        setProductCount(res.data?.meta?.total ?? null);
      })
      .catch(() => {});
    api.getTestimonials()
      .then((res: any) => { if (res?.success && Array.isArray(res.data)) setTestimonials(res.data); })
      .catch(() => {});
  }, []);

  const openWhatsApp = () => {
    const msg = `Bonjour ${s.app_name} ${s.app_subtitle}, je vous contacte depuis l'application.`;
    Linking.openURL(whatsappUrl(s.contact.whatsapp, msg)).catch(() => {});
  };

  const stats = [
    { value: mediaCount != null ? formatNumber(mediaCount) : '—', label: 'Médias santé' },
    { value: productCount != null ? String(productCount) : '—', label: 'Produits' },
    { value: testimonials.length ? String(testimonials.length) : '—', label: 'Témoignages' },
  ];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* ─── Hero ─────────────────────────────────────────── */}
        <LinearGradient colors={[palette.greenDark, BRAND.ink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <Image source={LOGO} style={styles.watermark} resizeMode="contain" />

          <View style={styles.topBar}>
            <View style={styles.brand}>
              <View style={styles.brandLogo}><Image source={LOGO} style={styles.brandLogoImg} resizeMode="contain" /></View>
              <View>
                <Text style={styles.brandName}>{s.app_name} <Text style={{ color: palette.gold }}>{s.app_subtitle}</Text></Text>
                <Text style={styles.brandTag}>{s.tagline}</Text>
              </View>
            </View>
            <View style={styles.topActions}>
              <TouchableOpacity style={styles.topBtn} onPress={() => router.push('/SearchScreen')}>
                <Ionicons name="search-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topBtn} onPress={() => router.push('/NotificationsScreen')}>
                <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
                {unreadCount > 0 ? <View style={styles.dot} /> : null}
              </TouchableOpacity>
              <ThemeToggle inline />
            </View>
          </View>

          <View style={styles.kicker}>
            <Ionicons name="leaf" size={12} color={palette.gold} />
            <Text style={styles.kickerText}>Médecine naturelle · Burundi</Text>
          </View>
          <Text style={styles.headline}>
            La santé par les plantes, <Text style={{ color: palette.gold }}>prouvée par la science</Text>
          </Text>
          <Text style={styles.lead}>
            Consultez un expert en ligne et commandez des produits phytomédicinaux certifiés, livrés chez vous.
          </Text>

          <TouchableOpacity style={styles.ctaPrimary} onPress={() => router.push('/consultation')} activeOpacity={0.88}>
            <Ionicons name="calendar-outline" size={19} color={BRAND.ink} />
            <Text style={styles.ctaPrimaryText}>Être consulté</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctaSecondary} onPress={() => router.push('/produits')} activeOpacity={0.85}>
            <Ionicons name="bag-handle-outline" size={19} color="#FFFFFF" />
            <Text style={styles.ctaSecondaryText}>Acheter les produits</Text>
          </TouchableOpacity>

          <View style={styles.trust}>
            {[['shield-checkmark-outline', 'Experts qualifiés'], ['logo-whatsapp', 'Suivi WhatsApp'], ['lock-closed-outline', 'Confidentiel']].map(([icon, label]) => (
              <View key={label} style={styles.trustItem}>
                <Ionicons name={icon as any} size={14} color={palette.gold} />
                <Text style={styles.trustText}>{label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ─── Chiffres ────────────────────────────────────── */}
        <View style={styles.stats}>
          {stats.map((st, i) => (
            <React.Fragment key={st.label}>
              {i > 0 ? <View style={styles.statSep} /> : null}
              <View style={styles.stat}>
                <Text style={styles.statValue}>{st.value}</Text>
                <Text style={styles.statLabel}>{st.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* ─── Services ────────────────────────────────────── */}
        <View style={styles.services}>
          {SERVICES.map((sv) => (
            <TouchableOpacity key={sv.title} style={styles.service} onPress={() => router.push(sv.route as any)} activeOpacity={0.8}>
              <View style={styles.serviceIcon}><Ionicons name={sv.icon as any} size={24} color={palette.green} /></View>
              <Text style={styles.serviceTitle} numberOfLines={1}>{sv.title}</Text>
              <Text style={styles.serviceSub} numberOfLines={1}>{sv.sub}</Text>
            </TouchableOpacity>
          ))}
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
                    {p.image ? <Image source={{ uri: p.image }} style={styles.productImg} resizeMode="contain" /> : null}
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

  hero: { paddingHorizontal: spacing.lg, paddingBottom: 56, overflow: 'hidden' },
  watermark: { position: 'absolute', width: SCREEN_W * 1.1, height: SCREEN_W * 1.1, right: -SCREEN_W * 0.35, top: 40, opacity: 0.07 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  brandLogo: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: p.gold },
  brandLogoImg: { width: 34, height: 34 },
  brandName: { color: '#FFFFFF', fontSize: typography.base, fontWeight: '900', letterSpacing: 0.2 },
  brandTag: { color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 1 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  topBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  dot: { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: p.red, borderWidth: 1.5, borderColor: BRAND.ink },

  kicker: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  kickerText: { color: '#FFFFFF', fontSize: typography.xs + 1, fontWeight: '700' },
  headline: { color: '#FFFFFF', fontSize: 32, lineHeight: 38, fontWeight: '900', letterSpacing: -0.6, marginTop: spacing.md },
  lead: { color: 'rgba(255,255,255,0.82)', fontSize: typography.md, lineHeight: 22, marginTop: spacing.md, marginBottom: spacing.xl },
  ctaPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: radius.full, backgroundColor: p.gold },
  ctaPrimaryText: { color: BRAND.ink, fontSize: typography.md + 1, fontWeight: '800' },
  ctaSecondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: radius.full,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', marginTop: spacing.md,
  },
  ctaSecondaryText: { color: '#FFFFFF', fontSize: typography.md + 1, fontWeight: '700' },
  trust: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: spacing.xl },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { color: 'rgba(255,255,255,0.85)', fontSize: typography.sm },

  stats: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: -32,
    backgroundColor: p.white, borderRadius: radius.lg, paddingVertical: spacing.lg,
    shadowColor: BRAND.ink, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 6,
  },
  stat: { flex: 1, alignItems: 'center' },
  statSep: { width: 1, height: 34, backgroundColor: p.greyLight },
  statValue: { color: p.green, fontSize: 24, fontWeight: '900' },
  statLabel: { color: p.greyDark, fontSize: typography.xs + 1, fontWeight: '600', marginTop: 2 },

  services: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  service: { width: (SCREEN_W - spacing.lg * 2 - spacing.sm * 3) / 4, alignItems: 'center' },
  serviceIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: p.greenSoft, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  serviceTitle: { color: p.dark, fontSize: typography.sm, fontWeight: '800' },
  serviceSub: { color: p.greyDark, fontSize: 10, marginTop: 1 },

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
