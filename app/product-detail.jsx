// app/product-detail.jsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import BottomNav from '../src/components/BottomNav';
import api from '../src/utils/api';
import { colors, radius, spacing, typography } from '../src/utils/theme';

const SITE_NAME = 'NUFOTEC BURUNDI';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  
  // États pour le formulaire de commande
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    country: 'Burundi',
    city: '',
    address: '',
  });
  
  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadProductDetail();
    // Afficher le toast après 2 secondes
    const timer = setTimeout(() => {
      setToastMessage('⚠️ Veuillez nous contacter via WhatsApp (+257) 79 666 439 ou Email nufotecburundi2026@gmail.com pour connaitre le prix actualisé');
      setShowToast(true);
      // Cacher le toast après 5 secondes
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const message = [
      `🛒 *COMMANDE - ${SITE_NAME}*`,
      ``,
      `📦 *PRODUIT*`,
      `Nom: ${product.title}`,
      `Prix: ${product.price}`,
      `Quantité: ${quantity}`,
      `Lien: https://nufotec.com/product/${product.slug}`,
      ``,
      `👤 *CLIENT*`,
      `Nom: ${formData.name}`,
      `Téléphone: ${formData.phone}`,
      `Pays: ${formData.country}`,
      `Ville: ${formData.city}`,
      `Adresse: ${formData.address}`,
      ``,
      `📅 Date: ${dateStr}`,
      `⏳ Statut: En attente de confirmation`
    ].join('%0A');
    
    return message;
  };

  const handlePriceRequest = async () => {
    // Incrémenter le compteur de demande de prix
    try {
      await api.incrementPriceRequest(product.id);
    } catch (error) {
      console.error('Erreur incrémentation:', error);
    }
    
    const message = `*${SITE_NAME} - Demande de prix*%0A%0A`;
    const dateStr = new Date().toLocaleDateString('fr-FR');
    const timeStr = new Date().toLocaleTimeString('fr-FR');
    
    const fullMessage = message + 
      `Bonjour, je souhaite connaître le prix actualisé de ${product.title}.%0A%0A` +
      `📦 *Source:* Application Mobile%0A` +
      `🔗 *Lien:* https://nufotec.com/product/${product.slug}%0A%0A` +
      `📅 *Date:* ${dateStr} à ${timeStr}`;
    
    const phoneNumber = '79666439';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${fullMessage}`;
    
    Linking.openURL(whatsappUrl);
    setShowOrderForm(false);
  };

  const handleWhatsAppOrder = () => {
    if (!formData.name.trim()) {
      Alert.alert('Champ manquant', 'Veuillez entrer votre nom');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Champ manquant', 'Veuillez entrer votre numéro de téléphone');
      return;
    }
    if (!formData.city.trim()) {
      Alert.alert('Champ manquant', 'Veuillez entrer votre ville');
      return;
    }
    if (!formData.address.trim()) {
      Alert.alert('Champ manquant', 'Veuillez entrer votre adresse');
      return;
    }
    
    const message = formatWhatsAppMessage();
    const phoneNumber = '79666439';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    Linking.openURL(whatsappUrl);
    setShowOrderForm(false);
    
    // Réinitialiser le formulaire
    setFormData({
      name: '',
      phone: '',
      country: 'Burundi',
      city: '',
      address: '',
    });
    setQuantity(1);
  };

  const openOrderForm = () => {
    setShowOrderForm(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Chargement du produit...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>Produit non trouvé</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Toast */}
        {showToast && (
          <View style={styles.toastContainer}>
            <View style={styles.toastContent}>
              <View style={styles.toastHeader}>
                <Ionicons name="information-circle" size={20} color="#FF9800" />
                <Text style={styles.toastTitle}>Information importante</Text>
                <TouchableOpacity onPress={() => setShowToast(false)}>
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.toastBody}>
                <Text style={styles.toastText}>{toastMessage}</Text>
                <View style={styles.toastButtons}>
                  <TouchableOpacity 
                    style={styles.toastWhatsAppBtn}
                    onPress={handlePriceRequest}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                    <Text style={styles.toastWhatsAppText}>WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.toastCloseBtn}
                    onPress={() => setShowToast(false)}
                  >
                    <Text style={styles.toastCloseText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Image du produit */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
            <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            {product.in_vedette === 1 && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>En vedette</Text>
              </View>
            )}
          </View>

          {/* Informations produit */}
          <View style={styles.contentContainer}>
            <Text style={styles.productTitle}>{product.title}</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.productPrice}>{product.price}</Text>
              <TouchableOpacity 
                style={styles.requestCount}
                onPress={handlePriceRequest}
              >
                <Ionicons name="chatbubble-outline" size={14} color="#FF9800" />
                <Text style={styles.requestCountText}>
                  {product.price_request_count || 0} demandes
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quantité et Bouton Commander sur la même ligne */}
            <View style={styles.quantityRow}>
              <View style={styles.quantitySection}>
                <Text style={styles.sectionTitle}>Quantité</Text>
                <View style={styles.quantitySelector}>
                  <TouchableOpacity 
                    style={styles.quantityBtn}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Ionicons name="remove" size={20} color="#4CAF50" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity 
                    style={styles.quantityBtn}
                    onPress={() => setQuantity(quantity + 1)}
                  >
                    <Ionicons name="add" size={20} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bouton Commander sur WhatsApp */}
              <TouchableOpacity style={styles.orderButtonInline} onPress={openOrderForm}>
                <LinearGradient
                  colors={['#25D366', '#128C7E']}
                  style={styles.orderGradientInline}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="white" />
                  <Text style={styles.orderTextInline}>Commander</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* En-tête Détails produit - Version améliorée avec lignes */}
            <View style={styles.detailsHeader}>
              <View style={styles.detailsHeaderLine} />
              <View style={styles.detailsHeaderContent}>
                <Ionicons name="document-text-outline" size={18} color="#4CAF50" />
                <Text style={styles.detailsHeaderText}>Détails du produit</Text>
              </View>
              <View style={styles.detailsHeaderLine} />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.description}>{product.description}</Text>
            </View>

            {/* product similaires */}
            {product.similar_products && product.similar_products.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>product similaires</Text>
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
            
            {/* Bouton Demander le prix réel */}
            <TouchableOpacity style={styles.priceRequestButton} onPress={handlePriceRequest}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FF9800" />
              <Text style={styles.priceRequestText}>Demander le prix réel</Text>
            </TouchableOpacity>
            
            {/* Espace en bas */}
            <View style={{ height: 80 }} />
          </View>
        </ScrollView>

        {/* Modal Formulaire de commande */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showOrderForm}
          onRequestClose={() => setShowOrderForm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Informations de livraison</Text>
                <TouchableOpacity onPress={() => setShowOrderForm(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nom complet *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Votre nom et prénom"
                    value={formData.name}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Téléphone *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Votre numéro WhatsApp"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({...formData, phone: text})}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Pays</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Burundi"
                    value={formData.country}
                    onChangeText={(text) => setFormData({...formData, country: text})}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ville *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Bujumbura, Gitega, etc."
                    value={formData.city}
                    onChangeText={(text) => setFormData({...formData, city: text})}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Adresse *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Quartier, rue, numéro..."
                    multiline
                    numberOfLines={3}
                    value={formData.address}
                    onChangeText={(text) => setFormData({...formData, address: text})}
                  />
                </View>
                
                <TouchableOpacity style={styles.submitButton} onPress={handleWhatsAppOrder}>
                  <LinearGradient
                    colors={['#4CAF50', '#2E7D32']}
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="white" />
                    <Text style={styles.submitText}>Envoyer la commande</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Bottom Navigation */}
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSub,
  },
  errorText: {
    fontSize: typography.lg,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  backButton: {
    marginTop: spacing.lg,
    backgroundColor: '#4CAF50',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  backCircle: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  featuredText: {
    color: 'white',
    fontSize: typography.xs,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: spacing.lg,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  requestCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  requestCountText: {
    fontSize: typography.xs,
    color: '#FF9800',
  },
  // Ligne pour quantité et bouton commander
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quantitySection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.base,
    fontWeight: '600',
    color: '#333',
    marginBottom: spacing.sm,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quantityBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
  },
  // Bouton Commander en ligne
  orderButtonInline: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  orderGradientInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  orderTextInline: {
    color: 'white',
    fontSize: typography.sm,
    fontWeight: 'bold',
  },
  // En-tête Détails produit
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  detailsHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  detailsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  detailsHeaderText: {
    fontSize: typography.sm,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: typography.sm,
    color: '#666',
    lineHeight: 20,
  },
  similarScroll: {
    flexDirection: 'row',
  },
  similarCard: {
    width: 140,
    backgroundColor: 'white',
    borderRadius: radius.md,
    marginRight: spacing.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  similarImage: {
    width: '100%',
    height: 100,
  },
  similarTitle: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: '#333',
    padding: spacing.sm,
    paddingBottom: 0,
  },
  similarPrice: {
    fontSize: typography.sm,
    fontWeight: 'bold',
    color: '#4CAF50',
    padding: spacing.sm,
  },
  priceRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#FFF3E0',
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  priceRequestText: {
    color: '#FF9800',
    fontSize: typography.sm,
    fontWeight: '600',
  },
  // Toast styles
  toastContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  toastContent: {
    backgroundColor: '#333',
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  toastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    backgroundColor: '#222',
    borderBottomWidth: 1,
    borderBottomColor: '#FF9800',
  },
  toastTitle: {
    color: '#FF9800',
    fontSize: typography.sm,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
    flex: 1,
  },
  toastBody: {
    padding: spacing.md,
  },
  toastText: {
    color: '#fff',
    fontSize: typography.sm,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  toastButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toastWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#128C7E',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  toastWhatsAppText: {
    color: 'white',
    fontSize: typography.xs,
    fontWeight: '600',
  },
  toastCloseBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  toastCloseText: {
    color: '#fff',
    fontSize: typography.xs,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: radius.lg,
    width: '90%',
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: typography.lg,
    fontWeight: 'bold',
    color: '#333',
  },
  inputGroup: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: '#333',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: typography.sm,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  submitText: {
    color: 'white',
    fontSize: typography.base,
    fontWeight: 'bold',
  },
});