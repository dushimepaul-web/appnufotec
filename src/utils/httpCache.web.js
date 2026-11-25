// Cache des réponses de l'API — version web : en mémoire, plus sessionStorage pour survivre à un rechargement.
// (Même interface que httpCache.js ; voir ce fichier pour le principe ETag / 304 et le mode hors ligne.)
const PREFIX = 'nuf_api_cache:';
const MAX_MEMORY = 100;
const memory = new Map();

function storage() {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function remember(url, entry) {
  memory.delete(url);
  memory.set(url, entry);
  if (memory.size > MAX_MEMORY) memory.delete(memory.keys().next().value);
}

export async function readCache(url) {
  if (memory.has(url)) return memory.get(url);
  try {
    const raw = storage()?.getItem(PREFIX + url);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    remember(url, entry);
    return entry;
  } catch {
    return null;
  }
}

export async function writeCache(url, etag, payload) {
  const entry = { url, etag: etag || null, payload, savedAt: Date.now() };
  remember(url, entry);
  try {
    storage()?.setItem(PREFIX + url, JSON.stringify(entry));
  } catch {
    // stockage plein : la copie en mémoire suffit
  }
}

export async function clearCache() {
  memory.clear();
  const s = storage();
  if (!s) return;
  try {
    Object.keys(s).filter((k) => k.startsWith(PREFIX)).forEach((k) => s.removeItem(k));
  } catch {
    // rien à faire
  }
}
