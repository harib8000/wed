import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../models/coordinator.dart';
import '../../providers/coordinator_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';
import '../../shared/widgets/shimmer_state_widget.dart';

class CoordinatorEventsScreen extends ConsumerWidget {
  const CoordinatorEventsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(coordinatorEventsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('My Events'),
        backgroundColor: AppColors.coordinator,
        foregroundColor: Colors.white,
        titleTextStyle: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () => ref.invalidate(coordinatorEventsProvider),
          ),
        ],
      ),
      body: eventsAsync.when(
        loading: () => const ShimmerStateWidget(itemCount: 4, itemHeight: 120),
        error: (e, _) => ErrorStateWidget(
          message: 'Failed to load events.',
          onRetry: () => ref.invalidate(coordinatorEventsProvider),
        ),
        data: (events) {
          if (events.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.event_note_outlined,
              title: 'No Events',
              message: 'No wedding events have been assigned to you yet.',
            );
          }
          final active = events.where((e) => e.status == 'ACTIVE').toList();
          final planning = events.where((e) => e.status == 'PLANNING').toList();
          final completed = events.where((e) => e.status == 'COMPLETED').toList();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (active.isNotEmpty) ...[
                _SectionHeader(title: 'Active (${active.length})', color: AppColors.success),
                ...active.map((e) => _EventListTile(event: e)),
                const SizedBox(height: 16),
              ],
              if (planning.isNotEmpty) ...[
                _SectionHeader(title: 'Planning (${planning.length})', color: AppColors.coordinator),
                ...planning.map((e) => _EventListTile(event: e)),
                const SizedBox(height: 16),
              ],
              if (completed.isNotEmpty) ...[
                _SectionHeader(title: 'Completed (${completed.length})', color: AppColors.textMuted),
                ...completed.map((e) => _EventListTile(event: e)),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final Color color;
  const _SectionHeader({required this.title, required this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(width: 4, height: 16, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 8),
          Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}

class _EventListTile extends StatelessWidget {
  final CoordinatorEvent event;
  const _EventListTile({required this.event});

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('EEE, d MMM yyyy').format(event.eventDate);
    final daysUntil = event.eventDate.difference(DateTime.now()).inDays;

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: AppColors.border),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => context.push('/coordinator/events/${event.id}'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.coordinatorLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.celebration, color: AppColors.coordinator, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(event.coupleNames,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 2),
                    Text(event.venueName,
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    const SizedBox(height: 4),
                    Row(children: [
                      const Icon(Icons.calendar_today_outlined, size: 11, color: AppColors.textMuted),
                      const SizedBox(width: 4),
                      Text(dateStr, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                      if (event.guestCount != null) ...[
                        const SizedBox(width: 8),
                        const Icon(Icons.people_outline, size: 11, color: AppColors.textMuted),
                        const SizedBox(width: 4),
                        Text('${event.guestCount}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                      ],
                    ]),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Icon(Icons.chevron_right, color: AppColors.textMuted),
                  const SizedBox(height: 4),
                  if (daysUntil >= 0 && event.status != 'COMPLETED')
                    Text(
                      daysUntil == 0 ? 'Today!' : '$daysUntil d',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: daysUntil <= 7 ? AppColors.error : AppColors.textSecondary,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
