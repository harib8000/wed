import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../models/booking.dart';
import '../../providers/booking_provider.dart';

class BookingDetailScreen extends ConsumerWidget {
  final String bookingId;
  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingAsync = ref.watch(bookingDetailProvider(bookingId));

    return bookingAsync.when(
      loading: () => const _LoadingView(),
      error: (e, _) => _ErrorView(onRetry: () => ref.refresh(bookingDetailProvider(bookingId))),
      data: (booking) => _BookingDetailView(booking: booking, ref: ref),
    );
  }
}

// ─── Main View ─────────────────────────────────────────────
class _BookingDetailView extends StatelessWidget {
  final Booking booking;
  final WidgetRef ref;
  const _BookingDetailView({required this.booking, required this.ref});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Hero App Bar
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(imageUrl: booking.vendorImage ?? 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80', fit: BoxFit.cover),
                  Container(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Colors.black.withOpacity(0.75)]))),
                  Positioned(bottom: 16, left: 16, right: 60, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(booking.bookingNumber, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 11)),
                    Text(booking.vendorName, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                    Row(children: [
                      Icon(Icons.location_on, color: Colors.white.withOpacity(0.7), size: 13),
                      Text(' ${booking.eventCity} · ${DateFormat('d MMM yyyy').format(booking.eventDate)}', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                    ]),
                  ])),
                ],
              ),
            ),
            actions: [
              IconButton(icon: const Icon(Icons.chat_outlined, color: Colors.white), onPressed: () => context.push('/chat/${booking.vendorId}')),
            ],
          ),

          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(delegate: SliverChildListDelegate([
              // Status Card
              _StatusCard(status: booking.status),
              const SizedBox(height: 16),

              // Action banner for quote
              if (booking.status == BookingStatus.quoteSent) ...[
                _QuoteBanner(booking: booking),
                const SizedBox(height: 16),
              ],

              // Escrow Timeline
              if (!booking.status.isTerminal) ...[
                _EscrowTimeline(current: booking.status),
                const SizedBox(height: 16),
              ],

              // Payment Summary
              if (booking.finalAmountPaise != null) ...[
                _PaymentCard(booking: booking),
                const SizedBox(height: 16),
              ],

              // Event Details
              _EventDetailsCard(booking: booking),
              const SizedBox(height: 16),

              // Activity Log
              if (booking.events.isNotEmpty) ...[
                _ActivityLog(events: booking.events),
                const SizedBox(height: 16),
              ],

              // Write review (completed)
              if (booking.status == BookingStatus.completed) ...[
                _ReviewCta(booking: booking),
                const SizedBox(height: 16),
              ],

              // Cancel button
              if (!booking.status.isTerminal)
                _CancelButton(bookingId: booking.id, ref: ref),

              const SizedBox(height: 32),
            ])),
          ),
        ],
      ),
    );
  }
}

// ─── Status Card ───────────────────────────────────────────
class _StatusCard extends StatelessWidget {
  final BookingStatus status;
  const _StatusCard({required this.status});

  @override
  Widget build(BuildContext context) {
    final cfg = _statusConfig[status]!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: cfg.bg, borderRadius: BorderRadius.circular(16), border: Border.all(color: cfg.border)),
      child: Row(children: [
        Icon(cfg.icon, color: cfg.color, size: 22),
        const SizedBox(width: 12),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(status.label, style: TextStyle(color: cfg.color, fontWeight: FontWeight.bold, fontSize: 15)),
          Text(cfg.desc, style: TextStyle(color: cfg.color.withOpacity(0.7), fontSize: 12)),
        ]),
      ]),
    );
  }
}

class _StatusCfg {
  final Color color, bg, border;
  final IconData icon;
  final String desc;
  const _StatusCfg({required this.color, required this.bg, required this.border, required this.icon, required this.desc});
}

final _statusConfig = {
  BookingStatus.enquiry:       _StatusCfg(color: const Color(0xFF2563EB), bg: const Color(0xFFEFF6FF), border: const Color(0xFFBFDBFE), icon: Icons.send_outlined, desc: 'Waiting for vendor response'),
  BookingStatus.quoteSent:     _StatusCfg(color: const Color(0xFFD97706), bg: const Color(0xFFFFFBEB), border: const Color(0xFFFDE68A), icon: Icons.request_quote_outlined, desc: 'Review and accept the quote'),
  BookingStatus.quoteAccepted: _StatusCfg(color: const Color(0xFF0D9488), bg: const Color(0xFFF0FDFA), border: const Color(0xFF99F6E4), icon: Icons.check_circle_outline, desc: 'Proceed to pay advance'),
  BookingStatus.advancePaid:   _StatusCfg(color: const Color(0xFF7C3AED), bg: const Color(0xFFF5F3FF), border: const Color(0xFFDDD6FE), icon: Icons.lock_outline, desc: 'Advance held in escrow'),
  BookingStatus.confirmed:     _StatusCfg(color: const Color(0xFF16A34A), bg: const Color(0xFFF0FDF4), border: const Color(0xFFBBF7D0), icon: Icons.verified_outlined, desc: 'Your booking is confirmed!'),
  BookingStatus.inProgress:    _StatusCfg(color: const Color(0xFF4F46E5), bg: const Color(0xFFEEF2FF), border: const Color(0xFFC7D2FE), icon: Icons.hourglass_top, desc: 'Event is in progress'),
  BookingStatus.completed:     _StatusCfg(color: const Color(0xFF374151), bg: const Color(0xFFF9FAFB), border: const Color(0xFFE5E7EB), icon: Icons.task_alt, desc: 'Service completed successfully'),
  BookingStatus.cancelled:     _StatusCfg(color: const Color(0xFFDC2626), bg: const Color(0xFFFEF2F2), border: const Color(0xFFFECACA), icon: Icons.cancel_outlined, desc: 'This booking was cancelled'),
  BookingStatus.disputed:      _StatusCfg(color: const Color(0xFFD97706), bg: const Color(0xFFFFFBEB), border: const Color(0xFFFDE68A), icon: Icons.report_outlined, desc: 'Under dispute resolution'),
};

// ─── Quote Banner ──────────────────────────────────────────
class _QuoteBanner extends StatelessWidget {
  final Booking booking;
  const _QuoteBanner({required this.booking});

  String _fmt(int p) => '₹${NumberFormat('#,##,###').format(p ~/ 100)}';

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFFBBF24))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [
          Icon(Icons.notifications_active_outlined, color: Color(0xFFD97706)),
          SizedBox(width: 8),
          Text('Action Required', style: TextStyle(color: Color(0xFFD97706), fontWeight: FontWeight.bold)),
        ]),
        const SizedBox(height: 8),
        Text('Vendor has sent a quote. Review and accept to proceed.', style: TextStyle(color: const Color(0xFF92400E).withOpacity(0.8), fontSize: 13)),
        const SizedBox(height: 12),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Quoted Amount', style: TextStyle(color: Color(0xFF92400E), fontSize: 11)),
            Text(_fmt(booking.quotedAmountPaise ?? 0), style: const TextStyle(color: Color(0xFF78350F), fontWeight: FontWeight.bold, fontSize: 22)),
          ]),
          ElevatedButton(
            onPressed: () => context.push('/checkout/${booking.vendorId}?bookingId=${booking.id}&amount=${booking.quotedAmountPaise}'),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD97706), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('Accept & Pay', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ]),
      ]),
    );
  }
}

// ─── Escrow Timeline ───────────────────────────────────────
class _EscrowTimeline extends StatelessWidget {
  final BookingStatus current;
  const _EscrowTimeline({required this.current});

  static const _steps = [
    (BookingStatus.enquiry,       'Enquiry Sent',      'You sent an enquiry'),
    (BookingStatus.quoteSent,     'Quote Received',    'Vendor sent a quote'),
    (BookingStatus.quoteAccepted, 'Quote Accepted',    'You accepted'),
    (BookingStatus.advancePaid,   'Advance in Escrow', '30% held securely'),
    (BookingStatus.confirmed,     'Booking Confirmed', 'Date locked!'),
    (BookingStatus.inProgress,    'Event Day',         'In progress'),
    (BookingStatus.completed,     'Completed ✓',       'Escrow released'),
  ];

  static const _order = [
    BookingStatus.enquiry, BookingStatus.quoteSent, BookingStatus.quoteAccepted,
    BookingStatus.advancePaid, BookingStatus.confirmed, BookingStatus.inProgress, BookingStatus.completed,
  ];

  @override
  Widget build(BuildContext context) {
    final currentIdx = _order.indexOf(current);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.shield_outlined, color: AppColors.brand, size: 20),
          const SizedBox(width: 8),
          const Text('Escrow Protection', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        ]),
        const SizedBox(height: 16),
        ..._steps.asMap().entries.map((e) {
          final i = e.key; final step = e.value;
          final done = i < currentIdx;
          final active = i == currentIdx;
          return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Column(children: [
              Container(width: 26, height: 26, decoration: BoxDecoration(
                color: done ? Colors.green : active ? AppColors.brand : Colors.grey.shade100,
                shape: BoxShape.circle,
                border: active ? Border.all(color: AppColors.brand.withOpacity(0.3), width: 3) : null,
              ), child: Icon(done ? Icons.check : Icons.circle, color: done || active ? Colors.white : Colors.grey.shade300, size: done ? 14 : 8)),
              if (i < _steps.length - 1)
                Container(width: 2, height: 28, color: done ? Colors.green.shade300 : Colors.grey.shade200),
            ]),
            const SizedBox(width: 12),
            Expanded(child: Padding(padding: const EdgeInsets.only(bottom: 16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(step.$2, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: done ? Colors.green.shade700 : active ? AppColors.brand : Colors.grey)),
              Text(step.$3, style: TextStyle(fontSize: 11, color: done || active ? AppColors.textSecondary : Colors.grey.shade400)),
            ]))),
          ]);
        }),
      ]),
    );
  }
}

// ─── Payment Card ──────────────────────────────────────────
class _PaymentCard extends StatelessWidget {
  final Booking booking;
  const _PaymentCard({required this.booking});

  String _fmt(int p) => '₹${NumberFormat('#,##,###').format(p ~/ 100)}';

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Payment', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 12),
        _Row('Total Amount', _fmt(booking.finalAmountPaise ?? booking.quotedAmountPaise ?? 0)),
        if (booking.advanceAmountPaise != null) ...[
          _Row('Advance Paid', _fmt(booking.advanceAmountPaise!), valueColor: Colors.green),
          const Divider(height: 20),
          _Row('Balance Due', _fmt((booking.finalAmountPaise ?? booking.quotedAmountPaise ?? 0) - booking.advanceAmountPaise!), valueColor: AppColors.brand, bold: true),
        ],
      ]),
    );
  }
}

class _Row extends StatelessWidget {
  final String label, value;
  final Color? valueColor;
  final bool bold;
  const _Row(this.label, this.value, {this.valueColor, this.bold = false});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
      Text(value, style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.w600, fontSize: 13, color: valueColor)),
    ]),
  );
}

// ─── Event Details Card ─────────────────────────────────────
class _EventDetailsCard extends StatelessWidget {
  final Booking booking;
  const _EventDetailsCard({required this.booking});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Event Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 12),
        _DetailRow(Icons.calendar_today, 'Date', DateFormat('EEEE, d MMMM yyyy').format(booking.eventDate)),
        _DetailRow(Icons.location_on_outlined, 'City', booking.eventCity),
        _DetailRow(Icons.celebration_outlined, 'Type', booking.eventType),
        if (booking.guestCount != null)
          _DetailRow(Icons.group_outlined, 'Guests', '~${booking.guestCount}'),
        if (booking.packageName != null)
          _DetailRow(Icons.inventory_2_outlined, 'Package', booking.packageName!),
      ]),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon; final String label, value;
  const _DetailRow(this.icon, this.label, this.value);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 5),
    child: Row(children: [
      Icon(icon, size: 16, color: AppColors.brand),
      const SizedBox(width: 10),
      Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
      const SizedBox(width: 8),
      Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))),
    ]),
  );
}

// ─── Activity Log ──────────────────────────────────────────
class _ActivityLog extends StatelessWidget {
  final List<BookingEvent> events;
  const _ActivityLog({required this.events});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Activity', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 12),
        ...events.reversed.map((e) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(children: [
            Container(width: 32, height: 32, decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.history, color: AppColors.brand, size: 16)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(e.eventType.replaceAll('_', ' ').toLowerCase().split(' ').map((w) => w.isEmpty ? '' : '${w[0].toUpperCase()}${w.substring(1)}').join(' '), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
              Text(DateFormat('d MMM · h:mm a').format(e.createdAt), style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
            ])),
          ]),
        )),
      ]),
    );
  }
}

// ─── Review CTA ────────────────────────────────────────────
class _ReviewCta extends StatelessWidget {
  final Booking booking;
  const _ReviewCta({required this.booking});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFFFFF7ED), Color(0xFFFFFBEB)]), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFFDE68A))),
      child: Column(children: [
        const Icon(Icons.star_border_rounded, color: Color(0xFFD97706), size: 32),
        const SizedBox(height: 8),
        const Text('How was your experience?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 4),
        Text('Share your feedback to help other couples', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
        const SizedBox(height: 12),
        SizedBox(width: double.infinity, child: ElevatedButton(
          onPressed: () => context.push('/reviews/write?vendorId=${booking.vendorId}&bookingId=${booking.id}'),
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD97706), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
          child: const Text('Write a Review'),
        )),
      ]),
    );
  }
}

// ─── Cancel Button ─────────────────────────────────────────
class _CancelButton extends StatelessWidget {
  final String bookingId; final WidgetRef ref;
  const _CancelButton({required this.bookingId, required this.ref});
  @override
  Widget build(BuildContext context) => OutlinedButton.icon(
    onPressed: () => _confirm(context),
    icon: const Icon(Icons.cancel_outlined, color: Colors.red),
    label: const Text('Cancel Booking', style: TextStyle(color: Colors.red)),
    style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.red), minimumSize: const Size(double.infinity, 48), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
  );

  void _confirm(BuildContext context) {
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('Cancel Booking?'),
      content: const Text('This action cannot be undone. Any advance paid may be subject to cancellation fees.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Keep Booking')),
        TextButton(onPressed: () {
          Navigator.pop(context);
          ref.read(bookingsProvider.notifier).cancelBooking(bookingId, 'Customer cancelled');
          context.pop();
        }, child: const Text('Cancel', style: TextStyle(color: Colors.red))),
      ],
    ));
  }
}

// ─── Loading / Error ───────────────────────────────────────
class _LoadingView extends StatelessWidget {
  const _LoadingView();
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Booking')),
    body: const Center(child: CircularProgressIndicator()),
  );
}

class _ErrorView extends StatelessWidget {
  final VoidCallback onRetry;
  const _ErrorView({required this.onRetry});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Booking')),
    body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      const Icon(Icons.error_outline, size: 48, color: Colors.grey),
      const SizedBox(height: 16),
      const Text('Could not load booking'),
      TextButton(onPressed: onRetry, child: const Text('Retry')),
    ])),
  );
}

extension on BookingStatus {
  bool get isTerminal => this == BookingStatus.completed || this == BookingStatus.cancelled;
}
