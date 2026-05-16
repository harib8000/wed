import admin from 'firebase-admin';
import { config } from '../config';
import { logger } from '../utils/logger';

let initialized = false;

export function getFirebaseApp(): admin.app.App | null {
  if (initialized) return admin.app();
  if (!config.FIREBASE_ADMIN_CREDENTIALS) return null;

  try {
    const credentials = JSON.parse(config.FIREBASE_ADMIN_CREDENTIALS);
    admin.initializeApp({ credential: admin.credential.cert(credentials) });
    initialized = true;
    return admin.app();
  } catch (err) {
    logger.warn({ err }, 'Firebase initialization failed');
    return null;
  }
}

export async function sendPushNotification(token: string, title: string, body: string, data?: Record<string, string>): Promise<string> {
  const app = getFirebaseApp();
  if (!app) {
    logger.info({ title, body }, '[FCM stub] Push notification (Firebase not configured)');
    return 'stub-message-id';
  }

  const message: admin.messaging.Message = {
    token,
    notification: { title, body },
    data,
    android: { priority: 'high', notification: { sound: 'default' } },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  };

  const response = await admin.messaging().send(message);
  return response;
}

export async function sendMulticastPush(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<admin.messaging.BatchResponse> {
  const app = getFirebaseApp();
  if (!app) {
    logger.info({ title, tokenCount: tokens.length }, '[FCM stub] Multicast push');
    return { responses: tokens.map(() => ({ success: true, messageId: 'stub' } as admin.messaging.SendResponse)), successCount: tokens.length, failureCount: 0 };
  }

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: { title, body },
    data,
  };

  return admin.messaging().sendEachForMulticast(message);
}
