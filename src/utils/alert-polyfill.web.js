// react-native-web implémente Alert.alert comme une fonction vide : sur web,
// tous les messages (champs manquants, erreurs de connexion, confirmations…)
// étaient silencieux. On les redirige vers les boîtes de dialogue du navigateur.
import { Alert } from 'react-native';

Alert.alert = (title, message, buttons) => {
  if (typeof window === 'undefined') return;
  const text = [title, message].filter(Boolean).join('\n\n');
  const list = Array.isArray(buttons) ? buttons : [];

  if (list.length <= 1) {
    window.alert(text);
    list[0]?.onPress?.();
    return;
  }

  const cancel = list.find((b) => b.style === 'cancel');
  const confirm = list.find((b) => b !== cancel) || list[0];
  if (window.confirm(text)) confirm?.onPress?.();
  else cancel?.onPress?.();
};
