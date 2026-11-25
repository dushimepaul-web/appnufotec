// Cache des réponses de l'API (rapidité et disponibilité) — version téléphone.
//
// Chaque réponse publique (GET sans compte) est gardée avec son empreinte ETag :
//  - à la requête suivante, l'app envoie If-None-Match ; si rien n'a changé, l'API répond 304 sans contenu
//    et l'app réutilise sa copie (quelques centaines d'octets au lieu de la liste complète) ;
//  - sans réseau ou si le serveur est indisponible, l'app affiche la dernière copie au lieu d'un écran vide.
// Les copies sont rangées dans le dossier cache de l'app (le système peut le vider s'il manque de place).
import * as FileSystem from 'expo-file-system/legacy';

const DIR = FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}api_cache/` : null;
const MAX_MEMORY = 100;
const memory = new Map();
let dirReady = null;

function keyOf(url) {
  // FNV-1a sur 2 x 32 bits : nom de fichier court et stable
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < url.length; i++) {
    const c = url.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ c, 2246822519);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

function remember(url, entry) {
  memory.delete(url);
  memory.set(url, entry);
  if (memory.size > MAX_MEMORY) memory.delete(memory.keys().next().value);
}

async function ensureDir() {
  if (!DIR) return false;
  dirReady ??= FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).then(() => true, () => true);
  return dirReady;
}

/** { etag, payload, savedAt } ou null */
export async function readCache(url) {
  if (memory.has(url)) return memory.get(url);
  if (!DIR) return null;
  try {
    const raw = await FileSystem.readAsStringAsync(`${DIR}${keyOf(url)}.json`);
    const entry = JSON.parse(raw);
    if (entry?.url !== url) return null;
    remember(url, entry);
    return entry;
  } catch {
    return null;
  }
}

export async function writeCache(url, etag, payload) {
  const entry = { url, etag: etag || null, payload, savedAt: Date.now() };
  remember(url, entry);
  if (!(await ensureDir())) return;
  FileSystem.writeAsStringAsync(`${DIR}${keyOf(url)}.json`, JSON.stringify(entry)).catch(() => {});
}

export async function clearCache() {
  memory.clear();
  if (DIR) await FileSystem.deleteAsync(DIR, { idempotent: true }).catch(() => {});
  dirReady = null;
}
