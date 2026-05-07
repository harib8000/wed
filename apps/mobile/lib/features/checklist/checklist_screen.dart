import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';

// ─── Checklist Models ────────────────────────────────────────
enum ChecklistCategory { venue, catering, photography, decoration, makeup, music, attire, invitations, honeymoon, other }

class ChecklistTask {
  final String id;
  final String title;
  final String? detail;
  final ChecklistCategory category;
  final int daysBeforeEvent; // days before wedding to complete
  bool isDone;

  ChecklistTask({
    required this.id,
    required this.title,
    this.detail,
    required this.category,
    required this.daysBeforeEvent,
    this.isDone = false,
  });

  ChecklistTask copyWith({bool? isDone}) => ChecklistTask(
    id: id, title: title, detail: detail, category: category,
    daysBeforeEvent: daysBeforeEvent, isDone: isDone ?? this.isDone,
  );
}

// ─── Checklist Provider ──────────────────────────────────────
class ChecklistNotifier extends StateNotifier<List<ChecklistTask>> {
  ChecklistNotifier() : super(_defaultTasks);

  void toggle(String taskId) {
    state = state.map((t) => t.id == taskId ? t.copyWith(isDone: !t.isDone) : t).toList();
  }

  int get totalCount => state.length;
  int get doneCount => state.where((t) => t.isDone).length;
  double get progress => totalCount == 0 ? 0 : doneCount / totalCount;
}

final checklistProvider = StateNotifierProvider<ChecklistNotifier, List<ChecklistTask>>(
  (ref) => ChecklistNotifier(),
);

// ─── Default tasks (wedding checklist) ──────────────────────
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
  ChecklistTask(id: 'cl10', title: 'Grooming outfit selection (groom)', category: ChecklistCategory.attire, daysBeforeEvent: 180),
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

// ─── Checklist Screen ────────────────────────────────────────
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

  static (IconData, String, Color) _meta(ChecklistCategory c) =>
      _categoryMeta[c] ?? (Icons.checklist_outlined, 'Other', const Color(0xFF4B5563));

  @override
  Widget build(BuildContext context) {
    final tasks = ref.watch(checklistProvider);
    final notifier = ref.read(checklistProvider.notifier);
    final filtered = _filterCategory == null ? tasks : tasks.where((t) => t.category == _filterCategory).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Wedding Checklist')),
      body: Column(children: [
        _ProgressHeader(notifier: notifier),
        _CategoryFilterRow(selected: _filterCategory, onSelect: (c) => setState(() => _filterCategory = c), meta: _meta),
        Expanded(
          child: filtered.isEmpty
              ? const Center(child: Text('No tasks in this category', style: TextStyle(color: AppColors.textMuted)))
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  itemCount: filtered.length,
                  itemBuilder: (context, i) {
                    final task = filtered[i];
                    return _TaskTile(task: task, meta: _meta(task.category), onToggle: () => notifier.toggle(task.id));
                  },
                ),
        ),
      ]),
    );
  }
}

// ─── Progress Header ─────────────────────────────────────────
class _ProgressHeader extends ConsumerWidget {
  final ChecklistNotifier notifier;
  const _ProgressHeader({required this.notifier});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(checklistProvider);
    final done = tasks.where((t) => t.isDone).length;
    final total = tasks.length;
    final pct = total == 0 ? 0.0 : done / total;

    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('$done of $total tasks completed', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            Text('${(pct * 100).round()}% of your wedding prep done', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
          ]),
          Container(
            width: 52, height: 52,
            child: Stack(alignment: Alignment.center, children: [
              CircularProgressIndicator(value: pct, backgroundColor: Colors.grey.shade200, color: AppColors.brand, strokeWidth: 5),
              Text('${(pct * 100).round()}%', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
            ]),
          ),
        ]),
        const SizedBox(height: 8),
        ClipRRect(borderRadius: BorderRadius.circular(4), child: LinearProgressIndicator(value: pct, backgroundColor: Colors.grey.shade200, color: AppColors.brand, minHeight: 6)),
      ]),
    );
  }
}

// ─── Category Filter ─────────────────────────────────────────
class _CategoryFilterRow extends StatelessWidget {
  final ChecklistCategory? selected;
  final ValueChanged<ChecklistCategory?> onSelect;
  final (IconData, String, Color) Function(ChecklistCategory) meta;
  const _CategoryFilterRow({required this.selected, required this.onSelect, required this.meta});

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 48,
    child: ListView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      children: [
        _FilterChip(label: 'All', icon: Icons.apps, selected: selected == null, color: AppColors.brand, onTap: () => onSelect(null)),
        ...ChecklistCategory.values.map((c) {
          final m = meta(c);
          return _FilterChip(label: m.$2, icon: m.$1, selected: selected == c, color: m.$3, onTap: () => onSelect(selected == c ? null : c));
        }),
      ],
    ),
  );
}

class _FilterChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final Color color;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.icon, required this.selected, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: selected ? color : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: selected ? color : AppColors.border),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 14, color: selected ? Colors.white : color),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 12, color: selected ? Colors.white : AppColors.textSecondary, fontWeight: FontWeight.w500)),
      ]),
    ),
  );
}

// ─── Task Tile ────────────────────────────────────────────────
class _TaskTile extends StatelessWidget {
  final ChecklistTask task;
  final (IconData, String, Color) meta;
  final VoidCallback onToggle;
  const _TaskTile({required this.task, required this.meta, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    final (icon, label, color) = meta;
    return GestureDetector(
      onTap: onToggle,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: task.isDone ? Colors.grey.shade50 : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: task.isDone ? Colors.grey.shade200 : AppColors.border),
        ),
        child: Row(children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 26, height: 26,
            decoration: BoxDecoration(
              color: task.isDone ? Colors.green : Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: task.isDone ? Colors.green : color, width: 2),
            ),
            child: task.isDone ? const Icon(Icons.check, color: Colors.white, size: 14) : null,
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              task.title,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: task.isDone ? AppColors.textMuted : AppColors.textPrimary,
                decoration: task.isDone ? TextDecoration.lineThrough : null,
              ),
            ),
            if (task.detail != null) Text(task.detail!, style: TextStyle(fontSize: 11, color: AppColors.textMuted.withOpacity(task.isDone ? 0.5 : 1))),
            const SizedBox(height: 3),
            Row(children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
              const SizedBox(width: 4),
              Text(label, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w500)),
              const SizedBox(width: 8),
              if (task.daysBeforeEvent > 0) Text('${task.daysBeforeEvent}d before wedding', style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
            ]),
          ])),
        ]),
      ),
    );
  }
}
