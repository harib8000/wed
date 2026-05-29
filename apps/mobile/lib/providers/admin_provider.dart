import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../core/api_client.dart';
import '../models/admin.dart';
import 'auth_provider.dart';

const _adminStatsBoxKey = 'admin_stats_cache';
const _adminStatsDataKey = 'stats';

// ─── Admin Stats Provider ─────────────────────────────────────────────────────

final adminStatsProvider = FutureProvider<AdminStats>((ref) async {
  ref.watch(currentUserProvider);
  final box = await Hive.openBox<String>(_adminStatsBoxKey);
  try {
    final res = await ApiClient.getAdminStats();
    final data = (res.data['data'] as Map<String, dynamic>?) ?? {};
    final stats = AdminStats.fromJson(data);
    await box.put(_adminStatsDataKey, jsonEncode(data));
    return stats;
  } catch (e) {
    debugPrint('Admin stats fetch failed, checking cache: $e');
    final cached = box.get(_adminStatsDataKey);
    if (cached != null) {
      try {
        return AdminStats.fromJson(jsonDecode(cached) as Map<String, dynamic>);
      } catch (_) {}
    }
    return const AdminStats(
      totalUsers: 12_483,
      activeVendors: 1_247,
      todayBookings: 38,
      revenueTodayPaise: 45_80_000_00,
      pendingKyc: 14,
      openDisputes: 3,
    );
  }
});

// ─── Activity Feed Provider ────────────────────────────────────────────────────

final adminActivityProvider = FutureProvider<List<ActivityFeedItem>>((ref) async {
  try {
    final res = await ApiClient.getAdminActivityFeed();
    final raw = (res.data['data'] as Map<String, dynamic>?) ?? {};
    final list = (raw['items'] as List<dynamic>?) ?? [];
    return list
        .map((i) => ActivityFeedItem.fromJson(i as Map<String, dynamic>))
        .toList();
  } catch (e) {
    debugPrint('Admin activity feed fetch failed, using mock: $e');
    return _mockActivity;
  }
});

// ─── Admin Users Provider ─────────────────────────────────────────────────────

class AdminUsersFilter {
  final String? role;
  final String? city;
  final String? status;
  final String? search;
  final int page;

  const AdminUsersFilter({
    this.role,
    this.city,
    this.status,
    this.search,
    this.page = 1,
  });

  Map<String, dynamic> toParams() => {
        if (role != null) 'role': role,
        if (city != null) 'city': city,
        if (status != null) 'status': status,
        if (search != null) 'search': search,
        'page': page,
        'limit': 20,
      };
}

final adminUsersFilterProvider =
    StateProvider<AdminUsersFilter>((ref) => const AdminUsersFilter());

final adminUsersProvider =
    FutureProvider<List<AdminUser>>((ref) async {
  final filter = ref.watch(adminUsersFilterProvider);
  try {
    final res = await ApiClient.getAllUsers(filter.toParams());
    final raw = (res.data['data'] as Map<String, dynamic>?) ?? {};
    final list = (raw['users'] as List<dynamic>?) ?? [];
    return list
        .map((u) => AdminUser.fromJson(u as Map<String, dynamic>))
        .toList();
  } catch (e) {
    debugPrint('Admin users fetch failed, using mock: $e');
    return _mockUsers;
  }
});

// ─── Admin Vendors Provider ───────────────────────────────────────────────────

class AdminVendorsFilter {
  final String? kycStatus;
  final String? category;
  final String? city;
  final String? search;
  final int page;

  const AdminVendorsFilter({
    this.kycStatus,
    this.category,
    this.city,
    this.search,
    this.page = 1,
  });

  Map<String, dynamic> toParams() => {
        if (kycStatus != null) 'kycStatus': kycStatus,
        if (category != null) 'category': category,
        if (city != null) 'city': city,
        if (search != null) 'search': search,
        'page': page,
        'limit': 20,
      };
}

final adminVendorsFilterProvider =
    StateProvider<AdminVendorsFilter>((ref) => const AdminVendorsFilter());

final adminVendorsProvider = FutureProvider<List<AdminVendor>>((ref) async {
  final filter = ref.watch(adminVendorsFilterProvider);
  try {
    final res = await ApiClient.getAllVendorsAdmin(filter.toParams());
    final raw = (res.data['data'] as Map<String, dynamic>?) ?? {};
    final list = (raw['vendors'] as List<dynamic>?) ?? [];
    return list
        .map((v) => AdminVendor.fromJson(v as Map<String, dynamic>))
        .toList();
  } catch (e) {
    debugPrint('Admin vendors fetch failed, using mock: $e');
    return _mockVendors;
  }
});

// ─── Admin Bookings Provider ──────────────────────────────────────────────────

class AdminBookingsFilter {
  final String? status;
  final String? search;
  final int page;

  const AdminBookingsFilter({this.status, this.search, this.page = 1});

  Map<String, dynamic> toParams() => {
        if (status != null) 'status': status,
        if (search != null) 'search': search,
        'page': page,
        'limit': 20,
      };
}

final adminBookingsFilterProvider =
    StateProvider<AdminBookingsFilter>((ref) => const AdminBookingsFilter());

final adminBookingsProvider = FutureProvider<List<AdminBooking>>((ref) async {
  final filter = ref.watch(adminBookingsFilterProvider);
  try {
    final res = await ApiClient.getAllBookingsAdmin(filter.toParams());
    final raw = (res.data['data'] as Map<String, dynamic>?) ?? {};
    final list = (raw['bookings'] as List<dynamic>?) ?? [];
    return list
        .map((b) => AdminBooking.fromJson(b as Map<String, dynamic>))
        .toList();
  } catch (e) {
    debugPrint('Admin bookings fetch failed, using mock: $e');
    return _mockBookings;
  }
});

// ─── Admin Disputes Provider ──────────────────────────────────────────────────

final adminDisputesProvider = FutureProvider<List<AdminDispute>>((ref) async {
  try {
    final res = await ApiClient.getDisputes({'status': 'OPEN'});
    final raw = (res.data['data'] as Map<String, dynamic>?) ?? {};
    final list = (raw['disputes'] as List<dynamic>?) ?? [];
    return list
        .map((d) => AdminDispute.fromJson(d as Map<String, dynamic>))
        .toList();
  } catch (e) {
    debugPrint('Admin disputes fetch failed, using mock: $e');
    return _mockDisputes;
  }
});

// ─── Platform Reports Provider ────────────────────────────────────────────────

final platformReportsProvider = FutureProvider<PlatformReport>((ref) async {
  try {
    final res = await ApiClient.getPlatformReports({'period': '6months'});
    final raw = (res.data['data'] as Map<String, dynamic>?) ?? {};
    final monthlyList = (raw['monthly'] as List<dynamic>?) ?? [];
    final monthly = monthlyList.map((m) {
      final mp = m as Map<String, dynamic>;
      return MonthlyRevenuePoint(
        month: mp['month'] as String? ?? '',
        revenuePaise: _toInt(mp['revenuePaise']),
        bookingCount: _toInt(mp['bookingCount']),
      );
    }).toList();

    final categoryRaw = (raw['categories'] as Map<String, dynamic>?) ?? {};
    final cityRaw = (raw['cities'] as Map<String, dynamic>?) ?? {};
    return PlatformReport(
      monthlyRevenue: monthly,
      categoryBreakdown: categoryRaw
          .map((k, v) => MapEntry(k, _toInt(v))),
      cityDistribution: cityRaw.map((k, v) => MapEntry(k, _toInt(v))),
      totalRevenuePaise: _toInt(raw['totalRevenuePaise']),
      totalBookings: _toInt(raw['totalBookings']),
      avgBookingValuePaise: (raw['avgBookingValuePaise'] as num?)?.toDouble() ?? 0.0,
    );
  } catch (e) {
    debugPrint('Platform reports fetch failed, using mock: $e');
    return _mockReport;
  }
});

int _toInt(dynamic v) {
  if (v is int) return v;
  if (v is double) return v.toInt();
  if (v is String) return int.tryParse(v) ?? 0;
  return 0;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

final _mockActivity = [
  ActivityFeedItem(
    id: 'a1',
    type: 'USER_REGISTERED',
    title: 'New couple registered',
    subtitle: 'Priya & Rahul — Hyderabad',
    createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
  ),
  ActivityFeedItem(
    id: 'a2',
    type: 'KYC_SUBMITTED',
    title: 'KYC submitted',
    subtitle: 'Royal Grand Decorators',
    createdAt: DateTime.now().subtract(const Duration(minutes: 18)),
  ),
  ActivityFeedItem(
    id: 'a3',
    type: 'DISPUTE_RAISED',
    title: 'Dispute raised',
    subtitle: 'Booking #WOS-0234 — ₹45,000',
    createdAt: DateTime.now().subtract(const Duration(hours: 1)),
  ),
  ActivityFeedItem(
    id: 'a4',
    type: 'BOOKING_CREATED',
    title: 'New booking confirmed',
    subtitle: 'Moments Photography — ₹1,20,000',
    createdAt: DateTime.now().subtract(const Duration(hours: 2)),
  ),
];

final _mockUsers = [
  AdminUser(
    id: 'u1',
    phone: '9876543210',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    city: 'Hyderabad',
    createdAt: '2025-01-15T10:00:00Z',
  ),
  AdminUser(
    id: 'u2',
    phone: '9988776655',
    name: 'Royal Grand Palace',
    email: 'info@royalgrand.com',
    role: 'VENDOR',
    status: 'ACTIVE',
    city: 'Hyderabad',
    createdAt: '2025-02-01T10:00:00Z',
  ),
  AdminUser(
    id: 'u3',
    phone: '9876543212',
    name: 'Meera Events',
    email: 'meera@events.com',
    role: 'COORDINATOR',
    status: 'ACTIVE',
    city: 'Mumbai',
    createdAt: '2025-03-10T10:00:00Z',
  ),
];

final _mockVendors = [
  AdminVendor(
    id: 'v1',
    businessName: 'Royal Grand Palace',
    category: 'Venue',
    city: 'Hyderabad',
    kycStatus: 'APPROVED',
    status: 'ACTIVE',
    isFeatured: true,
    avgRating: 4.8,
    totalBookings: 142,
    createdAt: '2025-01-01T10:00:00Z',
  ),
  AdminVendor(
    id: 'v2',
    businessName: 'Moments Photography',
    category: 'Photography',
    city: 'Bangalore',
    kycStatus: 'PENDING',
    status: 'ACTIVE',
    isFeatured: false,
    avgRating: 4.6,
    totalBookings: 87,
    createdAt: '2025-02-15T10:00:00Z',
  ),
  AdminVendor(
    id: 'v3',
    businessName: 'Star Caterers',
    category: 'Catering',
    city: 'Mumbai',
    kycStatus: 'REJECTED',
    status: 'SUSPENDED',
    isFeatured: false,
    avgRating: 3.9,
    totalBookings: 23,
    createdAt: '2025-03-01T10:00:00Z',
  ),
];

final _mockBookings = [
  AdminBooking(
    id: 'b1',
    bookingNumber: 'WOS-0234',
    customerName: 'Priya Sharma',
    vendorName: 'Royal Grand Palace',
    eventType: 'Wedding',
    eventDate: '2025-12-15',
    status: 'CONFIRMED',
    amountPaise: 5000000000,
    createdAt: '2025-10-01T10:00:00Z',
  ),
  AdminBooking(
    id: 'b2',
    bookingNumber: 'WOS-0235',
    customerName: 'Ananya Reddy',
    vendorName: 'Moments Photography',
    eventType: 'Wedding',
    eventDate: '2025-11-20',
    status: 'ENQUIRY',
    amountPaise: 120000000,
    createdAt: '2025-10-05T10:00:00Z',
  ),
];

final _mockDisputes = [
  AdminDispute(
    id: 'd1',
    bookingId: 'b1',
    bookingNumber: 'WOS-0234',
    raisedBy: 'CUSTOMER',
    raiserName: 'Priya Sharma',
    reason: 'Venue did not match expectations from photos',
    status: 'OPEN',
    amountPaise: 5000000000,
    createdAt: '2025-10-10T10:00:00Z',
  ),
  AdminDispute(
    id: 'd2',
    bookingId: 'b3',
    bookingNumber: 'WOS-0215',
    raisedBy: 'VENDOR',
    raiserName: 'Star Caterers',
    reason: 'Customer cancelled last minute without refund request',
    status: 'OPEN',
    amountPaise: 45000000,
    createdAt: '2025-10-08T10:00:00Z',
  ),
];

final _mockReport = PlatformReport(
  monthlyRevenue: [
    const MonthlyRevenuePoint(month: 'May', revenuePaise: 1200000000, bookingCount: 42),
    const MonthlyRevenuePoint(month: 'Jun', revenuePaise: 1450000000, bookingCount: 51),
    const MonthlyRevenuePoint(month: 'Jul', revenuePaise: 1800000000, bookingCount: 63),
    const MonthlyRevenuePoint(month: 'Aug', revenuePaise: 2100000000, bookingCount: 71),
    const MonthlyRevenuePoint(month: 'Sep', revenuePaise: 2400000000, bookingCount: 85),
    const MonthlyRevenuePoint(month: 'Oct', revenuePaise: 2750000000, bookingCount: 98),
  ],
  categoryBreakdown: {
    'Venue': 245,
    'Photography': 189,
    'Catering': 167,
    'Decoration': 134,
    'Music': 89,
    'Other': 45,
  },
  cityDistribution: {
    'Hyderabad': 312,
    'Bangalore': 234,
    'Mumbai': 198,
    'Delhi': 145,
    'Chennai': 98,
  },
  totalRevenuePaise: 11700000000,
  totalBookings: 410,
  avgBookingValuePaise: 28536585.0,
);
