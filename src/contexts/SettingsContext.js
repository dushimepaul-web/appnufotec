import { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/api';
import { adaptSettings } from '../utils/adapters';
import { palette } from '../utils/theme';

const DEFAULTS = {
  app_name: 'NUFOTEC',
  app_subtitle: 'BURUNDI',
  tagline: 'Connaître • Agir • Transformer',
  welcome_title: 'Bienvenue sur NUFOTEC BURUNDI',
  welcome_text: "Votre plateforme d'information, de conseils et de solutions naturelles pour une vie meilleure.",
  stats: [
    { value: '100+', label: 'Médias', icon: 'play' },
    { value: '50+', label: 'Produits', icon: 'cube' },
    { value: '24/7', label: 'Support', icon: 'headset' },
  ],
  quick_actions: [
    { title: 'Médias', description: 'Vidéos, audios, PDFs', icon: 'play-circle', route: '/medias', color: palette.green },
    { title: 'Consultation', description: 'Réservez un expert', icon: 'calendar', route: '/consultation', color: palette.gold },
    { title: 'Produits', description: 'Solutions naturelles', icon: 'leaf', route: '/produits', color: palette.green },
    { title: 'Téléchargé', description: 'Hors-ligne', icon: 'cloud-download', route: '/OfflineScreen', color: palette.red },
  ],
  nav_items: [
    { name: 'Accueil', icon: 'home', route: '/' },
    { name: 'Médias', icon: 'play-circle', route: '/medias' },
    { name: 'Consultation', icon: 'calendar', route: '/consultation' },
    { name: 'Produits', icon: 'cube', route: '/produits' },
    { name: 'Téléchargés', icon: 'cloud-download', route: '/OfflineScreen' },
  ],
  banner: {
    title: 'Conseils personnalisés',
    text: "Besoin d'aide ? Contactez-nous sur WhatsApp au (+257) 79 666 439",
    button_text: 'Nous écrire',
  },
  consultation: {
    title: 'Consultation',
    subtitle: 'Remplissez le formulaire ci-dessous',
    international_label: 'International',
    international_price: '50 USD / 50 EUR',
    local_label: 'Burundi',
    local_price: '40 000 FBu',
    whatsapp_number: '25779666439',
    submit_text: 'Envoyer via WhatsApp',
  },
  player: {
    like_text: "J'aime",
    save_text: 'Sauver',
    share_text: 'Partager',
    download_text: 'Télécharger',
    offline_text: 'Hors-ligne',
    downloading_text: 'Chargement…',
    suggestions_text: 'Suggestions',
    loading_text: 'Chargement…',
    back_text: 'Retour',
    already_offline: 'Déjà disponible hors-ligne',
    already_offline_desc: 'Ce média est déjà téléchargé sur votre appareil.',
    youtube_not_downloadable: 'Les vidéos YouTube ne peuvent pas être téléchargées hors-ligne.',
    no_file: "Ce média n'a pas de fichier téléchargeable.",
  },
  library: {
    title: 'Bibliothèque',
    login_title: 'Connectez-vous',
    login_subtitle: 'Accédez à vos médias, commentaires et playlists',
    login_button: 'Se connecter',
    menu_items: [
      { icon: 'time-outline', label: 'Historique', subtitle: 'Médias récemment vus', color: 'gold' },
      { icon: 'list-outline', label: 'Playlists', subtitle: 'Vos listes de lecture', color: 'gold' },
    ],
  },
  products: {
    title: 'Produits',
    search_placeholder: 'Rechercher un produit…',
    detail_button: 'Détails',
    featured_text: 'Vedette',
    order_text: 'Commander',
    quantity_text: 'Quantité',
    details_title: 'Détails du produit',
    price_request_text: 'Demander le prix réel',
    similar_title: 'Produits similaires',
  },
  search: {
    placeholder: 'Rechercher des médias...',
    hint: 'Tapez pour chercher…',
  },
  media: {
    title: 'EMISSION SUR LA SANTÉ',
    subtitle: 'Vidéos, audios et documents',
    no_media: 'Aucun média disponible',
    trending: 'EMISSION SUR LA SANTÉ',
  },
  offline: {
    title: 'Téléchargements',
    empty_title: 'Aucun média hors-ligne',
    empty_text: "Téléchargez des vidéos, audios ou PDFs depuis l'écran de lecture pour y accéder sans connexion.",
    empty_button: 'Parcourir les médias',
    clear_all: 'Tout effacer',
    delete_title: 'Supprimer le téléchargement',
  },
  contact: {
    whatsapp: '25779666439',
    phone: '(+257) 79 666 439',
    email: 'nufotecburundi2026@gmail.com',
  },
};

export const SettingsContext = createContext({ settings: DEFAULTS, loaded: false });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const apply = (res) => {
          if (res?.success && res.data) setSettings(mergeDeep(DEFAULTS, adaptSettings(res.data)));
        };
        // copie gardée affichée tout de suite, puis version à jour
        apply(await api.getSettings({ onCached: (cached) => { apply(cached); setLoaded(true); } }));
      } catch (_e) {
        // Paramètres serveur indisponibles : on utilise les défauts locaux
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  return ctx.settings || DEFAULTS;
}

function mergeDeep(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = mergeDeep(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}
