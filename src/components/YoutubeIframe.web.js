// src/components/YoutubeIframe.web.js
// ─────────────────────────────────────────────────────────────
// Stub web : react-native-youtube-iframe n'existe pas sur web.
// Ce fichier remplace le composant par une iframe HTML native.
// Expo choisit automatiquement le fichier .web.js sur la plateforme web.
// ─────────────────────────────────────────────────────────────

import { Dimensions, View } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

export default function YoutubeIframe({ videoId, height, width }) {
  const embedUrl =
    `https://www.youtube.com/embed/${videoId}` +
    `?playsinline=1&rel=0&modestbranding=1&controls=1`;

  const w = width || SCREEN_W;
  const h = height || (SCREEN_W * 9) / 16;

  return (
    <View style={{ width: w, height: h, backgroundColor: '#000' }}>
      <iframe
        src={embedUrl}
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </View>
  );
}