import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import * as Device from 'expo-device';

const EXPO_PROJECT_ID = '340e3039-7252-4411-acf1-50491ba579ae';
const PUSH_TOKEN_API_URL = 'https://gold.imcbs.com/api/push/register-token/';

function resolveModule(moduleExports) {
  return moduleExports?.default ?? moduleExports;
}

function hasNativePushSupport() {
  return !!requireOptionalNativeModule('ExpoPushTokenManager');
}

async function getPushModules() {
  if (!hasNativePushSupport()) {
    console.log('Skipping push token registration because native push support is unavailable in this build.');
    return null;
  }

  try {
    const NotificationsModule = await import('expo-notifications');
    const Notifications = resolveModule(NotificationsModule);

    return { Notifications };
  } catch (error) {
    console.log('Push notification modules are not available in this build.');
    return null;
  }
}

export async function registerForPushNotificationsAsync() {
  const pushModules = await getPushModules();
  if (!pushModules) {
    return null;
  }

  const { Notifications } = pushModules;
  if (
    typeof Notifications?.getPermissionsAsync !== 'function' ||
    typeof Notifications?.requestPermissionsAsync !== 'function' ||
    typeof Notifications?.getExpoPushTokenAsync !== 'function'
  ) {
    console.log('Push notification APIs are not available in this build.');
    return null;
  }

  const androidImportance =
    Notifications?.AndroidImportance?.MAX ?? Notifications?.AndroidImportance?.HIGH;

  if (Platform.OS === 'android' && androidImportance) {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: androidImportance,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8E24AA',
      });
    } catch (channelError) {
      console.log('Could not set notification channel:', channelError.message);
    }
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission was not granted.');
    return null;
  }

  try {
    const expoTokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID,
    });
    
    let deviceToken = null;
    try {
      const deviceTokenResponse = await Notifications.getDevicePushTokenAsync();
      deviceToken = deviceTokenResponse.data;
    } catch (e) {
      console.log('Could not get device push token:', e.message);
    }

    return {
      expoToken: expoTokenResponse.data,
      deviceToken: deviceToken,
    };
  } catch (tokenError) {
    console.log('Could not get push tokens:', tokenError.message);
    return null;
  }
}

export async function sendExpoPushTokenToApi(authToken, pushTokens) {
  const { expoToken, deviceToken } = pushTokens;
  
  const headers = {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  const payload = {
    token: expoToken,
    fcm_token: deviceToken || expoToken, // Use expoToken as fallback if native token fails
    device_id: Device.osBuildId || Device.modelName || 'unknown-device',
  };

  // Try POST first
  const response = await fetch(PUSH_TOKEN_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Push token sync failed: ${response.status} ${errorText}`);
  }

  return true;
}
