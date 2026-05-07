// ─── Vendor Analytics Models ──────────────────────────────────────────────────

class VendorAnalytics {
  final RevenueMetrics revenue;
  final BookingMetrics bookings;
  final PerformanceMetrics performance;
  final List<MonthlyRevenue> monthlyRevenue;
  final List<PackageBreakdown> packageBreakdown;
  final List<LeadSource> leadSources;
  final List<ActivityItem> recentActivity;

  const VendorAnalytics({
    required this.revenue,
    required this.bookings,
    required this.performance,
    required this.monthlyRevenue,
    required this.packageBreakdown,
    required this.leadSources,
    required this.recentActivity,
  });
}

class RevenueMetrics {
  final int todayPaise;
  final int weekPaise;
  final int monthPaise;
  final int totalPaise;
  final int pendingPaise;
  final double monthOverMonthGrowth; // percentage

  const RevenueMetrics({
    required this.todayPaise,
    required this.weekPaise,
    required this.monthPaise,
    required this.totalPaise,
    required this.pendingPaise,
    required this.monthOverMonthGrowth,
  });
}

class BookingMetrics {
  final int totalEnquiries;
  final int quotedCount;
  final int confirmedCount;
  final int completedCount;
  final int cancelledCount;
  final int activeCount;
  final double conversionRate; // enquiries → confirmed %
  final int avgBookingValuePaise;

  const BookingMetrics({
    required this.totalEnquiries,
    required this.quotedCount,
    required this.confirmedCount,
    required this.completedCount,
    required this.cancelledCount,
    required this.activeCount,
    required this.conversionRate,
    required this.avgBookingValuePaise,
  });
}

class PerformanceMetrics {
  final double avgRating;
  final int totalReviews;
  final int profileViews;
  final int profileViewsChange; // vs last month
  final double responseRate; // 0-100
  final int avgResponseMinutes;
  final int repeatCustomers;
  final Map<int, int> ratingDistribution; // 5→count, 4→count...

  const PerformanceMetrics({
    required this.avgRating,
    required this.totalReviews,
    required this.profileViews,
    required this.profileViewsChange,
    required this.responseRate,
    required this.avgResponseMinutes,
    required this.repeatCustomers,
    required this.ratingDistribution,
  });
}

class MonthlyRevenue {
  final String month; // 'Jan', 'Feb', etc
  final int revenuePaise;
  final int bookingCount;

  const MonthlyRevenue({required this.month, required this.revenuePaise, required this.bookingCount});
}

class PackageBreakdown {
  final String name;
  final int bookingCount;
  final int revenuePaise;
  final double percentage;

  const PackageBreakdown({required this.name, required this.bookingCount, required this.revenuePaise, required this.percentage});
}

class LeadSource {
  final String name;
  final int count;
  final double percentage;

  const LeadSource({required this.name, required this.count, required this.percentage});
}

class ActivityItem {
  final String title;
  final String subtitle;
  final String timeAgo;
  final ActivityType type;

  const ActivityItem({required this.title, required this.subtitle, required this.timeAgo, required this.type});
}

enum ActivityType { enquiry, booking, payment, review, profile }

// ─── Lead / Enquiry ───────────────────────────────────────────────────────────

enum LeadStatus { newLead, contacted, quoted, negotiating, won, lost }

class VendorLead {
  final String id;
  final String customerName;
  final String phone;
  final String eventType;
  final String eventDate;
  final int guestCount;
  final int? budgetPaise;
  final LeadStatus status;
  final String receivedAgo;
  final String? notes;
  final int priority; // 1=hot, 2=warm, 3=cold

  const VendorLead({
    required this.id,
    required this.customerName,
    required this.phone,
    required this.eventType,
    required this.eventDate,
    required this.guestCount,
    this.budgetPaise,
    required this.status,
    required this.receivedAgo,
    this.notes,
    required this.priority,
  });
}

// ─── Calendar Event ───────────────────────────────────────────────────────────

enum CalendarEventType { confirmed, tentative, blocked }

class CalendarEvent {
  final String id;
  final String title;
  final String customerName;
  final DateTime date;
  final String timeSlot;
  final CalendarEventType type;
  final String? packageName;
  final int? amountPaise;

  const CalendarEvent({
    required this.id,
    required this.title,
    required this.customerName,
    required this.date,
    required this.timeSlot,
    required this.type,
    this.packageName,
    this.amountPaise,
  });
}

// ─── Vendor Review (vendor-facing) ────────────────────────────────────────────

class VendorReviewItem {
  final String id;
  final String customerName;
  final String eventType;
  final double rating;
  final String body;
  final DateTime date;
  final double? qualityRating;
  final double? valueRating;
  final double? professionalismRating;
  final String? vendorReply;
  final List<String> photoUrls;

  const VendorReviewItem({
    required this.id,
    required this.customerName,
    required this.eventType,
    required this.rating,
    required this.body,
    required this.date,
    this.qualityRating,
    this.valueRating,
    this.professionalismRating,
    this.vendorReply,
    this.photoUrls = const [],
  });
}
