import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

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

// Depuis Expo SDK 53, les notifications push distantes ne sont plus
// disponibles dans Expo Go sur Android. Le module est donc chargé seulement
// dans une build de développement ou de production.
const isExpoGo = Constants.executionEnvironment === 'storeClient';
let Notifications = null;
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch {
    Notifications = null;
  }
}

const TOKEN_FILE = FileSystem?.documentDirectory
  ? FileSystem.documentDirectory + 'push_token.json'
  : null;

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function registerForPushNotifications() {
  if (Platform.OS === 'web' || !Device.isDevice || isExpoGo || !Notifications) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notifications NUFOTEC',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0C7B45',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const pushTokenData = await Notifications.getDevicePushTokenAsync();
  const token = pushTokenData.data;

  return token;
}

export async function sendTokenToServer(token, userId = null) {
  await storeToken(token, userId);
  return true;
}

async function storeToken(token, userId) {
  if (!TOKEN_FILE) return;
  try {
    await FileSystem.writeAsStringAsync(
      TOKEN_FILE,
      JSON.stringify({ token, userId, updatedAt: new Date().toISOString() })
    );
  } catch {}
}

export function setupNotificationListeners(onNotification, onNotificationResponse) {
  if (!Notifications || Platform.OS === 'web') return () => {};

  const notifListener = Notifications.addNotificationReceivedListener(notification => {
    onNotification?.(notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    onNotificationResponse?.(response);
  });

  return () => {
    notifListener.remove();
    responseListener.remove();
  };
}
