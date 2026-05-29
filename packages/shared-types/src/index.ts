// Shared types for WeddingOS platform

export interface VendorProfile {
  id: string;
  businessName: string;
  category: string;
  city: string;
  citiesServed: string[];
  rating: number;
  totalReviews: number;
  totalBookings: number;
  basePrice: number;
  coverImage?: string;
  portfolio?: string[];
  description?: string;
  yearsExperience?: number;
  teamSize?: number;
  featured?: boolean;
  responseTimeHours?: number;
  cancellationRate?: number;
  tags?: string[];
  verificationStatus: 'PENDING_KYC' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  bankAccountNo?: string;
  bankIfsc?: string;
  bankAccountName?: string;
  upiId?: string;
}

export interface BookingDetail {
  id: string;
  bookingNumber: string;
  customerId: string;
  vendorId: string;
  vendorName?: string;
  vendorCategory?: string;
  eventDate?: string;
  eventType?: string;
  eventCity?: string;
  status: BookingStatus;
  quotedAmountPaise?: number;
  finalAmountPaise?: number;
  advanceAmountPaise?: number;
  requirements?: string;
  vendorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus =
  | 'ENQUIRY'
  | 'QUOTE_SENT'
  | 'QUOTE_ACCEPTED'
  | 'ADVANCE_PAID'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface UserProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  email?: string;
  dateOfBirth?: string;
  city?: string;
  state?: string;
  pincode?: string;
  partnerName?: string;
  weddingDate?: string;
  estimatedBudgetPaise?: number;
  guestCount?: number;
  venueCity?: string;
  whatsappNotif: boolean;
  emailNotif: boolean;
  pushNotif: boolean;
  smsNotif: boolean;
}

export interface GuestEntry {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  side: 'BRIDE' | 'GROOM' | 'MUTUAL';
  group: 'FAMILY' | 'FRIENDS' | 'COLLEAGUES' | 'NEIGHBOURS' | 'OTHERS';
  rsvpStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'MAYBE';
  mealPreference: 'VEG' | 'NON_VEG' | 'JAIN' | 'VEGAN' | 'NO_PREFERENCE';
  plusOnes: number;
  tableNumber?: string;
  roomAllocation?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  channel: 'PUSH' | 'SMS' | 'EMAIL' | 'WHATSAPP' | 'IN_APP';
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TimelineTask {
  id: string;
  timelineId: string;
  title: string;
  category: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED';
  dueDate?: string;
  dueDaysBeforeWedding?: number;
  sortOrder: number;
  isSystemGenerated: boolean;
  linkedBookingId?: string;
  assignedVendorId?: string;
  completedAt?: string;
}

export interface WeddingTimeline {
  id: string;
  customerId: string;
  weddingDate: string;
  tasks: TimelineTask[];
  createdAt: string;
  updatedAt: string;
}
