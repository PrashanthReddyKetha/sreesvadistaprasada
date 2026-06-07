import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../api';

// Push notifications were removed from Expo Go in SDK 53.
// Conditionally require expo-notifications so the import itself doesn't crash.
// executionEnvironment === 'storeClient' is the SDK 51+ way to detect Expo Go.
const IS_EXPO_GO =
  Constants.executionEnvironment === 'storeClient' ||
  Constants.appOwnership === 'expo';

let Notifications = null;
if (!IS_EXPO_GO) {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (_) {
    Notifications = null;
  }
}

/**
 * Request push-notification permissions and return the Expo push token.
 * Returns null if permission was denied, device is a simulator, or running in Expo Go (SDK 53+).
 */
export async function registerForPushNotifications() {
  // Push tokens are not supported in Expo Go from SDK 53+
  if (Constants.appOwnership === 'expo') return null;
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order updates',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync();
  return token;
}

/**
 * Register for push notifications and save the token to the backend.
 * Silent — never throws.
 */
export async function savePushToken() {
  try {
    const token = await registerForPushNotifications();
    if (token) {
      await api.post('/auth/push-token', { push_token: token });
    }
  } catch {
    // Non-fatal — push notifications are optional
  }
}
