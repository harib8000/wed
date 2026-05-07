import 'package:flutter/material.dart';
import '../../core/theme.dart';

class _Booking {
  final String id, vendorName, category, date, status, amount, image;
  const _Booking({required this.id, required this.vendorName, required this.category, required this.date, required this.status, required this.amount, required this.image});
}

const _bookings = [
  _Booking(id: 'b1', vendorName: 'Royal Grand Palace', category: 'Venue', date: 'Mar 15, 2025', status: 'Confirmed', amount: '₹5,00,000', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=200&q=80'),
  _Booking(id: 'b2', vendorName: 'Srikanth Photography', category: 'Photography', date: 'Mar 15, 2025', status: 'Pending', amount: '₹1,20,000', image: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=200&q=80'),
  _Booking(id: 'b3', vendorName: 'Flavours Catering', category: 'Catering', date: 'Mar 15, 2025', status: 'In Progress', amount: '₹2,40,000', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=200&q=80'),
  _Booking(id: 'b4', vendorName: 'Blooms & Dreams', category: 'Decor', date: 'Mar 14, 2025', status: 'Completed', amount: '₹1,50,000', image: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=200&q=80'),
];

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<_Booking> _filterBookings(String status) {
    if (status == 'All') return _bookings;
    return _bookings.where((b) => b.status == status).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Bookings'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppColors.brand,
          unselectedLabelColor: AppColors.textMuted,
          indicatorColor: AppColors.brand,
          indicatorSize: TabBarIndicatorSize.label,
          tabs: const [Tab(text: 'All'), Tab(text: 'Confirmed'), Tab(text: 'Pending'), Tab(text: 'Completed')],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _BookingsList(bookings: _filterBookings('All')),
          _BookingsList(bookings: _filterBookings('Confirmed')),
          _BookingsList(bookings: _filterBookings('Pending')),
          _BookingsList(bookings: _filterBookings('Completed')),
        ],
      ),
    );
  }
}

class _BookingsList extends StatelessWidget {
  final List<_Booking> bookings;
  const _BookingsList({required this.bookings});

  @override
  Widget build(BuildContext context) {
    if (bookings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_busy, size: 64, color: AppColors.border),
            const SizedBox(height: 16),
            Text('No bookings yet', style: TextStyle(color: AppColors.textMuted, fontSize: 16)),
            const SizedBox(height: 8),
            Text('Start exploring vendors to make your first booking', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: bookings.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, i) => _BookingCard(booking: bookings[i]),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final _Booking booking;
  const _BookingCard({required this.booking});

  Color _statusColor(String status) {
    switch (status) {
      case 'Confirmed': return Colors.green;
      case 'Pending': return Colors.orange;
      case 'In Progress': return Colors.blue;
      case 'Completed': return Colors.grey;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor(booking.status);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 0.5),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(booking.image, width: 64, height: 64, fit: BoxFit.cover),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(booking.vendorName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(6)),
                            child: Text(booking.category, style: TextStyle(color: AppColors.brand, fontSize: 10, fontWeight: FontWeight.w500)),
                          ),
                          const SizedBox(width: 8),
                          Icon(Icons.calendar_today, size: 12, color: AppColors.textMuted),
                          const SizedBox(width: 4),
                          Text(booking.date, style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(width: 8, height: 8, decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle)),
                    const SizedBox(width: 6),
                    Text(booking.status, style: TextStyle(color: statusColor, fontWeight: FontWeight.w600, fontSize: 12)),
                  ],
                ),
                Text(booking.amount, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
