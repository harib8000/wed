// ─── User & Auth Types ──────────────────────────────────────────────────────

export type UserRole = 'customer' | 'vendor' | 'coordinator' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface User {
  id: string;
  phone: string;
  email?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  languagePreference: string;
  notificationPreferences: NotificationPreferences;
}

export interface NotificationPreferences {
  push: boolean;
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
}

export interface JwtPayload {
  sub: string;       // user id
  role: UserRole;
  phone: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  deviceId?: string;
  jti: string;       // unique token id
}

// ─── Vendor Types ───────────────────────────────────────────────────────────

export type VendorCategory =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'videography'
  | 'decor'
  | 'makeup'
  | 'mehendi'
  | 'music'
  | 'transport'
  | 'invitation'
  | 'priest'
  | 'other';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type KycStatus = 'not_submitted' | 'submitted' | 'approved' | 'rejected';
export type SubscriptionTier = 'free' | 'premium' | 'enterprise';
export type PriceType = 'fixed' | 'per_plate' | 'per_hour' | 'per_day' | 'custom';

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  category: VendorCategory;
  subCategories: string[];
  description?: string;
  verificationStatus: VerificationStatus;
  kycStatus: KycStatus;
  citiesServed: string[];
  yearsExperience?: number;
  teamSize?: number;
  basePrice?: number;
  rating: number;
  totalReviews: number;
  totalBookings: number;
  isFeatured: boolean;
  subscriptionTier: SubscriptionTier;
  createdAt: Date;
}

export interface VendorPackage {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  price: number;
  priceType: PriceType;
  inclusions: string[];
  exclusions: string[];
  minGuests?: number;
  maxGuests?: number;
  advancePercentage: number;
  isActive: boolean;
}

// ─── Booking Types ───────────────────────────────────────────────────────────

export type BookingStatus =
  | 'enquiry'
  | 'quoted'
  | 'confirmed'
  | 'advance_paid'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type EventType =
  | 'wedding'
  | 'engagement'
  | 'reception'
  | 'sangeet'
  | 'mehendi'
  | 'haldi'
  | 'birthday'
  | 'corporate'
  | 'other';

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  vendorId: string;
  eventId?: string;
  packageId?: string;
  status: BookingStatus;
  eventDate: Date;
  eventTime?: string;
  eventLocation?: string;
  totalAmount: number;
  advanceAmount?: number;
  advancePaid: boolean;
  finalAmount?: number;
  specialRequirements?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  customerId: string;
  eventName: string;
  eventType: EventType;
  weddingDate?: Date;
  venueCity?: string;
  totalBudget?: number;
  allocatedBudget: number;
  guestCount?: number;
  status: 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
}

// ─── Payment Types ───────────────────────────────────────────────────────────

export type PaymentType = 'advance' | 'milestone' | 'final' | 'refund' | 'platform_fee';
export type PaymentStatus = 'initiated' | 'processing' | 'success' | 'failed' | 'refunded';
export type PaymentGateway = 'razorpay' | 'stripe' | 'manual';

export type EscrowStatus =
  | 'holding'
  | 'partial_released'
  | 'release_pending'
  | 'fully_released'
  | 'disputed'
  | 'refunded';

export type EscrowReleaseTrigger = 'manual' | 'auto_7day' | 'customer_confirm' | 'milestone';

export interface Payment {
  id: string;
  bookingId: string;
  payerId: string;
  payeeId: string;
  amount: number;
  currency: string;
  paymentType: PaymentType;
  status: PaymentStatus;
  gateway: PaymentGateway;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  createdAt: Date;
}

export interface EscrowHold {
  id: string;
  paymentId: string;
  bookingId: string;
  vendorId: string;
  heldAmount: number;
  platformFee: number;
  vendorPayout: number;
  status: EscrowStatus;
  holdExpiry?: Date;
  releaseTrigger?: EscrowReleaseTrigger;
  releasedAt?: Date;
  createdAt: Date;
}

// ─── Task & Execution Types ──────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'skipped';
export type TaskOwner = 'customer' | 'vendor' | 'coordinator' | 'system';

export interface Task {
  id: string;
  eventId: string;
  bookingId?: string;
  title: string;
  description?: string;
  dueDate: Date;
  dueDaysBeforeEvent: number;
  status: TaskStatus;
  owner: TaskOwner;
  assignedUserId?: string;
  dependsOnTaskId?: string;
  isAutoGenerated: boolean;
  createdAt: Date;
}

// ─── Review Types ────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  vendorId: string;
  rating: number;
  comment?: string;
  photoUrls: string[];
  isVerified: boolean;
  createdAt: Date;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
    pagination?: {
      cursor?: string;
      hasNext: boolean;
      totalCount?: number;
    };
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Notification Types ──────────────────────────────────────────────────────

export type NotificationChannel = 'push' | 'sms' | 'whatsapp' | 'email' | 'in_app';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationPayload {
  userId: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  template: string;
  variables: Record<string, string>;
  data?: Record<string, unknown>;
}

// ─── Search Types ────────────────────────────────────────────────────────────

export interface VendorSearchFilters {
  query?: string;
  category?: VendorCategory;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  availabilityDate?: string;
  verifiedOnly?: boolean;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  cursor?: string;
  limit?: number;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';
}

export interface VendorSearchResult {
  vendors: VendorSearchItem[];
  cursor?: string;
  hasNext: boolean;
  total: number;
}

export interface VendorSearchItem {
  id: string;
  businessName: string;
  category: VendorCategory;
  citiesServed: string[];
  basePrice?: number;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  isFeatured: boolean;
  coverPhotoUrl?: string;
  score?: number;
}
