import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../models/booking.dart';
import '../../providers/booking_provider.dart';

// ─── Bookings Screen ────────────────────────────────────────
class BookingsScreen extends ConsumerStatefulWidget {
  const BookingsScreen({super.key});

  @override
  ConsumerState<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends ConsumerState<BookingsScreen>
    with SingleTickerProviderStateMixin {
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

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(bookingsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Bookings'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined),
            onPressed: () => ref.read(bookingsProvider.notifier).load(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppColors.brand,
          unselectedLabelColor: AppColors.textMuted,
          indicatorColor: AppColors.brand,
          indicatorSize: TabBarIndicatorSize.label,
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Active'),
            Tab(text: 'Pending'),
            Tab(text: 'Completed'),
          ],
        ),
      ),
      body: bookingsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.textMuted),
            const SizedBox(height: 12),
            Text('$e', textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted)),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => ref.read(bookingsProvider.notifier).load(),
              child: const Text('Retry'),
            ),
          ]),
        ),
        data: (bookings) => TabBarView(
          controller: _tabController,
          children: [
            _BookingsList(bookings: bookings),
            _BookingsList(bookings: bookings.where((b) => b.status.isActive).toList()),
            _BookingsList(bookings: bookings.where((b) => b.status.isPending).toList()),
            _BookingsList(bookings: bookings.where((b) => b.status == BookingStatus.completed).toList()),
          ],
        ),
      ),
    );
  }
}

// ─── Bookings List ──────────────────────────────────────────
class _BookingsList extends StatelessWidget {
  final List<Booking> bookings;
  const _BookingsList({required this.bookings});

  @override
  Widget build(BuildContext context) {
    if (bookings.isEmpty) {
      return Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.event_busy, size: 64, color: AppColors.border),
          const SizedBox(height: 16),
          const Text('No bookings here',
              style: TextStyle(color: AppColors.textMuted, fontSize: 16)),
          const SizedBox(height: 8),
          const Text('Explore vendors to plan your dream wedding',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () => context.go('/vendors'),
            icon: const Icon(Icons.explore_outlined),
            label: const Text('Browse Vendors'),
          ),
        ]),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {},
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: bookings.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, i) => _BookingCard(booking: bookings[i]),
      ),
    );
  }
}

// ─── Booking Card ───────────────────────────────────────────
class _BookingCard extends StatelessWidget {
  final Booking booking;
  const _BookingCard({required this.booking});

  static const _statusColors = {
    BookingStatus.enquiry:       Color(0xFF2563EB),
    BookingStatus.quoteSent:     Color(0xFFD97706),
    BookingStatus.quoteAccepted: Color(0xFF0D9488),
    BookingStatus.advancePaid:   Color(0xFF7C3AED),
    BookingStatus.confirmed:     Color(0xFF16A34A),
    BookingStatus.inProgress:    Color(0xFF4F46E5),
    BookingStatus.completed:     Color(0xFF374151),
    BookingStatus.cancelled:     Color(0xFFDC2626),
    BookingStatus.disputed:      Color(0xFFD97706),
  };

  String _fmt(int paise) =>
      '₹${NumberFormat('#,##,###').format(paise ~/ 100)}';

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColors[booking.status] ?? AppColors.textMuted;

    return GestureDetector(
      onTap: () => context.push('/bookings/${booking.id}'),
      child: Container(
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
                    child: CachedNetworkImage(
                      imageUrl: booking.vendorImage ?? 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=200&q=80',
                      width: 64, height: 64, fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(booking.vendorName,
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                        const SizedBox(height: 4),
                        Row(children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(6)),
                            child: Text(booking.vendorCategory,
                                style: const TextStyle(color: AppColors.brand, fontSize: 10, fontWeight: FontWeight.w500)),
                          ),
                          const SizedBox(width: 8),
                          const Icon(Icons.calendar_today, size: 12, color: AppColors.textMuted),
                          const SizedBox(width: 4),
                          Text(DateFormat('d MMM yyyy').format(booking.eventDate),
                              style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        ]),
                        if (booking.packageName != null) ...[
                          const SizedBox(height: 3),
                          Text(booking.packageName!,
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                        ],
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: AppColors.textMuted),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: const BoxDecoration(
                color: Color(0xFFF9FAFB),
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(children: [
                    Container(width: 8, height: 8, decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle)),
                    const SizedBox(width: 6),
                    Text(booking.status.label,
                        style: TextStyle(color: statusColor, fontWeight: FontWeight.w600, fontSize: 12)),
                  ]),
                  if (booking.quotedAmountPaise != null)
                    Text(_fmt(booking.quotedAmountPaise!),
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
