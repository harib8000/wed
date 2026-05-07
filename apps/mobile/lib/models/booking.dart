// ─── Booking Status ───────────────────────────────────────────────────────────

enum BookingStatus {
  enquiry,
  quoteSent,
  quoteAccepted,
  advancePaid,
  confirmed,
  inProgress,
  completed,
  cancelled,
  disputed,
}

extension BookingStatusExt on BookingStatus {
  static BookingStatus fromString(String s) {
    const map = {
      'ENQUIRY': BookingStatus.enquiry,
      'QUOTE_SENT': BookingStatus.quoteSent,
      'QUOTE_ACCEPTED': BookingStatus.quoteAccepted,
      'ADVANCE_PAID': BookingStatus.advancePaid,
      'CONFIRMED': BookingStatus.confirmed,
      'IN_PROGRESS': BookingStatus.inProgress,
      'COMPLETED': BookingStatus.completed,
      'CANCELLED': BookingStatus.cancelled,
      'DISPUTED': BookingStatus.disputed,
    };
    return map[s] ?? BookingStatus.enquiry;
  }

  String get label {
    const labels = {
      BookingStatus.enquiry: 'Enquiry Sent',
      BookingStatus.quoteSent: 'Quote Received',
      BookingStatus.quoteAccepted: 'Quote Accepted',
      BookingStatus.advancePaid: 'Advance Paid',
      BookingStatus.confirmed: 'Confirmed',
      BookingStatus.inProgress: 'In Progress',
      BookingStatus.completed: 'Completed',
      BookingStatus.cancelled: 'Cancelled',
      BookingStatus.disputed: 'Disputed',
    };
    return labels[this] ?? 'Unknown';
  }

  bool get isActive => [
        BookingStatus.confirmed,
        BookingStatus.advancePaid,
        BookingStatus.inProgress,
        BookingStatus.quoteAccepted,
      ].contains(this);

  bool get isPending => [
        BookingStatus.enquiry,
        BookingStatus.quoteSent,
      ].contains(this);
}

// ─── Booking Event ────────────────────────────────────────────────────────────

class BookingEvent {
  final String eventType;
  final String actorRole;
  final Map<String, dynamic> payload;
  final DateTime createdAt;

  const BookingEvent({
    required this.eventType,
    required this.actorRole,
    required this.payload,
    required this.createdAt,
  });

  factory BookingEvent.fromJson(Map<String, dynamic> json) => BookingEvent(
        eventType: json['eventType'] as String,
        actorRole: json['actorRole'] as String,
        payload: (json['payload'] as Map<String, dynamic>?) ?? {},
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

// ─── Booking ──────────────────────────────────────────────────────────────────

class Booking {
  final String id;
  final String bookingNumber;
  final BookingStatus status;
  final String vendorId;
  final String vendorName;
  final String vendorCategory;
  final String? vendorImage;
  final String? packageId;
  final String? packageName;
  final DateTime eventDate;
  final String eventType;
  final String eventCity;
  final String? requirements;
  final int? guestCount;
  final int? quotedAmountPaise;
  final int? finalAmountPaise;
  final int? advanceAmountPaise;
  final int? platformFeePaise;
  final String? vendorQuoteNote;
  final DateTime? quoteSentAt;
  final DateTime? advancePaidAt;
  final DateTime? confirmedAt;
  final DateTime createdAt;
  final List<BookingEvent> events;

  const Booking({
    required this.id,
    required this.bookingNumber,
    required this.status,
    required this.vendorId,
    required this.vendorName,
    required this.vendorCategory,
    this.vendorImage,
    this.packageId,
    this.packageName,
    required this.eventDate,
    required this.eventType,
    required this.eventCity,
    this.requirements,
    this.guestCount,
    this.quotedAmountPaise,
    this.finalAmountPaise,
    this.advanceAmountPaise,
    this.platformFeePaise,
    this.vendorQuoteNote,
    this.quoteSentAt,
    this.advancePaidAt,
    this.confirmedAt,
    required this.createdAt,
    this.events = const [],
  });

  factory Booking.fromJson(Map<String, dynamic> json) => Booking(
        id: json['id'] as String,
        bookingNumber: json['bookingNumber'] as String,
        status: BookingStatusExt.fromString(json['status'] as String),
        vendorId: json['vendorId'] as String,
        vendorName: json['vendorName'] as String? ?? 'Unknown Vendor',
        vendorCategory: json['vendorCategory'] as String? ?? '',
        vendorImage: json['vendorImage'] as String?,
        packageId: json['packageId'] as String?,
        packageName: json['packageName'] as String?,
        eventDate: DateTime.parse(json['eventDate'] as String),
        eventType: json['eventType'] as String,
        eventCity: json['eventCity'] as String,
        requirements: json['requirements'] as String?,
        guestCount: json['guestCount'] as int?,
        quotedAmountPaise: json['quotedAmountPaise'] as int?,
        finalAmountPaise: json['finalAmountPaise'] as int?,
        advanceAmountPaise: json['advanceAmountPaise'] as int?,
        platformFeePaise: json['platformFeePaise'] as int?,
        vendorQuoteNote: json['vendorQuoteNote'] as String?,
        quoteSentAt: json['quoteSentAt'] != null ? DateTime.parse(json['quoteSentAt'] as String) : null,
        advancePaidAt: json['advancePaidAt'] != null ? DateTime.parse(json['advancePaidAt'] as String) : null,
        confirmedAt: json['confirmedAt'] != null ? DateTime.parse(json['confirmedAt'] as String) : null,
        createdAt: DateTime.parse(json['createdAt'] as String),
        events: (json['events'] as List<dynamic>?)
                ?.map((e) => BookingEvent.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [],
      );
}
