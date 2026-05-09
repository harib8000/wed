import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../core/api_client.dart';

// ─── Notification model ────────────────────────────────────────────────────────

class AppNotification {
  final String id;
  final String title;
  final String body;
  final String type; // BOOKING_UPDATE | PAYMENT | REMINDER | CHAT
  final bool isRead;
  final DateTime createdAt;
  final Map<String, dynamic>? data;

  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.isRead,
    required this.createdAt,
    this.data,
  });

  factory AppNotification.fromJson(Map<String, dynamic> j) => AppNotification(
        id: j['id'] as String,
        title: j['title'] as String,
        body: j['body'] as String,
        type: j['type'] as String? ?? 'BOOKING_UPDATE',
        isRead: j['readAt'] != null,
        createdAt: DateTime.parse(j['createdAt'] as String),
        data: j['data'] as Map<String, dynamic>?,
      );

  AppNotification copyWith({bool? isRead}) => AppNotification(
    id: id, title: title, body: body, type: type,
    isRead: isRead ?? this.isRead,
    createdAt: createdAt, data: data,
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

class NotificationsNotifier extends StateNotifier<AsyncValue<List<AppNotification>>> {
  NotificationsNotifier() : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final res = await ApiClient.getNotifications();
      final list = (res.data['data']['notifications'] as List<dynamic>)
          .map((n) => AppNotification.fromJson(n as Map<String, dynamic>))
          .toList();
      state = AsyncValue.data(list);
    } catch (e) {
      debugPrint('Notifications fetch failed, using mock: $e');
      state = AsyncValue.data(_mockNotifications);
    }
  }

  Future<void> markRead(String id) async {
    try { await ApiClient.markNotificationRead(id); } catch (_) {}
    final current = state.value ?? [];
    state = AsyncValue.data(
      current.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList(),
    );
  }

  Future<void> markAllRead() async {
    try { await ApiClient.markAllNotificationsRead(); } catch (_) {}
    final current = state.value ?? [];
    state = AsyncValue.data(current.map((n) => n.copyWith(isRead: true)).toList());
  }
}

final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, AsyncValue<List<AppNotification>>>(
  (ref) => NotificationsNotifier(),
);

final unreadCountProvider = Provider<int>((ref) {
  return ref.watch(notificationsProvider).when(
        data: (list) => list.where((n) => !n.isRead).length,
        loading: () => 0,
        error: (_, __) => 0,
      );
});

// ─── Screen ──────────────────────────────────────────────────────────────────

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationsProvider);
    final unreadCount = ref.watch(unreadCountProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Notifications',
          style: TextStyle(
            fontFamily: 'PlayfairDisplay',
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: () => ref.read(notificationsProvider.notifier).markAllRead(),
              child: const Text(
                'Mark all read',
                style: TextStyle(color: AppColors.brand),
              ),
            ),
        ],
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (notifications) => notifications.isEmpty
            ? const _EmptyNotifications()
            : _NotificationsList(notifications: notifications),
      ),
    );
  }
}

// ─── Empty State ─────────────────────────────────────────────────────────────

class _EmptyNotifications extends StatelessWidget {
  const _EmptyNotifications();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: AppColors.brand.withOpacity(0.08),
              borderRadius: BorderRadius.circular(50),
            ),
            child: const Icon(
              Icons.notifications_none_rounded,
              size: 48,
              color: AppColors.brand,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'No notifications yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            "We'll notify you about booking updates,\npayments, and reminders.",
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

// ─── Notifications List ────────────────────────────────────────────────────────

class _NotificationsList extends ConsumerWidget {
  const _NotificationsList({required this.notifications});
  final List<AppNotification> notifications;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Group by date
    final Map<String, List<AppNotification>> grouped = {};
    for (final n in notifications) {
      final key = _dateLabel(n.createdAt);
      grouped.putIfAbsent(key, () => []).add(n);
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: grouped.length,
      itemBuilder: (context, sectionIndex) {
        final dateKey = grouped.keys.elementAt(sectionIndex);
        final sectionItems = grouped[dateKey]!;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                dateKey,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            ...sectionItems.map(
              (n) => _NotificationTile(
                notification: n,
                onTap: () => ref.read(notificationsProvider.notifier).markRead(n.id),
              ),
            ),
          ],
        );
      },
    );
  }

  String _dateLabel(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays} days ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

// ─── Notification Tile ────────────────────────────────────────────────────────

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({required this.notification, required this.onTap});
  final AppNotification notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final icon = _iconForType(notification.type);
    final color = _colorForType(notification.type);

    return InkWell(
      onTap: onTap,
      child: Container(
        color: notification.isRead
            ? Colors.white
            : AppColors.brand.withOpacity(0.04),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(22),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            fontWeight: notification.isRead
                                ? FontWeight.w500
                                : FontWeight.w700,
                            fontSize: 14,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      if (!notification.isRead)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.brand,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.body,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _timeAgo(notification.createdAt),
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'PAYMENT':
        return Icons.payments_rounded;
      case 'REMINDER':
        return Icons.alarm_rounded;
      case 'CHAT':
        return Icons.chat_bubble_rounded;
      default:
        return Icons.event_available_rounded;
    }
  }

  Color _colorForType(String type) {
    switch (type) {
      case 'PAYMENT':
        return const Color(0xFF10B981);
      case 'REMINDER':
        return AppColors.gold;
      case 'CHAT':
        return const Color(0xFF3B82F6);
      default:
        return AppColors.brand;
    }
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

final _mockNotifications = [
  AppNotification(
    id: 'n1',
    title: 'Booking Confirmed!',
    body: 'Royal Grand Palace has confirmed your booking for Dec 15, 2025.',
    type: 'BOOKING_UPDATE',
    isRead: false,
    createdAt: DateTime.now().subtract(const Duration(hours: 2)),
  ),
  AppNotification(
    id: 'n2',
    title: 'Payment Received',
    body: 'Your advance payment of ₹2,50,000 has been held in escrow.',
    type: 'PAYMENT',
    isRead: false,
    createdAt: DateTime.now().subtract(const Duration(hours: 3)),
  ),
  AppNotification(
    id: 'n3',
    title: 'New Message from Vendor',
    body: 'Srikanth Photography: "Hi! Could we schedule a pre-wedding shoot consultation?"',
    type: 'CHAT',
    isRead: false,
    createdAt: DateTime.now().subtract(const Duration(hours: 5)),
  ),
  AppNotification(
    id: 'n4',
    title: '15 Days to Go!',
    body: 'Your wedding is in 15 days! Check your task list and confirm all vendor bookings.',
    type: 'REMINDER',
    isRead: true,
    createdAt: DateTime.now().subtract(const Duration(days: 1)),
  ),
  AppNotification(
    id: 'n5',
    title: 'Vendor Quote Received',
    body: 'Blooms & Dreams Decor has sent you a quote for your wedding decoration.',
    type: 'BOOKING_UPDATE',
    isRead: true,
    createdAt: DateTime.now().subtract(const Duration(days: 2)),
  ),
];
