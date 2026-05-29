import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Handles FCM + local notifications for WeddingOS
class NotificationService {
  static final _localNotifications = FlutterLocalNotificationsPlugin();
  static FirebaseMessaging get _fcm => FirebaseMessaging.instance;

  // ─── Initialization ─────────────────────────────────────────────────────────

  static Future<void> initialize() async {
    // Request notification permissions
    await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    // Local notifications setup
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Create notification channels for Android
    await _createNotificationChannels();

    // Listen to foreground FCM messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background / terminated messages
    FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundHandler);

    // Handle notification tap when app was in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

    // Handle notification that launched the app from terminated state
    final initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      _handleMessageOpenedApp(initialMessage);
    }
  }

  // ─── FCM Token ──────────────────────────────────────────────────────────────

  static Future<String?> getDeviceToken() async {
    try {
      return await _fcm.getToken();
    } catch (e) {
      debugPrint('Failed to get FCM token: $e');
      return null;
    }
  }

  static Stream<String> get tokenRefreshStream => _fcm.onTokenRefresh;

  // ─── Subscribe/Unsubscribe ──────────────────────────────────────────────────

  static Future<void> subscribeToTopic(String topic) =>
      _fcm.subscribeToTopic(topic);

  static Future<void> unsubscribeFromTopic(String topic) =>
      _fcm.unsubscribeFromTopic(topic);

  // ─── Local Notification Channels ────────────────────────────────────────────

  static Future<void> _createNotificationChannels() async {
    const bookingChannel = AndroidNotificationChannel(
      'booking_updates',
      'Booking Updates',
      description: 'Notifications about your booking status changes.',
      importance: Importance.high,
    );
    const paymentChannel = AndroidNotificationChannel(
      'payment_updates',
      'Payment Updates',
      description: 'Payment confirmations and escrow updates.',
      importance: Importance.high,
    );
    const reminderChannel = AndroidNotificationChannel(
      'reminders',
      'Reminders',
      description: 'Wedding day task reminders and upcoming event alerts.',
      importance: Importance.defaultImportance,
    );
    const chatChannel = AndroidNotificationChannel(
      'chat_messages',
      'Chat Messages',
      description: 'New messages from vendors.',
      importance: Importance.high,
    );
    const coordinatorTasksChannel = AndroidNotificationChannel(
      'coordinator_tasks',
      'Coordinator Tasks',
      description: 'Task assignments, milestone alerts and vendor messages for coordinators.',
      importance: Importance.high,
    );
    const adminAlertsChannel = AndroidNotificationChannel(
      'admin_alerts',
      'Admin Alerts',
      description: 'KYC submissions, disputes and platform alerts for admins.',
      importance: Importance.high,
    );

    final plugin = _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
    await plugin?.createNotificationChannel(bookingChannel);
    await plugin?.createNotificationChannel(paymentChannel);
    await plugin?.createNotificationChannel(reminderChannel);
    await plugin?.createNotificationChannel(chatChannel);
    await plugin?.createNotificationChannel(coordinatorTasksChannel);
    await plugin?.createNotificationChannel(adminAlertsChannel);
  }

  // ─── Show Local Notification ─────────────────────────────────────────────────

  static Future<void> showNotification({
    required int id,
    required String title,
    required String body,
    String channelId = 'booking_updates',
    Map<String, dynamic>? payload,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      channelId,
      _channelName(channelId),
      importance: Importance.high,
      priority: Priority.high,
      styleInformation: BigTextStyleInformation(body),
    );
    final iosDetails = const DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    await _localNotifications.show(
      id,
      title,
      body,
      details,
      payload: payload?.toString(),
    );
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  static void _handleForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    final channelId = _channelForType(message.data['type'] as String?);
    showNotification(
      id: message.hashCode,
      title: notification.title ?? 'WeddingOS',
      body: notification.body ?? '',
      channelId: channelId,
      payload: message.data,
    );
  }

  static void _handleMessageOpenedApp(RemoteMessage message) {
    // Navigation on notification tap is handled by the router via deep links
    debugPrint('Notification opened app: ${message.data}');
  }

  static void _onNotificationTap(NotificationResponse response) {
    debugPrint('Local notification tapped: ${response.payload}');
  }

  static String _channelForType(String? type) {
    switch (type) {
      case 'BOOKING_UPDATE':
        return 'booking_updates';
      case 'PAYMENT':
        return 'payment_updates';
      case 'REMINDER':
        return 'reminders';
      case 'CHAT':
        return 'chat_messages';
      case 'TASK_ASSIGNED':
      case 'MILESTONE_DUE':
      case 'VENDOR_MESSAGE':
        return 'coordinator_tasks';
      case 'KYC_SUBMITTED':
      case 'DISPUTE_RAISED':
      case 'NEW_VENDOR_REGISTERED':
        return 'admin_alerts';
      default:
        return 'booking_updates';
    }
  }

  static String _channelName(String channelId) {
    switch (channelId) {
      case 'booking_updates':
        return 'Booking Updates';
      case 'payment_updates':
        return 'Payment Updates';
      case 'reminders':
        return 'Reminders';
      case 'chat_messages':
        return 'Chat Messages';
      case 'coordinator_tasks':
        return 'Coordinator Tasks';
      case 'admin_alerts':
        return 'Admin Alerts';
      default:
        return 'WeddingOS';
    }
  }
}

// Top-level handler for background messages (must be top-level, not a closure)
@pragma('vm:entry-point')
Future<void> _firebaseBackgroundHandler(RemoteMessage message) async {
  debugPrint('Background message received: ${message.messageId}');
}

// ─── Riverpod Provider ────────────────────────────────────────────────────────

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});
