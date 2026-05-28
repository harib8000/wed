'use client';
import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Star, Heart, X, SlidersHorizontal, Loader2, Info, GitCompareArrows, CheckCircle, Clock, LocateFixed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { QuickEnquiry } from '@/components/vendors/QuickEnquiry';
import { vendorApi, searchApi } from '@/lib/api';
import { SocialProofBadges, BookingActivityIndicator } from '@/components/engagement/SocialProof';
import { addToCompare, isInCompare, CompareFloatingBar } from '@/components/compare/VendorCompare';
import type { CompareVendor } from '@/components/compare/VendorCompare';

const CATEGORIES = ['All', 'Venue', 'Photography', 'Catering', 'Decor', 'Makeup', 'Music', 'Mehendi', 'Videography', 'Transport'];
const CITIES = ['Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Jaipur'];
const EVENT_TYPES = ['All Events', 'Wedding', 'Engagement', 'Dhoti Ceremony', 'Saree Function', 'Birthday', 'Reception', 'Housewarming', 'Baby Shower', 'Anniversary', 'Corporate Event'];
const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'reviews', label: 'Most Reviewed' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];
const RADIUS_OPTIONS = [
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
  { value: 'all', label: 'All India' },
];

const PAGE_SIZE = 8;
const LOAD_MORE_SIZE = 4;
const DEBOUNCE_MS = 400;
const SELECTED_CITY_KEY = 'wedding_os_selected_city';

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
};

interface VendorItem {
  id: string;
  businessName: string;
  category: string;
  citiesServed: string[];
  rating: string;
  totalReviews: number;
  basePrice: number;
  coverImage: string;
  featured: boolean;
  verified: boolean;
  totalBookings: number;
  responseTimeHours: number;
  yearsExperience: number;
  teamSize: number;
  cancellationRate: number;
  eventTypes: string[];
  latitude: number | null;
  longitude: number | null;
  distanceKm?: number | null;
}

const MOCK_VENDOR_META = [
  { verified: true, totalBookings: 312, responseTimeHours: 2, yearsExperience: 12, teamSize: 50, cancellationRate: 1.4, lat: 17.4304, lng: 78.4077, events: ['Wedding', 'Reception', 'Engagement'] },
  { verified: true, totalBookings: 156, responseTimeHours: 3, yearsExperience: 8, teamSize: 8, cancellationRate: 1.8, lat: 17.4121, lng: 78.4482, events: ['Wedding', 'Engagement', 'Anniversary'] },
  { verified: true, totalBookings: 420, responseTimeHours: 1, yearsExperience: 15, teamSize: 120, cancellationRate: 1.1, lat: 17.3616, lng: 78.4747, events: ['Wedding', 'Reception', 'Corporate Event'] },
  { verified: true, totalBookings: 198, responseTimeHours: 2, yearsExperience: 10, teamSize: 24, cancellationRate: 1.6, lat: 17.4435, lng: 78.3772, events: ['Wedding', 'Saree Function', 'Baby Shower'] },
  { verified: true, totalBookings: 240, responseTimeHours: 2, yearsExperience: 9, teamSize: 12, cancellationRate: 1.3, lat: 17.3943, lng: 78.4583, events: ['Wedding', 'Engagement', 'Housewarming'] },
  { verified: false, totalBookings: 132, responseTimeHours: 4, yearsExperience: 7, teamSize: 14, cancellationRate: 2.4, lat: 17.4033, lng: 78.4998, events: ['Wedding', 'Birthday', 'Corporate Event'] },
  { verified: true, totalBookings: 286, responseTimeHours: 2, yearsExperience: 11, teamSize: 38, cancellationRate: 1.5, lat: 17.4483, lng: 78.3915, events: ['Wedding', 'Reception', 'Anniversary'] },
  { verified: true, totalBookings: 174, responseTimeHours: 3, yearsExperience: 9, teamSize: 9, cancellationRate: 1.7, lat: 17.3724, lng: 78.4378, events: ['Wedding', 'Engagement', 'Birthday'] },
  { verified: true, totalBookings: 390, responseTimeHours: 2, yearsExperience: 14, teamSize: 90, cancellationRate: 1.2, lat: 17.4512, lng: 78.4676, events: ['Wedding', 'Reception', 'Corporate Event'] },
  { verified: true, totalBookings: 205, responseTimeHours: 3, yearsExperience: 10, teamSize: 28, cancellationRate: 1.9, lat: 17.4198, lng: 78.3489, events: ['Wedding', 'Baby Shower', 'Housewarming'] },
  { verified: true, totalBookings: 164, responseTimeHours: 2, yearsExperience: 8, teamSize: 10, cancellationRate: 1.8, lat: 17.3864, lng: 78.4562, events: ['Wedding', 'Reception', 'Engagement'] },
  { verified: false, totalBookings: 148, responseTimeHours: 5, yearsExperience: 6, teamSize: 16, cancellationRate: 2.6, lat: 17.3399, lng: 78.5203, events: ['Wedding', 'Birthday', 'Corporate Event'] },
] as const;

const MOCK_RATINGS = ['4.9', '4.8', '4.7', '4.9', '4.6', '4.8', '4.7', '4.9', '4.8', '4.5', '4.7', '4.6'];
const MOCK_REVIEWS = [247, 189, 312, 95, 156, 78, 201, 167, 283, 134, 112, 63];
const MOCK_VENDORS: VendorItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: `vendor-${i + 1}`,
  businessName: ['Royal Grand Palace', 'Srikanth Photography', 'Flavours Catering', 'Blooms & Dreams', 'Shika Makeup', 'Beats & Celebrations', 'Heritage Banquets', 'Frame Perfect Studios', 'Royal Feast', 'Garden of Eden Decor', 'Glamour Touch', 'Melody Masters'][i],
  category: ['venue', 'photography', 'catering', 'decor', 'makeup', 'music', 'venue', 'photography', 'catering', 'decor', 'makeup', 'music'][i],
  citiesServed: ['Hyderabad'],
  rating: MOCK_RATINGS[i],
  totalReviews: MOCK_REVIEWS[i],
  basePrice: [500000, 80000, 800, 150000, 25000, 60000, 300000, 100000, 1200, 200000, 35000, 80000][i],
  coverImage: `https://images.unsplash.com/photo-${['1519741497674-611481863552', '1537907690979-13c0f6a4c7f4', '1555244162-803834f70033', '1478146059778-26028b07395a', '1487412912498-0447578fcca8', '1470225620780-dba8ba36b745', '1519225421980-715cb0215aed', '1493863641943-9b68992a8d07', '1414235077428-338989a2e8c0', '1519167758481-83f550bb49b3', '1512290923902-8a9f81dc236c', '1483133440078-16c4d1e7ddc0'][i]}?w=400&q=80`,
  featured: i < 3,
  verified: MOCK_VENDOR_META[i].verified,
  totalBookings: MOCK_VENDOR_META[i].totalBookings,
  responseTimeHours: MOCK_VENDOR_META[i].responseTimeHours,
  yearsExperience: MOCK_VENDOR_META[i].yearsExperience,
  teamSize: MOCK_VENDOR_META[i].teamSize,
  cancellationRate: MOCK_VENDOR_META[i].cancellationRate,
  eventTypes: [...MOCK_VENDOR_META[i].events],
  latitude: MOCK_VENDOR_META[i].lat,
  longitude: MOCK_VENDOR_META[i].lng,
  distanceKm: null,
}));

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function getWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('wishlist') || '[]'); } catch { return []; }
}

function toggleWishlist(vendorId: string): boolean {
  const list = getWishlist();
  const idx = list.indexOf(vendorId);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push(vendorId);
  }
  localStorage.setItem('wishlist', JSON.stringify(list));
  window.dispatchEvent(new Event('storage'));
  return idx < 0;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getCoordinates(raw: Record<string, unknown>): { latitude: number | null; longitude: number | null } {
  if (typeof raw.latitude === 'number' && typeof raw.longitude === 'number') {
    return { latitude: raw.latitude, longitude: raw.longitude };
  }
  if (typeof raw.lat === 'number' && typeof raw.lng === 'number') {
    return { latitude: raw.lat, longitude: raw.lng };
  }
  if (raw.location && typeof raw.location === 'object') {
    const location = raw.location as Record<string, unknown>;
    const latitude = typeof location.lat === 'number' ? location.lat : typeof location.latitude === 'number' ? location.latitude : null;
    const longitude = typeof location.lng === 'number' ? location.lng : typeof location.longitude === 'number' ? location.longitude : null;
    return { latitude, longitude };
  }
  return { latitude: null, longitude: null };
}

function formatPrice(p: number, cat: string) {
  if (cat === 'catering') return `₹${p.toLocaleString('en-IN')}/plate`;
  if (p >= 100000) return `₹${(p / 100000).toFixed(1)}L`;
  if (p >= 1000) return `₹${(p / 1000).toFixed(0)}K`;
  return `₹${p}`;
}

function formatResponseTime(hours: number) {
  return `Usually responds in ${hours} hour${hours > 1 ? 's' : ''}`;
}

function formatBookingCount(totalBookings: number) {
  if (totalBookings >= 500) return '500+ weddings';
  if (totalBookings >= 250) return '250+ weddings';
  if (totalBookings >= 150) return '150+ weddings';
  return `${totalBookings}+ weddings`;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDistance(distanceKm?: number | null) {
  if (typeof distanceKm !== 'number' || !Number.isFinite(distanceKm)) return null;
  return `${distanceKm.toFixed(1)} km away`;
}

function normalizeVendor(raw: Record<string, unknown>, selectedCity: string): VendorItem {
  const coordinates = getCoordinates(raw);
  const city = String(raw.city || ((raw.citiesServed || raw.cities_served) as string[] | undefined)?.[0] || selectedCity || 'Hyderabad');
  const eventTypes = Array.isArray(raw.eventTypes)
    ? raw.eventTypes.map(String)
    : Array.isArray(raw.event_types)
      ? raw.event_types.map(String)
      : ['Wedding', 'Reception'];

  return {
    id: String(raw.id || raw._id || ''),
    businessName: String(raw.businessName || raw.business_name || 'Unnamed Vendor'),
    category: String(raw.category || 'venue'),
    citiesServed: Array.isArray(raw.citiesServed)
      ? raw.citiesServed.map(String)
      : Array.isArray(raw.cities_served)
        ? raw.cities_served.map(String)
        : [city],
    rating: String(raw.rating || raw.avgRating || '4.5'),
    totalReviews: toNumber(raw.totalReviews || raw.total_reviews, 0),
    basePrice: toNumber(raw.basePrice || raw.base_price || raw.startingPrice, 0),
    coverImage: String(
      raw.coverImage ||
      raw.cover_image ||
      (Array.isArray(raw.portfolio) && raw.portfolio.length > 0 ? ((raw.portfolio[0] as Record<string, unknown>)?.url || (raw.portfolio[0] as Record<string, unknown>)?.mediaUrl) : null) ||
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
    ),
    featured: Boolean(raw.featured),
    verified: Boolean(raw.verified || raw.isVerified || raw.verificationStatus === 'verified' || raw.verification_status === 'verified'),
    totalBookings: toNumber(raw.totalBookings || raw.total_bookings, 120),
    responseTimeHours: Math.max(1, toNumber(raw.responseTimeHours || raw.response_time_hours, 3)),
    yearsExperience: Math.max(1, toNumber(raw.yearsExperience || raw.years_experience, 8)),
    teamSize: Math.max(1, toNumber(raw.teamSize || raw.team_size, 10)),
    cancellationRate: Number(toNumber(raw.cancellationRate || raw.cancellation_rate, 2).toFixed(1)),
    eventTypes,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    distanceKm: null,
  };
}

function filterAndSortVendors(
  vendors: VendorItem[],
  search: string,
  category: string,
  city: string,
  eventType: string,
  sortBy: string,
  locationActive: boolean,
  userLocation: { lat: number; lng: number } | null,
  radiusKm: string,
) {
  const radiusLimit = radiusKm === 'all' ? Number.POSITIVE_INFINITY : Number(radiusKm);

  const result = vendors
    .map((vendor) => {
      if (locationActive && userLocation && typeof vendor.latitude === 'number' && typeof vendor.longitude === 'number') {
        return {
          ...vendor,
          distanceKm: haversineDistance(userLocation.lat, userLocation.lng, vendor.latitude, vendor.longitude),
        };
      }
      if (!locationActive && city && CITY_COORDS[city] && typeof vendor.latitude === 'number' && typeof vendor.longitude === 'number') {
        return {
          ...vendor,
          distanceKm: haversineDistance(CITY_COORDS[city].lat, CITY_COORDS[city].lng, vendor.latitude, vendor.longitude),
        };
      }
      return { ...vendor, distanceKm: null };
    })
    .filter((vendor) => {
      const matchCategory = category === 'All' || vendor.category === category.toLowerCase();
      const matchSearch = !search || vendor.businessName.toLowerCase().includes(search.toLowerCase());
      const matchCity = !city || vendor.citiesServed.some((servedCity) => servedCity.toLowerCase() === city.toLowerCase());
      const matchEventType = eventType === 'All Events' || vendor.eventTypes.some((item) => item.toLowerCase() === eventType.toLowerCase());
      const matchDistance = !locationActive || radiusKm === 'all' || typeof vendor.distanceKm !== 'number' || vendor.distanceKm <= radiusLimit;
      return matchCategory && matchSearch && matchCity && matchEventType && matchDistance;
    });

  return result.sort((a, b) => {
    switch (sortBy) {
      case 'reviews':
        return b.totalReviews - a.totalReviews;
      case 'price_asc':
        return a.basePrice - b.basePrice;
      case 'price_desc':
        return b.basePrice - a.basePrice;
      default:
        return Number.parseFloat(b.rating) - Number.parseFloat(a.rating);
    }
  });
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="relative h-48 bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20" />
          <div className="h-6 bg-gray-200 rounded-full animate-pulse w-24" />
        </div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="space-y-1">
            <div className="h-2.5 bg-gray-200 rounded animate-pulse w-12" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
          </div>
          <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-20" />
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function DemoModeBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
      <Info size={12} />
      Demo mode — showing sample data
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="text-center py-20"
    >
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="text-7xl mb-6 inline-block"
      >
        🔍
      </motion.div>
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
        className="text-5xl mb-4 inline-block"
      >
        💐
      </motion.div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No vendors found</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">
        We couldn&apos;t find any vendors matching your criteria. Try broadening your search or clearing filters.
      </p>
      <button
        onClick={onClear}
        className="btn-primary mt-2 inline-flex items-center gap-2"
      >
        <X size={16} />
        Clear All Filters
      </button>
    </motion.div>
  );
}

function VendorCard({
  vendor,
  index,
  onEnquiry,
  locationActive,
}: {
  vendor: VendorItem;
  index: number;
  onEnquiry: (vendor: VendorItem) => void;
  locationActive: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [inCompare, setInCompare] = useState(false);
  const isTopRated = Number.parseFloat(vendor.rating) >= 4.8;

  useEffect(() => {
    setLiked(getWishlist().includes(vendor.id));
    setInCompare(isInCompare(vendor.id));
  }, [vendor.id]);

  const handleToggleWishlist = useCallback(() => {
    const nowLiked = toggleWishlist(vendor.id);
    setLiked(nowLiked);
  }, [vendor.id]);

  const handleAddToCompare = useCallback(() => {
    const compareVendor: CompareVendor = {
      id: vendor.id,
      businessName: vendor.businessName,
      category: vendor.category,
      rating: String(vendor.rating),
      totalReviews: vendor.totalReviews,
      basePrice: vendor.basePrice,
      coverImage: vendor.coverImage,
      citiesServed: vendor.citiesServed,
      verified: vendor.verified,
      featured: vendor.featured,
      topRated: isTopRated,
      totalBookings: vendor.totalBookings,
      responseTimeHours: vendor.responseTimeHours,
      yearsExperience: vendor.yearsExperience,
      teamSize: vendor.teamSize,
      cancellationRate: vendor.cancellationRate,
      distanceKm: vendor.distanceKm ?? null,
      priceLabel: formatPrice(vendor.basePrice, vendor.category),
    };
    const added = addToCompare(compareVendor);
    if (added) {
      setInCompare(true);
      toast.success(`Added ${vendor.businessName} to compare`);
    } else {
      toast.error('Compare list is full (max 3 vendors)');
    }
  }, [isTopRated, vendor]);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      layout
      className="card group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={vendor.coverImage}
          alt={vendor.businessName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            onClick={handleAddToCompare}
            disabled={inCompare}
            aria-label={inCompare ? `${vendor.businessName} is in compare list` : `Add ${vendor.businessName} to compare`}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors ${
              inCompare ? 'bg-brand-600 text-white' : 'bg-white/90 text-gray-400 hover:bg-white hover:text-brand-600'
            }`}
          >
            <GitCompareArrows size={14} />
          </button>
          <button
            onClick={handleToggleWishlist}
            aria-label={liked ? `Remove ${vendor.businessName} from wishlist` : `Add ${vendor.businessName} to wishlist`}
            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <Heart size={16} className={liked ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
          </button>
        </div>
        <div className="absolute left-3 top-3 flex max-w-[80%] flex-wrap gap-1.5">
          {vendor.featured && <span className="badge bg-gold-500 text-white text-xs">⭐ Featured</span>}
          {vendor.verified && (
            <span className="badge bg-green-100 text-green-700 text-xs inline-flex items-center gap-1">
              <CheckCircle size={12} /> Verified
            </span>
          )}
          {isTopRated && <span className="badge bg-rose-100 text-rose-700 text-xs">🔥 Top Rated</span>}
        </div>
        <span className="absolute bottom-3 left-3 badge bg-brand-600 text-white text-xs capitalize">{vendor.category}</span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{vendor.businessName}</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-1.5">
          <div className="flex items-center gap-1">
            <Star size={13} className="fill-gold-400 text-gold-400" />
            <span className="font-medium text-gray-900">{vendor.rating}</span>
            <span>({vendor.totalReviews})</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1">
            <MapPin size={13} />
            <span>{vendor.citiesServed[0]}</span>
          </div>
          {locationActive && formatDistance(vendor.distanceKm) && (
            <>
              <span>·</span>
              <span className="text-brand-600 font-medium">{formatDistance(vendor.distanceKm)}</span>
            </>
          )}
        </div>
        <div className="mb-3 space-y-1">
          <SocialProofBadges rating={String(vendor.rating)} reviews={vendor.totalReviews} featured={vendor.featured} />
          <BookingActivityIndicator reviews={vendor.totalReviews} />
        </div>
        <div className="grid gap-2 rounded-xl bg-gray-50 p-3 mb-3 text-xs text-gray-600">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5"><Clock size={12} className="text-brand-500" /> {formatResponseTime(vendor.responseTimeHours)}</span>
            <span className="font-medium text-gray-700">{formatBookingCount(vendor.totalBookings)}</span>
          </div>
          {locationActive && formatDistance(vendor.distanceKm) && (
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5"><LocateFixed size={12} className="text-brand-500" /> Near your venue</span>
              <span className="font-medium text-brand-700">{formatDistance(vendor.distanceKm)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-400">Starting from</span>
            <p className="text-sm font-bold text-brand-700">{formatPrice(vendor.basePrice, vendor.category)}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEnquiry(vendor)}
              className="text-xs py-2 px-3 border border-brand-200 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors font-medium"
              aria-label={`Quick enquiry for ${vendor.businessName}`}
            >
              Enquire
            </button>
            <Link href={`/vendors/${vendor.id}`} className="btn-primary text-xs py-2 px-4">View</Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function VendorsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category');
  const queryParam = searchParams.get('q');
  const cityParam = searchParams.get('city');

  const [search, setSearch] = useState(queryParam || '');
  const [selectedCategory, setSelectedCategory] = useState(
    categoryParam ? CATEGORIES.find((category) => category.toLowerCase() === categoryParam.toLowerCase()) || 'All' : 'All',
  );
  const [selectedCity, setSelectedCity] = useState(cityParam || 'Hyderabad');
  const [selectedEventType, setSelectedEventType] = useState(searchParams.get('eventType') || 'All Events');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [enquiryVendor, setEnquiryVendor] = useState<VendorItem | null>(null);
  const [locationActive, setLocationActive] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [radiusKm, setRadiusKm] = useState('10');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const debouncedSearch = useDebounce(search, DEBOUNCE_MS);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedCity = localStorage.getItem(SELECTED_CITY_KEY);
    if (!cityParam && storedCity && CITIES.includes(storedCity)) {
      setSelectedCity(storedCity);
    }
  }, [cityParam]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SELECTED_CITY_KEY, selectedCity);
  }, [selectedCity]);

  const apiParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (selectedCategory !== 'All') params.category = selectedCategory.toLowerCase();
    if (selectedCity) params.city = selectedCity;
    if (selectedEventType !== 'All Events') params.eventType = selectedEventType;
    if (sortBy) params.sortBy = sortBy;
    if (locationActive && userLocation) {
      params.lat = String(userLocation.lat);
      params.lng = String(userLocation.lng);
      params.radius = radiusKm;
    }
    params.limit = '50';
    return params;
  }, [debouncedSearch, locationActive, radiusKm, selectedCategory, selectedCity, selectedEventType, sortBy, userLocation]);

  const { data: vendorData, isLoading, isError } = useQuery({
    queryKey: ['vendors', apiParams],
    queryFn: async () => {
      try {
        const res = await searchApi.search(apiParams);
        return { vendors: res.data.data?.vendors || res.data.data || res.data, isDemo: false };
      } catch {
        try {
          const res = await vendorApi.search(apiParams);
          return { vendors: res.data.data?.vendors || res.data.data || res.data, isDemo: false };
        } catch {
          return null;
        }
      }
    },
    retry: 0,
    staleTime: 30_000,
  });

  const isDemo = !vendorData || vendorData.isDemo || isError;

  const allVendors: VendorItem[] = useMemo(() => {
    const baseVendors = !isDemo && vendorData?.vendors && Array.isArray(vendorData.vendors)
      ? vendorData.vendors.map((vendor: Record<string, unknown>) => normalizeVendor(vendor, selectedCity))
      : MOCK_VENDORS;

    return filterAndSortVendors(
      baseVendors,
      debouncedSearch,
      selectedCategory,
      selectedCity,
      selectedEventType,
      sortBy,
      locationActive,
      userLocation,
      radiusKm,
    );
  }, [debouncedSearch, isDemo, locationActive, radiusKm, selectedCategory, selectedCity, selectedEventType, sortBy, userLocation, vendorData]);

  const visibleVendors = allVendors.slice(0, visibleCount);
  const hasMore = visibleCount < allVendors.length;

  useEffect(() => {
    if (categoryParam) {
      const matched = CATEGORIES.find((category) => category.toLowerCase() === categoryParam.toLowerCase());
      if (matched) setSelectedCategory(matched);
    }
    if (queryParam) setSearch(queryParam);
  }, [categoryParam, queryParam]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (selectedCategory !== 'All') params.set('category', selectedCategory.toLowerCase());
    if (selectedCity !== 'Hyderabad') params.set('city', selectedCity);
    if (selectedEventType !== 'All Events') params.set('eventType', selectedEventType);
    if (sortBy !== 'rating') params.set('sort', sortBy);
    if (locationActive) {
      params.set('nearMe', '1');
      if (radiusKm !== '10') params.set('radius', radiusKm);
    }
    const qs = params.toString();
    router.replace(`/vendors${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [debouncedSearch, locationActive, radiusKm, router, selectedCategory, selectedCity, selectedEventType, sortBy]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, locationActive, radiusKm, selectedCategory, selectedCity, selectedEventType, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (search) count++;
    if (selectedCity !== 'Hyderabad') count++;
    if (selectedEventType !== 'All Events') count++;
    if (sortBy !== 'rating') count++;
    if (locationActive) count++;
    return count;
  }, [locationActive, search, selectedCategory, selectedCity, selectedEventType, sortBy]);

  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + LOAD_MORE_SIZE, allVendors.length));
      setIsLoadingMore(false);
    }, 300);
  }, [allVendors.length]);

  const handleNearMeToggle = useCallback(() => {
    if (locationActive) {
      setLocationActive(false);
      return;
    }
    if (userLocation) {
      setLocationActive(true);
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation is not supported on this device.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(nextLocation);
        setLocationActive(true);
        setIsLocating(false);
        toast.success('Showing vendors near your location');
      },
      () => {
        setIsLocating(false);
        toast.error('Unable to access your location. Please allow location access and try again.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, [locationActive, userLocation]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedCity('Hyderabad');
    setSelectedEventType('All Events');
    setSortBy('rating');
    setLocationActive(false);
    setRadiusKm('10');
  }, []);

  const resultsLabel = locationActive
    ? `Showing ${Math.min(visibleCount, allVendors.length)} of ${allVendors.length} vendors near you${radiusKm !== 'all' ? ` within ${radiusKm} km` : ' across India'}`
    : `Showing ${Math.min(visibleCount, allVendors.length)} of ${allVendors.length} vendors in ${selectedCity}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10 py-2.5 text-sm"
                  aria-label="Search vendors"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X size={16} className="text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <div className="relative min-w-[150px]">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  aria-label="Select city"
                  className="input-field pl-9 pr-8 py-2.5 text-sm appearance-none cursor-pointer min-w-[150px]"
                >
                  {CITIES.map((city) => <option key={city}>{city}</option>)}
                </select>
              </div>
              <button
                onClick={handleNearMeToggle}
                className={`inline-flex min-w-[132px] items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  locationActive ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                aria-pressed={locationActive}
              >
                {isLocating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
                {isLocating ? 'Locating…' : locationActive ? 'Near Me On' : 'Near Me'}
              </button>
              <div className="relative min-w-[120px]">
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(e.target.value)}
                  aria-label="Select search radius"
                  className="input-field pr-8 py-2.5 text-sm appearance-none cursor-pointer min-w-[120px]"
                  disabled={!locationActive}
                >
                  {RADIUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="relative min-w-[160px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort vendors"
                  className="input-field pr-8 py-2.5 text-sm appearance-none cursor-pointer min-w-[160px]"
                >
                  {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <button
                onClick={clearFilters}
                aria-label={activeFilterCount > 0 ? `${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}. Click to clear all filters` : 'Filters'}
                className="relative shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal size={16} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-brand-600 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  aria-label={`Filter by ${category === 'All' ? 'all categories' : category}`}
                  aria-pressed={selectedCategory === category}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 space-y-2">
            <div>
              <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Event Type</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {EVENT_TYPES.map((eventType) => (
                  <button
                    key={eventType}
                    onClick={() => setSelectedEventType(eventType)}
                    aria-label={`Filter by ${eventType}`}
                    aria-pressed={selectedEventType === eventType}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                      selectedEventType === eventType
                        ? 'bg-gold-500 text-white border-gold-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gold-300 hover:bg-gold-50'
                    }`}
                  >
                    {eventType}
                  </button>
                ))}
              </div>
            </div>
            {selectedCity && (
              <p className="text-xs text-gray-500">
                Planning in <span className="font-semibold text-gray-700">{selectedCity}</span>
                {locationActive && radiusKm !== 'all' && <span> · searching within <span className="font-semibold text-gray-700">{radiusKm} km</span></span>}
              </p>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <SkeletonGrid />
          ) : (
            <>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-gray-600 text-sm">
                    {resultsLabel}
                    {selectedCategory !== 'All' && <> · <strong>{selectedCategory}</strong></>}
                    {selectedEventType !== 'All Events' && <> · <strong>{selectedEventType}</strong></>}
                  </p>
                  {isDemo && <DemoModeBadge />}
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1"
                  >
                    <X size={14} />
                    Clear filters
                  </button>
                )}
              </div>

              {allVendors.length > 0 ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${selectedCategory}-${selectedEventType}-${debouncedSearch}-${locationActive ? radiusKm : 'city'}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                    >
                      {visibleVendors.map((vendor, i) => (
                        <VendorCard
                          key={vendor.id}
                          vendor={vendor}
                          index={i}
                          onEnquiry={setEnquiryVendor}
                          locationActive={locationActive}
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  {hasMore && (
                    <div className="flex justify-center mt-10">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-brand-600 text-brand-600 font-semibold text-sm hover:bg-brand-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Loading…
                          </>
                        ) : (
                          <>Load More Vendors</>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState onClear={clearFilters} />
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
      <CompareFloatingBar />
      {enquiryVendor && (
        <QuickEnquiry
          vendorName={enquiryVendor.businessName}
          vendorId={enquiryVendor.id}
          category={enquiryVendor.category}
          isOpen={!!enquiryVendor}
          onClose={() => setEnquiryVendor(null)}
        />
      )}
    </div>
  );
}

export default function VendorsPage() {
  return <Suspense><VendorsPageInner /></Suspense>;
}
