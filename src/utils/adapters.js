import { BASE_URL, toWhatsAppNumber } from './api';
import { extractYoutubeId } from './youtube';
import { decodeEntities, formatNumber } from './format';

function formatViews(value) {
  const n = Number(value) || 0;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace('.', ',')} M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')} k`;
  return String(n);
}

function formatDuration(seconds) {
  const total = Number(seconds) || 0;
  if (total <= 0) return null;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function mediaType(item) {
  const categorie = item.categorie;
  if (categorie === 'audio' || categorie === 'video' || categorie === 'image') return categorie;
  if (categorie === 'link') return 'video';
  const format = String(item.format || '').toLowerCase();
  if (format === 'pdf') return 'pdf';
  return 'document';
}

const CATEGORY_LABELS = {
  audio: 'Audio',
  video: 'Vidéo',
  link: 'YouTube',
  image: 'Image',
  fichier: 'Document',
};

function mediaUrls(item) {
  const slug = item.slug || item.uuid;
  if (!slug) return {};
  const base = `${BASE_URL}/medias/${encodeURIComponent(slug)}`;
  const isLink = item.categorie === 'link';
  const isPlayable = item.categorie === 'audio' || item.categorie === 'video';
  const isDocument = item.categorie === 'image' || item.categorie === 'fichier';
  const streamUrl = isPlayable ? `${base}/flux` : null;
  const previewUrl = isDocument ? `${base}/apercu` : null;
  const downloadUrl = !isLink && item.telechargeable ? `${base}/telecharger` : null;
  return {
    stream_url: streamUrl,
    preview_url: previewUrl,
    download_url: downloadUrl,
    file_url: isLink ? item.lien_externe || item.lien || null : streamUrl || previewUrl,
  };
}

export function adaptMedia(item, detail = false) {
  if (!item) return null;
  const type = mediaType(item);
  const urls = mediaUrls(item);
  const youtubeId = item.youtube_id || extractYoutubeId(item.lien_externe || item.lien || item.file_url);
  const thumbnail = decodeEntities(item.miniature) || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null);
  const vues = item.stats?.vues ?? 0;

  return {
    ...item,
    id_media: item.slug || item.uuid,
    slug: item.slug,
    uuid: item.uuid,
    type,
    categorie: item.categorie,
    categorie_label: CATEGORY_LABELS[item.categorie] || item.categorie || null,
    titre: item.titre || '',
    thumbnail_url: thumbnail,
    miniature: decodeEntities(item.miniature),
    published_at: item.created_at || item.date || null,
    comments_count: item.stats?.commentaires ?? 0,
    file_url: urls.file_url,
    stream_url: urls.stream_url,
    preview_url: urls.preview_url,
    download_url: urls.download_url,
    youtube_id: youtubeId || null,
    lien: item.lien_externe || item.lien || null,
    views: vues,
    likes: item.stats?.likes ?? 0,
    views_formatted: formatViews(vues),
    duration_formatted: formatDuration(item.duree),
    description: item.description || null,
    credits: item.credits || null,
    similar: detail ? (item.recommandations || []).map((m) => adaptMedia(m)) : [],
    comments: [],
  };
}

function formatBif(value) {
  return `${formatNumber(value)} BIF`;
}

function formatUsd(value) {
  const n = Number(value) || 0;
  return `${Number.isInteger(n) ? n : n.toFixed(2)} USD`;
}

const hasPrice = (v) => v != null && v !== '' && Number(v) > 0;

export function adaptProduct(item, detail = false) {
  if (!item) return null;
  const categorie = item.categorie || null;
  const bif = hasPrice(item.prix_bif) ? formatBif(item.prix_bif) : null;
  const usd = hasPrice(item.prix_usd) ? formatUsd(item.prix_usd) : null;
  const price = bif || usd || 'Prix sur demande';
  const galerie = (item.galerie || []).map((g) => (typeof g === 'string' ? g : g?.url || g?.image)).filter(Boolean);

  return {
    ...item,
    id: item.slug || item.uuid,
    slug: item.slug,
    uuid: item.uuid,
    title: item.titre || '',
    price,
    image: item.image || null,
    images: [item.image, ...galerie].filter(Boolean),
    price_secondary: bif && usd ? `≈ ${usd}` : null,
    has_price: !!(bif || usd),
    in_stock: item.en_stock !== false,
    is_new: !!item.nouveau,
    health_warning: item.avertissement_sante || null,
    description: item.description || item.extrait || '',
    in_vedette: item.vedette ? 1 : 0,
    vedette: !!item.vedette,
    category_id: categorie?.id ?? null,
    category_name: categorie?.nom ?? null,
    similar_products: detail ? (item.similaires || []).map((p) => adaptProduct(p)) : [],
  };
}

export function adaptProductCategory(item) {
  if (!item) return null;
  return {
    ...item,
    id: item.id,
    name: item.nom || '',
    slug: item.slug,
    product_count: item.produits ?? 0,
    sous_categories: (item.sous_categories || []).map((c) => adaptProductCategory(c)),
  };
}

export function adaptMediaPage(response) {
  const items = response?.data?.items || [];
  return items.map((item) => adaptMedia(item));
}

function compact(value) {
  if (Array.isArray(value)) return value.map(compact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, child]) => [key, compact(child)])
        .filter(([, child]) => child !== undefined && child !== null && child !== '')
    );
  }
  return value;
}

export function adaptSettings(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const siteName = String(raw.site_name || '').trim();
  const parts = siteName.split(/\s+/).filter(Boolean);
  const appName = parts.length > 1 ? parts[0] : siteName;
  const appSubtitle = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
  const phone = raw.site_phone || raw.contact_whatsapp || undefined;
  const whatsapp = toWhatsAppNumber(raw.contact_whatsapp || raw.site_phone) || undefined;
  const email = raw.contact_email_invest || undefined;

  return compact({
    app_name: appName || undefined,
    app_subtitle: appSubtitle,
    contact: { whatsapp, phone, email },
    banner: {
      text: phone ? `Besoin d'aide ? Contactez-nous sur WhatsApp au ${phone}` : undefined,
    },
  });
}
