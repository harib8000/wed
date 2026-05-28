'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, MapPin, CheckCircle, Shield, MessageCircle, Calendar, ArrowLeft, Heart, SearchX, Clock, Info, Sparkles, BadgeCheck, Phone, Trophy, Scale, ChevronRight } from 'lucide-react';
import AvailabilityCalendar from '@/components/vendors/AvailabilityCalendar';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { addToRecentlyViewed } from '@/components/vendors/RecentlyViewed';
import { ShareButton } from '@/components/vendors/ShareButton';
import { QuickEnquiry } from '@/components/vendors/QuickEnquiry';
import { vendorApi } from '@/lib/api';

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };
const stagger = { animate: { transition: { staggerChildren: 0.1 } } };
const PLATFORM_FEE_RATE = 0.05;
const GST_RATE = 0.18;

function getWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('wishlist') || '[]'); } catch { return []; }
}
function toggleWishlist(vendorId: string): boolean {
  const list = getWishlist();
  const idx = list.indexOf(vendorId);
  if (idx >= 0) { list.splice(idx, 1); } else { list.push(vendorId); }
  localStorage.setItem('wishlist', JSON.stringify(list));
  window.dispatchEvent(new Event('storage'));
  return idx < 0;
}

function DemoModeBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
      <Info size={12} />
      Demo mode — showing sample data
    </div>
  );
}

const MOCK_VENDOR = {
  id: '1',
  businessName: 'Royal Grand Palace',
  category: 'Venue',
  city: 'Hyderabad',
  rating: 4.9,
  totalReviews: 247,
  totalBookings: 312,
  verificationStatus: 'verified',
  description: 'Royal Grand Palace is Hyderabad\'s premier wedding venue, nestled in the heart of the city. With 3 grand halls accommodating 200-2000 guests, we offer world-class facilities including a rooftop garden, poolside area, and dedicated bridal suites.',
  yearsExperience: 12,
  teamSize: 50,
  basePrice: 500000,
  currency: 'INR',
  citiesServed: ['Hyderabad', 'Secunderabad'],
  featured: true,
  responseTimeHours: 2,
  cancellationRate: 1.6,
  phone: '+91 98765 43210',
  packages: [
    { id: 'p1', name: 'Grand Silver', price: 500000, priceType: 'fixed', description: 'Perfect for intimate gatherings', inclusions: ['Hall for 200 guests', 'Basic decor', 'Parking for 100 cars', '8-hour access'], minGuests: 100, maxGuests: 200 },
    { id: 'p2', name: 'Grand Gold', price: 900000, priceType: 'fixed', description: 'Most popular choice', inclusions: ['Hall for 500 guests', 'Premium floral decor', 'Valet parking', 'Bridal suite', '12-hour access', 'DJ console'], minGuests: 200, maxGuests: 500 },
    { id: 'p3', name: 'Grand Platinum', price: 1500000, priceType: 'fixed', description: 'The ultimate luxury experience', inclusions: ['All 3 halls', '2000 guests', 'Luxury decor', 'Dedicated coordinator', 'Catering kitchen', 'Multi-day booking', 'Celebrity DJ'], minGuests: 500, maxGuests: 2000 },
  ],
  portfolio: Array.from({ length: 8 }, (_, i) => ({ id: i, url: `https://images.unsplash.com/photo-${['1519225421980-715cb0215aed', '1519741497674-611481863552', '1478146059778-26028b07395a', '1464366400600-7168b8af9bc3', '1531058020387-4de47d62d946', '1491604612772-6853927639ef', '1519167758481-83f550bb49b3', '1463863148025-20c37369acec'][i]}?w=400&q=80` })),
  tags: ['Garden', 'Banquet', 'Rooftop', 'Pool', '5-Star', 'AC Halls'],
};

const MOCK_REVIEWS = [
  { id: 1, customerName: 'Priya S.', rating: 5, date: 'March 2026', body: 'Absolutely stunning venue! The staff was professional and the ambiance was magical. Our 500-guest wedding went off without a hitch.', tags: ['Great Service', 'Punctual', 'Clean'], helpfulCount: 41 },
  { id: 2, customerName: 'Rahul K.', rating: 5, date: 'February 2026', body: 'Best venue in Hyderabad hands down. The food was excellent, the decor was perfect. Highly recommend the Gold package.', tags: ['Great Value', 'Beautiful'], helpfulCount: 36 },
  { id: 3, customerName: 'Meera A.', rating: 4, date: 'January 2026', body: 'Great experience overall. Parking could be better but everything else was perfect. The bridal suite was gorgeous!', tags: ['Bridal Suite', 'Professional'], helpfulCount: 18 },
];

const VENDOR_MAP: Record<string, typeof MOCK_VENDOR> = {
  'vendor-1': { ...MOCK_VENDOR },
  'vendor-2': { ...MOCK_VENDOR, id: '2', businessName: 'Srikanth Photography', category: 'Photography', rating: 4.8, totalReviews: 189, totalBookings: 156, basePrice: 80000, description: 'Award-winning wedding photography studio specializing in candid, traditional, and cinematic styles. Capturing your most precious moments with a team of 8 professional photographers across Hyderabad.', yearsExperience: 8, teamSize: 8, featured: true, responseTimeHours: 3, cancellationRate: 1.8, phone: '+91 98765 40002', packages: [{ id: 'p1', name: 'Essential', price: 40000, priceType: 'fixed', description: '1 photographer, 200 edited photos', inclusions: ['1 Photographer', '200 Edited Photos', '8-hour coverage', 'Online Gallery'], minGuests: 0, maxGuests: 500 }, { id: 'p2', name: 'Premium', price: 80000, priceType: 'fixed', description: '2 photographers + pre-wedding shoot', inclusions: ['2 Photographers', '500 Edited Photos', 'Pre-wedding Shoot', 'Photo Album', '12-hour coverage'], minGuests: 0, maxGuests: 1000 }, { id: 'p3', name: 'Cinematic', price: 150000, priceType: 'fixed', description: 'Full team with drone + film', inclusions: ['3 Photographers', 'Drone Coverage', 'Cinematic Film', '1000+ Photos', 'Premium Album', 'Multi-day coverage'], minGuests: 0, maxGuests: 2000 }], tags: ['Candid', 'Traditional', 'Cinematic', 'Drone', 'Pre-wedding'] },
  'vendor-3': { ...MOCK_VENDOR, id: '3', businessName: 'Flavours Catering Co.', category: 'Catering', rating: 4.7, totalReviews: 312, totalBookings: 420, basePrice: 800, description: 'Hyderabad\'s finest multi-cuisine catering service with live counters, traditional Hyderabadi Biryani, and 200+ menu options. Serving weddings from 100 to 5000 guests.', yearsExperience: 15, teamSize: 120, featured: false, responseTimeHours: 1, cancellationRate: 1.1, phone: '+91 98765 40003', packages: [{ id: 'p1', name: 'Classic', price: 800, priceType: 'per_plate', description: 'Standard buffet menu', inclusions: ['15 Items Buffet', 'Welcome Drinks', 'Basic Setup', 'Service Staff'], minGuests: 100, maxGuests: 500 }, { id: 'p2', name: 'Royal', price: 1200, priceType: 'per_plate', description: 'Premium multi-cuisine', inclusions: ['25 Items Buffet', 'Live Counters', 'Premium Beverages', 'Themed Setup', 'Dedicated Manager'], minGuests: 200, maxGuests: 2000 }, { id: 'p3', name: 'Grand Feast', price: 2000, priceType: 'per_plate', description: 'Ultimate luxury dining', inclusions: ['40+ Items', 'Live Counters', 'Biryani Counter', 'Dessert Bar', 'Ice Cream Station', 'Luxury Crockery'], minGuests: 300, maxGuests: 5000 }], tags: ['Multi-cuisine', 'Live Counters', 'Biryani', 'Vegetarian', 'Non-veg'] },
  'vendor-4': { ...MOCK_VENDOR, id: '4', businessName: 'Blooms & Dreams Decor', category: 'Decor', rating: 4.9, totalReviews: 156, totalBookings: 198, basePrice: 150000, description: 'Luxury wedding decor studio known for immersive floral concepts, mandap styling and experiential reception setups.', yearsExperience: 10, teamSize: 24, featured: true, responseTimeHours: 2, cancellationRate: 1.5, phone: '+91 98765 40004', tags: ['Luxury Decor', 'Mandap', 'Floral'], packages: [{ id: 'p1', name: 'Classic Decor', price: 150000, priceType: 'fixed', description: 'Elegant floral styling for intimate functions', inclusions: ['Mandap styling', 'Fresh flowers', 'Stage lighting', 'Setup crew'], minGuests: 100, maxGuests: 300 }, { id: 'p2', name: 'Signature Decor', price: 275000, priceType: 'fixed', description: 'Designer styling with themed installations', inclusions: ['Entry decor', 'Floral ceiling', 'Photo booth', 'Mood lighting'], minGuests: 200, maxGuests: 600 }, { id: 'p3', name: 'Luxury Experience', price: 450000, priceType: 'fixed', description: 'Premium wedding decor with immersive concepts', inclusions: ['Custom concept design', 'Luxury florals', 'LED tunnel', 'On-site designer'], minGuests: 300, maxGuests: 1200 }] },
};

type VendorDetail = typeof MOCK_VENDOR;
type Review = typeof MOCK_REVIEWS[0];
type Package = typeof MOCK_VENDOR['packages'][0];

type ReviewSort = 'most_helpful' | 'highest' | 'lowest' | 'newest';

function normalizeVendor(raw: Record<string, unknown>): VendorDetail {
  return {
    id: String(raw.id || raw._id || ''),
    businessName: String(raw.businessName || raw.business_name || 'Unnamed Vendor'),
    category: String(raw.category || 'Venue'),
    city: String(raw.city || (raw.citiesServed as string[])?.[0] || 'Hyderabad'),
    rating: Number(raw.rating || raw.avgRating || 4.5),
    totalReviews: Number(raw.totalReviews || raw.total_reviews || 0),
    totalBookings: Number(raw.totalBookings || raw.total_bookings || 0),
    verificationStatus: String(raw.verificationStatus || raw.verification_status || 'pending'),
    description: String(raw.description || ''),
    yearsExperience: Number(raw.yearsExperience || raw.years_experience || 0),
    teamSize: Number(raw.teamSize || raw.team_size || 0),
    basePrice: Number(raw.basePrice || raw.base_price || raw.startingPrice || 0),
    currency: String(raw.currency || 'INR'),
    citiesServed: (raw.citiesServed || raw.cities_served || ['Hyderabad']) as string[],
    featured: Boolean(raw.featured),
    responseTimeHours: Number(raw.responseTimeHours || raw.response_time_hours || 3),
    cancellationRate: Number(raw.cancellationRate || raw.cancellation_rate || 2),
    phone: String(raw.phone || raw.phoneNumber || '+91 98765 43210'),
    packages: Array.isArray(raw.packages) ? raw.packages.map((p: Record<string, unknown>) => ({
      id: String(p.id || p._id || ''),
      name: String(p.name || ''),
      price: Number(p.price || 0),
      priceType: String(p.priceType || p.price_type || 'fixed'),
      description: String(p.description || ''),
      inclusions: (p.inclusions || []) as string[],
      minGuests: Number(p.minGuests || p.min_guests || 0),
      maxGuests: Number(p.maxGuests || p.max_guests || 0),
    })) : [],
    portfolio: Array.isArray(raw.portfolio) ? raw.portfolio.map((p: Record<string, unknown>, i: number) => ({
      id: Number(p.id ?? i),
      url: String(p.url || p.mediaUrl || p.media_url || ''),
    })) : MOCK_VENDOR.portfolio,
    tags: (raw.tags || []) as string[],
  };
}

function normalizeReviews(raw: unknown[]): Review[] {
  return raw.map((r: unknown, i: number) => {
    const rev = r as Record<string, unknown>;
    return {
      id: Number(rev.id || rev._id || i + 1),
      customerName: String(rev.customerName || rev.customer_name || 'Anonymous'),
      rating: Number(rev.rating || 5),
      date: String(rev.date || rev.createdAt || rev.created_at || 'Recently'),
      body: String(rev.body || rev.text || rev.comment || ''),
      tags: (rev.tags || []) as string[],
      helpfulCount: Number(rev.helpfulCount || rev.helpful_count || 0),
    };
  });
}

function formatPrice(price: number) {
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
  if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K`;
  return `₹${price}`;
}

function formatResponseTime(hours: number) {
  return `Usually responds within ${hours} hour${hours > 1 ? 's' : ''}`;
}

function calculatePricing(price: number) {
  const platformFee = price * PLATFORM_FEE_RATE;
  const taxableAmount = price + platformFee;
  const gst = taxableAmount * GST_RATE;
  return {
    base: price,
    platformFee,
    gst,
    total: taxableAmount + gst,
  };
}

function getReviewDistribution(rating: number) {
  if (rating >= 4.8) return [
    { stars: 5, percent: 80 },
    { stars: 4, percent: 15 },
    { stars: 3, percent: 5 },
    { stars: 2, percent: 0 },
    { stars: 1, percent: 0 },
  ];
  if (rating >= 4.6) return [
    { stars: 5, percent: 70 },
    { stars: 4, percent: 20 },
    { stars: 3, percent: 8 },
    { stars: 2, percent: 2 },
    { stars: 1, percent: 0 },
  ];
  return [
    { stars: 5, percent: 60 },
    { stars: 4, percent: 25 },
    { stars: 3, percent: 10 },
    { stars: 2, percent: 3 },
    { stars: 1, percent: 2 },
  ];
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="card overflow-hidden">
                <div className="h-72 bg-gray-200 animate-pulse" />
                <div className="p-4 grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-gray-200 animate-pulse" />
                  ))}
                </div>
              </div>
              <div className="card p-6 space-y-4">
                <div className="h-7 w-64 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-4/6 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="card p-6 space-y-4">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="card p-6 space-y-4">
                <div className="h-8 w-32 mx-auto bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function VendorNotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 flex items-center justify-center min-h-[60vh]">
        <div className="text-center px-4">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <SearchX size={36} className="text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold font-heading mb-2">Vendor Not Found</h1>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            The vendor you&apos;re looking for doesn&apos;t exist or may have been removed. Browse our curated list of verified wedding vendors instead.
          </p>
          <Link href="/vendors" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Browse All Vendors
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function VendorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [reviewSort, setReviewSort] = useState<ReviewSort>('most_helpful');

  useEffect(() => {
    setWishlisted(getWishlist().includes(params.id));
  }, [params.id]);

  const handleToggleWishlist = useCallback(() => {
    const nowLiked = toggleWishlist(params.id);
    setWishlisted(nowLiked);
  }, [params.id]);

  const { data: vendorResult, isLoading: vendorLoading } = useQuery({
    queryKey: ['vendor', params.id],
    queryFn: async () => {
      try {
        const res = await vendorApi.getById(params.id);
        const raw = res.data.data || res.data;
        return { vendor: normalizeVendor(raw), isDemo: false };
      } catch {
        const mock = VENDOR_MAP[params.id];
        if (mock) return { vendor: mock, isDemo: true };
        return null;
      }
    },
    retry: 0,
    staleTime: 60_000,
  });

  const { data: packagesResult } = useQuery({
    queryKey: ['vendor-packages', params.id],
    queryFn: async () => {
      try {
        const res = await vendorApi.getPackages(params.id);
        const raw = res.data.data || res.data;
        if (Array.isArray(raw) && raw.length > 0) {
          return raw.map((p: Record<string, unknown>) => ({
            id: String(p.id || p._id || ''),
            name: String(p.name || ''),
            price: Number(p.price || 0),
            priceType: String(p.priceType || p.price_type || 'fixed'),
            description: String(p.description || ''),
            inclusions: (p.inclusions || []) as string[],
            minGuests: Number(p.minGuests || p.min_guests || 0),
            maxGuests: Number(p.maxGuests || p.max_guests || 0),
          }));
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled: !!vendorResult && !vendorResult.isDemo,
    retry: 0,
  });

  const { data: reviewsResult } = useQuery({
    queryKey: ['vendor-reviews', params.id],
    queryFn: async () => {
      try {
        const res = await vendorApi.getReviews(params.id, { limit: 10, sort: reviewSort === 'most_helpful' ? 'helpful' : reviewSort });
        const raw = res.data.data?.reviews || res.data.data || res.data;
        if (Array.isArray(raw) && raw.length > 0) {
          return { reviews: normalizeReviews(raw), isDemo: false };
        }
        return { reviews: MOCK_REVIEWS, isDemo: true };
      } catch {
        return { reviews: MOCK_REVIEWS, isDemo: true };
      }
    },
    retry: 0,
    staleTime: 60_000,
  });

  const isDemo = !vendorResult || vendorResult.isDemo;
  const v = vendorResult?.vendor ?? null;
  const reviews = reviewsResult?.reviews ?? MOCK_REVIEWS;
  const packages: Package[] = useMemo(() => {
    if (packagesResult && packagesResult.length > 0) return packagesResult;
    return v?.packages ?? [];
  }, [packagesResult, v]);

  useEffect(() => {
    if (v) {
      addToRecentlyViewed({
        id: params.id,
        businessName: v.businessName,
        category: v.category,
        city: v.city,
        rating: String(v.rating),
        coverImage: v.portfolio[0]?.url ?? '',
        basePrice: v.basePrice,
      });
    }
  }, [params.id, v]);

  const sortedReviews = useMemo(() => {
    const nextReviews = [...reviews];
    switch (reviewSort) {
      case 'highest':
        return nextReviews.sort((a, b) => b.rating - a.rating || b.helpfulCount - a.helpfulCount);
      case 'lowest':
        return nextReviews.sort((a, b) => a.rating - b.rating || b.helpfulCount - a.helpfulCount);
      case 'newest':
        return nextReviews.reverse();
      default:
        return nextReviews.sort((a, b) => b.helpfulCount - a.helpfulCount || b.rating - a.rating);
    }
  }, [reviewSort, reviews]);

  const reviewHighlights = useMemo(() => {
    const counts = new Map<string, number>();
    reviews.forEach((review) => {
      review.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [reviews]);

  if (vendorLoading) return <LoadingSkeleton />;
  if (!v) return <VendorNotFound />;

  const similarVendorEntries = Object.entries(VENDOR_MAP).filter(([key]) => key !== params.id);
  const sameCategoryAndCity = similarVendorEntries.filter(([, vendor]) => vendor.category === v.category && vendor.city === v.city);
  const sameCity = similarVendorEntries.filter(([, vendor]) => vendor.city === v.city);
  const similarVendors = (sameCategoryAndCity.length > 0 ? sameCategoryAndCity : sameCity.length > 0 ? sameCity : similarVendorEntries)
    .slice(0, 4)
    .map(([key, vendor]) => ({ key, ...vendor }));

  const reviewDistribution = getReviewDistribution(v.rating);
  const lowestPackagePrice = Math.min(...packages.map((pkg) => pkg.price), v.basePrice || 0);
  const isTopRated = v.rating >= 4.8;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-0">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/vendors" className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition-colors" aria-label="Back to vendors list">
            <ArrowLeft size={16} /> Back to Vendors
          </Link>
          {isDemo && <DemoModeBadge />}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-8" {...stagger} initial="initial" animate="animate">
            <div className="lg:col-span-2 space-y-6">
              <motion.div className="card overflow-hidden" {...fadeIn}>
                <div className="h-72 overflow-hidden">
                  <img src={v.portfolio[0].url} alt={v.businessName} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-2">
                    {v.portfolio.slice(1, 5).map((p) => (
                      <div key={p.id} className="aspect-square rounded-lg overflow-hidden">
                        <img src={p.url} alt="" className="w-full h-full object-cover hover:opacity-90 cursor-pointer transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div className="card p-6" {...fadeIn}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold font-heading">{v.businessName}</h1>
                      {v.verificationStatus === 'verified' && (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                          <BadgeCheck size={13} /> KYC Verified
                        </span>
                      )}
                      {isTopRated && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">🔥 Top Rated</span>}
                      {v.featured && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">⭐ Featured</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                      <span className="badge bg-brand-100 text-brand-700 capitalize">{v.category}</span>
                      <div className="flex items-center gap-1"><MapPin size={14} />{v.city}</div>
                      <div className="flex items-center gap-1"><Star size={14} className="fill-gold-400 text-gold-400" /><strong>{v.rating}</strong> ({v.totalReviews} reviews)</div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"><Trophy size={12} className="text-brand-500" /> {v.totalBookings}+ weddings</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"><Sparkles size={12} className="text-brand-500" /> {v.yearsExperience}+ years experience</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"><Clock size={12} className="text-brand-500" /> {formatResponseTime(v.responseTimeHours)}</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"><Scale size={12} className="text-brand-500" /> Less than {v.cancellationRate}% cancellation rate</span>
                    </div>
                    <p className="text-sm font-semibold text-brand-700">Starting from {formatPrice(lowestPackagePrice || v.basePrice)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleWishlist}
                      className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                      aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                    >
                      <Heart size={18} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                    </button>
                    <ShareButton title={v.businessName} text={`Check out ${v.businessName} on WeddingOS — ${v.category} in ${v.city}`} />
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{v.description}</p>
                <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                  <div className="text-center"><div className="font-bold text-lg">{v.yearsExperience}+</div><div className="text-xs text-gray-500">Years Experience</div></div>
                  <div className="text-center"><div className="font-bold text-lg">{v.totalBookings}+</div><div className="text-xs text-gray-500">Events Done</div></div>
                  <div className="text-center"><div className="font-bold text-lg">{v.teamSize}+</div><div className="text-xs text-gray-500">Team Size</div></div>
                </div>
              </motion.div>

              <motion.div className="card p-6" {...fadeIn}>
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={20} className="text-brand-600" />
                  <h2 className="text-xl font-bold font-heading">WeddingOS Booking Protection</h2>
                </div>
                <div className="grid gap-3 text-sm text-gray-600">
                  <div className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3"><CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" /> Verified vendor with KYC documentation</div>
                  <div className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3"><CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" /> Secure escrow payment — money held until event completion</div>
                  <div className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3"><CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" /> 100% refund if vendor cancels</div>
                  <div className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3"><CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" /> Dedicated dispute resolution support</div>
                </div>
              </motion.div>

              <motion.div className="card p-6" {...fadeIn}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold font-heading">Packages & Pricing</h2>
                    <p className="text-sm text-gray-500">Transparent pricing with WeddingOS platform protection built in.</p>
                  </div>
                  <p className="text-sm font-semibold text-brand-700">Starting from {formatPrice(lowestPackagePrice || v.basePrice)}</p>
                </div>
                <div className="space-y-4">
                  {packages.map((pkg, i) => {
                    const pricing = calculatePricing(pkg.price);
                    return (
                      <div key={pkg.id} className={`border-2 rounded-xl p-4 transition-colors ${i === 1 ? 'border-brand-500 bg-brand-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                        {i === 1 && <span className="badge bg-brand-600 text-white text-xs mb-2">Most Popular</span>}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                            <p className="text-sm text-gray-500">{pkg.description}</p>
                            <p className="text-xs text-gray-400 mt-1">{pkg.minGuests}–{pkg.maxGuests} guests</p>
                          </div>
                          <div className="text-left lg:text-right">
                            <p className="text-lg font-bold text-brand-700">{formatPrice(pkg.price)}</p>
                            <p className="text-xs text-gray-400">{pkg.priceType === 'per_plate' ? '/plate' : 'Base price'}</p>
                          </div>
                        </div>
                        <div className="grid gap-2 rounded-xl bg-white p-3 border border-gray-100 text-sm text-gray-600 mb-3">
                          <div className="flex items-center justify-between"><span>Base price</span><span className="font-medium text-gray-900">{formatPrice(pricing.base)}</span></div>
                          <div className="flex items-center justify-between"><span>WeddingOS platform fee (5%)</span><span className="font-medium text-gray-900">{formatPrice(pricing.platformFee)}</span></div>
                          <div className="flex items-center justify-between"><span>GST (18%)</span><span className="font-medium text-gray-900">{formatPrice(pricing.gst)}</span></div>
                          <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2"><span className="font-semibold text-gray-900">Estimated total</span><span className="font-semibold text-brand-700">{formatPrice(pricing.total)}</span></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-4">
                          {pkg.inclusions.map((inc) => (
                            <div key={inc} className="flex items-center gap-1 text-xs text-gray-600">
                              <CheckCircle size={11} className="text-green-500 shrink-0" /> {inc}
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link href={`/checkout/${params.id}?package=${pkg.id}`} className="btn-primary text-sm px-4 py-2.5 text-center">
                            Send Enquiry
                          </Link>
                          <button
                            onClick={() => setShowEnquiry(true)}
                            className="btn-secondary text-sm px-4 py-2.5 flex items-center justify-center gap-2"
                          >
                            <MessageCircle size={15} /> Request Custom Quote
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div className="card p-6" id="availability" {...fadeIn}>
                <h2 className="text-xl font-bold font-heading mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-brand-600" /> Check Availability
                </h2>
                <p className="text-sm text-gray-500 mb-4">Select a date and time slot to check availability. Booked slots are marked in red.</p>
                <AvailabilityCalendar
                  vendorId={params.id}
                  vendorCategory={v.category.toLowerCase()}
                  onSlotSelect={(date: string, slot: string) => {
                    const searchParams = new URLSearchParams({ date, slot, package: packages[1]?.id || packages[0]?.id });
                    router.push(`/checkout/${params.id}?${searchParams.toString()}`);
                  }}
                />
              </motion.div>

              <motion.div className="card p-6" {...fadeIn}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold font-heading">Reviews</h2>
                    <p className="text-sm text-gray-500">Trusted by {v.totalBookings}+ bookings with transparent feedback and highlights.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star size={18} className="fill-gold-400 text-gold-400" />
                    <span className="text-2xl font-bold">{v.rating}</span>
                    <span className="text-gray-500">({v.totalReviews})</span>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] mb-6">
                  <div className="space-y-3">
                    {reviewDistribution.map((row) => (
                      <div key={row.stars} className="flex items-center gap-3 text-sm">
                        <span className="w-8 text-gray-600">{row.stars}★</span>
                        <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gold-400" style={{ width: `${row.percent}%` }} />
                        </div>
                        <span className="w-10 text-right text-gray-500">{row.percent}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Review highlights</h3>
                      <select
                        value={reviewSort}
                        onChange={(e) => setReviewSort(e.target.value as ReviewSort)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600"
                        aria-label="Sort reviews"
                      >
                        <option value="most_helpful">Most helpful</option>
                        <option value="highest">Highest rated</option>
                        <option value="lowest">Lowest rated</option>
                        <option value="newest">Newest</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {reviewHighlights.map(([tag, count]) => (
                        <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 border border-gray-200">
                          {tag} · {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {sortedReviews.map((r) => (
                    <div key={r.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2 gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold">{r.customerName[0]}</div>
                          <div>
                            <div className="font-medium text-sm">{r.customerName}</div>
                            <div className="text-xs text-gray-400">{r.date}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex justify-end">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={13} className="fill-gold-400 text-gold-400" />)}</div>
                          <p className="text-[11px] text-gray-400 mt-1">{r.helpfulCount} found this helpful</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{r.body}</p>
                      <div className="flex flex-wrap gap-1 mt-2">{r.tags.map((t) => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-sm text-gray-500">Had a great experience? Share your feedback!</p>
                  <Link href={`/reviews/write/new?vendorId=${params.id}&vendorName=${encodeURIComponent(v.businessName)}`} className="btn-primary text-sm py-2 px-5 flex items-center gap-2">
                    <Star size={14} /> Write a Review
                  </Link>
                </div>
              </motion.div>
            </div>

            <motion.div className="lg:col-span-1" {...fadeIn}>
              <div className="card p-6 sticky top-24">
                <div className="text-center mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Starting from</p>
                  <p className="text-3xl font-bold text-brand-700">{formatPrice(lowestPackagePrice || v.basePrice)}</p>
                  <p className="text-sm text-gray-500">Transparent pricing · Customizable packages</p>
                </div>

                <div className="space-y-3 mb-6">
                  <Link href={`/checkout/${params.id}`} className="btn-primary w-full text-center block">
                    📩 Send Enquiry
                  </Link>
                  <button
                    onClick={() => setShowEnquiry(true)}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} /> Quick Enquiry
                  </button>
                  <button
                    onClick={() => setShowEnquiry(true)}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} /> Request Custom Quote
                  </button>
                  <a href="#availability" className="btn-secondary w-full flex items-center justify-center gap-2">
                    <Calendar size={16} /> Check Availability
                  </a>
                </div>

                <div className="bg-green-50 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-1">
                    <Shield size={14} /> Escrow Protected
                  </div>
                  <p className="text-xs text-green-600">Your advance payment is held safely and released only after service delivery.</p>
                </div>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" />Free quotes & proposals</div>
                  <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" />Less than {v.cancellationRate}% cancellation rate</div>
                  <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" />{formatResponseTime(v.responseTimeHours)}</div>
                  <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" />Verified KYC vendor</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {similarVendors.length > 0 && (
            <motion.div className="mt-12" {...fadeIn}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold font-heading">Similar Vendors You May Like</h2>
                  <p className="text-sm text-gray-500">More {v.category.toLowerCase()} specialists serving {v.city}.</p>
                </div>
                <Link href={`/vendors?category=${encodeURIComponent(v.category.toLowerCase())}&city=${encodeURIComponent(v.city)}`} className="text-sm font-medium text-brand-600 inline-flex items-center gap-1 hover:underline">
                  View More <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {similarVendors.map((sv) => (
                  <Link key={sv.key} href={`/vendors/${sv.key}`} className="card overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="h-40 overflow-hidden">
                      <img src={sv.portfolio[0].url} alt={sv.businessName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{sv.businessName}</h3>
                        {sv.verificationStatus === 'verified' && <CheckCircle size={14} className="text-green-500" />}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <span className="badge bg-brand-100 text-brand-700 text-xs capitalize">{sv.category}</span>
                        <div className="flex items-center gap-1"><MapPin size={12} />{sv.city}</div>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Star size={14} className="fill-gold-400 text-gold-400" />
                          <strong>{sv.rating}</strong>
                          <span className="text-gray-400">({sv.totalReviews})</span>
                        </div>
                        <p className="text-sm font-semibold text-brand-700">{formatPrice(sv.basePrice)}</p>
                      </div>
                      <p className="text-xs text-gray-500">{sv.totalBookings}+ bookings · {formatResponseTime(sv.responseTimeHours)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />

      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 px-4 py-3">
          <button onClick={() => setShowEnquiry(true)} className="btn-primary flex-1 py-3 text-sm">Send Enquiry</button>
          <a href={`tel:${v.phone.replace(/\s+/g, '')}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700">
            <Phone size={16} /> Call
          </a>
          <Link href={`/chat?vendorId=${params.id}&vendorName=${encodeURIComponent(v.businessName)}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700">
            <MessageCircle size={16} /> Chat
          </Link>
        </div>
      </div>

      {showEnquiry && (
        <QuickEnquiry
          vendorName={v.businessName}
          vendorId={params.id}
          category={v.category}
          isOpen={showEnquiry}
          onClose={() => setShowEnquiry(false)}
        />
      )}
    </div>
  );
}
