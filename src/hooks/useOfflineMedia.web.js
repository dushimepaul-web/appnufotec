// src/hooks/useOfflineMedia.web.js
// ─────────────────────────────────────────────────────────────────
// Stub web : expo-file-system n'existe pas sur web.
// Toutes les fonctions sont des no-ops ; le téléchargement hors-ligne
// est désactivé silencieusement sur cette plateforme.
// Expo choisit automatiquement ce fichier sur web grâce à l'extension .web.js
// ─────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';

export function useOfflineMedia() {
  const [initialized] = useState(true);

  const isOffline      = useCallback(() => false,  []);
  const getLocalUri    = useCallback(() => null,   []);
  const isDownloading  = useCallback(() => false,  []);
  const getDownloadProgress = useCallback(() => null, []);

  const downloadMedia = useCallback(async () => {
    throw new Error("Le téléchargement hors-ligne n'est pas disponible sur Web.");
  }, []);

  const cancelDownload      = useCallback(async () => {}, []);
  const removeOfflineMedia  = useCallback(async () => {}, []);
  const clearAllOffline     = useCallback(async () => {}, []);

  return {
    initialized,
    offlineList: [],
    offlineMap: {},
    totalSizeFormatted: '0 B',
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