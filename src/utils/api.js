import Constants from 'expo-constants';
import { Platform } from 'react-native';

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

const API_BASE = (webDevProxyBase() || process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_BASE).replace(/\/+$/, '');

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

class ApiService {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  async request(endpoint, params = {}, retries = 2, silent = false, token = null) {
    const query = buildQuery(params);
    const url = `${this.baseUrl}/${endpoint}${query ? `?${query}` : ''}`;
    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetchWithTimeout(url, { method: 'GET', headers });
        const payload = await parseJsonResponse(response);
        if (!response.ok || payload?.success === false) throw toError(payload, response.status);
        return payload;
      } catch (error) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        if (!silent) console.error(`API Error [${endpoint}]:`, error.message);
        throw error;
      }
    }
  }

  async post(endpoint, body = {}, retries = 1, silent = false, token = null) {
    const url = `${this.baseUrl}/${endpoint}`;
    const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetchWithTimeout(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body ?? {}),
        });
        const payload = await parseJsonResponse(response);
        if (!response.ok || payload?.success === false) throw toError(payload, response.status);
        return payload;
      } catch (error) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
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

  getMedias({ page = 1, perPage = 20, categorie, q, tri = 'recent' } = {}) {
    return this.request('medias', { page, per_page: perPage, categorie, q, tri });
  }

  getMedia(slug) {
    return this.request(`medias/${encodeURIComponent(slug)}`, {}, 0, true);
  }

  getMediaComments(slug, { page = 1, perPage = 20 } = {}) {
    return this.request(`medias/${encodeURIComponent(slug)}/commentaires`, { page, per_page: perPage });
  }

  getMediaCategories() {
    return this.request('medias/categories');
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

  getRecent(perPage = 20) {
    return this.getMedias({ tri: 'recent', perPage });
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

  getSettings() {
    return this.request('site/parametres');
  }

  getTestimonials() {
    return this.request('temoignages', {}, 1, true);
  }

  getNotifications() {
    return Promise.resolve({ success: true, data: [] });
  }

  getPays(q) {
    return this.request('pays', { q });
  }

  getProducts({ page = 1, perPage = 10, categorie, q, vedette, prixMin, prixMax, devise, tri } = {}) {
    return this.request('produits', {
      page,
      per_page: perPage,
      categorie,
      q,
      vedette,
      prix_min: prixMin,
      prix_max: prixMax,
      devise,
      tri,
    });
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
