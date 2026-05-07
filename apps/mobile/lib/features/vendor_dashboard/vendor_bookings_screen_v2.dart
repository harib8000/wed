import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';

class VendorBookingsScreen extends ConsumerWidget {
  const VendorBookingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          title: const Text('Bookings'),
          automaticallyImplyLeading: false,
          actions: [
            IconButton(icon: const Icon(Icons.search), onPressed: () {}),
            IconButton(icon: const Icon(Icons.filter_list), onPressed: () {}),
          ],
          bottom: TabBar(
            isScrollable: true,
            indicatorWeight: 3,
            indicatorSize: TabBarIndicatorSize.label,
            tabs: [
              _TabWithBadge(label: 'New', count: 3, color: const Color(0xFFF97316)),
              _TabWithBadge(label: 'Confirmed', count: 5, color: const Color(0xFF10B981)),
              _TabWithBadge(label: 'Upcoming', count: 2, color: const Color(0xFF3B82F6)),
              _TabWithBadge(label: 'Completed', count: 18, color: AppColors.brand),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _BookingList(bookings: _newBookings, showActions: true),
            _BookingList(bookings: _confirmedBookings),
            _BookingList(bookings: _upcomingBookings),
            _BookingList(bookings: _completedBookings),
          ],
        ),
      ),
    );
  }
}

class _TabWithBadge extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  const _TabWithBadge({required this.label, required this.count, required this.color});

  @override
  Widget build(BuildContext context) {
    return Tab(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label),
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
            decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
            child: Text('$count', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
          ),
        ],
      ),
    );
  }
}

class _BookingList extends StatelessWidget {
  final List<_BookingData> bookings;
  final bool showActions;
  const _BookingList({required this.bookings, this.showActions = false});

  @override
  Widget build(BuildContext context) {
    if (bookings.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox_outlined, size: 48, color: AppColors.textMuted),
            SizedBox(height: 12),
            Text('No bookings here', style: TextStyle(color: AppColors.textMuted)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: bookings.length,
      itemBuilder: (context, i) => _BookingCard(data: bookings[i], showActions: showActions),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final _BookingData data;
  final bool showActions;
  const _BookingCard({required this.data, this.showActions = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
            child: Row(
              children: [
                // Customer avatar
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [data.statusColor.withOpacity(0.2), data.statusColor.withOpacity(0.05)]),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(data.emoji, style: const TextStyle(fontSize: 20)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(data.customerName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                      Text(data.eventType, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: data.statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(data.status,
                      style: TextStyle(color: data.statusColor, fontSize: 10, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),

          // Details
          Container(
            margin: const EdgeInsets.fromLTRB(14, 0, 14, 0),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                _InfoChip(icon: Icons.calendar_today, text: data.date),
                const SizedBox(width: 14),
                _InfoChip(icon: Icons.people_outline, text: '${data.guests} pax'),
                const Spacer(),
                Text('₹${data.amount}',
                    style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.brand, fontSize: 15)),
              ],
            ),
          ),

          if (data.package != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 6, 14, 0),
              child: Row(
                children: [
                  Container(
                    width: 3, height: 14,
                    decoration: BoxDecoration(color: data.statusColor, borderRadius: BorderRadius.circular(2)),
                  ),
                  const SizedBox(width: 6),
                  Text(data.package!, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),

          // Timeline indicator
          if (data.daysUntil != null)
            Container(
              margin: const EdgeInsets.fromLTRB(14, 8, 14, 0),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: data.statusColor.withOpacity(0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.schedule, size: 14, color: data.statusColor),
                  const SizedBox(width: 6),
                  Text(data.daysUntil!, style: TextStyle(fontSize: 11, color: data.statusColor, fontWeight: FontWeight.w500)),
                ],
              ),
            ),

          // Actions
          if (showActions)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.close, size: 16),
                      label: const Text('Decline'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFEF4444),
                        side: const BorderSide(color: Color(0xFFEF4444)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.check, size: 16),
                      label: const Text('Accept'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),
            )
          else
            const SizedBox(height: 14),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoChip({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: AppColors.textMuted),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
      ],
    );
  }
}

// ─── Mock Data ──────────────────────────────────────────────────────────

class _BookingData {
  final String customerName, eventType, date, amount, status, emoji;
  final int guests;
  final Color statusColor;
  final String? package, daysUntil;

  const _BookingData({
    required this.customerName, required this.eventType, required this.date,
    required this.guests, required this.amount, required this.status,
    required this.statusColor, required this.emoji,
    this.package, this.daysUntil,
  });
}

const _newBookings = [
  _BookingData(
    customerName: 'Sneha & Karthik', eventType: 'Wedding Reception',
    date: '20 Feb 2025', guests: 500, amount: '3,50,000',
    status: 'New', statusColor: Color(0xFFF97316), emoji: '💒',
    package: 'Grand Package', daysUntil: 'Event in 18 days',
  ),
  _BookingData(
    customerName: 'Meera & Arjun', eventType: 'Engagement Ceremony',
    date: '15 Mar 2025', guests: 200, amount: '1,25,000',
    status: 'New', statusColor: Color(0xFFF97316), emoji: '💍',
    daysUntil: 'Event in 41 days',
  ),
  _BookingData(
    customerName: 'Anjali & Vikram', eventType: 'Mehendi + Sangeet',
    date: '28 Feb 2025', guests: 150, amount: '85,000',
    status: 'Awaiting', statusColor: Color(0xFFF59E0B), emoji: '🎵',
    daysUntil: 'Event in 26 days',
  ),
];

const _confirmedBookings = [
  _BookingData(
    customerName: 'Divya & Pranav', eventType: 'Grand Wedding',
    date: '10 Apr 2025', guests: 800, amount: '5,00,000',
    status: 'Confirmed', statusColor: Color(0xFF10B981), emoji: '💒',
    package: 'Royal Package', daysUntil: 'Event in 67 days',
  ),
  _BookingData(
    customerName: 'Priya & Rohit', eventType: 'Reception Party',
    date: '25 Apr 2025', guests: 400, amount: '2,75,000',
    status: 'Confirmed', statusColor: Color(0xFF10B981), emoji: '🎉',
    package: 'Premium Package', daysUntil: 'Event in 82 days',
  ),
  _BookingData(
    customerName: 'Kavya & Suresh', eventType: 'Wedding + Reception',
    date: '1 May 2025', guests: 1000, amount: '8,50,000',
    status: 'Confirmed', statusColor: Color(0xFF10B981), emoji: '💒',
    package: 'Royal Package', daysUntil: 'Event in 88 days',
  ),
  _BookingData(
    customerName: 'Lakshmi & Arun', eventType: 'Wedding',
    date: '15 May 2025', guests: 600, amount: '4,00,000',
    status: 'Escrow Paid', statusColor: Color(0xFF0D9488), emoji: '💒',
    package: 'Grand Package',
  ),
  _BookingData(
    customerName: 'Radha & Kishore', eventType: 'Sangeet Night',
    date: '20 May 2025', guests: 300, amount: '1,50,000',
    status: 'Confirmed', statusColor: Color(0xFF10B981), emoji: '🎵',
  ),
];

const _upcomingBookings = [
  _BookingData(
    customerName: 'Nithya & Ravi', eventType: 'Wedding',
    date: '5 Feb 2025', guests: 700, amount: '4,50,000',
    status: 'In 3 days', statusColor: Color(0xFFEF4444), emoji: '💒',
    package: 'Royal Package', daysUntil: 'Checklist: 3 items pending',
  ),
  _BookingData(
    customerName: 'Swathi & Ganesh', eventType: 'Reception',
    date: '8 Feb 2025', guests: 350, amount: '2,00,000',
    status: 'In 6 days', statusColor: Color(0xFFF97316), emoji: '🎉',
    package: 'Premium Package', daysUntil: 'All preparations done ✓',
  ),
];

const _completedBookings = [
  _BookingData(
    customerName: 'Harini & Vishnu', eventType: 'Wedding',
    date: '15 Jan 2025', guests: 500, amount: '3,75,000',
    status: '★ 4.9', statusColor: Color(0xFFF59E0B), emoji: '💒',
    package: 'Grand Package',
  ),
  _BookingData(
    customerName: 'Sowmya & Deepak', eventType: 'Reception',
    date: '10 Jan 2025', guests: 400, amount: '2,50,000',
    status: '★ 5.0', statusColor: Color(0xFFF59E0B), emoji: '🎉',
    package: 'Premium Package',
  ),
];
