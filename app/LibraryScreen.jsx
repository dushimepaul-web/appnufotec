// src/screens/LibraryScreen.js
import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Header from '../src/components/Header';
import { colors, radius, spacing, typography } from '../src/utils/theme';

const MENU_ITEMS = [
  { icon: 'time-outline', label: 'Historique', subtitle: 'Médias récemment vus' },
  { icon: 'thumbs-up-outline', label: 'Médias aimés', subtitle: 'Vos j\'aimes' },
  { icon: 'bookmark-outline', label: 'Enregistrés', subtitle: 'Regarder plus tard' },
  { icon: 'list-outline', label: 'Playlists', subtitle: 'Vos listes de lecture' },
];

export default function LibraryScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <Header navigation={navigation} title="Bibliothèque" />

      {/* Login prompt */}
      <View style={styles.loginPrompt}>
        <Ionicons name="person-circle-outline" size={64} color={colors.textMuted} />
        <Text style={styles.promptTitle}>Connectez-vous</Text>
        <Text style={styles.promptSub}>Accédez à vos médias, commentaires et playlists</Text>
        <TouchableOpacity style={styles.loginBtn}>
          <Ionicons name="log-in-outline" size={18} color={colors.accent} />
          <Text style={styles.loginBtnText}>Se connecter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Library items */}
      {MENU_ITEMS.map((item) => (
        <TouchableOpacity key={item.label} style={styles.row} activeOpacity={0.7}>
          <View style={styles.iconBox}>
            <Ionicons name={item.icon} size={22} color={colors.text} />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowSub}>{item.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loginPrompt: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  promptTitle: {
    color: colors.text,
    fontSize: typography.lg,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  promptSub: {
    color: colors.textMuted,
    fontSize: typography.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    marginTop: spacing.sm,
  },
  loginBtnText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: typography.base,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowInfo: { flex: 1 },
  rowLabel: {
    color: colors.text,
    fontSize: typography.base,
    fontWeight: '600',
  },
  rowSub: {
    color: colors.textMuted,
    fontSize: typography.sm,
    marginTop: 2,
  },
});
