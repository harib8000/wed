import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';

enum ChecklistCategory { venue, catering, photography, decoration, makeup, music, attire, invitations, honeymoon, other }

class ChecklistTask {
  final String id;
  final String title;
  final String? detail;
  final ChecklistCategory category;
  final int daysBeforeEvent;
  final bool isDone;

  const ChecklistTask({required this.id, required this.title, this.detail, required this.category, required this.daysBeforeEvent, this.isDone = false});

  ChecklistTask copyWith({bool? isDone}) {
    return ChecklistTask(
      id: id,
      title: title,
      detail: detail,
      category: category,
      daysBeforeEvent: daysBeforeEvent,
      isDone: isDone ?? this.isDone,
    );
  }
}

class ChecklistNotifier extends StateNotifier<List<ChecklistTask>> {
  ChecklistNotifier() : super(_defaultTasks);

  void toggle(String taskId) {
    state = state.map((task) => task.id == taskId ? task.copyWith(isDone: !task.isDone) : task).toList();
  }

  void addTask(ChecklistTask task) {
    state = [...state, task];
  }

  void clearCompleted() {
    state = state.where((task) => !task.isDone).toList();
  }

  int get totalCount => state.length;
  int get doneCount => state.where((task) => task.isDone).length;
  double get progress => totalCount == 0 ? 0 : doneCount / totalCount;
}

final checklistProvider = StateNotifierProvider<ChecklistNotifier, List<ChecklistTask>>((ref) => ChecklistNotifier());

final _defaultTasks = [
  ChecklistTask(id: 'cl1', title: 'Finalise wedding date & venue', category: ChecklistCategory.venue, daysBeforeEvent: 365, detail: 'Book venue at least 12 months in advance for popular dates'),
  ChecklistTask(id: 'cl2', title: 'Set a wedding budget', category: ChecklistCategory.other, daysBeforeEvent: 365),
  ChecklistTask(id: 'cl3', title: 'Create guest list', category: ChecklistCategory.invitations, daysBeforeEvent: 300),
  ChecklistTask(id: 'cl4', title: 'Book photographer & videographer', category: ChecklistCategory.photography, daysBeforeEvent: 270, detail: 'Good photographers book up 9-12 months in advance'),
  ChecklistTask(id: 'cl5', title: 'Book catering service', category: ChecklistCategory.catering, daysBeforeEvent: 270),
  ChecklistTask(id: 'cl6', title: 'Hire makeup artist & hair stylist', category: ChecklistCategory.makeup, daysBeforeEvent: 240),
  ChecklistTask(id: 'cl7', title: 'Book DJ / live music / band', category: ChecklistCategory.music, daysBeforeEvent: 240),
  ChecklistTask(id: 'cl8', title: 'Select wedding decoration theme', category: ChecklistCategory.decoration, daysBeforeEvent: 210),
  ChecklistTask(id: 'cl9', title: 'Shop for bridal outfit & jewellery', category: ChecklistCategory.attire, daysBeforeEvent: 180, detail: 'Allow 3-4 months for custom alterations'),
  ChecklistTask(id: 'cl10', title: 'Groom outfit selection', category: ChecklistCategory.attire, daysBeforeEvent: 180),
  ChecklistTask(id: 'cl11', title: 'Send save-the-dates', category: ChecklistCategory.invitations, daysBeforeEvent: 150),
  ChecklistTask(id: 'cl12', title: 'Finalise decoration layout & flowers', category: ChecklistCategory.decoration, daysBeforeEvent: 120),
  ChecklistTask(id: 'cl13', title: 'Order wedding invitations', category: ChecklistCategory.invitations, daysBeforeEvent: 120),
  ChecklistTask(id: 'cl14', title: 'Finalise catering menu', category: ChecklistCategory.catering, daysBeforeEvent: 90),
  ChecklistTask(id: 'cl15', title: 'Rehearsal dinner planning', category: ChecklistCategory.other, daysBeforeEvent: 60),
  ChecklistTask(id: 'cl16', title: 'Collect RSVPs & confirm head count', category: ChecklistCategory.invitations, daysBeforeEvent: 45),
  ChecklistTask(id: 'cl17', title: 'Final outfit fittings', category: ChecklistCategory.attire, daysBeforeEvent: 30),
  ChecklistTask(id: 'cl18', title: 'Confirm all vendor times & arrangements', category: ChecklistCategory.other, daysBeforeEvent: 14),
  ChecklistTask(id: 'cl19', title: 'Escort card & seating arrangement', category: ChecklistCategory.other, daysBeforeEvent: 7),
  ChecklistTask(id: 'cl20', title: 'Pack honeymoon essentials', category: ChecklistCategory.honeymoon, daysBeforeEvent: 3),
  ChecklistTask(id: 'cl21', title: 'Bridal party briefing', category: ChecklistCategory.other, daysBeforeEvent: 2),
  ChecklistTask(id: 'cl22', title: 'Enjoy your wedding day!', category: ChecklistCategory.other, daysBeforeEvent: 0),
];

class ChecklistScreen extends ConsumerStatefulWidget {
  const ChecklistScreen({super.key});

  @override
  ConsumerState<ChecklistScreen> createState() => _ChecklistScreenState();
}

class _ChecklistScreenState extends ConsumerState<ChecklistScreen> {
  ChecklistCategory? _filterCategory;

  static final _categoryMeta = {
    ChecklistCategory.venue: (Icons.location_city_outlined, 'Venue', const Color(0xFF6366F1)),
    ChecklistCategory.catering: (Icons.restaurant_outlined, 'Catering', const Color(0xFFEA580C)),
    ChecklistCategory.photography: (Icons.camera_alt_outlined, 'Photos', const Color(0xFF7C3AED)),
    ChecklistCategory.decoration: (Icons.local_florist_outlined, 'Decor', const Color(0xFFEC4899)),
    ChecklistCategory.makeup: (Icons.face_outlined, 'Makeup', const Color(0xFFDB2777)),
    ChecklistCategory.music: (Icons.music_note_outlined, 'Music', const Color(0xFF2563EB)),
    ChecklistCategory.attire: (Icons.checkroom_outlined, 'Attire', const Color(0xFF059669)),
    ChecklistCategory.invitations: (Icons.mail_outline, 'Invites', const Color(0xFFD97706)),
    ChecklistCategory.honeymoon: (Icons.flight_outlined, 'Honeymoon', const Color(0xFF0891B2)),
    ChecklistCategory.other: (Icons.checklist_outlined, 'Other', const Color(0xFF4B5563)),
  };

  static (IconData, String, Color) _meta(ChecklistCategory category) => _categoryMeta[category] ?? (Icons.checklist_outlined, 'Other', const Color(0xFF4B5563));

  DateTime _eventDate() {
    final user = ref.read(currentUserProvider);
    return DateTime.tryParse(user?.weddingDate ?? '') ?? DateTime.now().add(const Duration(days: 180));
  }

  Future<void> _showAddTaskSheet() async {
    final titleController = TextEditingController();
    final detailController = TextEditingController();
    ChecklistCategory category = ChecklistCategory.other;
    double timeline = 30;

    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => Padding(
          padding: EdgeInsets.fromLTRB(16, 8, 16, MediaQuery.of(context).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Add custom task', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              TextField(controller: titleController, decoration: const InputDecoration(labelText: 'Task title')),
              const SizedBox(height: 12),
              TextField(controller: detailController, maxLines: 3, decoration: const InputDecoration(labelText: 'Notes (optional)')),
              const SizedBox(height: 12),
              DropdownButtonFormField<ChecklistCategory>(
                value: category,
                items: ChecklistCategory.values.map((item) {
                  final meta = _meta(item);
                  return DropdownMenuItem(value: item, child: Text(meta.$2));
                }).toList(),
                onChanged: (value) => setState(() => category = value ?? category),
                decoration: const InputDecoration(labelText: 'Category'),
              ),
              const SizedBox(height: 12),
              Text('Complete this about ${timeline.round()} days before the event', style: const TextStyle(fontWeight: FontWeight.w600)),
              Slider(value: timeline, min: 0, max: 365, divisions: 73, activeColor: AppColors.brand, onChanged: (value) => setState(() => timeline = value)),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (titleController.text.trim().isEmpty) return;
                    ref.read(checklistProvider.notifier).addTask(
                          ChecklistTask(
                            id: DateTime.now().millisecondsSinceEpoch.toString(),
                            title: titleController.text.trim(),
                            detail: detailController.text.trim().isEmpty ? null : detailController.text.trim(),
                            category: category,
                            daysBeforeEvent: timeline.round(),
                          ),
                        );
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.brand, foregroundColor: Colors.white),
                  child: const Text('Add Task'),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    titleController.dispose();
    detailController.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tasks = ref.watch(checklistProvider);
    final notifier = ref.read(checklistProvider.notifier);
    final eventDate = _eventDate();
    final filtered = _filterCategory == null ? tasks : tasks.where((task) => task.category == _filterCategory).toList();
    final grouped = <ChecklistCategory, List<ChecklistTask>>{};
    for (final task in filtered) {
      grouped.putIfAbsent(task.category, () => []).add(task);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Wedding Checklist'),
        actions: [
          if (tasks.any((task) => task.isDone))
            TextButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                notifier.clearCompleted();
              },
              child: const Text('Clear done'),
            ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddTaskSheet,
        backgroundColor: AppColors.brand,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_task),
        label: const Text('Add Task'),
      ),
      body: Column(
        children: [
          _ProgressHeader(eventDate: eventDate),
          _CategoryFilterRow(selected: _filterCategory, onSelect: (value) => setState(() => _filterCategory = value), meta: _meta),
          Expanded(
            child: grouped.isEmpty
                ? const EmptyStateWidget(icon: Icons.checklist_outlined, title: 'No checklist items', message: 'Add a custom task or reset the filters to see your wedding checklist.')
                : ListView(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 90),
                    children: grouped.entries.map((entry) {
                      final meta = _meta(entry.key);
                      final tasks = entry.value;
                      final done = tasks.where((task) => task.isDone).length;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                        child: ExpansionTile(
                          initiallyExpanded: true,
                          leading: CircleAvatar(backgroundColor: meta.$3.withOpacity(0.1), child: Icon(meta.$1, color: meta.$3, size: 18)),
                          title: Text(meta.$2, style: const TextStyle(fontWeight: FontWeight.w700)),
                          subtitle: Text('$done/${tasks.length} done', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                          childrenPadding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                          children: tasks.map((task) => _TaskTile(task: task, meta: meta, eventDate: eventDate, onToggle: () => notifier.toggle(task.id))).toList(),
                        ),
                      );
                    }).toList(),
                  ),
          ),
        ],
      ),
    );
  }
}

class _ProgressHeader extends ConsumerWidget {
  final DateTime eventDate;
  const _ProgressHeader({required this.eventDate});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(checklistProvider);
    final done = tasks.where((task) => task.isDone).length;
    final total = tasks.length;
    final pct = total == 0 ? 0.0 : done / total;
    final overdue = tasks.where((task) => !task.isDone && eventDate.subtract(Duration(days: task.daysBeforeEvent)).isBefore(DateTime.now())).length;

    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('$done of $total tasks completed', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  Text('${(pct * 100).round()}% done · $overdue overdue', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                ],
              ),
              SizedBox(
                width: 54,
                height: 54,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    CircularProgressIndicator(value: pct, backgroundColor: Colors.grey.shade200, color: AppColors.brand, strokeWidth: 5),
                    Text('${(pct * 100).round()}%', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(borderRadius: BorderRadius.circular(4), child: LinearProgressIndicator(value: pct, backgroundColor: Colors.grey.shade200, color: AppColors.brand, minHeight: 6)),
        ],
      ),
    );
  }
}

class _CategoryFilterRow extends StatelessWidget {
  final ChecklistCategory? selected;
  final ValueChanged<ChecklistCategory?> onSelect;
  final (IconData, String, Color) Function(ChecklistCategory) meta;
  const _CategoryFilterRow({required this.selected, required this.onSelect, required this.meta});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        children: [
          _FilterChip(label: 'All', icon: Icons.apps, selected: selected == null, color: AppColors.brand, onTap: () => onSelect(null)),
          ...ChecklistCategory.values.map((category) {
            final item = meta(category);
            return _FilterChip(label: item.$2, icon: item.$1, selected: selected == category, color: item.$3, onTap: () => onSelect(selected == category ? null : category));
          }),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final Color color;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.icon, required this.selected, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(color: selected ? color : Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: selected ? color : AppColors.border)),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: selected ? Colors.white : color),
            const SizedBox(width: 4),
            Text(label, style: TextStyle(fontSize: 12, color: selected ? Colors.white : AppColors.textSecondary, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}

class _TaskTile extends StatelessWidget {
  final ChecklistTask task;
  final (IconData, String, Color) meta;
  final DateTime eventDate;
  final VoidCallback onToggle;
  const _TaskTile({required this.task, required this.meta, required this.eventDate, required this.onToggle});

  bool get _isOverdue => !task.isDone && eventDate.subtract(Duration(days: task.daysBeforeEvent)).isBefore(DateTime.now());

  @override
  Widget build(BuildContext context) {
    final (_, label, color) = meta;
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onToggle();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: task.isDone ? Colors.grey.shade50 : Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: _isOverdue ? AppColors.error.withOpacity(0.25) : task.isDone ? Colors.grey.shade200 : AppColors.border)),
        child: Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              width: 26,
              height: 26,
              decoration: BoxDecoration(color: task.isDone ? Colors.green : Colors.white, shape: BoxShape.circle, border: Border.all(color: task.isDone ? Colors.green : color, width: 2)),
              child: task.isDone ? const Icon(Icons.check, color: Colors.white, size: 14) : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(task.title, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: task.isDone ? AppColors.textMuted : AppColors.textPrimary, decoration: task.isDone ? TextDecoration.lineThrough : null)),
                  if (task.detail != null) ...[
                    const SizedBox(height: 4),
                    Text(task.detail!, style: TextStyle(fontSize: 11, color: AppColors.textMuted.withOpacity(task.isDone ? 0.5 : 1))),
                  ],
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      _TaskTag(color: color, label: label),
                      _TaskTag(color: _isOverdue ? AppColors.error : AppColors.textMuted, label: task.daysBeforeEvent == 0 ? 'Day of event' : '${task.daysBeforeEvent}d before'),
                      if (_isOverdue) const _TaskTag(color: AppColors.error, label: 'Overdue'),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TaskTag extends StatelessWidget {
  final Color color;
  final String label;
  const _TaskTag({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
    );
  }
}
