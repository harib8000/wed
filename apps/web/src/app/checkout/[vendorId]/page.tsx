'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, Shield, Calendar, MapPin, Users, ChevronDown, ChevronUp, AlertCircle, Lock, CreditCard, Wallet, Smartphone } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/authStore';
import { paymentApi, bookingApi } from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────
interface Package {
  id: string;
  name: string;
  packageType: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'CUSTOM';
  priceFromPaise: number;
  description?: string;
  inclusions?: string[];
}

interface VendorCheckout {
  id: string;
  name: string;
  category: string;
  city: string;
  image: string;
  rating: number;
  reviews: number;
  packages: Package[];
}

// ─── Mock fallback ──────────────────────────────────────────
const MOCK_VENDOR: Record<string, VendorCheckout> = {
  v1: { id: 'v1', name: 'Royal Grand Palace', category: 'Venue', city: 'Hyderabad', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80', rating: 4.9, reviews: 247, packages: [
    { id: 'p1', name: 'Silver', packageType: 'BASIC', priceFromPaise: 50000000, description: 'Basic hall + catering for 500 guests', inclusions: ['Main banquet hall', 'Veg catering (500 pax)', 'Basic decor', 'Parking'] },
    { id: 'p2', name: 'Gold', packageType: 'STANDARD', priceFromPaise: 100000000, description: 'Premium full-service for 800 guests', inclusions: ['Main + Outdoor lawn', 'Multi-cuisine (800 pax)', 'Premium decor', 'DJ setup', 'Bridal suite'] },
    { id: 'p3', name: 'Platinum', packageType: 'PREMIUM', priceFromPaise: 180000000, description: 'Exclusive luxury for up to 1,200 guests', inclusions: ['Exclusive 2-day booking', 'Royal catering 1200 pax', 'Grand decor + fireworks', 'Bridal & Groom suites', 'Complimentary rooms'] },
  ]},
  v2: { id: 'v2', name: 'Srikanth Photography', category: 'Photography', city: 'Hyderabad', image: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=600&q=80', rating: 4.8, reviews: 189, packages: [
    { id: 'p1', name: 'Basic', packageType: 'BASIC', priceFromPaise: 8000000, description: '1 photographer, 300 photos', inclusions: ['1 photographer', '300 edited photos', 'Online gallery'] },
    { id: 'p2', name: 'Standard', packageType: 'STANDARD', priceFromPaise: 12000000, description: '2 photographers + highlight video', inclusions: ['2 photographers', 'Drone coverage', '500 edited photos', '5-min highlight video'] },
    { id: 'p3', name: 'Premium', packageType: 'PREMIUM', priceFromPaise: 18000000, description: 'Full cinematic coverage', inclusions: ['3 photographers', '2 videographers', 'Drone + 4K footage', '1000 photos', '30-min film', 'Same-day teaser'] },
  ]},
};

// ─── Helpers ────────────────────────────────────────────────
function formatCurrency(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

const PACKAGE_BADGES: Record<string, { label: string; color: string }> = {
  BASIC:    { label: 'Basic',    color: 'bg-gray-100 text-gray-600' },
  STANDARD: { label: 'Standard', color: 'bg-blue-50 text-blue-700' },
  PREMIUM:  { label: 'Premium',  color: 'bg-purple-50 text-purple-700' },
  CUSTOM:   { label: 'Custom',   color: 'bg-orange-50 text-orange-700' },
};

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'PhonePe, GPay, Paytm' },
  { id: 'card', label: 'Card', icon: CreditCard, desc: 'Credit / Debit card' },
  { id: 'netbanking', label: 'Net Banking', icon: Wallet, desc: 'All major banks' },
];

// ─── Package card ───────────────────────────────────────────
function PackageCard({ pkg, selected, onSelect }: { pkg: Package; selected: boolean; onSelect: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const badge = PACKAGE_BADGES[pkg.packageType];
  const advance = Math.round(pkg.priceFromPaise * 0.3);

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${selected ? 'border-brand-500 bg-brand-50 shadow-md' : 'border-gray-200 bg-white hover:border-brand-200'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${selected ? 'border-brand-500 bg-brand-500' : 'border-gray-300'}`}>
            {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{pkg.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
            </div>
            {pkg.description && <p className="text-xs text-gray-500 mt-0.5">{pkg.description}</p>}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-gray-900 text-base">{formatCurrency(pkg.priceFromPaise)}</div>
          <div className="text-xs text-brand-600">Advance: {formatCurrency(advance)}</div>
        </div>
      </div>

      {pkg.inclusions && pkg.inclusions.length > 0 && (
        <div className="mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide' : 'Show'} inclusions
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1">
              {pkg.inclusions.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Page ──────────────────────────────────────────────────
export default function CheckoutPage() {
  const params = useParams<{ vendorId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();

  const [vendor, setVendor] = useState<VendorCheckout | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [eventDate, setEventDate] = useState('');
  const [eventCity, setEventCity] = useState('Hyderabad');
  const [guestCount, setGuestCount] = useState('');
  const [requirements, setRequirements] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    // Try to load vendor packages from API, fall back to mock
    const vendorId = params.vendorId;
    import('@/lib/api').then(({ vendorApi }) =>
      vendorApi.getById(vendorId)
        .then((res) => setVendor(res.data.data.vendor))
        .catch(() => setVendor(MOCK_VENDOR[vendorId] ?? MOCK_VENDOR['v1']))
        .finally(() => setIsLoading(false))
    );
  }, [params.vendorId]);

  const advance = selectedPackage ? Math.round(selectedPackage.priceFromPaise * 0.3) : 0;
  const platformFee = selectedPackage ? Math.round(selectedPackage.priceFromPaise * 0.10 * 1.18) : 0; // 10% + 18% GST

  const handleSubmit = async () => {
    if (!selectedPackage || !eventDate || !vendor) {
      setError('Please select a package and event date');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      // 1. Create booking enquiry
      const bookingRes = await bookingApi.enquire({
        vendorId: vendor.id,
        packageId: selectedPackage.id,
        eventDate,
        eventType: 'WEDDING',
        eventCity,
        guestCount: guestCount ? parseInt(guestCount) : undefined,
        requirements,
      });
      const bookingId = bookingRes.data.data.booking.id;

      // 2. Create payment order
      const orderRes = await paymentApi.createOrder({
        bookingId,
        amountPaise: advance,
        vendorId: vendor.id,
      });
      const { razorpayOrderId, razorpayKeyId } = orderRes.data.data;

      // 3. Open Razorpay checkout
      const Razorpay = (window as any).Razorpay;
      if (Razorpay) {
        const rzp = new Razorpay({
          key: razorpayKeyId,
          amount: advance,
          currency: 'INR',
          order_id: razorpayOrderId,
          name: 'Wedding OS',
          description: `Advance for ${vendor.name}`,
          handler: async (response: any) => {
            await paymentApi.verify({
              razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              bookingId,
              eventDate,
            });
            router.push(`/bookings/${bookingId}?success=1`);
          },
          prefill: { contact: user?.phone },
          theme: { color: '#9333ea' },
        });
        rzp.open();
      } else {
        // Razorpay SDK not loaded — redirect to bookings with success
        router.push(`/bookings/${bookingId}`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />)}
          </div>
        </div>
      </>
    );
  }

  if (!vendor) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">Vendor not found. <Link href="/vendors" className="text-brand-600">Browse vendors</Link></p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Load Razorpay SDK */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <Navbar />
      <main className="min-h-screen bg-gray-50 pb-24">
        {/* ── Header ── */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href={`/vendors/${vendor.id}`} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">Book {vendor.name}</h1>
              <p className="text-xs text-gray-400">{vendor.category} · {vendor.city}</p>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 py-5 space-y-5">
          {/* ── Vendor summary ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
            <div className="relative w-24 flex-shrink-0">
              <Image src={vendor.image} alt={vendor.name} fill className="object-cover" sizes="96px" />
            </div>
            <div className="p-4 flex-1">
              <h2 className="font-semibold text-gray-900">{vendor.name}</h2>
              <p className="text-sm text-gray-500">{vendor.category} · {vendor.city}</p>
              <p className="text-sm text-yellow-500 mt-1">★ {vendor.rating} <span className="text-gray-400">({vendor.reviews} reviews)</span></p>
            </div>
          </div>

          {/* ── Package selector ── */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">1. Select a Package</h2>
            <div className="space-y-3">
              {vendor.packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  selected={selectedPackage?.id === pkg.id}
                  onSelect={() => setSelectedPackage(pkg)}
                />
              ))}
            </div>
          </div>

          {/* ── Event details ── */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">2. Event Details</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Calendar className="w-4 h-4 inline mr-1.5 text-brand-400" />
                  Wedding Date *
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <MapPin className="w-4 h-4 inline mr-1.5 text-brand-400" />
                  Event City
                </label>
                <input
                  type="text"
                  value={eventCity}
                  onChange={(e) => setEventCity(e.target.value)}
                  placeholder="e.g. Hyderabad"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Users className="w-4 h-4 inline mr-1.5 text-brand-400" />
                  Guest Count (approx.)
                </label>
                <input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  placeholder="e.g. 300"
                  min="1"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Requirements</label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Any specific requests, dietary requirements, themes..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── Payment method ── */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">3. Payment Method</h2>
            <div className="grid grid-cols-3 gap-3">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`p-3 rounded-2xl border-2 text-center transition-all ${paymentMethod === pm.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white hover:border-brand-200'}`}
                >
                  <pm.icon className={`w-5 h-5 mx-auto mb-1.5 ${paymentMethod === pm.id ? 'text-brand-600' : 'text-gray-400'}`} />
                  <p className={`text-sm font-semibold ${paymentMethod === pm.id ? 'text-brand-700' : 'text-gray-600'}`}>{pm.label}</p>
                  <p className="text-xs text-gray-400">{pm.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Escrow safety note ── */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Your payment is protected by escrow</p>
              <p className="text-xs text-green-700 mt-0.5">We hold your advance securely. It's only released to the vendor after your event is completed.</p>
            </div>
          </div>

          {/* ── Price summary ── */}
          {selectedPackage && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{selectedPackage.name} Package</span>
                  <span>{formatCurrency(selectedPackage.priceFromPaise)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Platform fee (incl. GST)</span>
                  <span>{formatCurrency(platformFee)}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                  <span>Total Value</span>
                  <span>{formatCurrency(selectedPackage.priceFromPaise)}</span>
                </div>
                <div className="bg-brand-50 rounded-xl p-3 flex justify-between">
                  <div>
                    <p className="font-semibold text-brand-700">Pay Now (30% Advance)</p>
                    <p className="text-xs text-brand-500 mt-0.5">Balance paid on event day</p>
                  </div>
                  <p className="font-bold text-brand-700 text-lg">{formatCurrency(advance)}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── CTA ── */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedPackage || !eventDate}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition shadow-lg shadow-brand-200"
          >
            <Lock className="w-4 h-4" />
            {isSubmitting ? 'Processing...' : selectedPackage ? `Pay ${formatCurrency(advance)} Securely` : 'Select a Package to Continue'}
          </button>

          <p className="text-center text-xs text-gray-400">
            By continuing, you agree to our <Link href="#" className="text-brand-600">Terms of Service</Link> and <Link href="#" className="text-brand-600">Refund Policy</Link>
          </p>
        </div>
      </main>
    </>
  );
}
