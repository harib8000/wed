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
          title: const Text('My Bookings'),
          automaticallyImplyLeading: false,
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'New (3)'),
              Tab(text: 'Confirmed (5)'),
              Tab(text: 'Upcoming (2)'),
              Tab(text: 'Completed (18)'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _BookingList(bookings: _newEnquiries),
            _BookingList(bookings: _confirmedBookings),
            _BookingList(bookings: _upcomingBookings),
            _BookingList(bookings: _completedBookings),
          ],
        ),
      ),
    );
  }
}

class _BookingList extends StatelessWidget {
  final List<_BookingData> bookings;
  const _BookingList({required this.bookings});

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
      itemBuilder: (context, i) => _VendorBookingCard(data: bookings[i]),
    );
  }
}

class _VendorBookingCard extends StatelessWidget {
  final _BookingData data;
  const _VendorBookingCard({required this.data});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.brand.withOpacity(0.1),
                child: Text(data.customerName[0],
                    style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(data.customerName,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                    Text(data.eventType,
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
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
                    style: TextStyle(color: data.statusColor, fontSize: 11, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                _DetailChip(icon: Icons.calendar_today, text: data.date),
                const SizedBox(width: 16),
                _DetailChip(icon: Icons.people_outline, text: '${data.guests} guests'),
                const Spacer(),
                Text('₹${data.amount}',
                    style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.brand, fontSize: 15)),
              ],
            ),
          ),
          if (data.package != null) ...[
            const SizedBox(height: 8),
            Text('Package: ${data.package}',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          ],
          if (data.showActions) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {},
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      side: const BorderSide(color: Colors.red),
                    ),
                    child: const Text('Decline'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {},
                    child: const Text('Accept'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _DetailChip extends StatelessWidget {
  final IconData icon;
  final String text;
  const _DetailChip({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textMuted),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
      ],
    );
  }
}

// ─── Mock Data ──────────────────────────────────────────────────────────

class _BookingData {
  final String customerName;
  final String eventType;
  final String date;
  final int guests;
  final String amount;
  final String status;
  final Color statusColor;
  final String? package;
  final bool showActions;

  const _BookingData({
    required this.customerName,
    required this.eventType,
    required this.date,
    required this.guests,
    required this.amount,
    required this.status,
    required this.statusColor,
    this.package,
    this.showActions = false,
  });
}

final _newEnquiries = [
  const _BookingData(
    customerName: 'Sneha & Karthik',
    eventType: 'Wedding Reception',
    date: '20 Feb 2025',
    guests: 500,
    amount: '3,50,000',
    status: 'New',
    statusColor: Colors.orange,
    package: 'Grand Package',
    showActions: true,
  ),
  const _BookingData(
    customerName: 'Meera & Arjun',
    eventType: 'Engagement',
    date: '15 Mar 2025',
    guests: 200,
    amount: '1,25,000',
    status: 'New',
    statusColor: Colors.orange,
    showActions: true,
  ),
  const _BookingData(
    customerName: 'Anjali & Vikram',
    eventType: 'Mehendi + Sangeet',
    date: '28 Feb 2025',
    guests: 150,
    amount: '85,000',
    status: 'Awaiting Quote',
    statusColor: Colors.amber,
    showActions: true,
  ),
];

final _confirmedBookings = [
  const _BookingData(
    customerName: 'Divya & Pranav',
    eventType: 'Wedding',
    date: '10 Apr 2025',
    guests: 800,
    amount: '5,00,000',
    status: 'Confirmed',
    statusColor: Colors.green,
    package: 'Royal Package',
  ),
  const _BookingData(
    customerName: 'Priya & Rohit',
    eventType: 'Reception',
    date: '25 Apr 2025',
    guests: 400,
    amount: '2,75,000',
    status: 'Confirmed',
    statusColor: Colors.green,
    package: 'Premium Package',
  ),
  const _BookingData(
    customerName: 'Kavya & Suresh',
    eventType: 'Wedding + Reception',
    date: '1 May 2025',
    guests: 1000,
    amount: '8,50,000',
    status: 'Confirmed',
    statusColor: Colors.green,
    package: 'Royal Package',
  ),
  const _BookingData(
    customerName: 'Lakshmi & Arun',
    eventType: 'Wedding',
    date: '15 May 2025',
    guests: 600,
    amount: '4,00,000',
    status: 'Escrow Paid',
    statusColor: Colors.teal,
    package: 'Grand Package',
  ),
  const _BookingData(
    customerName: 'Radha & Kishore',
    eventType: 'Sangeet Night',
    date: '20 May 2025',
    guests: 300,
    amount: '1,50,000',
    status: 'Confirmed',
    statusColor: Colors.green,
  ),
];

final _upcomingBookings = [
  const _BookingData(
    customerName: 'Nithya & Ravi',
    eventType: 'Wedding',
    date: '5 Feb 2025',
    guests: 700,
    amount: '4,50,000',
    status: 'In 3 days',
    statusColor: AppColors.brand,
    package: 'Royal Package',
  ),
  const _BookingData(
    customerName: 'Swathi & Ganesh',
    eventType: 'Reception',
    date: '8 Feb 2025',
    guests: 350,
    amount: '2,00,000',
    status: 'In 6 days',
    statusColor: AppColors.brand,
    package: 'Premium Package',
  ),
];

final _completedBookings = [
  const _BookingData(
    customerName: 'Harini & Vishnu',
    eventType: 'Wedding',
    date: '15 Jan 2025',
    guests: 500,
    amount: '3,75,000',
    status: '★ 4.9',
    statusColor: AppColors.gold,
    package: 'Grand Package',
  ),
  const _BookingData(
    customerName: 'Sowmya & Deepak',
    eventType: 'Reception',
    date: '10 Jan 2025',
    guests: 400,
    amount: '2,50,000',
    status: '★ 5.0',
    statusColor: AppColors.gold,
    package: 'Premium Package',
  ),
];
