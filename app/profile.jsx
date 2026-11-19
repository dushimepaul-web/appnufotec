import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useSettings } from '../src/contexts/SettingsContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { toWhatsAppNumber, whatsappUrl } from '../src/utils/api';
import { radius, spacing, typography } from '../src/utils/theme';

const SOCIAL_ICONS = {
  facebook: { icon: 'logo-facebook', color: '#1877F2' },
  twitter: { icon: 'logo-twitter', color: '#1DA1F2' },
  instagram: { icon: 'logo-instagram', color: '#E4405F' },
  youtube: { icon: 'logo-youtube', color: '#FF0000' },
  linkedin: { icon: 'logo-linkedin', color: '#0A66C2' },
};

export default function ProfileScreen() {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const contact = settings.contact;
  const socialMedia = settings.social_media || [];

  const openWhatsApp = () => {
    const msg = `Bonjour ${settings.app_name} ${settings.app_subtitle}, je vous contacte depuis l'application.`;
    Linking.openURL(whatsappUrl(contact.whatsapp, msg));
  };

  const rows = [
    { icon: 'logo-whatsapp', label: 'WhatsApp', value: contact.phone, color: '#25D366', onPress: openWhatsApp },
    { icon: 'call-outline', label: 'Téléphone', value: contact.phone, color: palette.green, onPress: () => Linking.openURL(`tel:+${toWhatsAppNumber(contact.whatsapp)}`) },
    { icon: 'mail-outline', label: 'Email', value: contact.email, color: palette.gold, onPress: () => Linking.openURL(`mailto:${contact.email}`) },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={palette.dark} />
        </TouchableOpacity>
        <View style={styles.topTitleWrap}>
          <View style={styles.topIconBox}>
            <Ionicons name="information-circle" size={18} color={palette.green} />
          </View>
          <Text style={styles.topTitle}>A propos</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>{settings.app_name} {settings.app_subtitle}</Text>
          <Text style={styles.tagline}>{settings.tagline}</Text>
        </View>

        <Text style={styles.sectionTitle}>Nous contacter</Text>
        <View style={styles.contactCard}>
          {rows.map((row) => (
            <TouchableOpacity key={row.label} style={styles.row} onPress={row.onPress} activeOpacity={0.7}>
              <View style={[styles.rowIcon, { backgroundColor: `${row.color}15` }]}>
                <Ionicons name={row.icon} size={18} color={row.color} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette.grey} />
            </TouchableOpacity>
          ))}
        </View>

        {socialMedia.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Suivez-nous</Text>
            <View style={styles.socialCard}>
              {socialMedia.map((item) => {
                const social = SOCIAL_ICONS[item.platform] || { icon: 'globe-outline', color: palette.greyDark };
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.socialRow}
                    onPress={() => Linking.openURL(item.url)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.socialIconWrap, { backgroundColor: `${social.color}12` }]}>
                      <Ionicons name={social.icon} size={20} color={social.color} />
                    </View>
                    <View style={styles.socialInfo}>
                      <Text style={styles.socialLabel}>{item.label}</Text>
                      <Text style={styles.socialUrl} numberOfLines={1}>{item.url}</Text>
                    </View>
                    <Ionicons name="open-outline" size={16} color={palette.grey} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <Text style={styles.version}>Version {Constants.expoConfig?.version || '1.0.0'}</Text>
      </ScrollView>
    </View>
  );
}

const s = (p) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.whiteOff },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingBottom: spacing.md,
    backgroundColor: p.white, borderBottomWidth: 1, borderBottomColor: p.greyLight,
  },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: p.whiteOff, justifyContent: 'center', alignItems: 'center' },
  topTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topIconBox: { width: 30, height: 30, borderRadius: 10, backgroundColor: `${p.green}12`, justifyContent: 'center', alignItems: 'center' },
  topTitle: { color: p.dark, fontSize: typography.lg, fontWeight: '800' },
  scrollContent: { padding: spacing.lg, paddingBottom: 120 },
  card: { alignItems: 'center', backgroundColor: p.white, borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.lg, borderWidth: 1, borderColor: p.greyLight },
  logoWrap: { width: 88, height: 88, borderRadius: 24, backgroundColor: p.white, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: p.gold, marginBottom: spacing.md },
  logo: { width: 72, height: 72 },
  appName: { fontSize: typography.xl, fontWeight: '900', color: p.dark, textAlign: 'center' },
  tagline: { fontSize: typography.sm, color: p.greyDark, textAlign: 'center', marginTop: spacing.xs },
  sectionTitle: { fontSize: typography.base, fontWeight: '700', color: p.dark, marginBottom: spacing.sm },
  contactCard: { backgroundColor: p.white, borderRadius: radius.lg, borderWidth: 1, borderColor: p.greyLight, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: p.greyLight },
  rowIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: typography.sm, fontWeight: '600', color: p.dark },
  rowValue: { fontSize: typography.xs, color: p.greyDark, marginTop: 2 },
  socialCard: { backgroundColor: p.white, borderRadius: radius.lg, borderWidth: 1, borderColor: p.greyLight, overflow: 'hidden' },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: p.greyLight },
  socialIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  socialInfo: { flex: 1 },
  socialLabel: { fontSize: typography.sm, fontWeight: '600', color: p.dark },
  socialUrl: { fontSize: typography.xs, color: p.greyDark, marginTop: 2 },
  version: { textAlign: 'center', color: p.grey, fontSize: typography.xs, marginTop: spacing.xl },
});
