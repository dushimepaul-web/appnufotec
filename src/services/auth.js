import * as SecureStore from 'expo-secure-store';
import api from '../utils/api';
import { registerForPushNotifications, sendTokenToServer } from './notifications';

let FileSystem = null;
try {
  FileSystem = require('expo-file-system/legacy');
} catch {
  try {
    FileSystem = require('expo-file-system');
  } catch {
    FileSystem = null;
  }
}

const AUTH_FILE = FileSystem?.documentDirectory
  ? FileSystem.documentDirectory + 'auth_token.json'
  : null;

export async function loginUser(login, password) {
  const data = await api.login(login, password);
  if (data.success) {
    const authData = data.data || {};
    const token = authData.tokens?.access_token;
    const user = authData.user || null;
    if (!token) return { success: false, message: 'Réponse de connexion invalide' };
    await storeAuth(token, user);
    try {
      const pushToken = await registerForPushNotifications();
      if (pushToken) await sendTokenToServer(pushToken, user?.id ?? user?.id_user ?? null);
    } catch {}
    return { success: true, user };
  }
  return { success: false, message: data.message || 'Connexion impossible' };
}

export async function logoutUser() {
  const auth = await getStoredAuth();
  if (auth && auth.token) {
    try { await api.logout(auth.token); } catch {}
  }
  await clearAuth();
}

export async function getStoredAuth() {
  try {
    const raw = await SecureStore.getItemAsync('auth_token');
    if (raw) return JSON.parse(raw);
  } catch {}

  if (!AUTH_FILE) return null;
  try {
    const info = await FileSystem.getInfoAsync(AUTH_FILE);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(AUTH_FILE);
    const auth = JSON.parse(raw);
    await SecureStore.setItemAsync('auth_token', JSON.stringify(auth));
    await FileSystem.deleteAsync(AUTH_FILE, { idempotent: true });
    return auth;
  } catch { return null; }
}

export async function getStoredToken() {
  const auth = await getStoredAuth();
  return auth ? auth.token : null;
}

async function storeAuth(token, user) {
  try {
    await SecureStore.setItemAsync('auth_token', JSON.stringify({ token, user, loginAt: new Date().toISOString() }));
  } catch {}
}

async function clearAuth() {
  try {
    await SecureStore.deleteItemAsync('auth_token');
  } catch {}
  if (AUTH_FILE) {
    try { await FileSystem.deleteAsync(AUTH_FILE, { idempotent: true }); } catch {}
  }
}
