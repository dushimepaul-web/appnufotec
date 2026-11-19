import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../utils/api';
import { getStoredAuth } from '../services/auth';

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

const NOTIF_FILE = FileSystem?.documentDirectory
  ? FileSystem.documentDirectory + 'notifications.json'
  : null;

const NOTIF_TEMPLATES = {
  video: { icon: '🎥', color: '#0C7B45' },
  audio: { icon: '🎧', color: '#D4A843' },
  pdf: { icon: '📄', color: '#E53935' },
  product: { icon: '🛒', color: '#0C7B45' },
  update: { icon: '📢', color: '#F57F17' },
  training: { icon: '📚', color: '#8E24AA' },
  consultation: { icon: '🩺', color: '#D4A843' },
};

const normalizeNotification = (item, index, savedById) => {
  const id = String(item.id_notification || item.id || index);
  return {
    id,
    type: item.type || item.notification_type || 'update',
    title: item.title || item.titre || 'Notification',
    description: item.description || item.message || item.body || '',
    time: item.time || item.created_at || item.date_creation || new Date().toISOString(),
    route: item.route || item.link || item.url || '/',
    read: savedById.get(id)?.read ?? (Number(item.is_read) === 1 || item.is_read === true),
  };
};

export const NotificationContext = createContext({
  notifications: [],
  addNotification: (_notification) => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  unreadCount: 0,
  getGrouped: () => [],
  refresh: () => {},
  refreshing: false,
  loaded: false,
  NOTIF_TEMPLATES,
});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    let saved = [];

    try {
      if (NOTIF_FILE) {
        const exists = await FileSystem.getInfoAsync(NOTIF_FILE);
        if (exists.exists) {
          const raw = await FileSystem.readAsStringAsync(NOTIF_FILE);
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) saved = parsed;
        }
      }
    } catch {}

    const auth = await getStoredAuth();
    const userId = auth?.user?.id ?? auth?.user?.id_user ?? null;
    if (userId === null) {
      setNotifications(saved);
      setLoaded(true);
      setRefreshing(false);
      return;
    }

    try {
      const response = await api.getNotifications({ userId });
      if (response?.success === false) throw new Error(response.message || 'Réponse invalide');
      const items = Array.isArray(response) ? response : response?.data || response?.notifications || [];
      if (!Array.isArray(items)) throw new Error('Format de notifications invalide');

      const savedById = new Map(saved.map(item => [String(item.id), item]));
      const remote = items.map((item, index) => normalizeNotification(item, index, savedById));
      // Conserve les notifications reçues localement (push) absentes du serveur.
      const remoteIds = new Set(remote.map(item => item.id));
      const localOnly = saved.filter(item => !remoteIds.has(String(item.id)));
      setNotifications([...remote, ...localOnly].sort((a, b) => String(b.time).localeCompare(String(a.time))));
    } catch {
      setNotifications(saved);
    } finally {
      setLoaded(true);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadNotifications);
  }, [loadNotifications]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!loaded || !NOTIF_FILE) return;
    FileSystem.writeAsStringAsync(NOTIF_FILE, JSON.stringify(notifications)).catch(() => {});
  }, [notifications, loaded]);

  // Callbacks stables : _layout.tsx s'abonne aux notifications push avec
  // addNotification en dépendance ; une nouvelle fonction à chaque rendu
  // provoquait un désabonnement/réabonnement à chaque changement d'état.
  const addNotification = useCallback((notif) => {
    setNotifications(previous => [{ id: Date.now().toString(), ...notif, read: false, time: new Date().toISOString() }, ...previous]);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(previous => previous.map(item => item.id === id ? { ...item, read: true } : item));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(previous => previous.map(item => ({ ...item, read: true })));
  }, []);

  const unreadCount = notifications.filter(item => !item.read).length;

  const getGrouped = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekStart = new Date(today.getTime() - 6 * 86400000);
    const monthStart = new Date(today.getFullYear(), now.getMonth(), 1);
    const groups = { today: [], yesterday: [], week: [], month: [], older: [] };

    notifications.forEach(item => {
      const date = new Date(item.time);
      if (Number.isNaN(date.getTime())) return;
      if (date >= today) groups.today.push(item);
      else if (date >= yesterday) groups.yesterday.push(item);
      else if (date >= weekStart) groups.week.push(item);
      else if (date >= monthStart) groups.month.push(item);
      else groups.older.push(item);
    });

    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{
      notifications, addNotification, markAsRead, markAllAsRead, unreadCount, getGrouped,
      refresh, refreshing, loaded, NOTIF_TEMPLATES,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
