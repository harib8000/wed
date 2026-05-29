import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../models/coordinator.dart';
import '../../providers/coordinator_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';

class CoordinatorTasksScreen extends ConsumerWidget {
  const CoordinatorTasksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(coordinatorEventsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('All Tasks'),
        backgroundColor: AppColors.coordinator,
        foregroundColor: Colors.white,
        titleTextStyle: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
      ),
      body: eventsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorStateWidget(
          message: 'Failed to load events.',
          onRetry: () => ref.invalidate(coordinatorEventsProvider),
        ),
        data: (events) {
          if (events.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.checklist_outlined,
              title: 'No Tasks',
              message: 'Assign events first to manage their tasks.',
            );
          }
          return _AllTasksView(events: events);
        },
      ),
    );
  }
}

class _AllTasksView extends ConsumerWidget {
  final List<CoordinatorEvent> events;
  const _AllTasksView({required this.events});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: events.length,
      itemBuilder: (ctx, i) {
        final event = events[i];
        return _EventTaskGroup(event: event);
      },
    );
  }
}

class _EventTaskGroup extends ConsumerWidget {
  final CoordinatorEvent event;
  const _EventTaskGroup({required this.event});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(eventTasksProvider(event.id));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8, top: 8),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 16,
                decoration: BoxDecoration(
                  color: AppColors.coordinator,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  event.coupleNames,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.coordinator),
                ),
              ),
            ],
          ),
        ),
        tasksAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(16),
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          ),
          error: (e, _) => const Text('Failed to load tasks', style: TextStyle(color: AppColors.error)),
          data: (tasks) {
            final pending = tasks.where((t) => t.status == TaskStatus.todo).toList();
            final inProgress = tasks.where((t) => t.status == TaskStatus.inProgress).toList();
            final done = tasks.where((t) => t.status == TaskStatus.done).toList();

            final allOrdered = [...inProgress, ...pending, ...done];
            if (allOrdered.isEmpty) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Text('No tasks for this event', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              );
            }
            return Column(
              children: allOrdered.map((t) => _TaskTile(task: t)).toList(),
            );
          },
        ),
        const Divider(),
      ],
    );
  }
}

class _TaskTile extends StatelessWidget {
  final CoordinatorTask task;
  const _TaskTile({required this.task});

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
    final dueDateStr = task.dueDate != null ? DateFormat('d MMM').format(task.dueDate!) : null;
    final isOverdue = task.dueDate != null &&
        task.dueDate!.isBefore(DateTime.now()) &&
        task.status != TaskStatus.done;

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isOverdue ? AppColors.error.withOpacity(0.4) : AppColors.border,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            Container(
              width: 10,
              height: 10,
              margin: const EdgeInsets.only(top: 2),
              decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(task.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  if (task.description != null)
                    Text(task.description!,
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                ],
              ),
            ),
            if (dueDateStr != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isOverdue ? AppColors.error.withOpacity(0.1) : AppColors.border.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  dueDateStr,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: isOverdue ? AppColors.error : AppColors.textSecondary,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
