import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../models/coordinator.dart';
import '../../providers/coordinator_provider.dart';
import '../../shared/widgets/error_state_widget.dart';

class CoordinatorEventDetailScreen extends ConsumerWidget {
  final String eventId;
  const CoordinatorEventDetailScreen({super.key, required this.eventId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(coordinatorEventsProvider);

    return eventsAsync.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(
        appBar: AppBar(title: const Text('Event')),
        body: ErrorStateWidget(
          message: 'Failed to load event.',
          onRetry: () => ref.invalidate(coordinatorEventsProvider),
        ),
      ),
      data: (events) {
        final event = events.cast<CoordinatorEvent?>().firstWhere(
              (e) => e?.id == eventId,
              orElse: () => null,
            );
        if (event == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Event')),
            body: const Center(child: Text('Event not found')),
          );
        }
        return _EventDetailView(event: event);
      },
    );
  }
}

class _EventDetailView extends ConsumerStatefulWidget {
  final CoordinatorEvent event;
  const _EventDetailView({required this.event});

  @override
  ConsumerState<_EventDetailView> createState() => _EventDetailViewState();
}

class _EventDetailViewState extends ConsumerState<_EventDetailView>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final event = widget.event;
    final dateStr = DateFormat('EEEE, d MMMM yyyy').format(event.eventDate);
    final daysUntil = event.eventDate.difference(DateTime.now()).inDays;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: NestedScrollView(
        headerSliverBuilder: (ctx, _) => [
          SliverAppBar(
            expandedHeight: 160,
            pinned: true,
            backgroundColor: AppColors.coordinator,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 56, 20, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(event.coupleNames,
                            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text(event.venueName,
                            style: const TextStyle(color: Colors.white70, fontSize: 13)),
                        const SizedBox(height: 8),
                        Row(children: [
                          const Icon(Icons.calendar_today, size: 12, color: Colors.white70),
                          const SizedBox(width: 4),
                          Text(dateStr, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                          const SizedBox(width: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: daysUntil <= 7 ? AppColors.error.withOpacity(0.8) : Colors.white24,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              daysUntil < 0 ? 'Past' : daysUntil == 0 ? 'Today!' : '$daysUntil days',
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ]),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            bottom: TabBar(
              controller: _tabController,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white60,
              indicatorColor: Colors.white,
              tabs: const [
                Tab(text: 'Timeline'),
                Tab(text: 'Tasks'),
                Tab(text: 'Info'),
              ],
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _TimelineTab(eventId: event.id),
            _TasksTab(eventId: event.id),
            _InfoTab(event: event),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.coordinator,
        foregroundColor: Colors.white,
        onPressed: () => context.push('/coordinator/events/${event.id}/timeline'),
        icon: const Icon(Icons.timeline),
        label: const Text('Full Timeline'),
      ),
    );
  }
}

class _TimelineTab extends ConsumerWidget {
  final String eventId;
  const _TimelineTab({required this.eventId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timelineAsync = ref.watch(eventTimelineProvider(eventId));
    return timelineAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => ErrorStateWidget(
        message: 'Failed to load timeline.',
        onRetry: () => ref.invalidate(eventTimelineProvider(eventId)),
      ),
      data: (items) => items.isEmpty
          ? const Center(child: Text('No timeline items yet'))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (ctx, i) => _TimelineTile(item: items[i], isLast: i == items.length - 1),
            ),
    );
  }
}

class _TimelineTile extends StatelessWidget {
  final TimelineItem item;
  final bool isLast;
  const _TimelineTile({required this.item, required this.isLast});

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
                  width: 16,
                  height: 16,
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
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Container(
                padding: const EdgeInsets.all(12),
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
                        Text(item.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: _statusColor.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(item.status.label,
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: _statusColor)),
                        ),
                      ],
                    ),
                    if (item.description != null) ...[
                      const SizedBox(height: 4),
                      Text(item.description!, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    ],
                    const SizedBox(height: 4),
                    Text(timeStr, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
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

class _TasksTab extends ConsumerWidget {
  final String eventId;
  const _TasksTab({required this.eventId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(eventTasksProvider(eventId));
    return tasksAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => ErrorStateWidget(
        message: 'Failed to load tasks.',
        onRetry: () => ref.invalidate(eventTasksProvider(eventId)),
      ),
      data: (tasks) => tasks.isEmpty
          ? const Center(child: Text('No tasks yet'))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: tasks.length,
              itemBuilder: (ctx, i) => _TaskCard(task: tasks[i]),
            ),
    );
  }
}

class _TaskCard extends StatelessWidget {
  final CoordinatorTask task;
  const _TaskCard({required this.task});

  @override
  Widget build(BuildContext context) {
    final Color statusColor;
    switch (task.status) {
      case TaskStatus.done:
        statusColor = AppColors.success;
        break;
      case TaskStatus.inProgress:
        statusColor = AppColors.coordinator;
        break;
      case TaskStatus.todo:
        statusColor = AppColors.textMuted;
        break;
    }
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(task.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  if (task.description != null)
                    Text(task.description!, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(task.status.label,
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: statusColor)),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoTab extends StatelessWidget {
  final CoordinatorEvent event;
  const _InfoTab({required this.event});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _InfoRow(label: 'Event Type', value: event.eventType),
        _InfoRow(label: 'Status', value: event.status),
        if (event.guestCount != null) _InfoRow(label: 'Guest Count', value: '${event.guestCount}'),
        if (event.budgetPaise != null)
          _InfoRow(
            label: 'Budget',
            value: '₹${(event.budgetPaise! / 100).toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}',
          ),
        _InfoRow(label: 'Venue', value: event.venueName),
        _InfoRow(
          label: 'Event Date',
          value: DateFormat('EEEE, d MMMM yyyy').format(event.eventDate),
        ),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
