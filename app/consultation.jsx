import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../src/components/BottomNav';
import { useSettings } from '../src/contexts/SettingsContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { radius, spacing, typography } from '../src/utils/theme';

function Field({ icon, label, required: req, helper, children }) {
  const { palette } = useTheme();
  const styles = useMemo(() => cs(palette), [palette]);
  return (
    <View style={styles.fieldBlock}>
      <View style={styles.fieldLabelRow}>
        <View style={[styles.fieldIconWrap, { backgroundColor: `${palette.green}12` }]}>
          <Ionicons name={icon} size={14} color={palette.green} />
        </View>
        <Text style={styles.fieldLabel}>{label}</Text>
        {req && <Text style={styles.required}> *</Text>}
      </View>
      {helper && <Text style={styles.helper}>{helper}</Text>}
      {children}
    </View>
  );
}

export default function ConsultationScreen() {
  const { palette } = useTheme();
  const styles = useMemo(() => cs(palette), [palette]);
  const insets = useSafeAreaInsets();
  const s = useSettings().consultation;
  const contact = useSettings().contact;

  const [formData, setFormData] = useState({
    fullName: '', age: '', height: '', weight: '',
    residence: '', symptoms: '', exams: '',
  });
  const [examImages, setExamImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => setFormData({ ...formData, [field]: value });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', "Autorisez l'accès à la galerie."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8,
    });
    if (!result.canceled) {
      const newImages = [...examImages, ...result.assets];
      if (newImages.length <= 5) setExamImages(newImages);
      else Alert.alert('Limite atteinte', 'Maximum 5 photos.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', "Autorisez l'accès à la caméra."); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      const newImages = [...examImages, result.assets[0]];
      if (newImages.length <= 5) setExamImages(newImages);
      else Alert.alert('Limite atteinte', 'Maximum 5 photos.');
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
      if (!formData[field].trim()) { Alert.alert('Champ manquant', `Veuillez entrer votre ${label}.`); return; }
    }
    setLoading(true);
    Linking.openURL(`https://wa.me/${contact.whatsapp}?text=${formatWhatsAppMessage()}`);
    setLoading(false);
    Alert.alert(
      examImages.length > 0 ? 'Photos à envoyer' : 'Demande envoyée',
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

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={palette.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerLogoWrap}>
              <Image source={require('../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
            </View>
            <Text style={styles.headerTitle}>{s.title}</Text>
            <Text style={styles.headerSub}>{s.subtitle}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.tarifCard}>
          <View style={styles.tarifHeader}>
            <View style={styles.tarifPill}>
              <Ionicons name="pricetag" size={12} color={palette.white} />
              <Text style={styles.tarifPillText}>Tarifs</Text>
            </View>
          </View>
          <View style={styles.tarifRow}>
            <Ionicons name="globe-outline" size={16} color={palette.gold} />
            <Text style={styles.tarifText}>{s.international_label} : <Text style={styles.tarifBold}>{s.international_price}</Text></Text>
          </View>
          <View style={styles.tarifDivider} />
          <View style={styles.tarifRow}>
            <Ionicons name="location-outline" size={16} color={palette.green} />
            <Text style={styles.tarifText}>{s.local_label} : <Text style={styles.tarifBold}>{s.local_price}</Text></Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.formSectionTitle}>
            <View style={styles.formSectionAccent} />
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
          </View>

          <Field icon="person-outline" label="Nom et prénom complets" required>
            <TextInput style={styles.input} placeholder="Ex: Nduwimana Jean" placeholderTextColor={palette.grey}
              value={formData.fullName} onChangeText={v => handleChange('fullName', v)} />
          </Field>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field icon="calendar-outline" label="Âge (ans)" required>
                <TextInput style={styles.input} placeholder="Ex: 35" placeholderTextColor={palette.grey}
                  keyboardType="numeric" value={formData.age} onChangeText={v => handleChange('age', v)} />
              </Field>
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Field icon="resize-outline" label="Taille (cm)" required>
                <TextInput style={styles.input} placeholder="Ex: 170" placeholderTextColor={palette.grey}
                  keyboardType="numeric" value={formData.height} onChangeText={v => handleChange('height', v)} />
              </Field>
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Field icon="fitness-outline" label="Poids (kg)" required>
                <TextInput style={styles.input} placeholder="Ex: 70" placeholderTextColor={palette.grey}
                  keyboardType="numeric" value={formData.weight} onChangeText={v => handleChange('weight', v)} />
              </Field>
            </View>
          </View>

          <Field icon="location-outline" label="Résidence actuelle" required>
            <TextInput style={styles.input} placeholder="Ex: Bujumbura, Nyakabiga" placeholderTextColor={palette.grey}
              value={formData.residence} onChangeText={v => handleChange('residence', v)} />
          </Field>

          <View style={styles.divider} />

          <View style={styles.formSectionTitle}>
            <View style={[styles.formSectionAccent, { backgroundColor: palette.gold }]} />
            <Text style={styles.sectionTitle}>Votre état de santé</Text>
          </View>

          <Field icon="medical-outline" label="Description des symptômes" required helper="Décrivez précisément comment vous vous sentez">
            <TextInput style={[styles.input, styles.textarea]}
              placeholder="Ex: Fièvre depuis 3 jours, maux de tête, fatigue…"
              placeholderTextColor={palette.grey} multiline numberOfLines={5}
              textAlignVertical="top" value={formData.symptoms} onChangeText={v => handleChange('symptoms', v)} />
          </Field>

          <Field icon="document-text-outline" label="Examens récents (optionnel)" helper="Photos des résultats d'examens — max 5 photos">
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.8}>
                <Ionicons name="images-outline" size={18} color={palette.green} />
                <Text style={styles.uploadBtnText}>Galerie</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={18} color={palette.green} />
                <Text style={styles.uploadBtnText}>Caméra</Text>
              </TouchableOpacity>
            </View>
            {examImages.length > 0 && (
              <View style={styles.imagesWrap}>
                <Text style={styles.imagesCount}>{examImages.length} photo(s) sélectionnée(s)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {examImages.map((img, i) => (
                    <View key={i} style={styles.imgThumbWrap}>
                      <Image source={{ uri: img.uri }} style={styles.imgThumb} />
                      <TouchableOpacity style={styles.imgRemove} onPress={() => removeImage(i)}>
                        <Ionicons name="close-circle" size={22} color={palette.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            <TextInput style={[styles.input, styles.textareaSm]}
              placeholder="Ou décrivez vos examens ici (optionnel)…"
              placeholderTextColor={palette.grey} multiline numberOfLines={3}
              textAlignVertical="top" value={formData.exams} onChangeText={v => handleChange('exams', v)} />
          </Field>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color={palette.gold} />
            <Text style={styles.infoText}>
              Les photos seront envoyées manuellement après l’ouverture de WhatsApp. Un reçu de paiement peut être joint après validation.
            </Text>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={palette.white} /> : (
              <><Ionicons name="logo-whatsapp" size={22} color={palette.white} /><Text style={styles.submitText}>{s.submit_text}</Text></>
            )}
          </TouchableOpacity>

          <Text style={styles.note}>* Champs obligatoires</Text>
        </View>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const cs = (p) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.white },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: {
    backgroundColor: p.green, paddingHorizontal: spacing.base, paddingBottom: spacing.xl,
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 6 },
  headerLogoWrap: { width: 64, height: 64, borderRadius: 16, backgroundColor: p.white, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: p.gold, marginBottom: 4 },
  headerLogo: { width: 50, height: 50 },
  headerTitle: { color: p.white, fontSize: typography.xl, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: typography.xs, textAlign: 'center' },
  tarifCard: {
    margin: spacing.base, backgroundColor: p.white, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: p.greyLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  tarifHeader: { flexDirection: 'row', marginBottom: spacing.sm },
  tarifPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: p.green, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  tarifPillText: { color: p.white, fontSize: 10, fontWeight: '700' },
  tarifRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  tarifDivider: { height: 1, backgroundColor: p.greyLight, marginVertical: 4 },
  tarifText: { color: '#555', fontSize: typography.sm },
  tarifBold: { fontWeight: '700', color: p.dark },
  form: { paddingHorizontal: spacing.base },
  formSectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, marginTop: spacing.md },
  formSectionAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: p.green },
  sectionTitle: { fontSize: typography.base, fontWeight: '700', color: p.dark },
  divider: { height: 1, backgroundColor: p.greyLight, marginVertical: spacing.lg },
  row: { flexDirection: 'row' },
  fieldBlock: { marginBottom: spacing.md },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldIconWrap: { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  fieldLabel: { fontSize: typography.sm, fontWeight: '600', color: '#555' },
  required: { fontSize: typography.sm, color: p.gold, fontWeight: '700' },
  helper: { fontSize: typography.xs, color: p.grey, marginBottom: 6, marginLeft: 28 },
  input: { backgroundColor: p.whiteOff, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.sm, color: p.dark, borderWidth: 1.5, borderColor: p.greyLight },
  textarea: { minHeight: 110, paddingTop: spacing.sm },
  textareaSm: { minHeight: 70, paddingTop: spacing.sm, marginTop: spacing.sm },
  uploadRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: `${p.green}10`, borderWidth: 1.5, borderColor: p.green, borderRadius: radius.md, paddingVertical: spacing.sm },
  uploadBtnText: { color: p.green, fontSize: typography.sm, fontWeight: '600' },
  imagesWrap: { marginBottom: spacing.md },
  imagesCount: { fontSize: typography.xs, color: p.greyDark, marginBottom: spacing.sm },
  imgThumbWrap: { position: 'relative', marginRight: spacing.sm },
  imgThumb: { width: 76, height: 76, borderRadius: radius.sm, borderWidth: 1, borderColor: p.greyLight },
  imgRemove: { position: 'absolute', top: -8, right: -8, backgroundColor: p.white, borderRadius: 12 },
  infoBox: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', backgroundColor: `${p.gold}10`, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: `${p.gold}30` },
  infoText: { flex: 1, fontSize: typography.xs, color: p.goldDark, lineHeight: 18 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: '#25D366', borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.sm, shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  submitText: { color: p.white, fontSize: typography.base, fontWeight: '700' },
  note: { fontSize: typography.xs, color: p.grey, textAlign: 'center', marginBottom: spacing.xl },
});

