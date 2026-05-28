import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../models/vendor_analytics.dart';
import 'auth_provider.dart';

// ─── Helpers ──────────────────────────────────────────────────────────────────

int _parseInt(dynamic value) {
  if (value == null) return 0;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

double _parseDouble(dynamic value) {
  if (value == null) return 0.0;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

String _timeAgo(String? isoString) {
  if (isoString == null) return '';
  final date = DateTime.tryParse(isoString);
  if (date == null) return '';
  final diff = DateTime.now().difference(date);
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  return '${(diff.inDays / 7).floor()}w ago';
}

ActivityType _activityTypeFromStatus(String status) {
  switch (status) {
    case 'ENQUIRY': return ActivityType.enquiry;
    case 'QUOTE_SENT':
    case 'QUOTE_ACCEPTED':
    case 'ADVANCE_PENDING': return ActivityType.enquiry;
    case 'CONFIRMED':
    case 'ADVANCE_PAID':
    case 'CHECKIN': return ActivityType.booking;
    case 'COMPLETED': return ActivityType.payment;
    default: return ActivityType.enquiry;
  }
}

String _activityTitleFromStatus(String status) {
  switch (status) {
    case 'ENQUIRY': return 'New Enquiry';
    case 'QUOTE_SENT': return 'Quote Sent';
    case 'QUOTE_ACCEPTED': return 'Quote Accepted';
    case 'ADVANCE_PENDING': return 'Advance Pending';
    case 'ADVANCE_PAID':
    case 'CONFIRMED': return 'Booking Confirmed';
    case 'CHECKIN': return 'Check-in';
    case 'COMPLETED': return 'Event Completed';
    case 'CANCELLED_BY_CUSTOMER':
    case 'CANCELLED_BY_VENDOR': return 'Booking Cancelled';
    default: return status;
  }
}

LeadStatus _leadStatusFromBookingStatus(String status) {
  switch (status) {
    case 'ENQUIRY': return LeadStatus.newLead;
    case 'QUOTE_SENT': return LeadStatus.quoted;
    case 'QUOTE_ACCEPTED':
    case 'ADVANCE_PENDING': return LeadStatus.negotiating;
    case 'ADVANCE_PAID':
    case 'CONFIRMED':
    case 'CHECKIN':
    case 'COMPLETED': return LeadStatus.won;
    case 'CANCELLED_BY_CUSTOMER':
    case 'CANCELLED_BY_VENDOR': return LeadStatus.lost;
    default: return LeadStatus.newLead;
  }
}

// ─── Vendor Analytics Provider ────────────────────────────────────────────────

final vendorAnalyticsProvider = FutureProvider<VendorAnalytics>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) throw Exception('Not authenticated');

  final results = await Future.wait([
    ApiClient.getVendorDashboard().then((r) => r.data as Map<String, dynamic>),
    ApiClient.getVendorPaymentStats().then((r) => r.data as Map<String, dynamic>),
    ApiClient.getVendorReviews(user.id).then((r) => r.data as Map<String, dynamic>),
  ]);

  final dashRaw = (results[0]['data'] as Map<String, dynamic>?) ?? {};
  final payRaw = (results[1]['data'] as Map<String, dynamic>?) ?? {};
  final revRaw = (results[2]['data'] as Map<String, dynamic>?) ?? {};

  final stats = (dashRaw['stats'] as Map<String, dynamic>?) ?? {};
  final reviewStats = (revRaw['stats'] as Map<String, dynamic>?) ?? {};

  // ── Revenue ──
  final revenue = RevenueMetrics(
    todayPaise: _parseInt(payRaw['todayPaise']),
    weekPaise: _parseInt(payRaw['weekPaise']),
    monthPaise: _parseInt(payRaw['monthPaise']),
    totalPaise: _parseInt(payRaw['totalPaise']),
    pendingPaise: _parseInt(payRaw['pendingPaise']),
    monthOverMonthGrowth: _parseDouble(payRaw['monthOverMonthGrowth']),
  );

  // ── Bookings ──
  final totalEnquiries = _parseInt(stats['totalEnquiries']);
  final confirmedCount = _parseInt(stats['confirmedCount']);
  final completedCount = _parseInt(stats['completedCount']);
  final bookings = BookingMetrics(
    totalEnquiries: totalEnquiries,
    quotedCount: _parseInt(stats['quotedCount']),
    confirmedCount: confirmedCount,
    completedCount: completedCount,
    cancelledCount: _parseInt(stats['cancelledCount']),
    activeCount: _parseInt(stats['activeCount']),
    conversionRate: _parseDouble(stats['conversionRate']),
    avgBookingValuePaise: _parseInt(stats['avgBookingValuePaise']),
  );

  // ── Performance ──
  final avgRaw = (reviewStats['_avg'] as Map<String, dynamic>?) ?? {};
  final countRaw = (reviewStats['_count'] as Map<String, dynamic>?) ?? {};
  final performance = PerformanceMetrics(
    avgRating: _parseDouble(avgRaw['rating']),
    totalReviews: _parseInt(countRaw['id'] ?? revRaw['total']),
    profileViews: 0,
    profileViewsChange: 0,
    responseRate: 0,
    avgResponseMinutes: 0,
    repeatCustomers: 0,
    ratingDistribution: const {},
  );

  // ── Monthly Revenue ──
  final payMonthly = (payRaw['monthly'] as List<dynamic>?) ?? [];
  final dashMonthly = (dashRaw['monthly'] as List<dynamic>?) ?? [];

  // Merge payment monthly revenue with booking counts
  final monthlyMap = <String, Map<String, dynamic>>{};
  for (final m in payMonthly) {
    final mp = m as Map<String, dynamic>;
    final month = mp['month'] as String? ?? '';
    monthlyMap[month] = {'month': month, 'revenuePaise': _parseInt(mp['revenuePaise']), 'bookingCount': 0};
  }
  for (final m in dashMonthly) {
    final mp = m as Map<String, dynamic>;
    final month = mp['month'] as String? ?? '';
    final existing = monthlyMap[month] ?? {'month': month, 'revenuePaise': 0};
    existing['bookingCount'] = _parseInt(mp['bookingCount'] ?? mp['count']);
    monthlyMap[month] = existing;
  }
  final monthlyRevenue = monthlyMap.values
      .map((m) => MonthlyRevenue(
            month: m['month'] as String,
            revenuePaise: _parseInt(m['revenuePaise']),
            bookingCount: _parseInt(m['bookingCount']),
          ))
      .toList();

  // ── Recent Activity ──
  final activityList = (dashRaw['recentActivity'] as List<dynamic>?) ?? [];
  final recentActivity = activityList.take(8).map((item) {
    final a = item as Map<String, dynamic>;
    final status = a['status'] as String? ?? '';
    final eventType = a['eventType'] as String? ?? '';
    return ActivityItem(
      title: _activityTitleFromStatus(status),
      subtitle: '$eventType · ${a['bookingNumber'] ?? ''}',
      timeAgo: _timeAgo(a['updatedAt'] as String?),
      type: _activityTypeFromStatus(status),
    );
  }).toList();

  return VendorAnalytics(
    revenue: revenue,
    bookings: bookings,
    performance: performance,
    monthlyRevenue: monthlyRevenue,
    packageBreakdown: const [],
    leadSources: const [
      LeadSource(name: 'WeddingOS Search', count: 0, percentage: 100),
    ],
    recentActivity: recentActivity,
  );
});

// ─── Vendor Leads Provider ────────────────────────────────────────────────────

final vendorLeadsProvider = FutureProvider<List<VendorLead>>((ref) async {
  final res = await ApiClient.getVendorBookings();
  final data = (res.data['data'] as Map<String, dynamic>?) ?? {};
  final bookingList = (data['bookings'] as List<dynamic>?) ?? [];

  return bookingList
      .where((b) {
        final status = (b as Map<String, dynamic>)['status'] as String? ?? '';
        return ['ENQUIRY', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'ADVANCE_PENDING'].contains(status);
      })
      .map((b) {
        final bk = b as Map<String, dynamic>;
        final status = bk['status'] as String? ?? 'ENQUIRY';
        return VendorLead(
          id: bk['id'] as String? ?? '',
          customerName: bk['customerName'] as String? ?? 'Customer',
          phone: bk['customerPhone'] as String? ?? '',
          eventType: bk['eventType'] as String? ?? '',
          eventDate: bk['eventDate'] as String? ?? '',
          guestCount: _parseInt(bk['guestCount']),
          budgetPaise: bk['quotedAmountPaise'] != null ? _parseInt(bk['quotedAmountPaise']) : null,
          status: _leadStatusFromBookingStatus(status),
          receivedAgo: _timeAgo(bk['createdAt'] as String?),
          notes: bk['specialNotes'] as String?,
          priority: status == 'ENQUIRY' ? 1 : 2,
        );
      })
      .toList();
});

// ─── Vendor Calendar Provider ─────────────────────────────────────────────────

final vendorCalendarProvider = FutureProvider<List<CalendarEvent>>((ref) async {
  final res = await ApiClient.getVendorBookings();
  final data = (res.data['data'] as Map<String, dynamic>?) ?? {};
  final bookingList = (data['bookings'] as List<dynamic>?) ?? [];

  return bookingList.map((b) {
    final bk = b as Map<String, dynamic>;
    final status = bk['status'] as String? ?? '';
    final isConfirmed = ['CONFIRMED', 'ADVANCE_PAID', 'CHECKIN', 'COMPLETED'].contains(status);
    final isEnquiry = ['ENQUIRY', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'ADVANCE_PENDING'].contains(status);

    DateTime date;
    try {
      date = DateTime.parse(bk['eventDate'] as String? ?? '');
    } catch (_) {
      date = DateTime.now();
    }

    return CalendarEvent(
      id: bk['id'] as String? ?? '',
      title: '${bk['eventType'] ?? 'Event'} - ${bk['customerName'] ?? 'Customer'}',
      customerName: bk['customerName'] as String? ?? 'Customer',
      date: date,
      timeSlot: 'Full Day',
      type: isConfirmed
          ? CalendarEventType.confirmed
          : isEnquiry
              ? CalendarEventType.tentative
              : CalendarEventType.blocked,
      packageName: bk['packageName'] as String?,
      amountPaise: bk['quotedAmountPaise'] != null ? _parseInt(bk['quotedAmountPaise']) : null,
    );
  }).toList();
});

// ─── Vendor Reviews List Provider ────────────────────────────────────────────

final vendorReviewsListProvider = FutureProvider<List<VendorReviewItem>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) throw Exception('Not authenticated');

  final res = await ApiClient.getVendorReviews(user.id);
  final data = (res.data['data'] as Map<String, dynamic>?) ?? {};
  final reviewList = (data['reviews'] as List<dynamic>?) ?? [];

  return reviewList.map((r) {
    final rv = r as Map<String, dynamic>;
    final photosRaw = rv['photos'] as List<dynamic>? ?? [];
    DateTime date;
    try {
      date = DateTime.parse(rv['createdAt'] as String? ?? '');
    } catch (_) {
      date = DateTime.now();
    }
    return VendorReviewItem(
      id: rv['id'] as String? ?? '',
      customerName: rv['customerName'] as String? ?? 'Customer',
      eventType: rv['eventType'] as String? ?? '',
      rating: _parseDouble(rv['rating']),
      body: rv['body'] as String? ?? '',
      date: date,
      qualityRating: rv['qualityRating'] != null ? _parseDouble(rv['qualityRating']) : null,
      valueRating: rv['valueRating'] != null ? _parseDouble(rv['valueRating']) : null,
      professionalismRating: rv['professionalismRating'] != null ? _parseDouble(rv['professionalismRating']) : null,
      vendorReply: rv['vendorReply'] as String?,
      photoUrls: photosRaw.map((p) => p.toString()).toList(),
    );
  }).toList();
});
