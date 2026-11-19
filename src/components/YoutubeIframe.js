import { useCallback } from 'react';
import { WebView } from 'react-native-webview';
import { BRAND } from '../utils/theme';

// Chargement direct de l'URL d'embed YouTube.
// IMPORTANT : ne PAS utiliser source={{ html, baseUrl }} : YouTube refuse la
// lecture ("Video unavailable" 150/152-4) quand l'embed est chargé depuis un
// HTML injecté (Referer/origine invalides dans les WebViews Android/iOS).
export default function YoutubeIframe({ videoId, height, width }) {
  const embedUrl =
    `https://www.youtube.com/embed/${videoId}` +
    `?playsinline=1&rel=0&modestbranding=1&controls=1`;

  const onShouldStartLoadWithRequest = useCallback(({ url, isTopFrame }) => {
    if (isTopFrame) {
      const lower = url.toLowerCase();
      if (
        lower.includes('youtube.com/watch') ||
        lower.includes('youtube.com/shorts') ||
        lower.includes('youtu.be/') ||
        lower.includes('youtube.com/@')
      ) {
        return false;
      }
    }
    return true;
  }, []);

  return (
    <WebView
      key={videoId}
      source={{ uri: embedUrl }}
      style={{ width, height, backgroundColor: BRAND.ink }}
      onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
      setSupportMultipleWindows={false}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      domStorageEnabled
      thirdPartyCookiesEnabled
      sharedCookiesEnabled
      originWhitelist={['*']}
    />
  );
}
