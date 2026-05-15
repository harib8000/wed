'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, MapPin, Phone, CheckCircle2, Circle, Clock, Shield, AlertTriangle, ChevronRight, Building2, Camera, MessageSquare, XCircle, Star } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/authStore';
import { bookingApi, paymentApi } from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ─────────────────────────────────────────────────
type BookingStatus = 'ENQUIRY' | 'QUOTE_SENT' | 'QUOTE_ACCEPTED' | 'ADVANCE_PAID' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

interface BookingDetail {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  eventDate: string;
  eventType: string;
  eventCity: string;
  requirements?: string;
  guestCount?: number;
  specialNotes?: string;
  vendorId: string;
  vendorName: string;
  vendorCategory: string;
  vendorImage: string;
  vendorPhone?: string;
  packageName?: string;
  quotedAmountPaise?: number;
  finalAmountPaise?: number;
  advanceAmountPaise?: number;
  platformFeePaise?: number;
  vendorQuoteNote?: string;
  quoteSentAt?: string;
  advancePaidAt?: string;
  confirmedAt?: string;
  completedAt?: string;
  createdAt: string;
  events?: { eventType: string; actorRole: string; payload: any; createdAt: string }[];
}

// ─── Mock detail data ───────────────────────────────────────
const MOCK_DETAIL: Record<string, BookingDetail> = {
  b1: { id: 'b1', bookingNumber: 'WOS-001', status: 'CONFIRMED', eventDate: '2025-03-15', eventType: 'WEDDING', eventCity: 'Hyderabad', guestCount: 500, vendorId: 'v1', vendorName: 'Royal Grand Palace', vendorCategory: 'Venue', vendorImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80', vendorPhone: '+91 98765 43210', packageName: 'Gold Package', quotedAmountPaise: 50000000, finalAmountPaise: 50000000, advanceAmountPaise: 15000000, platformFeePaise: 5000000, vendorQuoteNote: 'Includes full décor, catering for 500 guests, parking, and bridal suite.', quoteSentAt: '2025-01-06T10:00:00Z', advancePaidAt: '2025-01-08T14:30:00Z', confirmedAt: '2025-01-08T14:32:00Z', createdAt: '2025-01-01T09:00:00Z', events: [{ eventType: 'ENQUIRY_CREATED', actorRole: 'customer', payload: {}, createdAt: '2025-01-01T09:00:00Z' }, { eventType: 'QUOTE_SENT', actorRole: 'vendor', payload: { quotedAmountPaise: 50000000 }, createdAt: '2025-01-06T10:00:00Z' }, { eventType: 'QUOTE_ACCEPTED', actorRole: 'customer', payload: {}, createdAt: '2025-01-07T11:00:00Z' }, { eventType: 'ADVANCE_PAID', actorRole: 'customer', payload: { amountPaise: 15000000 }, createdAt: '2025-01-08T14:30:00Z' }, { eventType: 'CONFIRMED', actorRole: 'system', payload: {}, createdAt: '2025-01-08T14:32:00Z' }] },
  b2: { id: 'b2', bookingNumber: 'WOS-002', status: 'QUOTE_SENT', eventDate: '2025-03-15', eventType: 'WEDDING', eventCity: 'Hyderabad', vendorId: 'v2', vendorName: 'Srikanth Photography', vendorCategory: 'Photography', vendorImage: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=800&q=80', quotedAmountPaise: 12000000, vendorQuoteNote: 'Includes 2 photographers, drone, 500 edited photos, 10-min highlight video, and same-day teaser.', quoteSentAt: '2025-01-10T15:00:00Z', createdAt: '2025-01-05T09:00:00Z', events: [{ eventType: 'ENQUIRY_CREATED', actorRole: 'customer', payload: {}, createdAt: '2025-01-05T09:00:00Z' }, { eventType: 'QUOTE_SENT', actorRole: 'vendor', payload: { quotedAmountPaise: 12000000 }, createdAt: '2025-01-10T15:00:00Z' }] },
  b3: { id: 'b3', bookingNumber: 'WOS-003', status: 'ADVANCE_PAID', eventDate: '2025-03-15', eventType: 'WEDDING', eventCity: 'Hyderabad', guestCount: 300, vendorId: 'v3', vendorName: 'Flavours Catering Co.', vendorCategory: 'Catering', vendorImage: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80', quotedAmountPaise: 24000000, finalAmountPaise: 24000000, advanceAmountPaise: 7200000, platformFeePaise: 2400000, createdAt: '2025-01-08T09:00:00Z', events: [] },
};

// ─── Escrow milestone config ────────────────────────────────
const ESCROW_STEPS: { status: BookingStatus; label: string; description: string }[] = [
  { status: 'ENQUIRY',        label: 'Enquiry Sent',    description: 'You sent an enquiry to the vendor' },
  { status: 'QUOTE_SENT',     label: 'Quote Received',  description: 'Vendor has reviewed and sent a quote' },
  { status: 'QUOTE_ACCEPTED', label: 'Quote Accepted',  description: 'You accepted the vendor\'s quote' },
  { status: 'ADVANCE_PAID',   label: 'Advance Paid',    description: '30% advance held securely in escrow' },
  { status: 'CONFIRMED',      label: 'Booking Confirmed', description: 'Vendor confirmed. Your date is locked!' },
  { status: 'IN_PROGRESS',    label: 'Event Day',       description: 'Wedding day in progress' },
  { status: 'COMPLETED',      label: 'Completed ✓',     description: 'Service complete. Balance released to vendor.' },
];

const STATUS_ORDER = ESCROW_STEPS.map(s => s.status);

function getStepIndex(status: BookingStatus) {
  return STATUS_ORDER.indexOf(status);
}

function formatCurrency(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Event type labels ──────────────────────────────────────
const EVENT_LABELS: Record<string, string> = {
  ENQUIRY_CREATED: 'Enquiry created',
  QUOTE_SENT: 'Vendor sent a quote',
  QUOTE_ACCEPTED: 'You accepted the quote',
  ADVANCE_PAID: 'Advance payment made',
  CONFIRMED: 'Booking confirmed',
  IN_PROGRESS: 'Service in progress',
  COMPLETED: 'Service completed',
  CANCELLED: 'Booking cancelled',
  DISPUTED: 'Dispute raised',
};

// ─── Page ──────────────────────────────────────────────────
export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingQuote, setAcceptingQuote] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!params.id) return;
    bookingApi.getById(params.id)
      .then((res) => setBooking(res.data.data.booking))
      .catch(() => setBooking(MOCK_DETAIL[params.id] ?? null))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const handleAcceptQuote = async () => {
    if (!booking) return;
    setAcceptingQuote(true);
    try {
      // Navigate to checkout to pay advance
      router.push(`/checkout/${booking.vendorId}?bookingId=${booking.id}&amount=${booking.quotedAmountPaise}`);
    } finally {
      setAcceptingQuote(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />)}
          </div>
        </div>
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Booking not found</h2>
            <Link href="/bookings" className="text-brand-600 text-sm">← Back to bookings</Link>
          </div>
        </div>
      </>
    );
  }

  const currentStep = getStepIndex(booking.status);
  const isCancelled = booking.status === 'CANCELLED' || booking.status === 'DISPUTED';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pb-24">
        {/* ── Vendor hero banner ── */}
        <div className="relative h-48 sm:h-56">
          <Image src={booking.vendorImage} alt={booking.vendorName} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />

          {/* Back button */}
          <Link href="/bookings" className="absolute top-4 left-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>

          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white/60 text-xs mb-1">{booking.bookingNumber}</p>
            <h1 className="text-white font-bold text-xl">{booking.vendorName}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-white/70 text-sm">{booking.vendorCategory}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/70 text-sm flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(booking.eventDate)}</span>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 space-y-4 mt-4">
          {/* ── Action banner (for QUOTE_SENT) ── */}
          {booking.status === 'QUOTE_SENT' && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-800 text-sm mb-1">You have a quote to review</h3>
                  <p className="text-orange-700 text-xs mb-3">{booking.vendorQuoteNote}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-orange-600 text-xs">Quoted Amount</span>
                    <span className="text-orange-800 font-bold text-lg">{formatCurrency(booking.quotedAmountPaise!)}</span>
                  </div>
                  <button
                    onClick={handleAcceptQuote}
                    disabled={acceptingQuote}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                  >
                    {acceptingQuote ? 'Processing...' : 'Accept Quote & Pay Advance'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Escrow Timeline ── */}
          {!isCancelled && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-5">
                <Shield className="w-5 h-5 text-brand-600" />
                <h2 className="font-semibold text-gray-900">Escrow Protection Timeline</h2>
              </div>

              <div className="space-y-0">
                {ESCROW_STEPS.map((step, i) => {
                  const done = i < currentStep;
                  const active = i === currentStep;
                  const future = i > currentStep;

                  return (
                    <div key={step.status} className="flex gap-3">
                      {/* Line + dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                          done ? 'bg-green-500' : active ? 'bg-brand-600 ring-4 ring-brand-100' : 'bg-gray-100'
                        }`}>
                          {done ? <CheckCircle2 className="w-5 h-5 text-white" /> : active ? <Circle className="w-3 h-3 text-white fill-white" /> : <Circle className="w-3 h-3 text-gray-300" />}
                        </div>
                        {i < ESCROW_STEPS.length - 1 && (
                          <div className={`w-0.5 flex-1 min-h-[28px] my-1 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                        )}
                      </div>

                      {/* Text */}
                      <div className={`pb-4 ${i === ESCROW_STEPS.length - 1 ? 'pb-0' : ''}`}>
                        <p className={`text-sm font-semibold ${done ? 'text-green-700' : active ? 'text-brand-700' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        <p className={`text-xs mt-0.5 ${done || active ? 'text-gray-500' : 'text-gray-300'}`}>{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Payment summary ── */}
          {(booking.quotedAmountPaise || booking.finalAmountPaise) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Payment Summary</h2>
              <div className="space-y-3 text-sm">
                {booking.finalAmountPaise && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Amount</span>
                    <span className="font-semibold">{formatCurrency(booking.finalAmountPaise)}</span>
                  </div>
                )}
                {booking.platformFeePaise && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform Fee (incl. GST)</span>
                    <span className="font-semibold">{formatCurrency(booking.platformFeePaise)}</span>
                  </div>
                )}
                {booking.advanceAmountPaise && (
                  <>
                    <div className="border-t border-gray-100 pt-2 flex justify-between">
                      <span className="text-gray-500">Advance Paid (30%)</span>
                      <span className="font-semibold text-green-600">{formatCurrency(booking.advanceAmountPaise)}</span>
                    </div>
                    {booking.finalAmountPaise && (
                      <div className="flex justify-between text-brand-700">
                        <span className="font-semibold">Balance Due (on event day)</span>
                        <span className="font-bold">{formatCurrency(booking.finalAmountPaise - booking.advanceAmountPaise)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Event details ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Event Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Event Date', value: formatDate(booking.eventDate), icon: Calendar },
                { label: 'Location', value: booking.eventCity, icon: MapPin },
                { label: 'Event Type', value: booking.eventType, icon: Building2 },
                ...(booking.guestCount ? [{ label: 'Guest Count', value: `~${booking.guestCount.toLocaleString()}`, icon: Building2 }] : []),
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <item.icon className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-xs">{item.label}</p>
                    <p className="font-medium text-gray-800">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            {booking.requirements && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-gray-400 text-xs mb-1">Requirements</p>
                <p className="text-gray-700 text-sm">{booking.requirements}</p>
              </div>
            )}
          </div>

          {/* ── Activity log ── */}
          {booking.events && booking.events.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Activity</h2>
              <div className="space-y-3">
                {[...booking.events].reverse().map((ev, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-3 h-3 text-brand-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{EVENT_LABELS[ev.eventType] ?? ev.eventType}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(ev.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-3">
            <Link
              href={`/chat?vendorId=${booking.vendorId}`}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-brand-300 py-3 rounded-xl text-sm font-medium text-gray-700 transition"
            >
              <MessageSquare className="w-4 h-4 text-brand-500" />
              Message Vendor
            </Link>
            {booking.status === 'COMPLETED' && (
              <Link
                href={`/reviews/write/${booking.id}`}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 hover:border-amber-300 py-3 rounded-xl text-sm font-medium text-amber-700 transition"
              >
                <Star className="w-4 h-4" />
                Write Review
              </Link>
            )}
            {!['COMPLETED', 'CANCELLED'].includes(booking.status) && (
              <button
                disabled={cancelling}
                onClick={async () => {
                  if (!confirm('Are you sure you want to cancel this booking?')) return;
                  setCancelling(true);
                  try {
                    await bookingApi.cancel(booking.id, 'Cancelled by customer');
                    toast.success('Booking cancelled successfully');
                    router.push('/bookings');
                  } catch {
                    toast.error('Failed to cancel booking. Please try again.');
                  } finally {
                    setCancelling(false);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-red-200 hover:border-red-300 py-3 rounded-xl text-sm font-medium text-red-600 transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
