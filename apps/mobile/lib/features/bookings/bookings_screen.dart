import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme.dart';
import '../../models/booking.dart';
import '../../providers/booking_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';

class BookingsScreen extends ConsumerStatefulWidget {
  const BookingsScreen({super.key});

  @override
  ConsumerState<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends ConsumerState<BookingsScreen> with SingleTickerProviderStateMixin {
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
        loading: () => const _BookingsLoadingView(),
        error: (error, _) => ErrorStateWidget(
          message: 'Could not load your bookings.',
          onRetry: () => ref.read(bookingsProvider.notifier).load(),
        ),
        data: (bookings) => TabBarView(
          controller: _tabController,
          children: [
            _BookingsList(bookings: bookings),
            _BookingsList(bookings: bookings.where((booking) => booking.status.isActive).toList()),
            _BookingsList(bookings: bookings.where((booking) => booking.status.isPending).toList()),
            _BookingsList(bookings: bookings.where((booking) => booking.status == BookingStatus.completed || booking.status == BookingStatus.cancelled).toList()),
          ],
        ),
      ),
    );
  }
}

class _BookingsList extends ConsumerWidget {
  final List<Booking> bookings;
  const _BookingsList({required this.bookings});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (bookings.isEmpty) {
      return EmptyStateWidget(
        icon: Icons.event_busy,
        title: 'No bookings here',
        message: 'Explore vendors and send an enquiry to start planning your big day.',
        actionLabel: 'Browse Vendors',
        onAction: () => context.go('/vendors'),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(bookingsProvider.notifier).load(),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: bookings.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) => _BookingCard(booking: bookings[index]),
      ),
    );
  }
}

class _BookingCard extends ConsumerWidget {
  final Booking booking;
  const _BookingCard({required this.booking});

  static const _statusColors = {
    BookingStatus.enquiry: Color(0xFF2563EB),
    BookingStatus.quoteSent: Color(0xFFD97706),
    BookingStatus.quoteAccepted: Color(0xFF0D9488),
    BookingStatus.advancePaid: Color(0xFF7C3AED),
    BookingStatus.confirmed: Color(0xFF16A34A),
    BookingStatus.inProgress: Color(0xFF4F46E5),
    BookingStatus.completed: Color(0xFF374151),
    BookingStatus.cancelled: Color(0xFFDC2626),
    BookingStatus.disputed: Color(0xFFD97706),
  };

  String _fmt(int paise) => '₹${NumberFormat('#,##,###').format(paise ~/ 100)}';

  int _progressIndex(BookingStatus status) {
    const order = [
      BookingStatus.enquiry,
      BookingStatus.quoteSent,
      BookingStatus.quoteAccepted,
      BookingStatus.advancePaid,
      BookingStatus.confirmed,
      BookingStatus.inProgress,
      BookingStatus.completed,
    ];
    return order.indexOf(status).clamp(0, order.length - 1);
  }

  Future<bool?> _confirmCancel(BuildContext context, WidgetRef ref) async {
    final reasonController = TextEditingController();
    final result = await showModalBottomSheet<bool>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Padding(
        padding: EdgeInsets.fromLTRB(16, 8, 16, MediaQuery.of(context).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Cancel booking?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text('Share a quick reason so the vendor and support team can help if needed.', style: TextStyle(color: AppColors.textMuted)),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(hintText: 'Reason for cancellation'),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: const Text('Keep Booking'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      await ref.read(bookingsProvider.notifier).cancelBooking(booking.id, reasonController.text.trim().isEmpty ? 'Customer cancelled' : reasonController.text.trim());
                      if (context.mounted) Navigator.pop(context, true);
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
                    child: const Text('Cancel Booking'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
    reasonController.dispose();
    return result;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusColor = _statusColors[booking.status] ?? AppColors.textMuted;
    final progress = _progressIndex(booking.status) / 6;
    final canCancel = booking.status != BookingStatus.completed && booking.status != BookingStatus.cancelled;
    final canRebook = booking.status == BookingStatus.completed || booking.status == BookingStatus.cancelled;

    return Dismissible(
      key: ValueKey(booking.id),
      direction: canCancel ? DismissDirection.endToStart : DismissDirection.none,
      confirmDismiss: (_) => _confirmCancel(context, ref),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(color: AppColors.error, borderRadius: BorderRadius.circular(16)),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.cancel_outlined, color: Colors.white),
            SizedBox(height: 4),
            Text('Cancel', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
      child: GestureDetector(
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
                        width: 72,
                        height: 72,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(booking.vendorName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(6)),
                                child: Text(booking.vendorCategory, style: const TextStyle(color: AppColors.brand, fontSize: 10, fontWeight: FontWeight.w600)),
                              ),
                              const SizedBox(width: 8),
                              const Icon(Icons.calendar_today, size: 12, color: AppColors.textMuted),
                              const SizedBox(width: 4),
                              Text(DateFormat('d MMM yyyy').format(booking.eventDate), style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                            ],
                          ),
                          if (booking.packageName != null) ...[
                            const SizedBox(height: 4),
                            Text(booking.packageName!, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                          ],
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(value: progress, minHeight: 6, backgroundColor: Colors.grey.shade200, color: statusColor),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.chevron_right, color: AppColors.textMuted),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                decoration: const BoxDecoration(color: Color(0xFFF9FAFB), borderRadius: BorderRadius.vertical(bottom: Radius.circular(16))),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(width: 8, height: 8, decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle)),
                            const SizedBox(width: 6),
                            Text(booking.status.label, style: TextStyle(color: statusColor, fontWeight: FontWeight.w700, fontSize: 12)),
                          ],
                        ),
                        if (booking.quotedAmountPaise != null)
                          Text(_fmt(booking.quotedAmountPaise!), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => context.push('/chat/${booking.vendorId}'),
                            icon: const Icon(Icons.chat_bubble_outline, size: 16),
                            label: const Text('Chat'),
                          ),
                        ),
                        if (canRebook) ...[
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () => context.push('/checkout/${booking.vendorId}'),
                              icon: const Icon(Icons.refresh, size: 16),
                              label: const Text('Re-book'),
                              style: ElevatedButton.styleFrom(backgroundColor: AppColors.brand, foregroundColor: Colors.white),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BookingsLoadingView extends StatelessWidget {
  const _BookingsLoadingView();

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) => Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.grey.shade100,
        child: Container(
          height: 170,
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }
}
