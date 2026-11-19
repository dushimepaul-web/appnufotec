import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Dimensions, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../src/components/BottomNav';
import MediaCard from '../src/components/MediaCard';
import { useSettings } from '../src/contexts/SettingsContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { useRecent } from '../src/hooks/useMedias';
import { radius, spacing, typography } from '../src/utils/theme';

const { width: SCREEN_W } = Dimensions.get('window');

export default function HomeScreen() {
  const { palette } = useTheme();
  const styles = useMemo(() => cs(palette), [palette]);
  const s = useSettings();
  const { data: recent } = useRecent(10);

  const handleRecentPress = (item: any) => {
    router.push({ pathname: '/PlayerScreen', params: { slug: item.slug || item.id_media } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoBg1} />
            <View style={styles.logoBg2} />
            <View style={styles.logoWrap}>
              <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.logoTitle}>
              {s.app_name} <Text style={styles.logoGold}>{s.app_subtitle}</Text>
            </Text>
            <Text style={styles.logoTag}>{s.tagline}</Text>
          </View>

          {/* Bienvenue */}
          <View style={styles.welcome}>
            <View style={styles.welcomeLine} />
            <Text style={styles.welcomeTitle}>{s.welcome_title}</Text>
            <Text style={styles.welcomeText}>{s.welcome_text}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsOuter}>
            {s.stats.map((stat: any, i: number) => (
              <View key={i} style={[styles.statCard, i === 1 && styles.statGold]}>
                <Text style={[styles.statNum, { color: i === 1 ? palette.gold : palette.green }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, i === 1 && { color: palette.gold }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Services */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nos services</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.grid}>
            {(s.quick_actions || []).map((card: any, i: number) => (
              <TouchableOpacity key={i} style={styles.gridCard} onPress={() => router.push(card.route as any)} activeOpacity={0.7}>
                <View style={[styles.gridIcon, { backgroundColor: `${card.color}14` }]}>
                  <Ionicons name={card.icon as any} size={24} color={card.color} />
                </View>
                <Text style={styles.gridTitle}>{card.title}</Text>
                <Text style={styles.gridDesc}>{card.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Derniers médias */}
          {recent.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Derniers médias</Text>
                <View style={styles.sectionLine} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
                {recent.map((item: any) => (
                  <MediaCard key={String(item.slug || item.id_media)} item={item} horizontal onPress={handleRecentPress} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* WhatsApp */}
          <View style={styles.wa}>
            <View style={styles.waBg} />
            <View style={styles.waBg2} />
            <View style={styles.waTop}>
              <View style={styles.waIcon}>
                <Ionicons name="logo-whatsapp" size={26} color={palette.white} />
              </View>
              <View style={styles.waBadge}>
                <View style={styles.waDot} />
                <Text style={styles.waBadgeText}>En ligne</Text>
              </View>
            </View>
            <Text style={styles.waTitle}>{s.banner.title}</Text>
            <Text style={styles.waText}>{s.banner.text}</Text>
            <TouchableOpacity
              style={styles.waBtn}
              activeOpacity={0.8}
              onPress={() => {
                const msg = `Bonjour ${s.app_name} ${s.app_subtitle}, je vous contacte depuis l'application.`;
                Linking.openURL(`https://wa.me/${s.contact.whatsapp}?text=${encodeURIComponent(msg)}`).catch(() => {});
              }}
            >
              <View style={styles.waBtnInner}>
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={styles.waBtnText}>{s.banner.button_text}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#25D366" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const cs = (p: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: p.whiteOff },
  container: { flex: 1, backgroundColor: p.whiteOff },
  scroll: { flexGrow: 1 },

  logoSection: { alignItems: 'center', paddingTop: spacing.xxl + 20, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, position: 'relative', overflow: 'hidden' },
  logoBg1: { position: 'absolute', top: -40, right: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: `${p.green}06` },
  logoBg2: { position: 'absolute', bottom: -30, left: -40, width: 130, height: 130, borderRadius: 65, backgroundColor: `${p.gold}06` },
  logoWrap: { width: 88, height: 88, borderRadius: 22, backgroundColor: p.white, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md, borderWidth: 2, borderColor: p.gold, shadowColor: p.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  logo: { width: 72, height: 72 },
  logoTitle: { fontSize: 28, fontWeight: '900', color: p.dark, textAlign: 'center' },
  logoGold: { color: p.gold },
  logoTag: { fontSize: typography.sm, color: p.greyDark, textAlign: 'center', marginTop: spacing.xs, maxWidth: SCREEN_W * 0.7 },

  welcome: { marginHorizontal: spacing.lg, marginBottom: spacing.xl, backgroundColor: p.white, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: p.greyLight, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  welcomeLine: { width: 36, height: 3, borderRadius: 2, backgroundColor: p.green, marginBottom: spacing.md },
  welcomeTitle: { fontSize: typography.lg, fontWeight: '800', color: p.dark, marginBottom: spacing.sm },
  welcomeText: { fontSize: typography.sm, color: '#4A4F55', lineHeight: 21 },

  statsOuter: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.xl },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: p.white, borderRadius: radius.lg, paddingVertical: spacing.lg, borderWidth: 1, borderColor: p.greyLight, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statGold: { borderColor: p.gold, backgroundColor: `${p.gold}04` },
  statNum: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: typography.xs, color: p.greyDark, fontWeight: '600', marginTop: 3 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { fontSize: typography.xl, fontWeight: '800', color: p.dark },
  sectionLine: { flex: 1, height: 1, backgroundColor: p.greyLight },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  gridCard: {
    width: (SCREEN_W - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: p.white, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: p.greyLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  gridIcon: { width: 44, height: 44, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  gridTitle: { fontSize: typography.base, fontWeight: '700', color: p.dark, marginBottom: 2 },
  gridDesc: { fontSize: typography.xs, color: p.greyDark, lineHeight: 15 },

  wa: { marginHorizontal: spacing.lg, marginBottom: spacing.xl, backgroundColor: '#128C7E', borderRadius: radius.lg, padding: spacing.lg, position: 'relative', overflow: 'hidden', shadowColor: '#128C7E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6 },
  recentSection: { marginBottom: spacing.xl },
  recentRow: { paddingHorizontal: spacing.lg, gap: spacing.md },
  waBg: { position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: `${p.white}08` },
  waBg2: { position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: `${p.white}06` },
  waTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  waIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: `${p.white}15`, justifyContent: 'center', alignItems: 'center' },
  waBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${p.white}12`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  waDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#69F0AE' },
  waBadgeText: { color: p.white, fontSize: typography.xs, fontWeight: '600' },
  waTitle: { color: p.white, fontWeight: '800', fontSize: typography.base, marginBottom: spacing.xs },
  waText: { color: `${p.white}CC`, fontSize: typography.sm, lineHeight: 18, marginBottom: spacing.lg },
  waBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: p.white, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full },
  waBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  waBtnText: { color: '#128C7E', fontWeight: '800', fontSize: typography.sm },
});
