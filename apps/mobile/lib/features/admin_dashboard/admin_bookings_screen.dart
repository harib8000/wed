import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../models/admin.dart';
import '../../providers/admin_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';
import '../../shared/widgets/shimmer_state_widget.dart';
class AdminBookingsScreen extends ConsumerWidget {
  const AdminBookingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(adminBookingsProvider);
    final filter = ref.watch(adminBookingsFilterProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Bookings'),
        backgroundColor: AppColors.admin,
        foregroundColor: Colors.white,
        titleTextStyle: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () => ref.invalidate(adminBookingsProvider),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: _StatusFilterRow(
              selected: filter.status,
              onSelected: (status) => ref
                  .read(adminBookingsFilterProvider.notifier)
                  .state = AdminBookingsFilter(status: status),
            ),
          ),
        ),
      ),
      body: bookingsAsync.when(
        loading: () => const ShimmerStateWidget(itemCount: 5, itemHeight: 104),
        error: (e, _) => ErrorStateWidget(
          message: 'Failed to load bookings.',
          onRetry: () => ref.invalidate(adminBookingsProvider),
        ),
        data: (bookings) {
          if (bookings.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.book_outlined,
              title: 'No Bookings',
              message: 'No bookings match the current filter.',
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: bookings.length,
            itemBuilder: (ctx, i) => _BookingTile(booking: bookings[i]),
          );
        },
      ),
    );
  }
}

class _StatusFilterRow extends StatelessWidget {
  final String? selected;
  final ValueChanged<String?> onSelected;
  const _StatusFilterRow({required this.selected, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    const statuses = ['ENQUIRY', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _FilterChip(label: 'All', selected: selected == null, onTap: () => onSelected(null)),
          ...statuses.map((s) => Padding(
                padding: const EdgeInsets.only(left: 8),
                child: _FilterChip(
                  label: s[0] + s.substring(1).toLowerCase(),
                  selected: selected == s,
                  onTap: () => onSelected(s),
                ),
              )),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: selected ? AppColors.admin : Colors.white,
          ),
        ),
      ),
    );
  }
}

class _BookingTile extends StatelessWidget {
  final AdminBooking booking;
  const _BookingTile({required this.booking});

  Color get _statusColor {
    switch (booking.status) {
      case 'CONFIRMED':
      case 'ADVANCE_PAID':
      case 'CHECKIN':
        return AppColors.success;
      case 'COMPLETED':
        return AppColors.coordinator;
      case 'CANCELLED_BY_CUSTOMER':
      case 'CANCELLED_BY_VENDOR':
        return AppColors.error;
      default:
        return AppColors.gold;
    }
  }

  String _rupees(int paise) {
    final val = paise ~/ 100;
    return '₹${NumberFormat('#,##,###').format(val)}';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(booking.bookingNumber,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13,
                          color: AppColors.textSecondary)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: _statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(booking.status,
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _statusColor)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.person_outline, size: 13, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(booking.customerName,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                const Text(' → ', style: TextStyle(color: AppColors.textMuted)),
                Expanded(
                  child: Text(booking.vendorName,
                      style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.event, size: 12, color: AppColors.textMuted),
                const SizedBox(width: 4),
                Text(booking.eventType, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                const SizedBox(width: 8),
                const Icon(Icons.currency_rupee, size: 12, color: AppColors.textMuted),
                Text(_rupees(booking.amountPaise),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
