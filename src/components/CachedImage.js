// Image avec cache (rapidité) : remplace l'Image de React Native par expo-image.
//  - cache mémoire + disque : une image déjà vue s'affiche aussitôt, sans retéléchargement, même hors ligne ;
//  - WebP demandé explicitement au serveur (en-tête Accept) : sur téléphone, le serveur ne l'envoie qu'aux
//    clients qui le demandent ; sans cet en-tête, l'app recevait l'image d'origine (parfois plusieurs Mo) ;
//  - `thumb` : vignette de 400 px (adresse ?w=400, environ 10 à 25 Ko) pour les listes et les cartes ;
//  - fondu court à l'arrivée, et recyclage propre dans les listes (FlatList) grâce à recyclingKey.
// Même usage que l'Image de React Native : <CachedImage source={{ uri }} style={…} resizeMode="cover" thumb />.
import { Image } from 'expo-image';
import { Platform } from 'react-native';

const FIT = { cover: 'cover', contain: 'contain', stretch: 'fill', center: 'none', repeat: 'cover' };
// Le navigateur envoie déjà image/webp lui-même ; sur web, un en-tête ajouté exigerait une autorisation CORS.
const WEBP_HEADERS = Platform.OS === 'web' ? undefined : { Accept: 'image/webp,image/*;q=0.8' };

/** Vignette 400 px pour les images du site (dossier attachments) ; les autres adresses restent inchangées. */
export function thumbUrl(uri) {
  if (!uri || !uri.includes('/attachments/') || uri.includes('?')) return uri;
  return `${uri}?w=400`;
}

export default function CachedImage({ resizeMode = 'cover', source, thumb = false, ...props }) {
  let finalSource = source;
  let uri = null;
  if (source && typeof source === 'object' && !Array.isArray(source) && source.uri) {
    uri = thumb ? thumbUrl(source.uri) : source.uri;
    const remote = /^https?:\/\//.test(uri);
    finalSource = { ...source, uri, ...(remote && WEBP_HEADERS ? { headers: { ...WEBP_HEADERS, ...source.headers } } : {}) };
  }
  return (
    <Image
      source={finalSource}
      contentFit={FIT[resizeMode] ?? 'cover'}
      cachePolicy="memory-disk"
      transition={uri ? 150 : 0}
      recyclingKey={uri ?? undefined}
      {...props}
    />
  );
}
