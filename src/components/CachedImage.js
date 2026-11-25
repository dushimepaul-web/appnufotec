// Image avec cache (rapidité) : remplace l'Image de React Native par expo-image.
//  - cache mémoire + disque : une image déjà vue s'affiche aussitôt, sans retéléchargement, même hors ligne ;
//  - fondu court à l'arrivée, et recyclage propre dans les listes (FlatList) grâce à recyclingKey.
// Même usage que l'Image de React Native : <CachedImage source={{ uri }} style={…} resizeMode="cover" />.
import { Image } from 'expo-image';

const FIT = { cover: 'cover', contain: 'contain', stretch: 'fill', center: 'none', repeat: 'cover' };

export default function CachedImage({ resizeMode = 'cover', source, ...props }) {
  const uri = source && typeof source === 'object' && !Array.isArray(source) ? source.uri : null;
  return (
    <Image
      source={source}
      contentFit={FIT[resizeMode] ?? 'cover'}
      cachePolicy="memory-disk"
      transition={uri ? 150 : 0}
      recyclingKey={uri ?? undefined}
      {...props}
    />
  );
}
