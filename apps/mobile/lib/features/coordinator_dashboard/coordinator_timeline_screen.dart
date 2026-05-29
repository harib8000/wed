import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../models/coordinator.dart';
import '../../providers/coordinator_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';

class CoordinatorTimelineScreen extends ConsumerStatefulWidget {
  final String eventId;
  const CoordinatorTimelineScreen({super.key, required this.eventId});

  @override
  ConsumerState<CoordinatorTimelineScreen> createState() => _CoordinatorTimelineScreenState();
}

class _CoordinatorTimelineScreenState extends ConsumerState<CoordinatorTimelineScreen> {
  Future<void> _showAddItemDialog(BuildContext context) async {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    TimeOfDay selectedTime = TimeOfDay.now();

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Add Timeline Item',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(
              controller: titleCtrl,
              decoration: const InputDecoration(
                labelText: 'Title',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descCtrl,
              decoration: const InputDecoration(
                labelText: 'Description (optional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.coordinator,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () async {
                if (titleCtrl.text.trim().isEmpty) return;
                try {
                  final now = DateTime.now();
                  final scheduledAt = DateTime(
                      now.year, now.month, now.day, selectedTime.hour, selectedTime.minute);
                  await ApiClientAccessor.createTimelineItem(widget.eventId, {
                    'title': titleCtrl.text.trim(),
                    'description': descCtrl.text.trim().isEmpty ? null : descCtrl.text.trim(),
                    'scheduledAt': scheduledAt.toIso8601String(),
                    'status': 'PENDING',
                  });
                  if (ctx.mounted) Navigator.of(ctx).pop();
                  ref.invalidate(eventTimelineProvider(widget.eventId));
                } catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      const SnackBar(content: Text('Failed to add item')),
                    );
                  }
                }
              },
              child: const Text('Add Item'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final timelineAsync = ref.watch(eventTimelineProvider(widget.eventId));

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Event Timeline'),
        backgroundColor: AppColors.coordinator,
        foregroundColor: Colors.white,
        titleTextStyle: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () => ref.invalidate(eventTimelineProvider(widget.eventId)),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.coordinator,
        foregroundColor: Colors.white,
        onPressed: () => _showAddItemDialog(context),
        child: const Icon(Icons.add),
      ),
      body: timelineAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorStateWidget(
          message: 'Failed to load timeline.',
          onRetry: () => ref.invalidate(eventTimelineProvider(widget.eventId)),
        ),
        data: (items) {
          if (items.isEmpty) {
            return EmptyStateWidget(
              icon: Icons.timeline,
              title: 'No Timeline Items',
              message: 'Add milestones and activities for this event.',
              actionLabel: 'Add Item',
              onAction: () => _showAddItemDialog(context),
            );
          }
          return ReorderableListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
            itemCount: items.length,
            onReorder: (oldIdx, newIdx) {
              // Reorder is optimistic UI; a full persist would call updateTimelineItem
            },
            itemBuilder: (ctx, i) {
              final item = items[i];
              return _TimelineItemCard(
                key: ValueKey(item.id),
                item: item,
                isLast: i == items.length - 1,
                onStatusChange: (newStatus) async {
                  try {
                    await ApiClientAccessor.updateTimelineItem(
                      widget.eventId,
                      item.id,
                      {'status': newStatus.name.toUpperCase()},
                    );
                    ref.invalidate(eventTimelineProvider(widget.eventId));
                  } catch (_) {}
                },
              );
            },
          );
        },
      ),
    );
  }
}

// Direct ApiClient calls for timeline CRUD
class ApiClientAccessor {
  static Future<void> createTimelineItem(String eventId, Map<String, dynamic> data) async {
    await ApiClient.createTimelineItem(eventId, data);
  }

  static Future<void> updateTimelineItem(String eventId, String itemId, Map<String, dynamic> data) async {
    await ApiClient.updateTimelineItem(eventId, itemId, data);
  }
}

class _TimelineItemCard extends StatelessWidget {
  final TimelineItem item;
  final bool isLast;
  final ValueChanged<TimelineItemStatus> onStatusChange;

  const _TimelineItemCard({
    super.key,
    required this.item,
    required this.isLast,
    required this.onStatusChange,
  });

  Color get _statusColor {
    switch (item.status) {
      case TimelineItemStatus.done:
        return AppColors.success;
      case TimelineItemStatus.inProgress:
        return AppColors.coordinator;
      case TimelineItemStatus.overdue:
        return AppColors.error;
      case TimelineItemStatus.pending:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final timeStr = DateFormat('h:mm a').format(item.scheduledAt);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 32,
            child: Column(
              children: [
                Container(
                  width: 18,
                  height: 18,
                  decoration: BoxDecoration(
                    color: _statusColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
                if (!isLast)
                  Expanded(child: Container(width: 2, color: AppColors.border)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(item.title,
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        ),
                        _StatusDropdown(current: item.status, onChanged: onStatusChange),
                      ],
                    ),
                    if (item.description != null) ...[
                      const SizedBox(height: 4),
                      Text(item.description!,
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    ],
                    const SizedBox(height: 6),
                    Row(children: [
                      const Icon(Icons.access_time, size: 11, color: AppColors.textMuted),
                      const SizedBox(width: 4),
                      Text(timeStr, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                      const SizedBox(width: 4),
                      const Icon(Icons.drag_handle, size: 14, color: AppColors.textMuted),
                    ]),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusDropdown extends StatelessWidget {
  final TimelineItemStatus current;
  final ValueChanged<TimelineItemStatus> onChanged;
  const _StatusDropdown({required this.current, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (current) {
      case TimelineItemStatus.done:
        color = AppColors.success;
        break;
      case TimelineItemStatus.inProgress:
        color = AppColors.coordinator;
        break;
      case TimelineItemStatus.overdue:
        color = AppColors.error;
        break;
      case TimelineItemStatus.pending:
        color = AppColors.textMuted;
        break;
    }

    return PopupMenuButton<TimelineItemStatus>(
      initialValue: current,
      onSelected: onChanged,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: color.withOpacity(0.12),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(current.label,
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
            Icon(Icons.arrow_drop_down, size: 14, color: color),
          ],
        ),
      ),
      itemBuilder: (ctx) => TimelineItemStatus.values
          .map((s) => PopupMenuItem(value: s, child: Text(s.label)))
          .toList(),
    );
  }
}
