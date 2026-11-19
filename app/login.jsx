import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loginUser } from '../src/services/auth';
import { useSettings } from '../src/contexts/SettingsContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { radius, spacing, typography } from '../src/utils/theme';

export default function LoginScreen() {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Champ manquant', 'Veuillez entrer votre identifiant et votre mot de passe.');
      return;
    }
    setLoading(true);
    try {
      const result = await loginUser(email.trim(), password);
      if (result.success) {
        router.push('/profile');
      } else {
        Alert.alert('Connexion impossible', result.message);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de contacter le serveur. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={palette.dark} />
      </TouchableOpacity>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre compte {settings.app_name} {settings.app_subtitle}</Text>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Identifiant</Text>
              <View style={[styles.inputWrap, { borderColor: palette.greyLight }]}>
                <Ionicons name="mail-outline" size={18} color={palette.grey} />
                <TextInput
                  style={styles.input}
                  placeholder="Email, téléphone ou identifiant"
                  placeholderTextColor={palette.grey}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={[styles.inputWrap, { borderColor: palette.greyLight }]}>
                <Ionicons name="lock-closed-outline" size={18} color={palette.grey} />
                <TextInput
                  style={styles.input}
                  placeholder="Votre mot de passe"
                  placeholderTextColor={palette.grey}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={palette.grey} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={palette.white} /> : (
                <>
                  <Ionicons name="log-in-outline" size={20} color={palette.white} />
                  <Text style={styles.submitText}>Se connecter</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = (p) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.white },
  flex: { flex: 1 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, marginLeft: spacing.base,
    backgroundColor: p.whiteOff, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: p.greyLight,
  },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  logoWrap: {
    width: 88, height: 88, borderRadius: 24, alignSelf: 'center',
    backgroundColor: p.white, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: p.gold, marginBottom: spacing.md,
    shadowColor: p.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
  },
  logo: { width: 72, height: 72 },
  title: { fontSize: 28, fontWeight: '900', color: p.dark, textAlign: 'center' },
  subtitle: { fontSize: typography.sm, color: p.greyDark, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl, lineHeight: 18 },
  form: { gap: spacing.lg },
  fieldGroup: { gap: spacing.xs },
  label: { fontSize: typography.sm, fontWeight: '600', color: p.dark, marginLeft: 4 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: p.whiteOff, borderRadius: radius.md,
    paddingHorizontal: spacing.md, height: 52,
    borderWidth: 1.5,
  },
  input: { flex: 1, color: p.dark, fontSize: typography.base, paddingVertical: 0 },
  eyeBtn: { padding: 4 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: p.green, borderRadius: radius.md,
    paddingVertical: spacing.md, marginTop: spacing.sm,
    shadowColor: p.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: p.white, fontSize: typography.base, fontWeight: '700' },
});
