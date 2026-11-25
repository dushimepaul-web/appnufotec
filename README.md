# NUFOTEC APP

Application mobile (Expo / React Native) de NUFOTEC BURUNDI, branchée sur l'API du dépôt `nufotec`.

## Exigences non fonctionnelles

**Sécurité et confidentialité**
- Jeton de connexion dans le stockage chiffré du téléphone (`expo-secure-store`).
- En production, l'API n'est appelée qu'en HTTPS : une adresse `http://` dans `EXPO_PUBLIC_API_URL` est ignorée.
- Permissions réduites au nécessaire (`app.json`) : pas de micro, pas de position GPS des photos, pas d'écriture
  du stockage, pas de Face ID ; ces permissions sont bloquées même si une bibliothèque les ajoute (`blockedPermissions`).

**Rapidité**
- Réponses de l'API gardées en cache avec leur ETag (`src/utils/httpCache.js`) : si rien n'a changé, l'API répond
  304 sans contenu et l'app réutilise sa copie.
- Images mises en cache mémoire + disque (`src/components/CachedImage.js`, basé sur `expo-image`), WebP demandé
  explicitement au serveur ; vignettes de 400 px (`?w=400`, 10 à 25 Ko) dans les listes (prop `thumb`).
- Accueil en une seule requête au démarrage (`api.warmup()` -> `GET /accueil`) : les six adresses qu'elle remplace
  sont servies depuis le cache. Une copie de moins de 30 s est utilisée sans requête.
- Affichage immédiat : les écrans reçoivent d'abord la copie gardée (`options.onCached`), puis la version à jour ;
  « tirer pour actualiser » interroge toujours le serveur (`options.force`).
- Audio lu dans sa version légère (~64 kbit/s) par défaut (`/medias/{slug}/flux`).

**Disponibilité**
- Nouvelles tentatives seulement sur les erreurs passagères (réseau, 408, 429, 5xx), en respectant `Retry-After`.
- Chaque envoi porte une `Idempotency-Key` : une commande renvoyée après une coupure n'est jamais enregistrée deux fois.
- Sans réseau ou serveur indisponible : la dernière copie des données est affichée (réponse marquée `stale: true`).
- Médias téléchargeables pour une écoute hors ligne.

---

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
