import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { readCache, writeCache } from './httpCache';

function resolveDevApiBase() {
  if (Platform.OS === 'web') return 'http://127.0.0.1:8000/api/v1';
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:8000/api/v1`;
  }
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api/v1'
    : 'http://127.0.0.1:8000/api/v1';
}

const DEFAULT_API_BASE = __DEV__ ? resolveDevApiBase() : 'https://nufotec.com/api/v1';

// En dev web, l'API distante refuse les requêtes cross-origin (pas d'en-tête
// CORS) : on passe par le proxy Metro défini dans metro.config.js.
function webDevProxyBase() {
  if (!__DEV__ || Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const { origin, hostname } = window.location || {};
  if (!origin || !/^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)$/.test(hostname || '')) return null;
  return `${origin}/__api`;
}

// Sécurité : en production, l'app ne parle à l'API qu'en HTTPS (jetons et données de santé chiffrés en transit).
// Une adresse http:// mal configurée dans EXPO_PUBLIC_API_URL est ignorée au profit de l'adresse officielle.
function secureBase(url) {
  if (__DEV__ || !url || url.startsWith('https://')) return url;
  console.warn('EXPO_PUBLIC_API_URL ignorée : HTTPS obligatoire en production');
  return null;
}

const API_BASE = (webDevProxyBase() || secureBase(process.env.EXPO_PUBLIC_API_URL) || DEFAULT_API_BASE).replace(/\/+$/, '');

export const BASE_URL = API_BASE;
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL || 'https://nufotec.com').replace(/\/+$/, '');

// wa.me exige un numéro international sans "+" ni espaces (ex. 25779666439).
// Un numéro burundais local à 8 chiffres reçoit l'indicatif 257.
export function toWhatsAppNumber(value) {
  const digits = String(value || '').replace(/\D/g, '').replace(/^00/, '');
  if (digits.length === 8) return `257${digits}`;
  return digits;
}

export function whatsappUrl(number, text) {
  const n = toWhatsAppNumber(number);
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

async function parseJsonResponse(response) {
  const body = await response.text();
  if (!body) return null;
  return JSON.parse(body.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, ''));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function toError(payload, status) {
  const message = payload?.error?.message || payload?.message || `HTTP ${status}`;
  const error = new Error(message);
  error.status = status;
  error.code = payload?.error?.code || null;
  error.details = payload?.error?.details || null;
  return error;
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      search.append(key, typeof value === 'boolean' ? String(value) : String(value));
    }
  });
  return search.toString();
}

export function resolveUrl(path) {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return `${BASE_URL}${path}`;
  return `${BASE_URL}/${path}`;
}

// Disponibilité : on ne réessaie que les erreurs passagères (réseau coupé, délai dépassé, serveur occupé
// ou momentanément indisponible), en respectant le délai Retry-After envoyé par l'API. Une erreur définitive
// (données invalides, introuvable, accès refusé) n'est pas répétée : réponse immédiate, pas de données gaspillées.
const RETRY_STATUS = [408, 425, 429, 500, 502, 503, 504];

function isTransient(error) {
  return !error.status || RETRY_STATUS.includes(error.status);
}

function retryDelay(attempt, error) {
  const after = Number(error.retryAfter);
  if (after > 0) return Math.min(after, 10) * 1000;
  return 1000 * Math.pow(2, attempt) + Math.random() * 300; // 1 s, 2 s, 4 s (+ un peu de hasard)
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Rapidité : une copie de moins de 30 s est utilisée telle quelle, sans requête (navigation entre écrans).
const FRESH_MS = 30 * 1000;

// Clé anti-doublon : la même pour toutes les tentatives d'un envoi. Si la réponse se perd (coupure) et que
// l'app renvoie la commande, l'API reconnaît la clé et ne l'enregistre pas une seconde fois.
function idempotencyKey() {
  const hex = () => Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0');
  return `m-${Date.now().toString(36)}-${hex()}${hex()}${hex()}`;
}

function mediaParams({ page = 1, perPage = 20, categorie, q, tri = 'recent' } = {}) {
  return { page, per_page: perPage, categorie, q, tri };
}

function productParams({ page = 1, perPage = 10, categorie, q, vedette, prixMin, prixMax, devise, tri } = {}) {
  return { page, per_page: perPage, categorie, q, vedette, prix_min: prixMin, prix_max: prixMax, devise, tri };
}

class ApiService {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  /**
   * GET. Les réponses publiques (sans jeton) sont gardées en cache avec leur ETag :
   * 304 -> la copie est réutilisée ; réseau ou serveur indisponible -> la dernière copie est renvoyée,
   * marquée `stale: true` (l'écran peut afficher « données hors ligne »).
   */
  urlFor(endpoint, params = {}) {
    const query = buildQuery(params);
    return `${this.baseUrl}/${endpoint}${query ? `?${query}` : ''}`;
  }

  /**
   * Accueil en une seule requête (GET /accueil) au démarrage de l'app. Chaque partie de la réponse est rangée
   * dans le cache sous l'adresse qu'elle remplace (paramètres, réseaux, témoignages, médias, produits) : les
   * écrans qui demandent ces adresses dans les secondes qui suivent sont servis sans nouvelle requête.
   * Ancienne API sans /accueil : échec silencieux, chaque écran fait alors ses requêtes habituelles.
   */
  warmup({ produits = 8, medias = 10 } = {}) {
    if (this.warming) return this.warming;
    this.warming = this.request('accueil', { produits, medias }, 1, true)
      .then((res) => {
        const d = res?.data;
        if (!res?.success || !d) return;
        const put = (url, data) => (data !== undefined ? writeCache(url, null, { success: true, message: null, data }) : null);
        put(this.urlFor('site/parametres'), d.parametres);
        put(this.urlFor('reseaux-sociaux'), d.reseaux_sociaux);
        put(this.urlFor('temoignages'), d.temoignages);
        put(this.urlFor('medias/categories'), d.medias_categories);
        put(this.urlFor('medias', mediaParams({ tri: 'recent', perPage: medias })), d.medias_recents);
        put(this.urlFor('produits', productParams({ perPage: produits })), d.produits);
      })
      .catch(() => {})
      .finally(() => { setTimeout(() => { this.warming = null; }, FRESH_MS); });
    return this.warming;
  }

  /**
   * GET. Les réponses publiques (sans jeton) sont gardées en cache avec leur ETag :
   *  - options.onCached(payload) reçoit tout de suite la copie gardée, avant la réponse du serveur
   *    (l'écran s'affiche immédiatement, puis se met à jour) ;
   *  - copie de moins de 30 s -> renvoyée sans requête (sauf options.force : « tirer pour actualiser ») ;
   *    304 -> la copie est réutilisée ;
   *  - réseau ou serveur indisponible -> la dernière copie est renvoyée, marquée `stale: true`.
   */
  async request(endpoint, params = {}, retries = 2, silent = false, token = null, options = {}) {
    const url = this.urlFor(endpoint, params);
    const headers = { Accept: 'application/json', 'Accept-Language': 'fr' };
    if (token) headers.Authorization = `Bearer ${token}`;
    let cached = token ? null : await readCache(url);
    if (cached && options.onCached) options.onCached(cached.payload);
    // Requête d'accueil groupée en cours : on l'attend plutôt que de doubler la requête.
    if (!token && this.warming && endpoint !== 'accueil') {
      await this.warming;
      const primed = await readCache(url);
      if (primed && primed !== cached && options.onCached) options.onCached(primed.payload);
      cached = primed || cached;
    }
    if (cached && !options.force && Date.now() - cached.savedAt < FRESH_MS) return cached.payload;
    if (cached?.etag) headers['If-None-Match'] = cached.etag;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetchWithTimeout(url, { method: 'GET', headers });
        if (response.status === 304 && cached) {
          writeCache(url, cached.etag, cached.payload);  // copie confirmée : de nouveau fraîche
          return cached.payload;
        }
        const payload = await parseJsonResponse(response);
        if (!response.ok || payload?.success === false) {
          const error = toError(payload, response.status);
          error.retryAfter = response.headers.get('retry-after');
          throw error;
        }
        if (!token) writeCache(url, response.headers.get('etag'), payload);
        return payload;
      } catch (error) {
        if (attempt < retries && isTransient(error)) {
          await wait(retryDelay(attempt, error));
          continue;
        }
        if (cached && isTransient(error)) return { ...cached.payload, stale: true, savedAt: cached.savedAt };
        if (!silent) console.error(`API Error [${endpoint}]:`, error.message);
        throw error;
      }
    }
  }

  async post(endpoint, body = {}, retries = 1, silent = false, token = null) {
    const url = `${this.baseUrl}/${endpoint}`;
    const headers = {
      Accept: 'application/json',
      'Accept-Language': 'fr',
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey(),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetchWithTimeout(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body ?? {}),
        });
        const payload = await parseJsonResponse(response);
        if (!response.ok || payload?.success === false) {
          const error = toError(payload, response.status);
          error.retryAfter = response.headers.get('retry-after');
          throw error;
        }
        return payload;
      } catch (error) {
        if (attempt < retries && isTransient(error)) {
          await wait(retryDelay(attempt, error));
          continue;
        }
        if (!silent) console.error(`API POST Error [${endpoint}]:`, error.message);
        throw error;
      }
    }
  }

  async login(login, password) {
    return this.post('auth/login', { login, password }, 0, false);
  }

  async logout(token) {
    return this.post('auth/logout', {}, 0, true, token);
  }

  getMedias(filters = {}, options = {}) {
    return this.request('medias', mediaParams(filters), 2, false, null, options);
  }

  getMedia(slug) {
    return this.request(`medias/${encodeURIComponent(slug)}`, {}, 0, true);
  }

  getMediaComments(slug, { page = 1, perPage = 20 } = {}) {
    return this.request(`medias/${encodeURIComponent(slug)}/commentaires`, { page, per_page: perPage });
  }

  getMediaCategories(options = {}) {
    return this.request('medias/categories', {}, 2, false, null, options);
  }

  getMediaCollections() {
    return this.request('medias/collections');
  }

  getMediaCollection(slug) {
    return this.request(`medias/collections/${encodeURIComponent(slug)}`);
  }

  searchMedia(q, perPage = 20) {
    return this.getMedias({ q, perPage });
  }

  getPopular(perPage = 20) {
    return this.getMedias({ tri: 'populaire', perPage });
  }

  getRecent(perPage = 20, options = {}) {
    return this.getMedias({ tri: 'recent', perPage }, options);
  }

  getCategories() {
    return this.getMediaCategories();
  }

  getPlaylists() {
    return this.getMediaCollections();
  }

  search(query, limit = 20) {
    return this.searchMedia(query, limit);
  }

  async recordView(slug) {
    try {
      return await this.post(`medias/${encodeURIComponent(slug)}/vue`, {}, 0, true);
    } catch (error) {
      if (error?.status === 403) return { success: false, forbidden: true };
      throw error;
    }
  }

  getSettings(options = {}) {
    return this.request('site/parametres', {}, 2, false, null, options);
  }

  getSocialLinks(options = {}) {
    return this.request('reseaux-sociaux', {}, 1, true, null, options);
  }

  getTestimonials(options = {}) {
    return this.request('temoignages', {}, 1, true, null, options);
  }

  getNotifications() {
    return Promise.resolve({ success: true, data: [] });
  }

  getPays(q) {
    return this.request('pays', { q });
  }

  getProducts(filters = {}, options = {}) {
    return this.request('produits', productParams(filters), 2, false, null, options);
  }

  getProductDetail(slug) {
    return this.request(`produits/${encodeURIComponent(slug)}`, {}, 0, true);
  }

  getProductCategories() {
    return this.request('produits/categories');
  }

  getFeaturedProducts(perPage = 6) {
    return this.getProducts({ vedette: true, perPage, tri: 'recent' });
  }

  createOrder(slug, orderData) {
    return this.post(`produits/${encodeURIComponent(slug)}/commander`, orderData);
  }

  requestPrice(slug) {
    return this.post(`produits/${encodeURIComponent(slug)}/demande-prix`, {});
  }
}

const api = new ApiService();
export default api;
