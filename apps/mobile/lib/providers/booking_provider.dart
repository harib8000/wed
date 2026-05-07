import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../models/booking.dart';

// ─── Booking List ─────────────────────────────────────────────────────────────

class BookingsNotifier extends StateNotifier<AsyncValue<List<Booking>>> {
  BookingsNotifier() : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final res = await ApiClient.dio.get('/bookings');
      final list = (res.data['data']['bookings'] as List<dynamic>)
          .map((b) => Booking.fromJson(b as Map<String, dynamic>))
          .toList();
      state = AsyncValue.data(list);
    } catch (e) {
      debugPrint('Bookings fetch failed, using mock data: $e');
      state = AsyncValue.data(_mockBookings);
    }
  }

  Future<Booking?> createBooking(Map<String, dynamic> payload) async {
    try {
      final res = await ApiClient.dio.post('/bookings', data: payload);
      final booking = Booking.fromJson(res.data['data']['booking'] as Map<String, dynamic>);
      state.whenData((list) => state = AsyncValue.data([booking, ...list]));
      return booking;
    } catch (e) {
      return null;
    }
  }

  Future<void> cancelBooking(String bookingId, String reason) async {
    try {
      await ApiClient.dio.patch('/bookings/$bookingId/cancel', data: {'reason': reason});
      load();
    } catch (e) {
      debugPrint('Cancel booking failed: $e');
      rethrow;
    }
  }
}

final bookingsProvider =
    StateNotifierProvider<BookingsNotifier, AsyncValue<List<Booking>>>(
  (ref) => BookingsNotifier(),
);

// ─── Single Booking Detail ────────────────────────────────────────────────────

final bookingDetailProvider = FutureProvider.family<Booking, String>((ref, id) async {
  try {
    final res = await ApiClient.dio.get('/bookings/$id');
    return Booking.fromJson(res.data['data']['booking'] as Map<String, dynamic>);
  } catch (_) {
    return _mockBookings.firstWhere(
      (b) => b.id == id,
      orElse: () => _mockBookings.first,
    );
  }
});

// ─── Mock data ────────────────────────────────────────────────────────────────

final _mockBookings = [
  Booking(
    id: 'b1',
    bookingNumber: 'WOS-001234',
    vendorId: 'v1',
    packageId: 'p2',
    vendorName: 'Royal Grand Palace',
    vendorCategory: 'VENUE',
    vendorImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80',
    packageName: 'Gold Package',
    eventDate: DateTime.now().add(const Duration(days: 90)),
    eventType: 'WEDDING',
    eventCity: 'Hyderabad',
    guestCount: 500,
    status: BookingStatus.confirmed,
    quotedAmountPaise: 100000000,
    finalAmountPaise: 100000000,
    advanceAmountPaise: 25000000,
    events: [
      BookingEvent(eventType: 'BOOKING_CREATED', actorRole: 'customer', payload: {}, createdAt: DateTime.now().subtract(const Duration(days: 5))),
      BookingEvent(eventType: 'QUOTE_SENT', actorRole: 'vendor', payload: {'note': 'Quote sent as requested'}, createdAt: DateTime.now().subtract(const Duration(days: 4))),
      BookingEvent(eventType: 'BOOKING_CONFIRMED', actorRole: 'customer', payload: {}, createdAt: DateTime.now().subtract(const Duration(days: 3))),
    ],
    confirmedAt: DateTime.now().subtract(const Duration(days: 3)),
    createdAt: DateTime.now().subtract(const Duration(days: 5)),
  ),
  Booking(
    id: 'b2',
    bookingNumber: 'WOS-001235',
    vendorId: 'v2',
    packageId: 'p5',
    vendorName: 'Srikanth Photography',
    vendorCategory: 'PHOTOGRAPHY',
    vendorImage: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=600&q=80',
    packageName: 'Standard Package',
    eventDate: DateTime.now().add(const Duration(days: 90)),
    eventType: 'WEDDING',
    eventCity: 'Hyderabad',
    status: BookingStatus.enquiry,
    quotedAmountPaise: 12000000,
    events: [
      BookingEvent(eventType: 'BOOKING_CREATED', actorRole: 'customer', payload: {}, createdAt: DateTime.now().subtract(const Duration(days: 1))),
    ],
    createdAt: DateTime.now().subtract(const Duration(days: 1)),
  ),
  Booking(
    id: 'b3',
    bookingNumber: 'WOS-001200',
    vendorId: 'v3',
    packageId: 'p8',
    vendorName: 'Flavours Catering Co.',
    vendorCategory: 'CATERING',
    vendorImage: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80',
    packageName: 'Standard Menu',
    eventDate: DateTime.now().subtract(const Duration(days: 30)),
    eventType: 'WEDDING',
    eventCity: 'Hyderabad',
    guestCount: 400,
    status: BookingStatus.completed,
    quotedAmountPaise: 64000000,
    finalAmountPaise: 64000000,
    advanceAmountPaise: 64000000,
    events: [
      BookingEvent(eventType: 'BOOKING_COMPLETED', actorRole: 'system', payload: {}, createdAt: DateTime.now().subtract(const Duration(days: 30))),
    ],
    createdAt: DateTime.now().subtract(const Duration(days: 100)),
  ),
];
