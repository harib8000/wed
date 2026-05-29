import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:table_calendar/table_calendar.dart';

import '../../core/theme.dart';
import '../../models/vendor_analytics.dart';
import '../../providers/vendor_analytics_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';
import '../../shared/widgets/shimmer_state_widget.dart';

class VendorCalendarScreen extends ConsumerStatefulWidget {
  const VendorCalendarScreen({super.key});

  @override
  ConsumerState<VendorCalendarScreen> createState() => _VendorCalendarScreenState();
}

class _VendorCalendarScreenState extends ConsumerState<VendorCalendarScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  final Set<DateTime> _blockedDates = <DateTime>{};

  Future<void> _blockDates() async {
    final pickedRange = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2024, 1, 1),
      lastDate: DateTime(2027, 12, 31),
      helpText: 'Select dates to block',
    );

    if (pickedRange == null || !mounted) {
      return;
    }

    final blocked = <DateTime>{};
    for (
      DateTime day = DateTime(
        pickedRange.start.year,
        pickedRange.start.month,
        pickedRange.start.day,
      );
      !day.isAfter(pickedRange.end);
      day = day.add(const Duration(days: 1))
    ) {
      blocked.add(DateTime(day.year, day.month, day.day));
    }

    setState(() {
      _blockedDates.addAll(blocked);
    });

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            'Blocked ${blocked.length} day${blocked.length == 1 ? '' : 's'} for your calendar.',
          ),
        ),
      );
  }

  List<CalendarEvent> _eventsForDay(List<CalendarEvent> events, DateTime day) {
    final normalized = DateTime(day.year, day.month, day.day);
    final scheduled = events.where(
      (event) =>
          event.date.year == normalized.year &&
          event.date.month == normalized.month &&
          event.date.day == normalized.day,
    );

    final blocked = _blockedDates.contains(normalized)
        ? [
            CalendarEvent(
              id: 'blocked-${normalized.toIso8601String()}',
              title: 'Date blocked',
              customerName: 'Unavailable',
              date: normalized,
              timeSlot: 'Full Day',
              type: CalendarEventType.blocked,
            ),
          ]
        : const <CalendarEvent>[];

    return [...scheduled, ...blocked];
  }

  @override
  Widget build(BuildContext context) {
    final eventsAsync = ref.watch(vendorCalendarProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Availability & Calendar'),
        automaticallyImplyLeading: false,
        actions: [
          TextButton.icon(
            onPressed: _blockDates,
            icon: const Icon(Icons.block, size: 16, color: AppColors.error),
            label: const Text(
              'Block Dates',
              style: TextStyle(color: AppColors.error, fontSize: 12),
            ),
          ),
        ],
      ),
      body: eventsAsync.when(
        loading: () => const ShimmerStateWidget(itemCount: 5, itemHeight: 110),
        error: (error, _) => ErrorStateWidget(
          message: 'Calendar could not load right now. Pull to try again.',
          onRetry: () => ref.refresh(vendorCalendarProvider.future),
        ),
        data: (events) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(vendorCalendarProvider);
            await ref.read(vendorCalendarProvider.future);
          },
          child: _CalendarBody(
            focusedDay: _focusedDay,
            selectedDay: _selectedDay,
            events: events,
            blockedDates: _blockedDates,
            onDaySelected: (selectedDay, focusedDay) {
              setState(() {
                _selectedDay = DateTime(
                  selectedDay.year,
                  selectedDay.month,
                  selectedDay.day,
                );
                _focusedDay = focusedDay;
              });
            },
            onPageChanged: (focusedDay) {
              setState(() => _focusedDay = focusedDay);
            },
            eventsForDay: (day) => _eventsForDay(events, day),
          ),
        ),
      ),
    );
  }
}

class _CalendarBody extends StatelessWidget {
  final DateTime focusedDay;
  final DateTime? selectedDay;
  final List<CalendarEvent> events;
  final Set<DateTime> blockedDates;
  final void Function(DateTime selectedDay, DateTime focusedDay) onDaySelected;
  final ValueChanged<DateTime> onPageChanged;
  final List<CalendarEvent> Function(DateTime day) eventsForDay;

  const _CalendarBody({
    required this.focusedDay,
    required this.selectedDay,
    required this.events,
    required this.blockedDates,
    required this.onDaySelected,
    required this.onPageChanged,
    required this.eventsForDay,
  });

  @override
  Widget build(BuildContext context) {
    final activeDay = selectedDay ?? focusedDay;
    final dayEvents = eventsForDay(activeDay);

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      children: [
        _SummaryHeader(
          monthLabel:
              '${_monthName(focusedDay.month)} ${focusedDay.year}',
          confirmedCount: events.where((e) => e.type == CalendarEventType.confirmed).length,
          tentativeCount: events.where((e) => e.type == CalendarEventType.tentative).length,
          blockedCount: blockedDates.length,
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.border),
          ),
          child: TableCalendar<CalendarEvent>(
            firstDay: DateTime(2024, 1, 1),
            lastDay: DateTime(2027, 12, 31),
            focusedDay: focusedDay,
            selectedDayPredicate: (day) => isSameDay(selectedDay, day),
            eventLoader: eventsForDay,
            onDaySelected: onDaySelected,
            onPageChanged: onPageChanged,
            calendarFormat: CalendarFormat.month,
            headerStyle: const HeaderStyle(
              formatButtonVisible: false,
              titleCentered: true,
            ),
            calendarStyle: CalendarStyle(
              todayDecoration: BoxDecoration(
                color: AppColors.brand.withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              selectedDecoration: const BoxDecoration(
                color: AppColors.brand,
                shape: BoxShape.circle,
              ),
              markerDecoration: const BoxDecoration(
                color: AppColors.brand,
                shape: BoxShape.circle,
              ),
              markersMaxCount: 3,
              outsideTextStyle: const TextStyle(color: AppColors.textMuted),
            ),
          ),
        ),
        const SizedBox(height: 12),
        const Wrap(
          spacing: 12,
          runSpacing: 8,
          children: [
            _LegendChip(color: Color(0xFF10B981), label: 'Confirmed'),
            _LegendChip(color: Color(0xFFF59E0B), label: 'Tentative'),
            _LegendChip(color: Color(0xFFEF4444), label: 'Blocked'),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          'Plans for ${activeDay.day} ${_monthName(activeDay.month)}',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        if (dayEvents.isEmpty)
          const EmptyStateWidget(
            icon: Icons.event_available,
            title: 'No events scheduled',
            message: 'This date is free for new enquiries, walkthroughs, or quick client calls.',
          )
        else
          ...dayEvents.map((event) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _EventCard(event: event),
              )),
      ],
    );
  }
}

class _SummaryHeader extends StatelessWidget {
  final String monthLabel;
  final int confirmedCount;
  final int tentativeCount;
  final int blockedCount;

  const _SummaryHeader({
    required this.monthLabel,
    required this.confirmedCount,
    required this.tentativeCount,
    required this.blockedCount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF065F46), Color(0xFF059669)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            monthLabel,
            style: TextStyle(
              color: Colors.white.withOpacity(0.82),
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Availability snapshot',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _StatPill(label: 'Confirmed', value: '$confirmedCount'),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatPill(label: 'Tentative', value: '$tentativeCount'),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatPill(label: 'Blocked', value: '$blockedCount'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  final String label;
  final String value;

  const _StatPill({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.16),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.86),
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

class _LegendChip extends StatelessWidget {
  final Color color;
  final String label;

  const _LegendChip({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

class _EventCard extends StatelessWidget {
  final CalendarEvent event;

  const _EventCard({required this.event});

  Color get _typeColor {
    switch (event.type) {
      case CalendarEventType.confirmed:
        return const Color(0xFF10B981);
      case CalendarEventType.tentative:
        return const Color(0xFFF59E0B);
      case CalendarEventType.blocked:
        return const Color(0xFFEF4444);
    }
  }

  String get _statusLabel {
    switch (event.type) {
      case CalendarEventType.confirmed:
        return 'Confirmed';
      case CalendarEventType.tentative:
        return 'Tentative';
      case CalendarEventType.blocked:
        return 'Blocked';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _typeColor.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: _typeColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              event.type == CalendarEventType.blocked
                  ? Icons.block
                  : Icons.event_available,
              color: _typeColor,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event.title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${event.customerName} · ${event.timeSlot}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                if (event.packageName != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    event.packageName!,
                    style: TextStyle(
                      color: _typeColor,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                ],
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _typeColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  _statusLabel,
                  style: TextStyle(
                    color: _typeColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              if (event.amountPaise != null) ...[
                const SizedBox(height: 8),
                Text(
                  _formatAmount(event.amountPaise!),
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

String _monthName(int month) {
  const months = [
    '',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return months[month];
}

String _formatAmount(int paise) {
  final rupees = paise ~/ 100;
  if (rupees >= 100000) {
    return '₹${(rupees / 100000).toStringAsFixed(1)}L';
  }
  if (rupees >= 1000) {
    return '₹${(rupees / 1000).toStringAsFixed(0)}K';
  }
  return '₹$rupees';
}
