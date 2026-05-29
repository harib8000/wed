// ─── Admin Models ─────────────────────────────────────────────────────────────

class AdminStats {
  final int totalUsers;
  final int activeVendors;
  final int todayBookings;
  final int revenueTodayPaise;
  final int pendingKyc;
  final int openDisputes;

  const AdminStats({
    required this.totalUsers,
    required this.activeVendors,
    required this.todayBookings,
    required this.revenueTodayPaise,
    required this.pendingKyc,
    required this.openDisputes,
  });

  factory AdminStats.fromJson(Map<String, dynamic> j) => AdminStats(
        totalUsers: _int(j['totalUsers']),
        activeVendors: _int(j['activeVendors']),
        todayBookings: _int(j['todayBookings']),
        revenueTodayPaise: _int(j['revenueTodayPaise']),
        pendingKyc: _int(j['pendingKyc']),
        openDisputes: _int(j['openDisputes']),
      );
}

int _int(dynamic v) {
  if (v is int) return v;
  if (v is double) return v.toInt();
  if (v is String) return int.tryParse(v) ?? 0;
  return 0;
}

class AdminUser {
  final String id;
  final String phone;
  final String? name;
  final String? email;
  final String role;
  final String status;
  final String? city;
  final String createdAt;

  const AdminUser({
    required this.id,
    required this.phone,
    this.name,
    this.email,
    required this.role,
    required this.status,
    this.city,
    required this.createdAt,
  });

  factory AdminUser.fromJson(Map<String, dynamic> j) => AdminUser(
        id: j['id'] as String,
        phone: j['phone'] as String? ?? '',
        name: j['name'] as String?,
        email: j['email'] as String?,
        role: j['role'] as String? ?? 'CUSTOMER',
        status: j['status'] as String? ?? 'ACTIVE',
        city: j['city'] as String?,
        createdAt: j['createdAt'] as String? ?? '',
      );
}

class AdminVendor {
  final String id;
  final String businessName;
  final String category;
  final String city;
  final String kycStatus; // PENDING | APPROVED | REJECTED
  final String status; // ACTIVE | SUSPENDED
  final bool isFeatured;
  final double avgRating;
  final int totalBookings;
  final String createdAt;

  const AdminVendor({
    required this.id,
    required this.businessName,
    required this.category,
    required this.city,
    required this.kycStatus,
    required this.status,
    required this.isFeatured,
    required this.avgRating,
    required this.totalBookings,
    required this.createdAt,
  });

  factory AdminVendor.fromJson(Map<String, dynamic> j) => AdminVendor(
        id: j['id'] as String,
        businessName: j['businessName'] as String? ?? '',
        category: j['category'] as String? ?? '',
        city: j['city'] as String? ?? '',
        kycStatus: j['kycStatus'] as String? ?? 'PENDING',
        status: j['status'] as String? ?? 'ACTIVE',
        isFeatured: j['isFeatured'] as bool? ?? false,
        avgRating: (j['avgRating'] as num?)?.toDouble() ?? 0.0,
        totalBookings: _int(j['totalBookings']),
        createdAt: j['createdAt'] as String? ?? '',
      );
}

class AdminBooking {
  final String id;
  final String bookingNumber;
  final String customerName;
  final String vendorName;
  final String eventType;
  final String eventDate;
  final String status;
  final int amountPaise;
  final String createdAt;

  const AdminBooking({
    required this.id,
    required this.bookingNumber,
    required this.customerName,
    required this.vendorName,
    required this.eventType,
    required this.eventDate,
    required this.status,
    required this.amountPaise,
    required this.createdAt,
  });

  factory AdminBooking.fromJson(Map<String, dynamic> j) => AdminBooking(
        id: j['id'] as String,
        bookingNumber: j['bookingNumber'] as String? ?? '',
        customerName: j['customerName'] as String? ?? 'Customer',
        vendorName: j['vendorName'] as String? ?? 'Vendor',
        eventType: j['eventType'] as String? ?? '',
        eventDate: j['eventDate'] as String? ?? '',
        status: j['status'] as String? ?? 'ENQUIRY',
        amountPaise: _int(j['quotedAmountPaise'] ?? j['amountPaise']),
        createdAt: j['createdAt'] as String? ?? '',
      );
}

class AdminDispute {
  final String id;
  final String bookingId;
  final String bookingNumber;
  final String raisedBy; // CUSTOMER | VENDOR
  final String raiserName;
  final String reason;
  final String status; // OPEN | RESOLVED | ESCALATED
  final int amountPaise;
  final String createdAt;

  const AdminDispute({
    required this.id,
    required this.bookingId,
    required this.bookingNumber,
    required this.raisedBy,
    required this.raiserName,
    required this.reason,
    required this.status,
    required this.amountPaise,
    required this.createdAt,
  });

  factory AdminDispute.fromJson(Map<String, dynamic> j) => AdminDispute(
        id: j['id'] as String,
        bookingId: j['bookingId'] as String? ?? '',
        bookingNumber: j['bookingNumber'] as String? ?? '',
        raisedBy: j['raisedBy'] as String? ?? 'CUSTOMER',
        raiserName: j['raiserName'] as String? ?? 'User',
        reason: j['reason'] as String? ?? '',
        status: j['status'] as String? ?? 'OPEN',
        amountPaise: _int(j['amountPaise']),
        createdAt: j['createdAt'] as String? ?? '',
      );
}

class PlatformReport {
  final List<MonthlyRevenuePoint> monthlyRevenue;
  final Map<String, int> categoryBreakdown;
  final Map<String, int> cityDistribution;
  final int totalRevenuePaise;
  final int totalBookings;
  final double avgBookingValuePaise;

  const PlatformReport({
    required this.monthlyRevenue,
    required this.categoryBreakdown,
    required this.cityDistribution,
    required this.totalRevenuePaise,
    required this.totalBookings,
    required this.avgBookingValuePaise,
  });
}

class MonthlyRevenuePoint {
  final String month;
  final int revenuePaise;
  final int bookingCount;

  const MonthlyRevenuePoint({
    required this.month,
    required this.revenuePaise,
    required this.bookingCount,
  });
}

class ActivityFeedItem {
  final String id;
  final String type; // USER_REGISTERED | KYC_SUBMITTED | DISPUTE_RAISED | BOOKING_CREATED
  final String title;
  final String subtitle;
  final DateTime createdAt;

  const ActivityFeedItem({
    required this.id,
    required this.type,
    required this.title,
    required this.subtitle,
    required this.createdAt,
  });

  factory ActivityFeedItem.fromJson(Map<String, dynamic> j) {
    DateTime dt;
    try {
      dt = DateTime.parse(j['createdAt'] as String? ?? '');
    } catch (_) {
      dt = DateTime.now();
    }
    return ActivityFeedItem(
      id: j['id'] as String? ?? '',
      type: j['type'] as String? ?? '',
      title: j['title'] as String? ?? '',
      subtitle: j['subtitle'] as String? ?? '',
      createdAt: dt,
    );
  }
}
