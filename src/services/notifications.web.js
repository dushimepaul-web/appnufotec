// src/services/notifications.web.js
// Stub web : expo-notifications n'est pas disponible sur web.
// Les fonctions push sont désactivées silencieusement.

export async function registerForPushNotifications() {
  return null;
}

export async function sendTokenToServer() {
  return false;
}

export function setupNotificationListeners() {
  return () => {};
}
