import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../models/booking.dart';
import '../../providers/booking_provider.dart';
import '../../shared/widgets/error_state_widget.dart';

class BookingDetailScreen extends ConsumerWidget {
  final String bookingId;
  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingAsync = ref.watch(bookingDetailProvider(bookingId));

    return bookingAsync.when(
      loading: () => const _LoadingView(),
      error: (_, __) => _ErrorView(onRetry: () => ref.refresh(bookingDetailProvider(bookingId))),
      data: (booking) => _BookingDetailView(booking: booking),
    );
  }
}

class _BookingDetailView extends ConsumerWidget {
  final Booking booking;
  const _BookingDetailView({required this.booking});

  String _fmt(int paise) => '₹${NumberFormat('#,##,###').format(paise ~/ 100)}';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final balanceDue = (booking.finalAmountPaise ?? booking.quotedAmountPaise ?? 0) - (booking.advanceAmountPaise ?? 0);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(imageUrl: booking.vendorImage ?? 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80', fit: BoxFit.cover),
                  Container(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Colors.black.withOpacity(0.75)]))),
                  Positioned(
                    bottom: 16,
                    left: 16,
                    right: 60,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(booking.bookingNumber, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 11)),
                        Text(booking.vendorName, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                        Row(
                          children: [
                            Icon(Icons.location_on, color: Colors.white.withOpacity(0.7), size: 13),
                            Text(' ${booking.eventCity} · ${DateFormat('d MMM yyyy').format(booking.eventDate)}', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              IconButton(icon: const Icon(Icons.chat_outlined, color: Colors.white), onPressed: () => context.push('/chat/${booking.vendorId}')),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _StatusCard(status: booking.status),
                const SizedBox(height: 16),
                _PrimaryActions(booking: booking, balanceDue: balanceDue),
                const SizedBox(height: 16),
                if (booking.status == BookingStatus.quoteSent) ...[
                  _QuoteBanner(booking: booking),
                  const SizedBox(height: 16),
                ],
                _EscrowTimeline(current: booking.status),
                const SizedBox(height: 16),
                if (booking.finalAmountPaise != null || booking.quotedAmountPaise != null) ...[
                  _PaymentCard(booking: booking),
                  const SizedBox(height: 16),
                ],
                _EventDetailsCard(booking: booking),
                const SizedBox(height: 16),
                if (booking.events.isNotEmpty) ...[
                  _ActivityLog(events: booking.events),
                  const SizedBox(height: 16),
                ],
                if (booking.status == BookingStatus.completed) ...[
                  _ReviewCta(booking: booking),
                  const SizedBox(height: 16),
                ],
                if (!booking.status.isTerminal) _CancelButton(bookingId: booking.id),
                const SizedBox(height: 32),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _PrimaryActions extends StatelessWidget {
  final Booking booking;
  final int balanceDue;
  const _PrimaryActions({required this.booking, required this.balanceDue});

  @override
  Widget build(BuildContext context) {
    final canPayQuote = booking.status == BookingStatus.quoteSent;
    final canPayBalance = booking.status == BookingStatus.confirmed && balanceDue > 0;

    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => context.push('/chat/${booking.vendorId}'),
            icon: const Icon(Icons.chat_bubble_outline, size: 18),
            label: const Text('Chat Vendor'),
          ),
        ),
        if (canPayQuote || canPayBalance) ...[
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () => context.push('/checkout/${booking.vendorId}?bookingId=${booking.id}&amount=${canPayQuote ? booking.quotedAmountPaise : balanceDue}'),
              icon: const Icon(Icons.payments_outlined, size: 18),
              label: Text(canPayQuote ? 'Pay Advance' : 'Pay Balance'),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.brand, foregroundColor: Colors.white),
            ),
          ),
        ],
      ],
    );
  }
}

class _StatusCard extends StatelessWidget {
  final BookingStatus status;
  const _StatusCard({required this.status});

  @override
  Widget build(BuildContext context) {
    final cfg = _statusConfig[status]!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: cfg.bg, borderRadius: BorderRadius.circular(16), border: Border.all(color: cfg.border)),
      child: Row(
        children: [
          Icon(cfg.icon, color: cfg.color, size: 22),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(status.label, style: TextStyle(color: cfg.color, fontWeight: FontWeight.bold, fontSize: 15)),
              Text(cfg.desc, style: TextStyle(color: cfg.color.withOpacity(0.7), fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusCfg {
  final Color color;
  final Color bg;
  final Color border;
  final IconData icon;
  final String desc;
  const _StatusCfg({required this.color, required this.bg, required this.border, required this.icon, required this.desc});
}

final _statusConfig = {
  BookingStatus.enquiry: _StatusCfg(color: const Color(0xFF2563EB), bg: const Color(0xFFEFF6FF), border: const Color(0xFFBFDBFE), icon: Icons.send_outlined, desc: 'Waiting for vendor response'),
  BookingStatus.quoteSent: _StatusCfg(color: const Color(0xFFD97706), bg: const Color(0xFFFFFBEB), border: const Color(0xFFFDE68A), icon: Icons.request_quote_outlined, desc: 'Review and accept the quote'),
  BookingStatus.quoteAccepted: _StatusCfg(color: const Color(0xFF0D9488), bg: const Color(0xFFF0FDFA), border: const Color(0xFF99F6E4), icon: Icons.check_circle_outline, desc: 'Proceed to pay advance'),
  BookingStatus.advancePaid: _StatusCfg(color: const Color(0xFF7C3AED), bg: const Color(0xFFF5F3FF), border: const Color(0xFFDDD6FE), icon: Icons.lock_outline, desc: 'Advance held in escrow'),
  BookingStatus.confirmed: _StatusCfg(color: const Color(0xFF16A34A), bg: const Color(0xFFF0FDF4), border: const Color(0xFFBBF7D0), icon: Icons.verified_outlined, desc: 'Your booking is confirmed'),
  BookingStatus.inProgress: _StatusCfg(color: const Color(0xFF4F46E5), bg: const Color(0xFFEEF2FF), border: const Color(0xFFC7D2FE), icon: Icons.hourglass_top, desc: 'Event is in progress'),
  BookingStatus.completed: _StatusCfg(color: const Color(0xFF374151), bg: const Color(0xFFF9FAFB), border: const Color(0xFFE5E7EB), icon: Icons.task_alt, desc: 'Service completed successfully'),
  BookingStatus.cancelled: _StatusCfg(color: const Color(0xFFDC2626), bg: const Color(0xFFFEF2F2), border: const Color(0xFFFECACA), icon: Icons.cancel_outlined, desc: 'This booking was cancelled'),
  BookingStatus.disputed: _StatusCfg(color: const Color(0xFFD97706), bg: const Color(0xFFFFFBEB), border: const Color(0xFFFDE68A), icon: Icons.report_outlined, desc: 'Under dispute resolution'),
};

class _QuoteBanner extends StatelessWidget {
  final Booking booking;
  const _QuoteBanner({required this.booking});

  String _fmt(int p) => '₹${NumberFormat('#,##,###').format(p ~/ 100)}';

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFFBBF24))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.notifications_active_outlined, color: Color(0xFFD97706)),
              SizedBox(width: 8),
              Text('Action Required', style: TextStyle(color: Color(0xFFD97706), fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 8),
          Text('Vendor has sent a quote. Review and pay the advance to proceed.', style: TextStyle(color: const Color(0xFF92400E).withOpacity(0.8), fontSize: 13)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Quoted Amount', style: TextStyle(color: Color(0xFF92400E), fontSize: 11)),
                  Text(_fmt(booking.quotedAmountPaise ?? 0), style: const TextStyle(color: Color(0xFF78350F), fontWeight: FontWeight.bold, fontSize: 22)),
                ],
              ),
              ElevatedButton(
                onPressed: () => context.push('/checkout/${booking.vendorId}?bookingId=${booking.id}&amount=${booking.quotedAmountPaise}'),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD97706), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: const Text('Accept & Pay', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EscrowTimeline extends StatelessWidget {
  final BookingStatus current;
  const _EscrowTimeline({required this.current});

  static const _steps = [
    (BookingStatus.enquiry, 'Enquiry Sent', 'You sent an enquiry'),
    (BookingStatus.quoteSent, 'Quote Received', 'Vendor sent a quote'),
    (BookingStatus.quoteAccepted, 'Quote Accepted', 'You accepted the quote'),
    (BookingStatus.advancePaid, 'Advance in Escrow', 'Advance held securely'),
    (BookingStatus.confirmed, 'Booking Confirmed', 'Date locked in'),
    (BookingStatus.inProgress, 'Event Day', 'Service is in progress'),
    (BookingStatus.completed, 'Completed', 'Escrow released'),
  ];

  static const _order = [
    BookingStatus.enquiry,
    BookingStatus.quoteSent,
    BookingStatus.quoteAccepted,
    BookingStatus.advancePaid,
    BookingStatus.confirmed,
    BookingStatus.inProgress,
    BookingStatus.completed,
  ];

  @override
  Widget build(BuildContext context) {
    final currentIndex = _order.indexOf(current).clamp(0, _order.length - 1);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.shield_outlined, color: AppColors.brand, size: 20),
              SizedBox(width: 8),
              Text('Escrow Protection', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          const SizedBox(height: 16),
          ..._steps.asMap().entries.map((entry) {
            final index = entry.key;
            final step = entry.value;
            final done = index < currentIndex;
            final active = index == currentIndex;
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 26,
                      height: 26,
                      decoration: BoxDecoration(
                        color: done ? Colors.green : active ? AppColors.brand : Colors.grey.shade100,
                        shape: BoxShape.circle,
                        border: active ? Border.all(color: AppColors.brand.withOpacity(0.3), width: 3) : null,
                      ),
                      child: Icon(done ? Icons.check : Icons.circle, color: done || active ? Colors.white : Colors.grey.shade300, size: done ? 14 : 8),
                    ),
                    if (index < _steps.length - 1) Container(width: 2, height: 28, color: done ? Colors.green.shade300 : Colors.grey.shade200),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(step.$2, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: done ? Colors.green.shade700 : active ? AppColors.brand : Colors.grey)),
                        Text(step.$3, style: TextStyle(fontSize: 11, color: done || active ? AppColors.textSecondary : Colors.grey.shade400)),
                      ],
                    ),
                  ),
                ),
              ],
            );
          }),
        ],
      ),
    );
  }
}

class _PaymentCard extends StatelessWidget {
  final Booking booking;
  const _PaymentCard({required this.booking});

  String _fmt(int p) => '₹${NumberFormat('#,##,###').format(p ~/ 100)}';

  @override
  Widget build(BuildContext context) {
    final total = booking.finalAmountPaise ?? booking.quotedAmountPaise ?? 0;
    final advance = booking.advanceAmountPaise ?? 0;
    final balance = (total - advance).clamp(0, total);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Payment', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          _Row('Total Amount', _fmt(total)),
          _Row('Advance Paid', _fmt(advance), valueColor: advance > 0 ? Colors.green : AppColors.textMuted),
          const Divider(height: 20),
          _Row('Balance Due', _fmt(balance), valueColor: AppColors.brand, bold: true),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool bold;
  const _Row(this.label, this.value, {this.valueColor, this.bold = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          Text(value, style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.w600, fontSize: 13, color: valueColor)),
        ],
      ),
    );
  }
}

class _EventDetailsCard extends StatelessWidget {
  final Booking booking;
  const _EventDetailsCard({required this.booking});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Event Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          _DetailRow(Icons.calendar_today, 'Date', DateFormat('EEEE, d MMMM yyyy').format(booking.eventDate)),
          _DetailRow(Icons.location_on_outlined, 'City', booking.eventCity),
          _DetailRow(Icons.celebration_outlined, 'Type', booking.eventType),
          if (booking.guestCount != null) _DetailRow(Icons.group_outlined, 'Guests', '~${booking.guestCount}'),
          if (booking.packageName != null) _DetailRow(Icons.inventory_2_outlined, 'Package', booking.packageName!),
          if (booking.requirements != null && booking.requirements!.isNotEmpty) _DetailRow(Icons.notes_outlined, 'Notes', booking.requirements!),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _DetailRow(this.icon, this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppColors.brand),
          const SizedBox(width: 10),
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          const SizedBox(width: 8),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))),
        ],
      ),
    );
  }
}

class _ActivityLog extends StatelessWidget {
  final List<BookingEvent> events;
  const _ActivityLog({required this.events});

  String _title(String eventType) {
    return eventType
        .replaceAll('_', ' ')
        .toLowerCase()
        .split(' ')
        .map((word) => word.isEmpty ? '' : '${word[0].toUpperCase()}${word.substring(1)}')
        .join(' ');
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Activity', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          ...events.reversed.map(
            (event) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Container(width: 32, height: 32, decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.history, color: AppColors.brand, size: 16)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_title(event.eventType), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                        Text(DateFormat('d MMM · h:mm a').format(event.createdAt), style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewCta extends StatelessWidget {
  final Booking booking;
  const _ReviewCta({required this.booking});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFFFFF7ED), Color(0xFFFFFBEB)]), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFFDE68A))),
      child: Column(
        children: [
          const Icon(Icons.star_border_rounded, color: Color(0xFFD97706), size: 32),
          const SizedBox(height: 8),
          const Text('How was your experience?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 4),
          Text('Share your feedback to help other couples.', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => context.push('/reviews/write?vendorId=${booking.vendorId}&bookingId=${booking.id}'),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD97706), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: const Text('Write a Review'),
            ),
          ),
        ],
      ),
    );
  }
}

class _CancelButton extends ConsumerWidget {
  final String bookingId;
  const _CancelButton({required this.bookingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return OutlinedButton.icon(
      onPressed: () => _confirm(context, ref),
      icon: const Icon(Icons.cancel_outlined, color: Colors.red),
      label: const Text('Cancel Booking', style: TextStyle(color: Colors.red)),
      style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.red), minimumSize: const Size(double.infinity, 48), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
    );
  }

  Future<void> _confirm(BuildContext context, WidgetRef ref) async {
    final reasons = ['Change of plans', 'Booked another vendor', 'Budget issue', 'Need more time'];
    String selectedReason = reasons.first;
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Cancel booking?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text('Choose a reason to keep your booking history accurate.', style: TextStyle(color: AppColors.textMuted)),
              const SizedBox(height: 16),
              ...reasons.map((reason) => RadioListTile<String>(value: reason, groupValue: selectedReason, title: Text(reason), onChanged: (value) => setState(() => selectedReason = value ?? selectedReason))),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
                  child: const Text('Confirm Cancellation'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    if (confirmed == true) {
      await ref.read(bookingsProvider.notifier).cancelBooking(bookingId, selectedReason);
      if (context.mounted) context.pop();
    }
  }
}

class _LoadingView extends StatelessWidget {
  const _LoadingView();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}

class _ErrorView extends StatelessWidget {
  final VoidCallback onRetry;
  const _ErrorView({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Scaffold(appBar: AppBar(title: const Text('Booking')), body: ErrorStateWidget(message: 'Could not load booking details.', onRetry: onRetry));
  }
}

extension BookingStatusTerminal on BookingStatus {
  bool get isTerminal => this == BookingStatus.completed || this == BookingStatus.cancelled;
}
