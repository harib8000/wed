import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/vendor_analytics.dart';

// ─── Vendor Analytics Provider ────────────────────────────────────────────────

final vendorAnalyticsProvider = FutureProvider<VendorAnalytics>((ref) async {
  // TODO: Replace with real API call
  await Future.delayed(const Duration(milliseconds: 300));
  return _mockAnalytics;
});

final vendorLeadsProvider = FutureProvider<List<VendorLead>>((ref) async {
  await Future.delayed(const Duration(milliseconds: 200));
  return _mockLeads;
});

final vendorCalendarProvider = FutureProvider<List<CalendarEvent>>((ref) async {
  await Future.delayed(const Duration(milliseconds: 200));
  return _mockCalendarEvents;
});

final vendorReviewsListProvider = FutureProvider<List<VendorReviewItem>>((ref) async {
  await Future.delayed(const Duration(milliseconds: 200));
  return _mockVendorReviews;
});

// ─── Mock Data ────────────────────────────────────────────────────────────────

const _mockAnalytics = VendorAnalytics(
  revenue: RevenueMetrics(
    todayPaise: 15000000,     // ₹1,50,000
    weekPaise: 47500000,      // ₹4,75,000
    monthPaise: 25000000000,  // ₹2,50,000 (scaled differently - this is monthly)
    totalPaise: 285000000000, // ₹28,50,000
    pendingPaise: 47500000000, // ₹4,75,000
    monthOverMonthGrowth: 18.5,
  ),
  bookings: BookingMetrics(
    totalEnquiries: 234,
    quotedCount: 189,
    confirmedCount: 142,
    completedCount: 128,
    cancelledCount: 14,
    activeCount: 8,
    conversionRate: 60.7,
    avgBookingValuePaise: 350000000, // ₹3,50,000
  ),
  performance: PerformanceMetrics(
    avgRating: 4.8,
    totalReviews: 89,
    profileViews: 2847,
    profileViewsChange: 23,
    responseRate: 95.0,
    avgResponseMinutes: 18,
    repeatCustomers: 12,
    ratingDistribution: {5: 52, 4: 28, 3: 6, 2: 2, 1: 1},
  ),
  monthlyRevenue: [
    MonthlyRevenue(month: 'Aug', revenuePaise: 180000000, bookingCount: 8),
    MonthlyRevenue(month: 'Sep', revenuePaise: 220000000, bookingCount: 10),
    MonthlyRevenue(month: 'Oct', revenuePaise: 310000000, bookingCount: 14),
    MonthlyRevenue(month: 'Nov', revenuePaise: 450000000, bookingCount: 18),
    MonthlyRevenue(month: 'Dec', revenuePaise: 520000000, bookingCount: 22),
    MonthlyRevenue(month: 'Jan', revenuePaise: 380000000, bookingCount: 16),
    MonthlyRevenue(month: 'Feb', revenuePaise: 250000000, bookingCount: 12),
  ],
  packageBreakdown: [
    PackageBreakdown(name: 'Royal', bookingCount: 35, revenuePaise: 175000000000, percentage: 42),
    PackageBreakdown(name: 'Gold', bookingCount: 62, revenuePaise: 186000000000, percentage: 35),
    PackageBreakdown(name: 'Silver', bookingCount: 45, revenuePaise: 67500000000, percentage: 23),
  ],
  leadSources: [
    LeadSource(name: 'WeddingOS Search', count: 98, percentage: 42),
    LeadSource(name: 'Direct Profile', count: 62, percentage: 26),
    LeadSource(name: 'Referrals', count: 45, percentage: 19),
    LeadSource(name: 'Social Media', count: 29, percentage: 13),
  ],
  recentActivity: [
    ActivityItem(title: 'New Enquiry', subtitle: 'Sneha & Karthik · Wedding Reception', timeAgo: '12m ago', type: ActivityType.enquiry),
    ActivityItem(title: 'Booking Confirmed', subtitle: 'Divya & Pranav · Royal Package', timeAgo: '2h ago', type: ActivityType.booking),
    ActivityItem(title: 'Payment Received', subtitle: '₹2,50,000 escrow from Priya & Rohit', timeAgo: '5h ago', type: ActivityType.payment),
    ActivityItem(title: 'New Review ★ 5.0', subtitle: 'Harini & Vishnu · "Absolutely magical venue!"', timeAgo: '1d ago', type: ActivityType.review),
    ActivityItem(title: 'Profile Updated', subtitle: 'Added 3 new portfolio photos', timeAgo: '2d ago', type: ActivityType.profile),
    ActivityItem(title: 'Enquiry Quoted', subtitle: 'Meera & Arjun · Gold Package ₹3,00,000', timeAgo: '2d ago', type: ActivityType.enquiry),
    ActivityItem(title: 'Payment Released', subtitle: '₹3,75,000 from Sowmya & Deepak', timeAgo: '3d ago', type: ActivityType.payment),
    ActivityItem(title: 'New Review ★ 4.9', subtitle: 'Lakshmi & Arun · "Perfect wedding venue"', timeAgo: '4d ago', type: ActivityType.review),
  ],
);

final _mockLeads = [
  const VendorLead(
    id: 'lead-1', customerName: 'Sneha & Karthik', phone: '9876543201',
    eventType: 'Wedding Reception', eventDate: '20 Feb 2025', guestCount: 500,
    budgetPaise: 400000000, status: LeadStatus.newLead, receivedAgo: '12 min ago',
    notes: 'Looking for a grand venue with lawn area', priority: 1,
  ),
  const VendorLead(
    id: 'lead-2', customerName: 'Meera & Arjun', phone: '9876543202',
    eventType: 'Engagement', eventDate: '15 Mar 2025', guestCount: 200,
    budgetPaise: 150000000, status: LeadStatus.quoted, receivedAgo: '2 days ago',
    priority: 2,
  ),
  const VendorLead(
    id: 'lead-3', customerName: 'Anjali & Vikram', phone: '9876543203',
    eventType: 'Mehendi + Sangeet', eventDate: '28 Feb 2025', guestCount: 150,
    budgetPaise: 100000000, status: LeadStatus.contacted, receivedAgo: '3 days ago',
    notes: 'Wants indoor and outdoor options', priority: 2,
  ),
  const VendorLead(
    id: 'lead-4', customerName: 'Priya & Aditya', phone: '9876543204',
    eventType: 'Wedding', eventDate: '5 Apr 2025', guestCount: 800,
    budgetPaise: 600000000, status: LeadStatus.negotiating, receivedAgo: '5 days ago',
    notes: 'Comparing with 2 other venues, price sensitive', priority: 1,
  ),
  const VendorLead(
    id: 'lead-5', customerName: 'Kavitha & Prasad', phone: '9876543205',
    eventType: 'Reception', eventDate: '10 Apr 2025', guestCount: 400,
    budgetPaise: 250000000, status: LeadStatus.newLead, receivedAgo: '1 hour ago',
    priority: 1,
  ),
  const VendorLead(
    id: 'lead-6', customerName: 'Deepa & Sunil', phone: '9876543206',
    eventType: 'Wedding', eventDate: '1 May 2025', guestCount: 600,
    budgetPaise: 500000000, status: LeadStatus.won, receivedAgo: '1 week ago',
    priority: 3,
  ),
  const VendorLead(
    id: 'lead-7', customerName: 'Rani & Mohan', phone: '9876543207',
    eventType: 'Sangeet Night', eventDate: '12 Mar 2025', guestCount: 250,
    budgetPaise: 120000000, status: LeadStatus.lost, receivedAgo: '2 weeks ago',
    notes: 'Chose another venue — budget', priority: 3,
  ),
];

final _mockCalendarEvents = [
  CalendarEvent(
    id: 'cal-1', title: 'Wedding - Divya & Pranav', customerName: 'Divya & Pranav',
    date: DateTime(2025, 4, 10), timeSlot: '10:00 AM - 10:00 PM',
    type: CalendarEventType.confirmed, packageName: 'Royal Package', amountPaise: 500000000,
  ),
  CalendarEvent(
    id: 'cal-2', title: 'Reception - Priya & Rohit', customerName: 'Priya & Rohit',
    date: DateTime(2025, 4, 25), timeSlot: '6:00 PM - 11:00 PM',
    type: CalendarEventType.confirmed, packageName: 'Premium Package', amountPaise: 275000000,
  ),
  CalendarEvent(
    id: 'cal-3', title: 'Wedding - Kavya & Suresh', customerName: 'Kavya & Suresh',
    date: DateTime(2025, 5, 1), timeSlot: 'Full Day',
    type: CalendarEventType.confirmed, packageName: 'Royal Package', amountPaise: 850000000,
  ),
  CalendarEvent(
    id: 'cal-4', title: 'Wedding - Lakshmi & Arun', customerName: 'Lakshmi & Arun',
    date: DateTime(2025, 5, 15), timeSlot: '9:00 AM - 9:00 PM',
    type: CalendarEventType.confirmed, packageName: 'Grand Package', amountPaise: 400000000,
  ),
  CalendarEvent(
    id: 'cal-5', title: 'Sangeet - Radha & Kishore', customerName: 'Radha & Kishore',
    date: DateTime(2025, 5, 20), timeSlot: '7:00 PM - 12:00 AM',
    type: CalendarEventType.tentative, amountPaise: 150000000,
  ),
  CalendarEvent(
    id: 'cal-6', title: 'Blocked - Renovation', customerName: '-',
    date: DateTime(2025, 3, 1), timeSlot: 'Full Day',
    type: CalendarEventType.blocked,
  ),
  CalendarEvent(
    id: 'cal-7', title: 'Blocked - Renovation', customerName: '-',
    date: DateTime(2025, 3, 2), timeSlot: 'Full Day',
    type: CalendarEventType.blocked,
  ),
];

final _mockVendorReviews = [
  VendorReviewItem(
    id: 'vr-1', customerName: 'Harini & Vishnu', eventType: 'Wedding',
    rating: 5.0, body: 'Absolutely magical venue! The Royal Grand Palace exceeded all our expectations. The staff was incredibly attentive, the decorations were breathtaking, and every detail was perfect. Our guests kept complimenting the venue throughout the night.',
    date: DateTime(2025, 1, 18), qualityRating: 5.0, valueRating: 4.5, professionalismRating: 5.0,
    photoUrls: ['https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=200'],
  ),
  VendorReviewItem(
    id: 'vr-2', customerName: 'Sowmya & Deepak', eventType: 'Reception',
    rating: 5.0, body: 'The best reception venue in Hyderabad! Everything from the food to the ambiance was world class. Would highly recommend to anyone planning their wedding.',
    date: DateTime(2025, 1, 12), qualityRating: 5.0, valueRating: 5.0, professionalismRating: 5.0,
  ),
  VendorReviewItem(
    id: 'vr-3', customerName: 'Ananya & Raj', eventType: 'Wedding',
    rating: 4.8, body: 'Beautiful venue with amazing gardens. The indoor hall was gorgeous and could easily accommodate 800+ guests. Only minor issue was parking during peak time, but the valet team handled it well.',
    date: DateTime(2025, 1, 5), qualityRating: 5.0, valueRating: 4.0, professionalismRating: 5.0,
    vendorReply: 'Thank you Ananya & Raj! We\'ve added more valet staff for peak events. Glad you loved the venue!',
  ),
  VendorReviewItem(
    id: 'vr-4', customerName: 'Pooja & Nikhil', eventType: 'Engagement',
    rating: 4.5, body: 'Great venue for intimate events too. We had our engagement ceremony here with 200 guests and it felt perfect - not too big, not too small. Good food options.',
    date: DateTime(2024, 12, 20), qualityRating: 4.5, valueRating: 4.0, professionalismRating: 4.5,
  ),
  VendorReviewItem(
    id: 'vr-5', customerName: 'Swathi & Ganesh', eventType: 'Wedding + Reception',
    rating: 4.9, body: 'We had both our wedding and reception here. The team managed two back-to-back events flawlessly. The transition from the mandap to the reception area was seamless.',
    date: DateTime(2024, 12, 8), qualityRating: 5.0, valueRating: 4.5, professionalismRating: 5.0,
    photoUrls: [
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=200',
      'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=200',
    ],
  ),
  VendorReviewItem(
    id: 'vr-6', customerName: 'Meena & Kumar', eventType: 'Wedding',
    rating: 3.5, body: 'Decent venue but a bit overpriced for what you get. The lawn area is beautiful but the indoor AC could be better for summer weddings.',
    date: DateTime(2024, 11, 15), qualityRating: 3.5, valueRating: 3.0, professionalismRating: 4.0,
    vendorReply: 'Thank you for the feedback, Meena & Kumar. We\'ve upgraded our HVAC system since your event. We hope to serve you better next time!',
  ),
];
