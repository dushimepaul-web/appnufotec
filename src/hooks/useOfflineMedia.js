// src/hooks/useOfflineMedia.js
// ─────────────────────────────────────────────────────────────────
// Hook central pour télécharger, stocker et lire les médias hors-ligne
// Compatible Expo Go + expo run:android/ios
// Sur Web : toutes les opérations FileSystem sont désactivées (no-op)
// ─────────────────────────────────────────────────────────────────

import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

const OFFLINE_DIR = Platform.OS !== 'web'
  ? FileSystem.documentDirectory + 'offline_media/'
  : null;

const META_FILE = Platform.OS !== 'web'
  ? FileSystem.documentDirectory + 'offline_meta.json'
  : null;

// ─── Utilitaires ──────────────────────────────────────────────
const getExtension = (url = '') => {
  const clean = url.split('?')[0];
  const parts = clean.split('.');
  if (parts.length > 1) {
    const ext = parts.pop().toLowerCase();
    if (['mp3', 'mp4', 'm4a', 'aac', 'wav', 'ogg', 'pdf', 'mkv', 'mov', 'webm'].includes(ext)) {
      return ext;
    }
  }
  return 'mp4';
};

// ─── Persistance (mobile seulement) ───────────────────────────
const readMeta = async () => {
  try {
    const info = await FileSystem.getInfoAsync(META_FILE);
    if (!info.exists) return {};
    const raw = await FileSystem.readAsStringAsync(META_FILE);
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const writeMeta = async (data) => {
  try {
    await FileSystem.writeAsStringAsync(META_FILE, JSON.stringify(data));
  } catch (e) {
    console.error('writeMeta error:', e);
  }
};

// ─── Hook principal ────────────────────────────────────────────
export function useOfflineMedia() {
  const [offlineMap, setOfflineMap] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [downloads, setDownloads] = useState({});
  const resumableRefs = useRef({});

  // ── Init ────────────────────────────────────────────────────
  useEffect(() => {
    // Web : pas de FileSystem, on initialise immédiatement avec état vide
    if (Platform.OS === 'web') {
      setInitialized(true);
      return;
    }

    (async () => {
      try {
        const dirInfo = await FileSystem.getInfoAsync(OFFLINE_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
        }
        const meta = await readMeta();
        const verified = {};
        for (const [id, item] of Object.entries(meta)) {
          const info = await FileSystem.getInfoAsync(item.localUri);
          if (info.exists) {
            verified[id] = { ...item, size: info.size };
          }
        }
        setOfflineMap(verified);
        if (Object.keys(verified).length !== Object.keys(meta).length) {
          await writeMeta(verified);
        }
      } catch (e) {
        console.error('useOfflineMedia init:', e);
      } finally {
        setInitialized(true);
      }
    })();
  }, []);

  // ── isOffline ───────────────────────────────────────────────
  const isOffline = useCallback(
    (mediaId) => !!offlineMap[String(mediaId)],
    [offlineMap]
  );

  // ── getLocalUri ─────────────────────────────────────────────
  const getLocalUri = useCallback(
    (mediaId) => offlineMap[String(mediaId)]?.localUri ?? null,
    [offlineMap]
  );

  // ── downloadMedia ───────────────────────────────────────────
  const downloadMedia = useCallback(async (media) => {
    if (Platform.OS === 'web') {
      throw new Error("Le téléchargement hors-ligne n'est pas disponible sur Web.");
    }

    const id = String(media.id_media);
    if (offlineMap[id]) return { success: true, alreadyExists: true };
    if (media.youtube_id) throw new Error('Les vidéos YouTube ne peuvent pas être téléchargées hors-ligne.');
    if (!media.file_url) throw new Error('Ce média ne possède pas de fichier téléchargeable.');

    const ext = getExtension(media.file_url);
    const localUri = OFFLINE_DIR + `media_${id}.${ext}`;

    setDownloads((prev) => ({ ...prev, [id]: { progress: 0 } }));

    try {
      const resumable = FileSystem.createDownloadResumable(
        media.file_url,
        localUri,
        {},
        (prog) => {
          const total = prog.totalBytesExpectedToWrite;
          if (total > 0) {
            const pct = Math.round((prog.totalBytesWritten / total) * 100);
            setDownloads((prev) => ({ ...prev, [id]: { progress: pct } }));
          }
        }
      );

      resumableRefs.current[id] = resumable;
      const result = await resumable.downloadAsync();
      if (!result?.uri) throw new Error('Téléchargement échoué (uri manquante)');

      const info = await FileSystem.getInfoAsync(result.uri);

      const entry = {
        id_media: media.id_media,
        localUri: result.uri,
        titre: media.titre,
        type: media.type,
        thumbnail_url: media.thumbnail_url ?? null,
        credits: media.credits ?? null,
        description: media.description ?? null,
        categorie: media.categorie ?? null,
        youtube_id: null,
        file_url: media.file_url,
        size: info.size ?? 0,
        downloadedAt: Date.now(),
      };

      const newMap = { ...offlineMap, [id]: entry };
      setOfflineMap(newMap);
      await writeMeta(newMap);

      return { success: true, localUri: result.uri };
    } catch (e) {
      try {
        const info = await FileSystem.getInfoAsync(localUri);
        if (info.exists) await FileSystem.deleteAsync(localUri, { idempotent: true });
      } catch {}
      throw e;
    } finally {
      delete resumableRefs.current[id];
      setDownloads((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, [offlineMap]);

  // ── cancelDownload ──────────────────────────────────────────
  const cancelDownload = useCallback(async (mediaId) => {
    if (Platform.OS === 'web') return;
    const id = String(mediaId);
    const resumable = resumableRefs.current[id];
    if (resumable) {
      try { await resumable.pauseAsync(); } catch {}
      delete resumableRefs.current[id];
    }
    setDownloads((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // ── removeOfflineMedia ──────────────────────────────────────
  const removeOfflineMedia = useCallback(async (mediaId) => {
    if (Platform.OS === 'web') return;
    const id = String(mediaId);
    const entry = offlineMap[id];
    if (!entry) return;
    try {
      await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
    } catch (e) {
      console.warn('removeOfflineMedia delete:', e);
    }
    const newMap = { ...offlineMap };
    delete newMap[id];
    setOfflineMap(newMap);
    await writeMeta(newMap);
  }, [offlineMap]);

  // ── clearAllOffline ─────────────────────────────────────────
  const clearAllOffline = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await FileSystem.deleteAsync(OFFLINE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
      await FileSystem.deleteAsync(META_FILE, { idempotent: true });
    } catch (e) {
      console.warn('clearAllOffline:', e);
    }
    setOfflineMap({});
  }, []);

  // ── helpers ─────────────────────────────────────────────────
  const getDownloadProgress = useCallback(
    (mediaId) => downloads[String(mediaId)]?.progress ?? null,
    [downloads]
  );

  const isDownloading = useCallback(
    (mediaId) => String(mediaId) in downloads,
    [downloads]
  );

  const offlineList = Object.values(offlineMap).sort(
    (a, b) => b.downloadedAt - a.downloadedAt
  );

  const totalSize = offlineList.reduce((acc, m) => acc + (m.size || 0), 0);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return {
    initialized,
    offlineList,
    offlineMap,
    totalSizeFormatted: formatSize(totalSize),
    isOffline,
    getLocalUri,
    downloadMedia,
    cancelDownload,
    removeOfflineMedia,
    clearAllOffline,
    getDownloadProgress,
    isDownloading,
  };
}