import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Image from '../src/components/CachedImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../src/contexts/SettingsContext';
import { useTheme } from '../src/contexts/ThemeContext';
import api, { SITE_URL, whatsappUrl } from '../src/utils/api';
import { adaptProduct } from '../src/utils/adapters';
import { radius, spacing, typography } from '../src/utils/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const IMG_H = Math.min(SCREEN_W, 420);
const EMPTY_FORM = { name: '', phone: '', country: 'Burundi', city: '', address: '' };

export default function ProductDetailScreen() {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  const insets = useSafeAreaInsets();
  const { slug, id, commander } = useLocalSearchParams();
  const identifier = slug || id;
  const settings = useSettings();
  const siteName = `${settings.app_name} ${settings.app_subtitle}`.trim();
  const contact = settings.contact;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paysList, setPaysList] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getProductDetail(identifier);
      if (response?.success) setProduct(adaptProduct(response.data, true));
    } catch (error) {
      console.error('Erreur chargement produit:', error);
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => { Promise.resolve().then(loadProduct); }, [loadProduct]);
  useEffect(() => {
    api.getPays().then((res) => { if (res?.success) setPaysList(res.data || []); }).catch(() => {});
  }, []);
  // Bouton « Commander » de la liste : ouvrir directement le formulaire.
  useEffect(() => {
    if (product && commander === '1') Promise.resolve().then(() => setShowOrderForm(true));
  }, [product, commander]);

  const productUrl = product ? `${SITE_URL}/produits/${product.slug}` : SITE_URL;

  const formatWhatsAppMessage = () => {
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    return [
      `🛒 *COMMANDE - ${siteName}*`, '',
      '📦 *PRODUIT*', `Nom: ${product.title}`, `Prix: ${product.price}`, `Quantité: ${quantity}`, `Lien: ${productUrl}`, '',
      '👤 *CLIENT*', `Nom: ${formData.name}`, `Téléphone: ${formData.phone}`, `Pays: ${formData.country}`,
      `Ville: ${formData.city}`, `Adresse: ${formData.address}`, '',
      `📅 Date: ${dateStr}`, '⏳ Statut: En attente de confirmation',
    ].join('\n');
  };

  const handlePriceRequest = async () => {
    try {
      const response = await api.requestPrice(product.slug);
      const url = response?.data?.whatsapp?.url || response?.data?.url;
      if (!url) throw new Error('URL WhatsApp indisponible');
      await Linking.openURL(url);
    } catch {
      const msg = `*${siteName} - Demande de prix*\n\nBonjour, je souhaite connaître le prix actualisé de ${product.title}.\n\n📦 *Source:* Application Mobile\n🔗 *Lien:* ${productUrl}`;
      await Linking.openURL(whatsappUrl(contact.whatsapp, msg)).catch(() => {});
    }
  };

  const handleWhatsAppOrder = async () => {
    const required = [['name', 'votre nom'], ['phone', 'votre numéro de téléphone'], ['city', 'votre ville'], ['address', 'votre adresse']];
    for (const [key, label] of required) {
      if (!formData[key].trim()) { Alert.alert('Champ manquant', `Veuillez entrer ${label}.`); return; }
    }
    const pays = paysList.find((p) => p.pays?.toLowerCase() === formData.country.trim().toLowerCase())
      || paysList.find((p) => p.pays?.toLowerCase() === 'burundi') || paysList[0] || null;
    setSending(true);
    try {
      // La commande est enregistrée sur le serveur, qui renvoie le lien WhatsApp à ouvrir.
      const response = await api.createOrder(product.slug, {
        nom_complet: formData.name.trim(),
        telephone: formData.phone.trim(),
        pays_id: pays?.id ?? null,
        ville: formData.city.trim(),
        adresse: formData.address.trim(),
        quantite: quantity,
      });
      const url = response?.data?.whatsapp?.url;
      if (!url) throw new Error('URL WhatsApp indisponible');
      await Linking.openURL(url);
    } catch {
      await Linking.openURL(whatsappUrl(contact.whatsapp, formatWhatsAppMessage())).catch(() => {});
    } finally {
      setSending(false);
    }
    setShowOrderForm(false);
    setFormData(EMPTY_FORM);
    setQuantity(1);
  };

  const handleShare = () => {
    Share.share({ message: `${product.title} — ${product.price}\n${productUrl}`, url: productUrl, title: product.title }).catch(() => {});
  };

  if (loading) {
    return <View style={[styles.root, styles.center]}><ActivityIndicator size="large" color={palette.green} /></View>;
  }

  if (!product) {
    return (
      <View style={[styles.root, styles.center]}>
        <Ionicons name="alert-circle-outline" size={44} color={palette.grey} />
        <Text style={styles.errorText}>Produit introuvable</Text>
        <TouchableOpacity style={styles.retry} onPress={loadProduct}><Text style={styles.retryText}>Réessayer</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Retour</Text></TouchableOpacity>
      </View>
    );
  }

  const images = product.images?.length ? product.images : [product.image || null];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <View style={[styles.gallery, { paddingTop: insets.top }]}>
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))}
          >
            {images.map((uri, i) => (
              <View key={String(uri || i)} style={styles.slide}>
                {uri ? <Image source={{ uri }} style={styles.slideImg} resizeMode="contain" /> : <Ionicons name="leaf-outline" size={64} color={palette.green} />}
              </View>
            ))}
          </ScrollView>
          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((_, i) => <View key={i} style={[styles.dot, i === imageIndex && styles.dotActive]} />)}
            </View>
          ) : null}
          <View style={[styles.floatBar, { top: insets.top + 10 }]}>
            <TouchableOpacity style={styles.floatBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={palette.dark} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.floatBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={19} color={palette.dark} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.tags}>
            {product.category_name ? <Text style={styles.cat}>{product.category_name}</Text> : null}
            {product.vedette ? <Text style={[styles.tag, styles.tagGold]}>★ Vedette</Text> : null}
            {product.is_new ? <Text style={[styles.tag, styles.tagGreen]}>Nouveau</Text> : null}
          </View>
          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.price, !product.has_price && styles.priceAsk]}>{product.price}</Text>
              {product.price_secondary ? <Text style={styles.price2}>{product.price_secondary}</Text> : null}
            </View>
            <View style={[styles.stock, !product.in_stock && styles.stockOut]}>
              <View style={[styles.stockDot, { backgroundColor: product.in_stock ? palette.greenLight : palette.red }]} />
              <Text style={[styles.stockText, !product.in_stock && { color: palette.red }]}>{product.in_stock ? 'En stock' : 'Rupture'}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.priceNote} onPress={handlePriceRequest} activeOpacity={0.85}>
            <Ionicons name="information-circle-outline" size={18} color={palette.goldDark} />
            <Text style={styles.priceNoteText}>Prix indicatif. Confirmez le prix actualisé sur WhatsApp.</Text>
            <Text style={styles.priceNoteLink}>Demander</Text>
          </TouchableOpacity>

          <View style={styles.perks}>
            {[['logo-whatsapp', 'Commande confirmée sur WhatsApp'], ['car-outline', 'Livraison au Burundi et à l\'international'], ['leaf-outline', 'Produit naturel à base de plantes']].map(([icon, label]) => (
              <View key={label} style={styles.perk}>
                <Ionicons name={icon} size={17} color={palette.green} />
                <Text style={styles.perkText}>{label}</Text>
              </View>
            ))}
          </View>

          {product.description ? (
            <>
              <Text style={styles.h2}>Description</Text>
              <Text style={styles.description}>{product.description.replace(/\r\n/g, '\n').trim()}</Text>
            </>
          ) : null}

          {product.health_warning ? (
            <View style={styles.warning}>
              <Ionicons name="medkit-outline" size={18} color={palette.goldDark} />
              <Text style={styles.warningText}>{product.health_warning}</Text>
            </View>
          ) : null}

          {product.proposer_consultation ? (
            <TouchableOpacity style={styles.consult} onPress={() => router.push('/consultation')} activeOpacity={0.85}>
              <View style={styles.consultIcon}><Ionicons name="calendar-outline" size={20} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.consultTitle}>Besoin d&apos;un avis avant d&apos;acheter ?</Text>
                <Text style={styles.consultSub}>Consultez un expert NUFOTEC</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette.green} />
            </TouchableOpacity>
          ) : null}

          {product.similar_products?.length > 0 ? (
            <>
              <Text style={styles.h2}>Produits similaires</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
                {product.similar_products.map((item) => (
                  <TouchableOpacity
                    key={item.slug || item.id} style={styles.similar} activeOpacity={0.9}
                    onPress={() => router.push({ pathname: '/product-detail', params: { slug: item.slug || item.id } })}
                  >
                    <View style={styles.similarImgWrap}>
                      {item.image ? <Image source={{ uri: item.image }} style={styles.similarImg} resizeMode="contain" /> : null}
                    </View>
                    <Text style={styles.similarTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.similarPrice}>{item.price}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.buyBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View style={styles.qty}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
            <Ionicons name="remove" size={18} color={palette.dark} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => q + 1)}>
            <Ionicons name="add" size={18} color={palette.dark} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.buyBtn, !product.in_stock && styles.buyBtnDisabled]}
          onPress={() => (product.in_stock ? setShowOrderForm(true) : handlePriceRequest())}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          <Text style={styles.buyText}>{product.in_stock ? 'Commander sur WhatsApp' : 'Être informé'}</Text>
        </TouchableOpacity>
      </View>

      <Modal animationType="slide" transparent visible={showOrderForm} onRequestClose={() => setShowOrderForm(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Informations de livraison</Text>
              <TouchableOpacity onPress={() => setShowOrderForm(false)}><Ionicons name="close" size={24} color={palette.dark} /></TouchableOpacity>
            </View>
            <View style={styles.summary}>
              {product.image ? <Image source={{ uri: product.image }} style={styles.summaryImg} resizeMode="contain" /> : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryTitle} numberOfLines={1}>{product.title}</Text>
                <Text style={styles.summaryMeta}>{`${quantity} × ${product.price}`}</Text>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {[
                { key: 'name', label: 'Nom complet *', placeholder: 'Votre nom et prénom' },
                { key: 'phone', label: 'Téléphone (WhatsApp) *', placeholder: '+257 …', keyboardType: 'phone-pad' },
                { key: 'country', label: 'Pays', placeholder: 'Burundi' },
                { key: 'city', label: 'Ville *', placeholder: 'Bujumbura, Gitega…' },
                { key: 'address', label: 'Adresse *', placeholder: 'Quartier, rue, numéro…', multiline: true },
              ].map((field) => (
                <View key={field.key} style={styles.inputGroup}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    style={[styles.input, field.multiline && styles.textArea]}
                    placeholder={field.placeholder}
                    placeholderTextColor={palette.grey}
                    keyboardType={field.keyboardType || 'default'}
                    value={formData[field.key]}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, [field.key]: text }))}
                    multiline={field.multiline}
                  />
                </View>
              ))}
              <TouchableOpacity style={styles.submit} onPress={handleWhatsAppOrder} disabled={sending} activeOpacity={0.85}>
                {sending ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                    <Text style={styles.buyText}>Envoyer la commande</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.sheetNote}>Votre commande sera confirmée par notre équipe sur WhatsApp.</Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = (p) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.white },
  center: { justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  errorText: { color: p.greyDark, fontSize: typography.lg },
  retry: { backgroundColor: p.green, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.full },
  retryText: { color: '#fff', fontWeight: '700' },
  link: { color: p.green, fontWeight: '700' },

  gallery: { backgroundColor: '#fff' },
  slide: { width: SCREEN_W, height: IMG_H, justifyContent: 'center', alignItems: 'center' },
  slideImg: { width: '86%', height: '86%' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: p.greyLight },
  dotActive: { backgroundColor: p.green, width: 16 },
  floatBar: { position: 'absolute', left: spacing.md, right: spacing.md, flexDirection: 'row', justifyContent: 'space-between' },
  floatBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },

  body: { padding: spacing.base, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: p.white, borderTopWidth: 1, borderColor: p.greyLight },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cat: { color: p.gold, fontSize: typography.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  tag: { fontSize: 10, fontWeight: '800', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  tagGold: { backgroundColor: `${p.gold}26`, color: p.goldDark },
  tagGreen: { backgroundColor: p.greenSoft, color: p.green },
  title: { color: p.dark, fontSize: 24, fontWeight: '900', marginTop: 6, lineHeight: 30 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  price: { color: p.green, fontSize: 28, fontWeight: '900' },
  priceAsk: { color: p.goldDark, fontSize: 20 },
  price2: { color: p.greyDark, fontSize: typography.sm, marginTop: 1 },
  stock: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: p.greenSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full },
  stockOut: { backgroundColor: `${p.red}14` },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockText: { color: p.green, fontSize: typography.sm, fontWeight: '700' },
  priceNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md, padding: spacing.md,
    backgroundColor: `${p.gold}14`, borderRadius: radius.md, borderWidth: 1, borderColor: `${p.gold}40`,
  },
  priceNoteText: { flex: 1, color: p.darkLight, fontSize: typography.sm, lineHeight: 17 },
  priceNoteLink: { color: p.green, fontWeight: '800', fontSize: typography.sm },
  perks: { marginTop: spacing.md, gap: 10, paddingVertical: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: p.greyLight },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { color: p.darkLight, fontSize: typography.sm + 1 },
  h2: { color: p.dark, fontSize: typography.lg, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.sm },
  description: { color: p.darkLight, fontSize: typography.base, lineHeight: 22 },
  warning: { flexDirection: 'row', gap: 10, marginTop: spacing.lg, padding: spacing.md, backgroundColor: p.whiteOff, borderRadius: radius.md },
  warningText: { flex: 1, color: p.greyDark, fontSize: typography.sm, lineHeight: 18 },
  consult: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: p.green, backgroundColor: p.greenSoft,
  },
  consultIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: p.green, justifyContent: 'center', alignItems: 'center' },
  consultTitle: { color: p.dark, fontWeight: '800', fontSize: typography.base },
  consultSub: { color: p.greyDark, fontSize: typography.sm, marginTop: 1 },
  similar: { width: 140, backgroundColor: p.white, borderRadius: radius.md, borderWidth: 1, borderColor: p.greyLight, overflow: 'hidden' },
  similarImgWrap: { width: '100%', height: 120, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  similarImg: { width: '88%', height: '88%' },
  similarTitle: { color: p.dark, fontSize: typography.sm, fontWeight: '700', paddingHorizontal: spacing.sm, paddingTop: spacing.sm, minHeight: 40 },
  similarPrice: { color: p.green, fontSize: typography.sm + 1, fontWeight: '900', padding: spacing.sm },

  buyBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, backgroundColor: p.white, borderTopWidth: 1, borderTopColor: p.greyLight,
  },
  qty: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: p.greyLight, borderRadius: radius.full, height: 48 },
  qtyBtn: { width: 40, height: 48, justifyContent: 'center', alignItems: 'center' },
  qtyText: { color: p.dark, fontSize: typography.md, fontWeight: '800', minWidth: 22, textAlign: 'center' },
  buyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: p.whatsapp, height: 48, borderRadius: radius.full },
  buyBtnDisabled: { backgroundColor: p.greyDark },
  buyText: { color: '#fff', fontSize: typography.base, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: p.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingHorizontal: spacing.base },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: p.greyLight, marginTop: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  sheetTitle: { color: p.dark, fontSize: typography.lg, fontWeight: '800' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm, backgroundColor: p.whiteOff, borderRadius: radius.md, marginBottom: spacing.md },
  summaryImg: { width: 48, height: 48, backgroundColor: '#fff', borderRadius: radius.sm },
  summaryTitle: { color: p.dark, fontWeight: '700' },
  summaryMeta: { color: p.green, fontWeight: '800', marginTop: 2 },
  inputGroup: { marginBottom: spacing.md },
  label: { color: p.darkLight, fontSize: typography.sm, fontWeight: '700', marginBottom: 6 },
  input: { backgroundColor: p.whiteOff, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: typography.base, color: p.dark, borderWidth: 1, borderColor: p.greyLight },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  submit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: p.whatsapp, height: 52, borderRadius: radius.full, marginTop: spacing.sm },
  sheetNote: { color: p.greyDark, fontSize: typography.xs + 1, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.sm },
});
