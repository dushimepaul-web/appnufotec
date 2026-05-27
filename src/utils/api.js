// src/utils/api.js
// ⚙️  Remplacez BASE_URL par l'URL de votre serveur CodeIgniter
const BASE_URL = 'https://nufotec.com/api/mobile';

const DEFAULT_LANG = 'fr';

class ApiService {
  constructor() {
    this.baseUrl = BASE_URL;
    this.lang = DEFAULT_LANG;
  }

  setLang(lang) {
    this.lang = lang;
  }

  async request(endpoint, params = {}) {
    const queryParams = new URLSearchParams({ lang: this.lang, ...params });
    const url = `${this.baseUrl}/${endpoint}?${queryParams}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  async post(endpoint, body = {}) {
    const url = `${this.baseUrl}/${endpoint}`;
    try {
      const formData = new FormData();
      Object.entries(body).forEach(([key, val]) => formData.append(key, val));

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error(`API POST Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  // ── Endpoints Médias ──────────────────────────────────────────────

  getMedias({ type = 'all', limit = 20, offset = 0, category } = {}) {
    const params = { limit, offset };
    if (type !== 'all') params.type = type;
    if (category) params.category = category;
    return this.request('medias', params);
  }

  getMedia(identifier) {
    return this.request(`media/${identifier}`);
  }

  getCategories() {
    return this.request('categories');
  }

  search(query, limit = 20) {
    return this.request('search', { q: query, limit });
  }

  getPopular(limit = 20) {
    return this.request('popular', { limit });
  }

  getRecent(limit = 20) {
    return this.request('recent', { limit });
  }

  getPlaylists() {
    return this.request('playlists');
  }

  recordView(id_media) {
    return this.post('record-view', { id_media });
  }

  // ── Endpoints Produits ──────────────────────────────────────────────

  /**
   * Récupérer la liste des produits
   * @param {Object} options - Options de filtrage
   * @param {number} options.page - Page (défaut: 1)
   * @param {number} options.limit - Nombre par page (défaut: 10)
   * @param {number} options.category_id - ID de la catégorie (optionnel)
   * @param {string} options.search - Terme de recherche (optionnel)
   * @returns {Promise} Réponse de l'API
   */
  getProducts({ page = 1, limit = 10, category_id = null, search = null } = {}) {
    const params = { page, limit };
    if (category_id && category_id !== 'all') params.category_id = category_id;
    if (search) params.search = search;
    return this.request('products', params);
  }

  /**
   * Récupérer le détail d'un produit
   * @param {number|string} identifier - ID ou slug du produit
   * @returns {Promise} Réponse de l'API avec les détails du produit
   */
  getProductDetail(identifier) {
    return this.request(`products/detail/${identifier}`);
  }

  /**
   * Récupérer les catégories de produits
   * @returns {Promise} Liste des catégories
   */
  getProductCategories() {
    return this.request('products/categories');
  }

  /**
   * Récupérer les produits vedettes (mis en avant)
   * @param {number} limit - Nombre de produits (défaut: 6)
   * @returns {Promise} Liste des produits vedettes
   */
  getFeaturedProducts(limit = 6) {
    return this.request('products/featured', { limit });
  }

  /**
   * Enregistrer une demande de commande
   * @param {Object} orderData - Données de la commande
   * @param {number} orderData.product_id - ID du produit
   * @param {string} orderData.customer_name - Nom complet du client
   * @param {string} orderData.customer_phone - Numéro de téléphone
   * @param {string} orderData.customer_country - Pays
   * @param {string} orderData.customer_city - Ville
   * @param {string} orderData.customer_address - Adresse complète
   * @param {string} orderData.customer_notes - Notes supplémentaires (optionnel)
   * @returns {Promise} Réponse de l'API avec order_id et message WhatsApp
   */
  saveOrder(orderData) {
    return this.post('products/save_order', orderData);
  }

  /**
   * Incrémenter le compteur de demande de prix
   * @param {number} product_id - ID du produit
   * @returns {Promise} Réponse avec le nouveau compteur
   */
  incrementPriceRequest(product_id) {
    return this.post('products/increment_price_request', { product_id });
  }

  /**
   * Générer le lien WhatsApp pour un produit
   * @param {number} product_id - ID du produit
   * @param {string} phone_number - Numéro de téléphone (optionnel, défaut: 68862945)
   * @returns {Promise} Réponse avec l'URL WhatsApp et le message
   */
  sendWhatsApp(product_id, phone_number = null) {
    const data = { product_id };
    if (phone_number) data.phone_number = phone_number;
    return this.post('products/send_whatsapp', data);
  }
}

export default new ApiService();