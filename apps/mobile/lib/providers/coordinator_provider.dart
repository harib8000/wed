import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../core/api_client.dart';
import '../models/coordinator.dart';
import 'auth_provider.dart';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const _coordinatorEventsBoxKey = 'coordinator_events_cache';
const _coordinatorEventsDataKey = 'events';

int _toInt(dynamic v) {
  if (v is int) return v;
  if (v is double) return v.toInt();
  if (v is String) return int.tryParse(v) ?? 0;
  return 0;
}

// ─── Coordinator Events ───────────────────────────────────────────────────────

final coordinatorEventsProvider = FutureProvider<List<CoordinatorEvent>>((ref) async {
  ref.watch(currentUserProvider);
  final box = await Hive.openBox<String>(_coordinatorEventsBoxKey);
  try {
    final res = await ApiClient.getCoordinatorEvents();
    final raw = (res.data['data'] as Map<String, dynamic>?) ?? {};
    final list = (raw['events'] as List<dynamic>?) ?? (res.data['data'] as List<dynamic>? ?? []);
    final events = list
        .map((e) => CoordinatorEvent.fromJson(e as Map<String, dynamic>))
        .toList();
    // Cache for offline use
    await box.put(_coordinatorEventsDataKey, jsonEncode(list));
    return events;
  } catch (e) {
    debugPrint('Coordinator events fetch failed, checking cache: $e');
    final cached = box.get(_coordinatorEventsDataKey);
    if (cached != null) {
      try {
        final list = jsonDecode(cached) as List<dynamic>;
        return list
            .map((e) => CoordinatorEvent.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {}
    }
    return _mockEvents;
  }
});

// ─── Event Timeline ───────────────────────────────────────────────────────────

final eventTimelineProvider =
    FutureProvider.family<List<TimelineItem>, String>((ref, eventId) async {
  try {
    final res = await ApiClient.getEventTimeline(eventId);
    final raw = (res.data['data'] as Map<String, dynamic>?) ?? {};
    final list =
        (raw['items'] as List<dynamic>?) ?? (res.data['data'] as List<dynamic>? ?? []);
    return list
        .map((e) => TimelineItem.fromJson(e as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => a.order.compareTo(b.order));
  } catch (e) {
    debugPrint('Timeline fetch failed: $e');
    return _mockTimeline(eventId);
  }
});

// ─── Event Tasks ──────────────────────────────────────────────────────────────

final eventTasksProvider =
    FutureProvider.family<List<CoordinatorTask>, String>((ref, eventId) async {
  try {
    final res = await ApiClient.getEventTasks(eventId);
    final raw = (res.data['data'] as Map<String, dynamic>?) ?? {};
    final list =
        (raw['tasks'] as List<dynamic>?) ?? (res.data['data'] as List<dynamic>? ?? []);
    return list
        .map((t) => CoordinatorTask.fromJson(t as Map<String, dynamic>))
        .toList();
  } catch (e) {
    debugPrint('Tasks fetch failed: $e');
    return _mockTasks(eventId);
  }
});

// ─── Coordinator Vendors ──────────────────────────────────────────────────────

final coordinatorVendorsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  try {
    final res = await ApiClient.getCoordinatorVendors();
    final raw = (res.data['data'] as Map<String, dynamic>?) ?? {};
    final list = (raw['vendors'] as List<dynamic>?) ?? [];
    return list.map((v) => v as Map<String, dynamic>).toList();
  } catch (e) {
    debugPrint('Coordinator vendors fetch failed: $e');
    return _mockVendors;
  }
});

// ─── Coordinator Stats (derived from events + tasks) ──────────────────────────

final coordinatorStatsProvider = FutureProvider<CoordinatorStats>((ref) async {
  final eventsAsync = ref.watch(coordinatorEventsProvider);
  return eventsAsync.when(
    data: (events) {
      final today = DateTime.now();
      final activeToday = events
          .where((e) =>
              e.status == 'ACTIVE' &&
              e.eventDate.year == today.year &&
              e.eventDate.month == today.month &&
              e.eventDate.day == today.day)
          .length;
      final completedThisMonth = events
          .where((e) =>
              e.status == 'COMPLETED' &&
              e.eventDate.year == today.year &&
              e.eventDate.month == today.month)
          .length;
      return CoordinatorStats(
        activeEventsToday: activeToday,
        pendingTasks: 0,
        upcomingMilestones: 0,
        openChats: 0,
        totalEventsManaged: events.length,
        completedThisMonth: completedThisMonth,
      );
    },
    loading: () => const CoordinatorStats(
      activeEventsToday: 0,
      pendingTasks: 0,
      upcomingMilestones: 0,
      openChats: 0,
      totalEventsManaged: 0,
      completedThisMonth: 0,
    ),
    error: (_, __) => const CoordinatorStats(
      activeEventsToday: 0,
      pendingTasks: 0,
      upcomingMilestones: 0,
      openChats: 0,
      totalEventsManaged: 0,
      completedThisMonth: 0,
    ),
  );
});

// ─── Mock Data ────────────────────────────────────────────────────────────────

final _mockEvents = [
  CoordinatorEvent(
    id: 'event-1',
    coupleNames: 'Priya & Rahul',
    venueName: 'Royal Grand Palace, Hyderabad',
    eventDate: DateTime.now().add(const Duration(days: 12)),
    status: 'ACTIVE',
    eventType: 'Wedding',
    guestCount: 500,
    budgetPaise: 2500000000,
  ),
  CoordinatorEvent(
    id: 'event-2',
    coupleNames: 'Ananya & Karthik',
    venueName: 'The Leela, Bangalore',
    eventDate: DateTime.now().add(const Duration(days: 45)),
    status: 'PLANNING',
    eventType: 'Wedding',
    guestCount: 250,
    budgetPaise: 1500000000,
  ),
  CoordinatorEvent(
    id: 'event-3',
    coupleNames: 'Divya & Rohan',
    venueName: 'Taj Falaknuma, Hyderabad',
    eventDate: DateTime.now().subtract(const Duration(days: 30)),
    status: 'COMPLETED',
    eventType: 'Wedding',
    guestCount: 800,
    budgetPaise: 5000000000,
  ),
];

List<TimelineItem> _mockTimeline(String eventId) => [
      TimelineItem(
        id: 't1',
        eventId: eventId,
        title: 'Venue Setup Begins',
        description: 'Decorators arrive and begin hall transformation',
        scheduledAt: DateTime.now().add(const Duration(hours: 8)),
        status: TimelineItemStatus.pending,
        order: 0,
      ),
      TimelineItem(
        id: 't2',
        eventId: eventId,
        title: 'Mehendi Ceremony',
        description: 'Bridal mehendi application',
        scheduledAt: DateTime.now().add(const Duration(hours: 10)),
        status: TimelineItemStatus.pending,
        order: 1,
      ),
      TimelineItem(
        id: 't3',
        eventId: eventId,
        title: 'Catering Setup',
        description: 'Kitchen and food service preparation',
        scheduledAt: DateTime.now().add(const Duration(hours: 14)),
        status: TimelineItemStatus.inProgress,
        order: 2,
      ),
      TimelineItem(
        id: 't4',
        eventId: eventId,
        title: 'Photography Session',
        description: 'Pre-wedding couple shoot',
        scheduledAt: DateTime.now().add(const Duration(hours: 16)),
        status: TimelineItemStatus.done,
        order: 3,
      ),
    ];

List<CoordinatorTask> _mockTasks(String eventId) => [
      CoordinatorTask(
        id: 'task-1',
        eventId: eventId,
        title: 'Confirm catering headcount',
        description: 'Final guest count for dinner buffet',
        status: TaskStatus.todo,
        dueDate: DateTime.now().add(const Duration(days: 2)),
        createdAt: DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
      ),
      CoordinatorTask(
        id: 'task-2',
        eventId: eventId,
        title: 'Arrange guest transport',
        description: 'Coordinate bus pickup from hotels',
        status: TaskStatus.inProgress,
        dueDate: DateTime.now().add(const Duration(days: 5)),
        createdAt: DateTime.now().subtract(const Duration(days: 3)).toIso8601String(),
      ),
      CoordinatorTask(
        id: 'task-3',
        eventId: eventId,
        title: 'Final menu approval',
        description: 'Get couple sign-off on menu',
        status: TaskStatus.done,
        dueDate: DateTime.now().subtract(const Duration(days: 1)),
        createdAt: DateTime.now().subtract(const Duration(days: 5)).toIso8601String(),
      ),
    ];

final _mockVendors = [
  {'id': 'v1', 'businessName': 'Royal Decorators', 'category': 'Decoration', 'city': 'Hyderabad'},
  {'id': 'v2', 'businessName': 'Moments Photography', 'category': 'Photography', 'city': 'Hyderabad'},
  {'id': 'v3', 'businessName': 'Spice Garden Caterers', 'category': 'Catering', 'city': 'Hyderabad'},
];
