'use client';
import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Star, Heart, X, SlidersHorizontal, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { QuickEnquiry } from '@/components/vendors/QuickEnquiry';
import { vendorApi, searchApi } from '@/lib/api';

const CATEGORIES = ['All', 'Venue', 'Photography', 'Catering', 'Decor', 'Makeup', 'Music', 'Mehendi', 'Videography', 'Transport'];
const CITIES = ['Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Jaipur'];
const EVENT_TYPES = ['All Events', 'Wedding', 'Engagement', 'Dhoti Ceremony', 'Saree Function', 'Birthday', 'Reception', 'Housewarming', 'Baby Shower', 'Anniversary', 'Corporate Event'];
const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'reviews', label: 'Most Reviewed' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const PAGE_SIZE = 8;
const LOAD_MORE_SIZE = 4;
const DEBOUNCE_MS = 400;

// Mock vendors for display — deterministic values to prevent hydration mismatch
const MOCK_RATINGS = ['4.9', '4.8', '4.7', '4.9', '4.6', '4.8', '4.7', '4.9', '4.8', '4.5', '4.7', '4.6'];
const MOCK_REVIEWS = [247, 189, 312, 95, 156, 78, 201, 167, 283, 134, 112, 63];
const MOCK_VENDORS = Array.from({ length: 12 }, (_, i) => ({
  id: `vendor-${i + 1}`,
  businessName: ['Royal Grand Palace', 'Srikanth Photography', 'Flavours Catering', 'Blooms & Dreams', 'Shika Makeup', 'Beats & Celebrations', 'Heritage Banquets', 'Frame Perfect Studios', 'Royal Feast', 'Garden of Eden Decor', 'Glamour Touch', 'Melody Masters'][i],
  category: ['venue', 'photography', 'catering', 'decor', 'makeup', 'music', 'venue', 'photography', 'catering', 'decor', 'makeup', 'music'][i],
  citiesServed: ['Hyderabad'],
  rating: MOCK_RATINGS[i],
  totalReviews: MOCK_REVIEWS[i],
  basePrice: [500000, 80000, 800, 150000, 25000, 60000, 300000, 100000, 1200, 200000, 35000, 80000][i],
  coverImage: `https://images.unsplash.com/photo-${['1519741497674-611481863552', '1537907690979-13c0f6a4c7f4', '1555244162-803834f70033', '1478146059778-26028b07395a', '1487412912498-0447578fcca8', '1470225620780-dba8ba36b745', '1519225421980-715cb0215aed', '1493863641943-9b68992a8d07', '1414235077428-338989a2e8c0', '1519167758481-83f550bb49b3', '1512290923902-8a9f81dc236c', '1483133440078-16c4d1e7ddc0'][i]}?w=400&q=80`,
  featured: i < 3,
}));

type VendorItem = typeof MOCK_VENDORS[0];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
};

/* ─── Debounce hook ─── */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

/* ─── Wishlist helper ─── */
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

/* ─── Skeleton Card ─── */
function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="relative h-48 bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
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
      {Array.from({ length: 12 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/* ─── Demo Mode Badge ─── */
function DemoModeBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
      <Info size={12} />
      Demo mode — showing sample data
    </div>
  );
}

/* ─── Empty State ─── */
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

/* ─── Vendor Card ─── */
function VendorCard({ vendor, index, onEnquiry }: { vendor: VendorItem; index: number; onEnquiry: (vendor: VendorItem) => void }) {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLiked(getWishlist().includes(vendor.id));
  }, [vendor.id]);

  const handleToggleWishlist = useCallback(() => {
    const nowLiked = toggleWishlist(vendor.id);
    setLiked(nowLiked);
  }, [vendor.id]);

  const formatPrice = (p: number, cat: string) => {
    if (cat === 'catering') return `₹${p.toLocaleString('en-IN')}/plate`;
    if (p >= 100000) return `₹${(p / 100000).toFixed(1)}L`;
    if (p >= 1000) return `₹${(p / 1000).toFixed(0)}K`;
    return `₹${p}`;
  };

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
        <button
          onClick={handleToggleWishlist}
          aria-label={liked ? `Remove ${vendor.businessName} from wishlist` : `Add ${vendor.businessName} to wishlist`}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <Heart size={16} className={liked ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>
        {vendor.featured && (
          <span className="absolute top-3 left-3 badge bg-gold-500 text-white text-xs">⭐ Featured</span>
        )}
        <span className="absolute bottom-3 left-3 badge bg-brand-600 text-white text-xs capitalize">{vendor.category}</span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{vendor.businessName}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Star size={13} className="fill-gold-400 text-gold-400" />
            <span className="font-medium text-gray-900">{vendor.rating}</span>
            <span>({vendor.totalReviews})</span>
          </div>
          <span>·</span>
          <MapPin size={13} />
          <span>{vendor.citiesServed[0]}</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-400">Starting</span>
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

/* ─── Filter mock data locally (fallback) ─── */
function filterMockVendors(vendors: VendorItem[], search: string, category: string, city: string, sortBy: string): VendorItem[] {
  let result = vendors.filter((v) => {
    const matchCategory = category === 'All' || v.category === category.toLowerCase();
    const matchSearch = !search || v.businessName.toLowerCase().includes(search.toLowerCase());
    const matchCity = !city || v.citiesServed.some(c => c.toLowerCase() === city.toLowerCase());
    return matchCategory && matchSearch && matchCity;
  });

  result = [...result].sort((a, b) => {
    switch (sortBy) {
      case 'reviews': return b.totalReviews - a.totalReviews;
      case 'price_asc': return a.basePrice - b.basePrice;
      case 'price_desc': return b.basePrice - a.basePrice;
      default: return parseFloat(String(b.rating)) - parseFloat(String(a.rating));
    }
  });

  return result;
}

/* ─── Page ─── */
function VendorsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category');
  const queryParam = searchParams.get('q');

  const [search, setSearch] = useState(queryParam || '');
  const [selectedCategory, setSelectedCategory] = useState(
    categoryParam ? CATEGORIES.find(c => c.toLowerCase() === categoryParam.toLowerCase()) || 'All' : 'All'
  );
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'Hyderabad');
  const [selectedEventType, setSelectedEventType] = useState(searchParams.get('eventType') || 'All Events');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [enquiryVendor, setEnquiryVendor] = useState<VendorItem | null>(null);

  const debouncedSearch = useDebounce(search, DEBOUNCE_MS);

  // Build API query params
  const apiParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (selectedCategory !== 'All') params.category = selectedCategory.toLowerCase();
    if (selectedCity) params.city = selectedCity;
    if (selectedEventType !== 'All Events') params.eventType = selectedEventType;
    if (sortBy) params.sortBy = sortBy;
    params.limit = '50';
    return params;
  }, [debouncedSearch, selectedCategory, selectedCity, selectedEventType, sortBy]);

  // Fetch vendors from API with mock fallback
  const { data: vendorData, isLoading, isError } = useQuery({
    queryKey: ['vendors', apiParams],
    queryFn: async () => {
      // Try search API first (Elasticsearch), fall back to vendor API
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

  // Normalize API vendors to match our card shape, or use mock fallback with local filtering
  const allVendors: VendorItem[] = useMemo(() => {
    if (!isDemo && vendorData?.vendors && Array.isArray(vendorData.vendors) && vendorData.vendors.length > 0) {
      return vendorData.vendors.map((v: Record<string, unknown>) => ({
        id: (v.id || v._id || '') as string,
        businessName: (v.businessName || v.business_name || 'Unnamed Vendor') as string,
        category: (v.category || 'venue') as string,
        citiesServed: (v.citiesServed || v.cities_served || ['Hyderabad']) as string[],
        rating: String(v.rating || v.avgRating || '4.5'),
        totalReviews: Number(v.totalReviews || v.total_reviews || 0),
        basePrice: Number(v.basePrice || v.base_price || v.startingPrice || 0),
        coverImage: (v.coverImage || v.cover_image || v.portfolio?.[0]?.url || `https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80`) as string,
        featured: Boolean(v.featured),
      }));
    }
    // Fallback: filter mock data locally
    return filterMockVendors(MOCK_VENDORS, debouncedSearch, selectedCategory, selectedCity, sortBy);
  }, [vendorData, isDemo, debouncedSearch, selectedCategory, selectedCity, sortBy]);

  const visibleVendors = allVendors.slice(0, visibleCount);
  const hasMore = visibleCount < allVendors.length;

  // Sync URL params when they change
  useEffect(() => {
    if (categoryParam) {
      const matched = CATEGORIES.find(c => c.toLowerCase() === categoryParam.toLowerCase());
      if (matched) setSelectedCategory(matched);
    }
    if (queryParam) setSearch(queryParam);
  }, [categoryParam, queryParam]);

  // Update URL search params for deep linking (debounced)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (selectedCategory !== 'All') params.set('category', selectedCategory.toLowerCase());
    if (selectedCity !== 'Hyderabad') params.set('city', selectedCity);
    if (selectedEventType !== 'All Events') params.set('eventType', selectedEventType);
    if (sortBy !== 'rating') params.set('sort', sortBy);
    const qs = params.toString();
    router.replace(`/vendors${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [debouncedSearch, selectedCategory, selectedCity, selectedEventType, sortBy, router]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, selectedCategory, selectedCity, selectedEventType, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (search) count++;
    if (selectedCity !== 'Hyderabad') count++;
    if (selectedEventType !== 'All Events') count++;
    if (sortBy !== 'rating') count++;
    return count;
  }, [selectedCategory, search, selectedCity, selectedEventType, sortBy]);

  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + LOAD_MORE_SIZE, allVendors.length));
      setIsLoadingMore(false);
    }, 300);
  }, [allVendors.length]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedCity('Hyderabad');
    setSelectedEventType('All Events');
    setSortBy('rating');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
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
              {/* City */}
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  aria-label="Select city"
                  className="input-field pl-9 pr-8 py-2.5 text-sm appearance-none cursor-pointer min-w-[140px]"
                >
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort vendors"
                  className="input-field pr-8 py-2.5 text-sm appearance-none cursor-pointer min-w-[160px]"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {/* Filters chip */}
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

          {/* Category tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  aria-label={`Filter by ${cat === 'All' ? 'all categories' : cat}`}
                  aria-pressed={selectedCategory === cat}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Event type filter */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
            <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Event Type</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {EVENT_TYPES.map((et) => (
                <button
                  key={et}
                  onClick={() => setSelectedEventType(et)}
                  aria-label={`Filter by ${et}`}
                  aria-pressed={selectedEventType === et}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    selectedEventType === et
                      ? 'bg-gold-500 text-white border-gold-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gold-300 hover:bg-gold-50'
                  }`}
                >
                  {et}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <SkeletonGrid />
          ) : (
            <>
              {/* Result count + Demo badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <p className="text-gray-600 text-sm">
                    Showing <strong>{Math.min(visibleCount, allVendors.length)}</strong> of <strong>{allVendors.length}</strong> vendors in <strong>{selectedCity}</strong>
                    {selectedCategory !== 'All' && <> · <strong>{selectedCategory}</strong></>}
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
                      key={`${selectedCategory}-${debouncedSearch}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                    >
                      {visibleVendors.map((vendor, i) => (
                        <VendorCard key={vendor.id} vendor={vendor} index={i} onEnquiry={setEnquiryVendor} />
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  {/* Load More */}
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
      {/* Quick Enquiry Modal */}
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
