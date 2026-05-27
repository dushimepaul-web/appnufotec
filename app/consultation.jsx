// app/consultation.jsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../src/components/BottomNav';
import { radius, spacing, typography } from '../src/utils/theme';

const GREEN = '#22C55E';
const GREEN_DARK = '#16A34A';
const GREEN_LIGHT = '#DCFCE7';
const ORANGE = '#F59E0B';
const ORANGE_LIGHT = '#FEF3C7';

export default function ConsultationScreen() {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    fullName: '', age: '', height: '', weight: '',
    residence: '', symptoms: '', exams: '',
  });
  const [examImages, setExamImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => setFormData({ ...formData, [field]: value });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "Autorisez l'accès à la galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newImages = [...examImages, ...result.assets];
      newImages.length <= 5
        ? setExamImages(newImages)
        : Alert.alert('Limite atteinte', 'Maximum 5 photos.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "Autorisez l'accès à la caméra.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      const newImages = [...examImages, result.assets[0]];
      newImages.length <= 5
        ? setExamImages(newImages)
        : Alert.alert('Limite atteinte', 'Maximum 5 photos.');
    }
  };

  const removeImage = (index) => {
    const newImages = [...examImages];
    newImages.splice(index, 1);
    setExamImages(newImages);
  };

  const formatWhatsAppMessage = () => {
    const msg = `*CONSULTATION NUFOTEC BURUNDI*\n\n*Nom :* ${formData.fullName}\n*Âge :* ${formData.age} ans\n*Taille :* ${formData.height} cm\n*Poids :* ${formData.weight} kg\n*Résidence :* ${formData.residence}\n\n*Symptômes :*\n${formData.symptoms}\n\n*Examens :*\n${formData.exams || 'Aucun'}\n\n*Photos :* ${examImages.length} photo(s) à suivre.`;
    return encodeURIComponent(msg);
  };

  const handleSubmit = () => {
    const required = [
      ['fullName', 'nom et prénom'], ['age', 'âge'], ['height', 'taille'],
      ['weight', 'poids'], ['residence', 'résidence'], ['symptoms', 'symptômes'],
    ];
    for (const [field, label] of required) {
      if (!formData[field].trim()) {
        Alert.alert('Champ manquant', `Veuillez entrer votre ${label}.`);
        return;
      }
    }
    setLoading(true);
    Linking.openURL(`https://wa.me/79666439?text=${formatWhatsAppMessage()}`);
    setLoading(false);
    Alert.alert(
      examImages.length > 0 ? 'Photos à envoyer 📸' : 'Demande envoyée ✅',
      examImages.length > 0
        ? `Message envoyé ! Partagez manuellement vos ${examImages.length} photo(s) dans WhatsApp.`
        : 'Un expert vous répondra sur WhatsApp.',
      [{ text: 'OK' }]
    );
    setTimeout(() => {
      setFormData({ fullName: '', age: '', height: '', weight: '', residence: '', symptoms: '', exams: '' });
      setExamImages([]);
    }, 2000);
  };

  const Field = ({ icon, label, required: req, helper, children }) => (
    <View style={styles.fieldBlock}>
      <View style={styles.fieldLabelRow}>
        <View style={styles.fieldIconWrap}>
          <Ionicons name={icon} size={14} color={GREEN} />
        </View>
        <Text style={styles.fieldLabel}>{label}</Text>
        {req && <Text style={styles.required}> *</Text>}
      </View>
      {helper && <Text style={styles.helper}>{helper}</Text>}
      {children}
    </View>
  );

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Consultation</Text>
            <Text style={styles.headerSub}>Remplissez le formulaire ci-dessous</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* ── Tarifs ── */}
        <View style={styles.tarifCard}>
          <View style={styles.tarifRow}>
            <Ionicons name="globe-outline" size={16} color={GREEN} />
            <Text style={styles.tarifText}>International : <Text style={styles.tarifBold}>50 USD / 50 EUR</Text></Text>
          </View>
          <View style={styles.tarifDivider} />
          <View style={styles.tarifRow}>
            <Ionicons name="location-outline" size={16} color={ORANGE} />
            <Text style={styles.tarifText}>Burundi : <Text style={styles.tarifBold}>40 000 FBu</Text></Text>
          </View>
        </View>

        {/* ── Formulaire ── */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>

          <Field icon="person-outline" label="Nom et prénom complets" required>
            <TextInput style={styles.input} placeholder="Ex: Nduwimana Jean" placeholderTextColor="#aaa"
              value={formData.fullName} onChangeText={v => handleChange('fullName', v)} />
          </Field>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field icon="calendar-outline" label="Âge (ans)" required>
                <TextInput style={styles.input} placeholder="Ex: 35" placeholderTextColor="#aaa"
                  keyboardType="numeric" value={formData.age} onChangeText={v => handleChange('age', v)} />
              </Field>
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Field icon="resize-outline" label="Taille (cm)" required>
                <TextInput style={styles.input} placeholder="Ex: 170" placeholderTextColor="#aaa"
                  keyboardType="numeric" value={formData.height} onChangeText={v => handleChange('height', v)} />
              </Field>
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Field icon="fitness-outline" label="Poids (kg)" required>
                <TextInput style={styles.input} placeholder="Ex: 70" placeholderTextColor="#aaa"
                  keyboardType="numeric" value={formData.weight} onChangeText={v => handleChange('weight', v)} />
              </Field>
            </View>
          </View>

          <Field icon="location-outline" label="Résidence actuelle" required>
            <TextInput style={styles.input} placeholder="Ex: Bujumbura, Nyakabiga" placeholderTextColor="#aaa"
              value={formData.residence} onChangeText={v => handleChange('residence', v)} />
          </Field>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Votre état de santé</Text>

          <Field icon="medical-outline" label="Description des symptômes" required
            helper="Décrivez précisément comment vous vous sentez">
            <TextInput style={[styles.input, styles.textarea]}
              placeholder="Ex: Fièvre depuis 3 jours, maux de tête, fatigue…"
              placeholderTextColor="#aaa" multiline numberOfLines={5}
              textAlignVertical="top" value={formData.symptoms}
              onChangeText={v => handleChange('symptoms', v)} />
          </Field>

          <Field icon="document-text-outline" label="Examens récents (optionnel)"
            helper="Photos des résultats d'examens — max 5 photos">

            {/* Boutons upload */}
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.8}>
                <Ionicons name="images-outline" size={18} color={GREEN} />
                <Text style={styles.uploadBtnText}>Galerie</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={18} color={GREEN} />
                <Text style={styles.uploadBtnText}>Caméra</Text>
              </TouchableOpacity>
            </View>

            {/* Aperçu images */}
            {examImages.length > 0 && (
              <View style={styles.imagesWrap}>
                <Text style={styles.imagesCount}>{examImages.length} photo(s) sélectionnée(s)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {examImages.map((img, i) => (
                    <View key={i} style={styles.imgThumbWrap}>
                      <Image source={{ uri: img.uri }} style={styles.imgThumb} />
                      <TouchableOpacity style={styles.imgRemove} onPress={() => removeImage(i)}>
                        <Ionicons name="close-circle" size={22} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <TextInput style={[styles.input, styles.textareaSm]}
              placeholder="Ou décrivez vos examens ici (optionnel)…"
              placeholderTextColor="#aaa" multiline numberOfLines={3}
              textAlignVertical="top" value={formData.exams}
              onChangeText={v => handleChange('exams', v)} />
          </Field>

          {/* Note info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color={ORANGE} />
            <Text style={styles.infoText}>
              Les photos seront envoyées manuellement après l'ouverture de WhatsApp. Un reçu de paiement peut être joint après validation.
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="logo-whatsapp" size={22} color="#fff" />
                  <Text style={styles.submitText}>Envoyer via WhatsApp</Text>
                </>
            }
          </TouchableOpacity>

          <Text style={styles.note}>* Champs obligatoires</Text>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // ── Header ──
  header: {
    backgroundColor: GREEN_DARK,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 4,
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 6 },
  headerLogo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginBottom: 4,
  },
  headerTitle: { color: '#fff', fontSize: typography.xl, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: typography.xs },

  // ── Tarifs ──
  tarifCard: {
    margin: spacing.base,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tarifRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  tarifDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },
  tarifText: { color: '#555', fontSize: typography.sm },
  tarifBold: { fontWeight: '700', color: '#1a1a1a' },

  // ── Formulaire ──
  form: { paddingHorizontal: spacing.base },
  sectionTitle: {
    fontSize: typography.base,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: spacing.lg },
  row: { flexDirection: 'row' },

  fieldBlock: { marginBottom: spacing.md },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldIconWrap: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: GREEN_LIGHT,
    justifyContent: 'center', alignItems: 'center',
  },
  fieldLabel: { fontSize: typography.sm, fontWeight: '600', color: '#334155' },
  required: { fontSize: typography.sm, color: ORANGE, fontWeight: '700' },
  helper: { fontSize: typography.xs, color: '#94A3B8', marginBottom: 6, marginLeft: 28 },

  input: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sm,
    color: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  textarea: { minHeight: 110, paddingTop: spacing.sm },
  textareaSm: { minHeight: 70, paddingTop: spacing.sm, marginTop: spacing.sm },

  // ── Upload ──
  uploadRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  uploadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: GREEN_LIGHT,
    borderWidth: 1.5, borderColor: GREEN,
    borderRadius: radius.md, paddingVertical: spacing.sm,
  },
  uploadBtnText: { color: GREEN_DARK, fontSize: typography.sm, fontWeight: '600' },

  imagesWrap: { marginBottom: spacing.md },
  imagesCount: { fontSize: typography.xs, color: '#64748B', marginBottom: spacing.sm },
  imgThumbWrap: { position: 'relative', marginRight: spacing.sm },
  imgThumb: { width: 76, height: 76, borderRadius: radius.sm, borderWidth: 1, borderColor: '#E2E8F0' },
  imgRemove: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 12 },

  // ── Info box ──
  infoBox: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: ORANGE_LIGHT,
    borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  infoText: { flex: 1, fontSize: typography.xs, color: '#92400E', lineHeight: 18 },

  // ── Submit ──
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: GREEN,
    borderRadius: radius.md, paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: { color: '#fff', fontSize: typography.base, fontWeight: '700' },
  note: { fontSize: typography.xs, color: '#94A3B8', textAlign: 'center', marginBottom: spacing.xl },
});
