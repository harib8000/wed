import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../models/vendor_analytics.dart';
import '../../providers/vendor_analytics_provider.dart';

class VendorCalendarScreen extends ConsumerWidget {
  const VendorCalendarScreen({super.key});

  Future<void> _blockDates(BuildContext context) async {
    final pickedRange = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2024, 1, 1),
      lastDate: DateTime(2027, 12, 31),
      helpText: 'Select dates to block',
    );

    if (pickedRange != null && context.mounted) {
      final start = pickedRange.start;
      final end = pickedRange.end;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text(
              'Blocked ${start.day}/${start.month}/${start.year} - ${end.day}/${end.month}/${end.year}',
            ),
          ),
        );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(vendorCalendarProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Availability & Calendar'),
        automaticallyImplyLeading: false,
        actions: [
          TextButton.icon(
            onPressed: () => _blockDates(context),
            icon: const Icon(Icons.block, size: 16, color: AppColors.error),
            label: const Text('Block Dates', style: TextStyle(color: AppColors.error, fontSize: 12)),
          ),
        ],
      ),
      body: eventsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (events) => _CalendarBody(events: events),
      ),
    );
  }
}

class _CalendarBody extends StatefulWidget {
  final List<CalendarEvent> events;
  const _CalendarBody({required this.events});

  @override
  State<_CalendarBody> createState() => _CalendarBodyState();
}

class _CalendarBodyState extends State<_CalendarBody> {
  late DateTime _selectedMonth;
  DateTime? _selectedDate;

  @override
  void initState() {
    super.initState();
    _selectedMonth = DateTime(2025, 4); // Start on a month with events
  }

  @override
  Widget build(BuildContext context) {
    final eventsOnDay = _selectedDate == null
        ? widget.events
        : widget.events.where((e) =>
            e.date.year == _selectedDate!.year &&
            e.date.month == _selectedDate!.month &&
            e.date.day == _selectedDate!.day).toList();

    return Column(
      children: [
        // Calendar grid
        _MonthCalendar(
          month: _selectedMonth,
          events: widget.events,
          selectedDate: _selectedDate,
          onDateTap: (d) => setState(() => _selectedDate = _selectedDate == d ? null : d),
          onMonthChange: (m) => setState(() { _selectedMonth = m; _selectedDate = null; }),
        ),

        // Legend
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              _Legend(color: const Color(0xFF10B981), label: 'Confirmed'),
              const SizedBox(width: 12),
              _Legend(color: const Color(0xFFF59E0B), label: 'Tentative'),
              const SizedBox(width: 12),
              _Legend(color: const Color(0xFFEF4444), label: 'Blocked'),
              const Spacer(),
              if (_selectedDate != null)
                GestureDetector(
                  onTap: () => setState(() => _selectedDate = null),
                  child: const Text('Show all', style: TextStyle(color: AppColors.brand, fontSize: 12, fontWeight: FontWeight.w500)),
                ),
            ],
          ),
        ),

        // Event list
        Expanded(
          child: eventsOnDay.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.event_available, size: 48, color: AppColors.textMuted.withOpacity(0.5)),
                      const SizedBox(height: 8),
                      Text(
                        _selectedDate != null ? 'No events on this day' : 'No events this month',
                        style: const TextStyle(color: AppColors.textMuted),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: eventsOnDay.length,
                  itemBuilder: (_, i) => _EventCard(event: eventsOnDay[i]),
                ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// MONTH CALENDAR
// ──────────────────────────────────────────────────────────────────────────────

class _MonthCalendar extends StatelessWidget {
  final DateTime month;
  final List<CalendarEvent> events;
  final DateTime? selectedDate;
  final ValueChanged<DateTime> onDateTap;
  final ValueChanged<DateTime> onMonthChange;

  const _MonthCalendar({required this.month, required this.events, required this.selectedDate, required this.onDateTap, required this.onMonthChange});

  static const _weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  static const _months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  List<CalendarEventType> _eventTypesOn(DateTime d) {
    return events
        .where((e) => e.date.year == d.year && e.date.month == d.month && e.date.day == d.day)
        .map((e) => e.type)
        .toSet()
        .toList();
  }

  Color _dotColor(CalendarEventType t) {
    switch (t) {
      case CalendarEventType.confirmed: return const Color(0xFF10B981);
      case CalendarEventType.tentative: return const Color(0xFFF59E0B);
      case CalendarEventType.blocked: return const Color(0xFFEF4444);
    }
  }

  @override
  Widget build(BuildContext context) {
    final firstDay = DateTime(month.year, month.month, 1);
    final daysInMonth = DateTime(month.year, month.month + 1, 0).day;
    final startWeekday = firstDay.weekday; // 1=Mon, 7=Sun

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          // Month header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left, size: 20),
                onPressed: () => onMonthChange(DateTime(month.year, month.month - 1)),
              ),
              Text('${_months[month.month]} ${month.year}',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              IconButton(
                icon: const Icon(Icons.chevron_right, size: 20),
                onPressed: () => onMonthChange(DateTime(month.year, month.month + 1)),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Weekday headers
          Row(
            children: _weekdays.map((d) => Expanded(
              child: Center(child: Text(d, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted))),
            )).toList(),
          ),
          const SizedBox(height: 8),

          // Day grid
          ...List.generate(6, (week) {
            return Row(
              children: List.generate(7, (col) {
                final dayIndex = week * 7 + col + 1 - (startWeekday - 1);
                if (dayIndex < 1 || dayIndex > daysInMonth) {
                  return const Expanded(child: SizedBox(height: 44));
                }

                final date = DateTime(month.year, month.month, dayIndex);
                final types = _eventTypesOn(date);
                final isSelected = selectedDate != null &&
                    selectedDate!.year == date.year &&
                    selectedDate!.month == date.month &&
                    selectedDate!.day == date.day;
                final isToday = DateTime.now().year == date.year &&
                    DateTime.now().month == date.month &&
                    DateTime.now().day == date.day;

                return Expanded(
                  child: GestureDetector(
                    onTap: () => onDateTap(date),
                    child: Container(
                      height: 44,
                      margin: const EdgeInsets.all(1),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.brand.withOpacity(0.1)
                            : isToday
                                ? AppColors.surface
                                : null,
                        borderRadius: BorderRadius.circular(8),
                        border: isSelected ? Border.all(color: AppColors.brand, width: 1.5) : null,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '$dayIndex',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: isToday || isSelected ? FontWeight.w700 : FontWeight.normal,
                              color: isSelected ? AppColors.brand : isToday ? AppColors.brand : AppColors.textPrimary,
                            ),
                          ),
                          if (types.isNotEmpty)
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: types.take(3).map((t) => Container(
                                width: 5, height: 5,
                                margin: const EdgeInsets.only(top: 2, left: 1, right: 1),
                                decoration: BoxDecoration(color: _dotColor(t), shape: BoxShape.circle),
                              )).toList(),
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            );
          }),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// EVENT CARD
// ──────────────────────────────────────────────────────────────────────────────

class _EventCard extends StatelessWidget {
  final CalendarEvent event;
  const _EventCard({required this.event});

  Color get _typeColor {
    switch (event.type) {
      case CalendarEventType.confirmed: return const Color(0xFF10B981);
      case CalendarEventType.tentative: return const Color(0xFFF59E0B);
      case CalendarEventType.blocked: return const Color(0xFFEF4444);
    }
  }

  String get _typeLabel {
    switch (event.type) {
      case CalendarEventType.confirmed: return 'Confirmed';
      case CalendarEventType.tentative: return 'Tentative';
      case CalendarEventType.blocked: return 'Blocked';
    }
  }

  String get _emoji {
    if (event.type == CalendarEventType.blocked) return '🚫';
    if (event.title.contains('Wedding')) return '💒';
    if (event.title.contains('Reception')) return '🎉';
    if (event.title.contains('Sangeet')) return '🎵';
    if (event.title.contains('Engagement')) return '💍';
    return '📅';
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = '${event.date.day}/${event.date.month}/${event.date.year}';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _typeColor.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          // Left: emoji
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: _typeColor.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(child: Text(_emoji, style: const TextStyle(fontSize: 20))),
          ),
          const SizedBox(width: 12),
          // Middle: info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(event.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text('$dateStr · ${event.timeSlot}',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  ],
                ),
                if (event.packageName != null)
                  Text(event.packageName!, style: TextStyle(color: _typeColor, fontSize: 11, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          // Right: status + amount
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: _typeColor.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                child: Text(_typeLabel, style: TextStyle(color: _typeColor, fontSize: 10, fontWeight: FontWeight.w600)),
              ),
              if (event.amountPaise != null) ...[
                const SizedBox(height: 4),
                Text(_formatAmount(event.amountPaise!),
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  final Color color;
  final String label;
  const _Legend({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
      ],
    );
  }
}

String _formatAmount(int paise) {
  final rupees = paise ~/ 100;
  if (rupees >= 100000) return '₹${(rupees / 100000).toStringAsFixed(1)}L';
  if (rupees >= 1000) return '₹${(rupees / 1000).toStringAsFixed(0)}K';
  return '₹$rupees';
}
