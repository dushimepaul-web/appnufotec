import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  FlatList, RefreshControl, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../src/contexts/NotificationContext';
import { useTheme } from '../src/contexts/ThemeContext';

const GROUP_LABELS = {
  today: "Aujourd'hui",
  yesterday: 'Hier',
  week: 'Cette semaine',
  month: 'Ce mois-ci',
  older: 'Plus ancien',
};

function formatNotifTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { markAsRead, markAllAsRead, unreadCount, getGrouped, refresh, refreshing, NOTIF_TEMPLATES } = useNotifications();
  const groups = useMemo(() => getGrouped(), [getGrouped]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handlePress = (notif) => {
    markAsRead(notif.id);
    if (notif.route) router.push(notif.route);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ paddingTop: insets.top, backgroundColor: palette.green }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, height: 56 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: 4 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ flex: 1, color: '#fff', fontSize: 19, fontWeight: '700' }}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.7}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' }}>Tout lire</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={groups}
        keyExtractor={([key]) => key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[palette.green]} tintColor={palette.green} />}
        renderItem={({ item: [groupKey, items] }) => (
          <View style={{ marginBottom: 8 }}>
            <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: palette.dark }}>{GROUP_LABELS[groupKey]}</Text>
            </View>
            {items.map(notif => {
              const tmpl = NOTIF_TEMPLATES[notif.type] || { icon: '🔔', color: palette.green };
              return (
                <TouchableOpacity
                  key={notif.id}
                  onPress={() => handlePress(notif)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', gap: 14, paddingHorizontal: 20, paddingVertical: 14,
                    backgroundColor: notif.read ? '#fff' : `${palette.green}04`,
                    borderBottomWidth: 1, borderBottomColor: palette.greyLight,
                  }}
                >
                  <View style={{
                    width: 46, height: 46, borderRadius: 23,
                    backgroundColor: notif.read ? palette.whiteOff : `${tmpl.color}15`,
                    justifyContent: 'center', alignItems: 'center',
                    borderWidth: notif.read ? 0 : 2, borderColor: tmpl.color,
                  }}>
                    <Text style={{ fontSize: 22 }}>{tmpl.icon}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: palette.dark }}>{notif.title}</Text>
                      {!notif.read && (
                        <View style={{ backgroundColor: palette.green, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 }}>
                          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>NOUVEAU</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 13, color: palette.greyDark, lineHeight: 17 }}>{notif.description}</Text>
                    <Text style={{ fontSize: 11, color: palette.grey, marginTop: 2 }}>{formatNotifTime(notif.time)}</Text>
                  </View>
                  {!notif.read && (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: palette.green, marginTop: 4 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Ionicons name="notifications-off-outline" size={52} color={palette.grey} />
            <Text style={{ color: palette.greyDark, fontSize: 16, fontWeight: '600', marginTop: 14 }}>Aucune notification</Text>
            <Text style={{ color: palette.grey, fontSize: 13, marginTop: 4 }}>Vous serez notifié des nouveaux contenus ici.</Text>
          </View>
        }
      />
    </View>
  );
}
