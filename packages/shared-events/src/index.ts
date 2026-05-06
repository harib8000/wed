// Domain Events — all events published to the message bus

export type DomainEventType =
  // Auth events
  | 'auth.otp_sent'
  | 'auth.user_registered'
  | 'auth.login_success'
  // Vendor events
  | 'vendor.registered'
  | 'vendor.kyc_submitted'
  | 'vendor.kyc_approved'
  | 'vendor.kyc_rejected'
  | 'vendor.profile_updated'
  | 'vendor.subscription_changed'
  // Booking events
  | 'booking.enquiry_created'
  | 'booking.quote_sent'
  | 'booking.confirmed'
  | 'booking.advance_paid'
  | 'booking.completed'
  | 'booking.cancelled'
  | 'booking.disputed'
  // Payment events
  | 'payment.captured'
  | 'payment.failed'
  | 'payment.refunded'
  | 'escrow.created'
  | 'escrow.released'
  | 'escrow.disputed'
  | 'payout.processed'
  | 'payout.failed'
  // Event execution events
  | 'event.created'
  | 'event.task_completed'
  | 'event.vendor_checked_in'
  | 'event.issue_reported'
  | 'event.completed'
  // Review events
  | 'review.created';

export interface DomainEvent<T = unknown> {
  id: string;
  type: DomainEventType;
  occurredAt: string; // ISO string
  aggregateId: string;
  aggregateType: string;
  payload: T;
  metadata?: Record<string, unknown>;
}

// ─── Event Payloads ──────────────────────────────────────────────────────────

export interface BookingEnquiryPayload {
  bookingId: string;
  customerId: string;
  vendorId: string;
  eventDate: string;
  totalAmount: number;
}

export interface PaymentCapturedPayload {
  paymentId: string;
  bookingId: string;
  vendorId: string;
  customerId: string;
  amount: number;
  gatewayPaymentId: string;
}

export interface EscrowCreatedPayload {
  escrowId: string;
  paymentId: string;
  bookingId: string;
  vendorId: string;
  heldAmount: number;
  platformFee: number;
  vendorPayout: number;
}

export interface VendorCheckedInPayload {
  eventId: string;
  bookingId: string;
  vendorId: string;
  checkedInAt: string;
  lat?: number;
  lng?: number;
}

export interface NotificationRequestPayload {
  userId: string;
  channels: string[];
  template: string;
  variables: Record<string, string>;
}
