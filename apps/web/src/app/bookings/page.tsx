'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Clock, ChevronRight, Building2, Camera, Utensils, Sparkles, Music, Search, Filter } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/authStore';
import { bookingApi } from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────
type BookingStatus = 'ENQUIRY' | 'QUOTE_SENT' | 'QUOTE_ACCEPTED' | 'ADVANCE_PAID' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

interface Booking {
  id: string;
  bookingNumber: string;
  vendorId: string;
  vendorName: string;
  vendorCategory: string;
  vendorImage: string;
  eventDate: string;
  eventType: string;
  eventCity: string;
  status: BookingStatus;
  quotedAmountPaise?: number;
  finalAmountPaise?: number;
  advanceAmountPaise?: number;
  requirements?: string;
  createdAt: string;
}

// ─── Mock fallback data ─────────────────────────────────────
const MOCK_BOOKINGS: Booking[] = [
  { id: 'b1', bookingNumber: 'WOS-001', vendorId: 'v1', vendorName: 'Royal Grand Palace', vendorCategory: 'Venue', vendorImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80', eventDate: '2025-03-15', eventType: 'WEDDING', eventCity: 'Hyderabad', status: 'CONFIRMED', quotedAmountPaise: 50000000, finalAmountPaise: 50000000, advanceAmountPaise: 15000000, createdAt: '2025-01-01' },
  { id: 'b2', bookingNumber: 'WOS-002', vendorId: 'v2', vendorName: 'Srikanth Photography', vendorCategory: 'Photography', vendorImage: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=400&q=80', eventDate: '2025-03-15', eventType: 'WEDDING', eventCity: 'Hyderabad', status: 'QUOTE_SENT', quotedAmountPaise: 12000000, createdAt: '2025-01-05' },
  { id: 'b3', bookingNumber: 'WOS-003', vendorId: 'v3', vendorName: 'Flavours Catering Co.', vendorCategory: 'Catering', vendorImage: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&q=80', eventDate: '2025-03-15', eventType: 'WEDDING', eventCity: 'Hyderabad', status: 'ADVANCE_PAID', quotedAmountPaise: 24000000, finalAmountPaise: 24000000, advanceAmountPaise: 7200000, createdAt: '2025-01-08' },
  { id: 'b4', bookingNumber: 'WOS-004', vendorId: 'v4', vendorName: 'Blooms & Dreams Decor', vendorCategory: 'Decor', vendorImage: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=400&q=80', eventDate: '2025-03-14', eventType: 'WEDDING', eventCity: 'Hyderabad', status: 'ENQUIRY', createdAt: '2025-01-10' },
];

// ─── Status config ──────────────────────────────────────────
const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; dotColor: string }> = {
  ENQUIRY:        { label: 'Enquiry Sent',   color: 'text-blue-700',  bg: 'bg-blue-50',   dotColor: 'bg-blue-500' },
  QUOTE_SENT:     { label: 'Quote Received', color: 'text-orange-700',bg: 'bg-orange-50', dotColor: 'bg-orange-500' },
  QUOTE_ACCEPTED: { label: 'Quote Accepted', color: 'text-teal-700',  bg: 'bg-teal-50',   dotColor: 'bg-teal-500' },
  ADVANCE_PAID:   { label: 'Advance Paid',   color: 'text-purple-700',bg: 'bg-purple-50', dotColor: 'bg-purple-500' },
  CONFIRMED:      { label: 'Confirmed',      color: 'text-green-700', bg: 'bg-green-50',  dotColor: 'bg-green-500' },
  IN_PROGRESS:    { label: 'In Progress',    color: 'text-indigo-700',bg: 'bg-indigo-50', dotColor: 'bg-indigo-500' },
  COMPLETED:      { label: 'Completed',      color: 'text-gray-700',  bg: 'bg-gray-100',  dotColor: 'bg-gray-400' },
  CANCELLED:      { label: 'Cancelled',      color: 'text-red-700',   bg: 'bg-red-50',    dotColor: 'bg-red-500' },
  DISPUTED:       { label: 'Disputed',       color: 'text-yellow-700',bg: 'bg-yellow-50', dotColor: 'bg-yellow-500' },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Venue: Building2, Photography: Camera, Catering: Utensils, Decor: Sparkles, Music: Music,
};

const TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Completed', value: 'COMPLETED' },
];

const ACTIVE_STATUSES: BookingStatus[] = ['CONFIRMED', 'ADVANCE_PAID', 'IN_PROGRESS', 'QUOTE_ACCEPTED'];
const PENDING_STATUSES: BookingStatus[] = ['ENQUIRY', 'QUOTE_SENT'];

function formatCurrency(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Components ────────────────────────────────────────────
function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const CategoryIcon = CATEGORY_ICONS[booking.vendorCategory] ?? Building2;
  const showAmount = booking.quotedAmountPaise || booking.finalAmountPaise;

  return (
    <Link href={`/bookings/${booking.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="flex gap-0">
          {/* Vendor image */}
          <div className="relative w-28 sm:w-36 flex-shrink-0">
            <Image
              src={booking.vendorImage}
              alt={booking.vendorName}
              fill
              className="object-cover"
              sizes="144px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
          </div>

          {/* Info */}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">{booking.bookingNumber}</p>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate group-hover:text-brand-600 transition-colors">{booking.vendorName}</h3>
                <span className="inline-flex items-center gap-1 text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full mt-1">
                  <CategoryIcon className="w-3 h-3" />
                  {booking.vendorCategory}
                </span>
              </div>
              <StatusBadge status={booking.status} />
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(booking.eventDate)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {booking.eventCity}
              </span>
            </div>

            {showAmount && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <div>
                  <p className="text-xs text-gray-400">
                    {booking.finalAmountPaise ? 'Final Amount' : 'Quoted Amount'}
                  </p>
                  <p className="font-bold text-brand-600 text-sm">
                    {formatCurrency(booking.finalAmountPaise ?? booking.quotedAmountPaise!)}
                  </p>
                </div>
                {booking.advanceAmountPaise && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Advance Paid</p>
                    <p className="font-semibold text-green-600 text-sm">{formatCurrency(booking.advanceAmountPaise)}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="flex items-center pr-3">
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ tab }: { tab: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-8 h-8 text-brand-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">No {tab.toLowerCase()} bookings</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
        {tab === 'All' ? "You haven't made any bookings yet. Start exploring vendors!" : `No ${tab.toLowerCase()} bookings found.`}
      </p>
      <Link href="/vendors" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
        Explore Vendors
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────
export default function BookingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    bookingApi.list()
      .then((res) => setBookings(res.data.data.bookings))
      .catch(() => setBookings(MOCK_BOOKINGS))
      .finally(() => setIsLoading(false));
  }, [user]);

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = !search || b.vendorName.toLowerCase().includes(search.toLowerCase()) || b.bookingNumber.toLowerCase().includes(search.toLowerCase());
    const matchesTab =
      activeTab === 'ALL' ||
      (activeTab === 'ACTIVE' && ACTIVE_STATUSES.includes(b.status)) ||
      (activeTab === 'PENDING' && PENDING_STATUSES.includes(b.status)) ||
      (activeTab === 'COMPLETED' && b.status === 'COMPLETED');
    return matchesSearch && matchesTab;
  });

  const totalSpent = bookings.filter((b) => b.advanceAmountPaise).reduce((s, b) => s + (b.advanceAmountPaise ?? 0), 0);
  const confirmedCount = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status)).length;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-brand-600 to-purple-700 text-white px-4 pt-8 pb-20">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-1">My Bookings</h1>
            <p className="text-white/70 text-sm">Track all your vendor bookings and payments</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { label: 'Total Bookings', value: bookings.length },
                { label: 'Confirmed', value: confirmedCount },
                { label: 'Total Paid', value: totalSpent > 0 ? formatCurrency(totalSpent) : '—' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                  <div className="font-bold text-lg">{stat.value}</div>
                  <div className="text-white/60 text-xs mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 -mt-8 pb-24">
          {/* ── Search + Filter card ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-200 transition"
              />
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
            {TABS.map((tab) => {
              const count = tab.value === 'ALL' ? bookings.length
                : tab.value === 'ACTIVE' ? bookings.filter(b => ACTIVE_STATUSES.includes(b.status)).length
                : tab.value === 'PENDING' ? bookings.filter(b => PENDING_STATUSES.includes(b.status)).length
                : bookings.filter(b => b.status === 'COMPLETED').length;

              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.value
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
                  }`}
                >
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.value ? 'bg-white/20' : 'bg-gray-100'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Booking list ── */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <EmptyState tab={TABS.find(t => t.value === activeTab)?.label ?? 'All'} />
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((b) => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
