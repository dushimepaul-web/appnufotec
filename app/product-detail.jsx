import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import BottomNav from '../src/components/BottomNav';
import { useSettings } from '../src/contexts/SettingsContext';
import { useTheme } from '../src/contexts/ThemeContext';
import api from '../src/utils/api';
import { radius, spacing, typography } from '../src/utils/theme';

export default function ProductDetailScreen() {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  const { id } = useLocalSearchParams();
  const settings = useSettings();
  const siteName = `${settings.app_name} ${settings.app_subtitle}`;
  const contact = settings.contact;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', phone: '', country: 'Burundi', city: '', address: '',
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadProductDetail();
    const timer = setTimeout(() => {
      setToastMessage(`Veuillez nous contacter via WhatsApp ${contact.phone} ou Email ${contact.email} pour connaitre le prix actualisé`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }, 2000);
    return () => clearTimeout(timer);
  }, [id]);

  const loadProductDetail = async () => {
    try {
      setLoading(true);
      const response = await api.getProductDetail(id);
      if (response.success) {
        setProduct(response.data);
      } else {
        Alert.alert('Erreur', response.message || 'Produit non trouvé');
        router.back();
      }
    } catch (error) {
      console.error('Erreur chargement produit:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du produit');
    } finally {
      setLoading(false);
    }
  };

  const formatWhatsAppMessage = () => {
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    return `🛒 *COMMANDE - ${siteName}*%0A%0A📦 *PRODUIT*%0ANom: ${product.title}%0APrix: ${product.price}%0AQuantité: ${quantity}%0ALien: https://nufotec.com/product/${product.slug}%0A%0A👤 *CLIENT*%0ANom: ${formData.name}%0ATéléphone: ${formData.phone}%0APays: ${formData.country}%0AVille: ${formData.city}%0AAdresse: ${formData.address}%0A%0A📅 Date: ${dateStr}%0A⏳ Statut: En attente de confirmation`;
  };

  const handlePriceRequest = async () => {
    try { await api.incrementPriceRequest(product.id); } catch (e) { console.error(e); }
    const dateStr = new Date().toLocaleDateString('fr-FR');
    const timeStr = new Date().toLocaleTimeString('fr-FR');
    const msg = `*${siteName} - Demande de prix*%0A%0ABonjour, je souhaite connaître le prix actualisé de ${product.title}.%0A%0A📦 *Source:* Application Mobile%0A🔗 *Lien:* https://nufotec.com/product/${product.slug}%0A%0A📅 *Date:* ${dateStr} à ${timeStr}`;
    Linking.openURL(`https://wa.me/${contact.whatsapp}?text=${msg}`);
    setShowOrderForm(false);
  };

  const handleWhatsAppOrder = () => {
    if (!formData.name.trim()) { Alert.alert('Champ manquant', 'Veuillez entrer votre nom'); return; }
    if (!formData.phone.trim()) { Alert.alert('Champ manquant', 'Veuillez entrer votre numéro de téléphone'); return; }
    if (!formData.city.trim()) { Alert.alert('Champ manquant', 'Veuillez entrer votre ville'); return; }
    if (!formData.address.trim()) { Alert.alert('Champ manquant', 'Veuillez entrer votre adresse'); return; }
    Linking.openURL(`https://wa.me/${contact.whatsapp}?text=${formatWhatsAppMessage()}`);
    setShowOrderForm(false);
    setFormData({ name: '', phone: '', country: 'Burundi', city: '', address: '' });
    setQuantity(1);
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, styles.centerContainer]}>
        <ActivityIndicator size="large" color={palette.green} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.safeArea, styles.centerContainer]}>
        <View style={styles.errorIconBox}>
          <Ionicons name="alert-circle-outline" size={40} color={palette.grey} />
        </View>
        <Text style={styles.errorText}>Produit non trouvé</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        {showToast && (
          <View style={styles.toastContainer}>
            <View style={styles.toastContent}>
              <View style={styles.toastHeader}>
                <Ionicons name="information-circle" size={20} color={palette.gold} />
                <Text style={styles.toastTitle}>Information importante</Text>
                <TouchableOpacity onPress={() => setShowToast(false)}>
                  <Ionicons name="close" size={20} color={palette.dark} />
                </TouchableOpacity>
              </View>
              <View style={styles.toastBody}>
                <Text style={styles.toastText}>{toastMessage}</Text>
                <View style={styles.toastButtons}>
                  <TouchableOpacity style={styles.toastWhatsAppBtn} onPress={handlePriceRequest}>
                    <Ionicons name="logo-whatsapp" size={16} color={palette.white} />
                    <Text style={styles.toastWhatsAppText}>WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toastCloseBtn} onPress={() => setShowToast(false)}>
                    <Text style={styles.toastCloseText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
            <View style={styles.imageOverlay} />
            <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={palette.white} />
            </TouchableOpacity>
            {product.in_vedette === 1 && (
              <View style={[styles.featuredBadge, { backgroundColor: palette.gold }]}>
                <Ionicons name="star" size={12} color={palette.white} />
                <Text style={styles.featuredText}>En vedette</Text>
              </View>
            )}
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.productTitle}>{product.title}</Text>

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Prix</Text>
                <Text style={styles.productPrice}>{product.price}</Text>
              </View>
              <TouchableOpacity style={styles.requestCount} onPress={handlePriceRequest}>
                <Ionicons name="chatbubble-outline" size={14} color={palette.gold} />
                <Text style={styles.requestCountText}>{product.price_request_count || 0} demandes</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quantityRow}>
              <View style={styles.quantitySection}>
                <Text style={styles.sectionLabel}>Quantité</Text>
                <View style={styles.quantitySelector}>
                  <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Ionicons name="remove" size={20} color={palette.green} />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity(quantity + 1)}>
                    <Ionicons name="add" size={20} color={palette.green} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.orderButtonInline} onPress={() => setShowOrderForm(true)}>
                <View style={[styles.orderGradientInline, { backgroundColor: '#25D366' }]}>
                  <Ionicons name="logo-whatsapp" size={20} color="white" />
                  <Text style={styles.orderTextInline}>Commander</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.detailsHeader}>
              <View style={styles.detailsHeaderLine} />
              <View style={styles.detailsHeaderContent}>
                <Ionicons name="document-text-outline" size={18} color={palette.green} />
                <Text style={styles.detailsHeaderText}>Détails du produit</Text>
              </View>
              <View style={styles.detailsHeaderLine} />
            </View>

            <View style={styles.section}>
              <Text style={styles.description}>{product.description}</Text>
            </View>

            {product.similar_products && product.similar_products.length > 0 && (
              <View style={styles.similarSection}>
                <Text style={styles.sectionLabel}>Produits similaires</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.similarScroll}>
                  {product.similar_products.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.similarCard}
                      onPress={() => router.push({ pathname: '/product-detail', params: { id: item.id } })}
                    >
                      <Image source={{ uri: item.image }} style={styles.similarImage} />
                      <Text style={styles.similarTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.similarPrice}>{item.price}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity style={styles.priceRequestButton} onPress={handlePriceRequest}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={palette.gold} />
              <Text style={styles.priceRequestText}>Demander le prix réel</Text>
            </TouchableOpacity>

            <View style={{ height: 80 }} />
          </View>
        </ScrollView>

        <Modal animationType="slide" transparent={true} visible={showOrderForm} onRequestClose={() => setShowOrderForm(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Informations de livraison</Text>
                <TouchableOpacity onPress={() => setShowOrderForm(false)}>
                  <Ionicons name="close" size={24} color={palette.dark} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {[
                  { key: 'name', label: 'Nom complet *', placeholder: 'Votre nom et prénom', keyboardType: 'default' },
                  { key: 'phone', label: 'Téléphone *', placeholder: 'Votre numéro WhatsApp', keyboardType: 'phone-pad' },
                  { key: 'country', label: 'Pays', placeholder: 'Burundi', keyboardType: 'default' },
                  { key: 'city', label: 'Ville *', placeholder: 'Bujumbura, Gitega, etc.', keyboardType: 'default' },
                  { key: 'address', label: 'Adresse *', placeholder: 'Quartier, rue, numéro...', keyboardType: 'default', multiline: true },
                ].map((field) => (
                  <View key={field.key} style={styles.inputGroup}>
                    <Text style={styles.label}>{field.label}</Text>
                    <TextInput
                      style={[styles.input, field.multiline && styles.textArea]}
                      placeholder={field.placeholder}
                      placeholderTextColor={palette.grey}
                      keyboardType={field.keyboardType}
                      value={formData[field.key]}
                      onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                      multiline={field.multiline}
                      numberOfLines={field.multiline ? 3 : 1}
                    />
                  </View>
                ))}
                <TouchableOpacity style={styles.submitButton} onPress={handleWhatsAppOrder}>
                  <View style={[styles.submitGradient, { backgroundColor: palette.green }]}>
                    <Ionicons name="logo-whatsapp" size={20} color="white" />
                    <Text style={styles.submitText}>Envoyer la commande</Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <BottomNav />
      </View>
    </View>
  );
}

const s = (p) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: p.white },
  container: { flex: 1, backgroundColor: p.white },
  scrollContent: { flexGrow: 1, paddingTop: 50 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: p.white },
  errorIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: p.whiteOff, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md, borderWidth: 1, borderColor: p.greyLight },
  errorText: { fontSize: typography.lg, color: p.grey, marginTop: spacing.md },
  backButton: { marginTop: spacing.lg, backgroundColor: p.green, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.full, shadowColor: p.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },

  imageContainer: { position: 'relative', width: '100%', height: 320, backgroundColor: p.greyLight },
  productImage: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(0,0,0,0.3)' },
  backCircle: { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  featuredBadge: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  featuredText: { color: 'white', fontSize: typography.xs, fontWeight: 'bold' },

  contentContainer: { padding: spacing.lg, marginTop: -20, backgroundColor: p.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  productTitle: { fontSize: 24, fontWeight: 'bold', color: p.dark, marginBottom: spacing.md },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.lg },
  priceLabel: { fontSize: typography.xs, color: p.greyDark, fontWeight: '500', marginBottom: 2 },
  productPrice: { fontSize: 28, fontWeight: 'bold', color: p.green },
  requestCount: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${p.gold}15`, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.md },

  requestCountText: { fontSize: typography.xs, color: p.gold, fontWeight: '600' },
  quantityRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, marginBottom: spacing.lg },
  quantitySection: { flex: 1 },
  sectionLabel: { fontSize: typography.base, fontWeight: '600', color: p.dark, marginBottom: spacing.sm },
  quantitySelector: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  quantityBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${p.green}15`, justifyContent: 'center', alignItems: 'center' },
  quantityText: { fontSize: 20, fontWeight: '600', color: p.dark, minWidth: 40, textAlign: 'center' },

  orderButtonInline: { flex: 1, borderRadius: radius.md, overflow: 'hidden', shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  orderGradientInline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, gap: spacing.xs },
  orderTextInline: { color: 'white', fontSize: typography.sm, fontWeight: 'bold' },

  detailsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, marginBottom: spacing.md },
  detailsHeaderLine: { flex: 1, height: 1, backgroundColor: p.greyLight },
  detailsHeaderContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md },
  detailsHeaderText: { fontSize: typography.sm, fontWeight: 'bold', color: p.greyDark, textTransform: 'uppercase', letterSpacing: 0.5 },

  section: { marginBottom: spacing.lg },
  description: { fontSize: typography.sm, color: '#555', lineHeight: 20 },

  similarSection: { marginBottom: spacing.lg },
  similarScroll: { flexDirection: 'row' },
  similarCard: { width: 140, backgroundColor: p.white, borderRadius: radius.md, marginRight: spacing.md, overflow: 'hidden', borderWidth: 1, borderColor: p.greyLight, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  similarImage: { width: '100%', height: 100 },
  similarTitle: { fontSize: typography.sm, fontWeight: '600', color: p.dark, padding: spacing.sm, paddingBottom: 0 },
  similarPrice: { fontSize: typography.sm, fontWeight: 'bold', color: p.green, padding: spacing.sm },

  priceRequestButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.sm, backgroundColor: `${p.gold}10`, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: `${p.gold}30` },
  priceRequestText: { color: p.gold, fontSize: typography.sm, fontWeight: '600' },

  toastContainer: { position: 'absolute', bottom: 80, left: 16, right: 16, zIndex: 1000 },
  toastContent: { backgroundColor: p.white, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: p.gold, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
  toastHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.sm, backgroundColor: p.whiteOff, borderBottomWidth: 1, borderBottomColor: p.gold },
  toastTitle: { color: p.gold, fontSize: typography.sm, fontWeight: 'bold', marginLeft: spacing.xs, flex: 1 },
  toastBody: { padding: spacing.md },
  toastText: { color: '#555', fontSize: typography.sm, marginBottom: spacing.md, lineHeight: 18 },
  toastButtons: { flexDirection: 'row', gap: spacing.sm },
  toastWhatsAppBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: '#25D366', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  toastWhatsAppText: { color: 'white', fontSize: typography.xs, fontWeight: '600' },
  toastCloseBtn: { backgroundColor: p.greyLight, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  toastCloseText: { color: p.dark, fontSize: typography.xs },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: p.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: p.greyLight },
  modalTitle: { fontSize: typography.lg, fontWeight: 'bold', color: p.dark },
  inputGroup: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  label: { fontSize: typography.sm, fontWeight: '600', color: '#555', marginBottom: spacing.xs },
  input: { backgroundColor: p.whiteOff, borderRadius: radius.sm, padding: spacing.md, fontSize: typography.sm, color: p.dark, borderWidth: 1, borderColor: p.greyLight },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  submitButton: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, borderRadius: radius.md, overflow: 'hidden', shadowColor: p.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, gap: spacing.sm },
  submitText: { color: 'white', fontSize: typography.base, fontWeight: 'bold' },
});

