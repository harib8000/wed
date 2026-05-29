'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompareArrows, X, Star, MapPin, Check, Plus, ArrowRight, Clock, Shield, Trophy, Briefcase, Users, PhoneCall, Download, Share2, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'wedding_os_compare_list';
const SELECTED_CITY_KEY = 'wedding_os_selected_city';
const NOTES_STORAGE_KEY = 'wedding_os_compare_notes';
const WEIGHTS_STORAGE_KEY = 'wedding_os_compare_weights';

type CompareMetricKey = 'price' | 'rating' | 'reviews' | 'experience' | 'team' | 'response' | 'cancellation' | 'trust' | 'distance';

interface CompareNotes {
  [vendorId: string]: string;
}

interface ScoringWeights {
  price: number;
  rating: number;
  reviews: number;
  experience: number;
}

interface SharedComparisonPayload {
  vendors: CompareVendor[];
  eventCity: string;
  weights: ScoringWeights;
}

interface WeightedScoreResult {
  score: number;
  breakdown: {
    price: number;
    rating: number;
    reviews: number;
    experience: number;
  };
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  price: 3,
  rating: 5,
  reviews: 4,
  experience: 4,
};

export interface CompareVendor {
  id: string;
  businessName: string;
  category: string;
  rating: string;
  totalReviews: number;
  basePrice: number;
  coverImage: string;
  citiesServed: string[];
  verified?: boolean;
  featured?: boolean;
  topRated?: boolean;
  totalBookings?: number;
  responseTimeHours?: number;
  yearsExperience?: number;
  teamSize?: number;
  cancellationRate?: number;
  distanceKm?: number | null;
  priceLabel?: string;
}

const DEFAULT_COMPARE_META: Record<string, Partial<CompareVendor>> = {
  'vendor-1': { verified: true, featured: true, topRated: true, totalBookings: 312, responseTimeHours: 2, yearsExperience: 12, teamSize: 50, cancellationRate: 1.4, distanceKm: 2.5 },
  'vendor-2': { verified: true, featured: true, topRated: true, totalBookings: 156, responseTimeHours: 3, yearsExperience: 8, teamSize: 8, cancellationRate: 1.8, distanceKm: 4.1 },
  'vendor-3': { verified: true, featured: false, topRated: false, totalBookings: 420, responseTimeHours: 1, yearsExperience: 15, teamSize: 120, cancellationRate: 1.1, distanceKm: 6.8 },
  'vendor-4': { verified: true, featured: false, topRated: true, totalBookings: 198, responseTimeHours: 2, yearsExperience: 10, teamSize: 24, cancellationRate: 1.6, distanceKm: 5.2 },
  'vendor-5': { verified: true, featured: false, topRated: true, totalBookings: 240, responseTimeHours: 2, yearsExperience: 9, teamSize: 12, cancellationRate: 1.3, distanceKm: 3.4 },
  'vendor-6': { verified: false, featured: false, topRated: false, totalBookings: 132, responseTimeHours: 4, yearsExperience: 7, teamSize: 14, cancellationRate: 2.4, distanceKm: 8.9 },
};

function normalizeCompareVendor(vendor: CompareVendor, index: number): CompareVendor {
  const fallback = DEFAULT_COMPARE_META[vendor.id] || {};
  const rating = Number.parseFloat(vendor.rating || '0') || 0;

  return {
    ...fallback,
    ...vendor,
    rating: String(vendor.rating || rating.toFixed(1) || '4.5'),
    totalReviews: Number(vendor.totalReviews || 0),
    basePrice: Number(vendor.basePrice || 0),
    citiesServed: Array.isArray(vendor.citiesServed) && vendor.citiesServed.length > 0 ? vendor.citiesServed : ['Hyderabad'],
    verified: vendor.verified ?? fallback.verified ?? true,
    featured: vendor.featured ?? fallback.featured ?? index < 2,
    topRated: vendor.topRated ?? fallback.topRated ?? rating >= 4.8,
    totalBookings: vendor.totalBookings ?? fallback.totalBookings ?? 120,
    responseTimeHours: vendor.responseTimeHours ?? fallback.responseTimeHours ?? 3,
    yearsExperience: vendor.yearsExperience ?? fallback.yearsExperience ?? 8,
    teamSize: vendor.teamSize ?? fallback.teamSize ?? 15,
    cancellationRate: vendor.cancellationRate ?? fallback.cancellationRate ?? 2,
    distanceKm: vendor.distanceKm ?? fallback.distanceKm ?? null,
    priceLabel: vendor.priceLabel,
  };
}

function loadCompareList(): CompareVendor[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.map((vendor, index) => normalizeCompareVendor(vendor, index))
      : [];
  } catch {
    return [];
  }
}

function saveCompareList(list: CompareVendor[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('compare-updated'));
}

function loadCompareNotes(): CompareNotes {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed as CompareNotes : {};
  } catch {
    return {};
  }
}

function saveCompareNotes(notes: CompareNotes) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

function loadScoringWeights(): ScoringWeights {
  if (typeof window === 'undefined') return DEFAULT_WEIGHTS;
  try {
    const parsed = JSON.parse(localStorage.getItem(WEIGHTS_STORAGE_KEY) || 'null');
    return {
      price: clampWeight(parsed?.price),
      rating: clampWeight(parsed?.rating),
      reviews: clampWeight(parsed?.reviews),
      experience: clampWeight(parsed?.experience),
    };
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

function saveScoringWeights(weights: ScoringWeights) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WEIGHTS_STORAGE_KEY, JSON.stringify(weights));
}

function clampWeight(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 3;
  return Math.min(5, Math.max(1, Math.round(numeric)));
}

function encodeSharedComparison(payload: SharedComparisonPayload) {
  if (typeof window === 'undefined') return '';
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

function decodeSharedComparison(value: string | null): SharedComparisonPayload | null {
  if (!value || typeof window === 'undefined') return null;

  try {
    const binary = window.atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || !Array.isArray(parsed.vendors)) return null;

    return {
      vendors: parsed.vendors.map((vendor: CompareVendor, index: number) => normalizeCompareVendor(vendor, index)).slice(0, 3),
      eventCity: typeof parsed.eventCity === 'string' && parsed.eventCity.trim() ? parsed.eventCity : 'Hyderabad',
      weights: {
        price: clampWeight(parsed.weights?.price),
        rating: clampWeight(parsed.weights?.rating),
        reviews: clampWeight(parsed.weights?.reviews),
        experience: clampWeight(parsed.weights?.experience),
      },
    };
  } catch {
    return null;
  }
}

function getShareUrl(vendors: CompareVendor[], eventCity: string, weights: ScoringWeights) {
  if (typeof window === 'undefined' || vendors.length === 0) return '';
  const payload = encodeSharedComparison({ vendors, eventCity, weights });
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('ids', vendors.map((vendor) => vendor.id).join(','));
  url.searchParams.set('data', payload);
  return url.toString();
}

export function addToCompare(vendor: CompareVendor): boolean {
  const list = loadCompareList();
  if (list.length >= 3) return false;
  if (list.some((v) => v.id === vendor.id)) return false;
  list.push(normalizeCompareVendor(vendor, list.length));
  saveCompareList(list);
  return true;
}

export function removeFromCompare(vendorId: string) {
  const list = loadCompareList().filter((v) => v.id !== vendorId);
  saveCompareList(list);
}

export function isInCompare(vendorId: string): boolean {
  return loadCompareList().some((v) => v.id === vendorId);
}

export function getCompareCount(): number {
  return loadCompareList().length;
}

function formatPrice(price: number, category: string) {
  if (category === 'catering') return `₹${price.toLocaleString('en-IN')}/plate`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
  if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K`;
  return `₹${price}`;
}

function formatResponseTime(hours?: number) {
  if (!hours) return 'Usually responds in a few hours';
  return `Usually responds in ${hours} hour${hours > 1 ? 's' : ''}`;
}

function formatDistance(distanceKm?: number | null, eventCity?: string) {
  if (typeof distanceKm === 'number') return `${distanceKm.toFixed(1)} km away`;
  return eventCity ? `Serves ${eventCity}` : 'Distance unavailable';
}

function getTrustBadgeCount(vendor: CompareVendor) {
  return Number(vendor.verified) + Number(vendor.featured) + Number(vendor.topRated);
}

function winnerIds(vendors: CompareVendor[], key: CompareMetricKey): Set<string> {
  if (vendors.length === 0) return new Set();

  const values = vendors.map((vendor) => {
    switch (key) {
      case 'rating': return Number.parseFloat(vendor.rating);
      case 'price': return vendor.basePrice;
      case 'reviews': return vendor.totalReviews;
      case 'experience': return vendor.yearsExperience || 0;
      case 'team': return vendor.teamSize || 0;
      case 'response': return vendor.responseTimeHours || Number.MAX_SAFE_INTEGER;
      case 'cancellation': return vendor.cancellationRate || Number.MAX_SAFE_INTEGER;
      case 'trust': return getTrustBadgeCount(vendor);
      case 'distance': return vendor.distanceKm ?? Number.MAX_SAFE_INTEGER;
      default: return vendor.totalReviews;
    }
  });

  const target = ['price', 'response', 'cancellation', 'distance'].includes(key)
    ? Math.min(...values)
    : Math.max(...values);

  return new Set(
    vendors
      .filter((vendor) => {
        const value = (() => {
          switch (key) {
            case 'rating': return Number.parseFloat(vendor.rating);
            case 'price': return vendor.basePrice;
            case 'reviews': return vendor.totalReviews;
            case 'experience': return vendor.yearsExperience || 0;
            case 'team': return vendor.teamSize || 0;
            case 'response': return vendor.responseTimeHours || Number.MAX_SAFE_INTEGER;
            case 'cancellation': return vendor.cancellationRate || Number.MAX_SAFE_INTEGER;
            case 'trust': return getTrustBadgeCount(vendor);
            case 'distance': return vendor.distanceKm ?? Number.MAX_SAFE_INTEGER;
            default: return vendor.totalReviews;
          }
        })();
        return value === target && Number.isFinite(value);
      })
      .map((vendor) => vendor.id),
  );
}

function normalizeHigher(values: number[], value: number) {
  if (values.length === 0) return 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 1;
  return (value - min) / (max - min);
}

function normalizeLower(values: number[], value: number) {
  if (values.length === 0) return 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 1;
  return (max - value) / (max - min);
}

function getWeightedScores(vendors: CompareVendor[], weights: ScoringWeights): Record<string, WeightedScoreResult> {
  if (vendors.length === 0) return {};

  const prices = vendors.map((vendor) => vendor.basePrice);
  const ratings = vendors.map((vendor) => Number.parseFloat(vendor.rating) || 0);
  const reviews = vendors.map((vendor) => vendor.totalReviews || 0);
  const experiences = vendors.map((vendor) => vendor.yearsExperience || 0);
  const totalWeight = weights.price + weights.rating + weights.reviews + weights.experience;

  return vendors.reduce<Record<string, WeightedScoreResult>>((accumulator, vendor) => {
    const breakdown = {
      price: normalizeLower(prices, vendor.basePrice),
      rating: normalizeHigher(ratings, Number.parseFloat(vendor.rating) || 0),
      reviews: normalizeHigher(reviews, vendor.totalReviews || 0),
      experience: normalizeHigher(experiences, vendor.yearsExperience || 0),
    };

    const score = totalWeight === 0
      ? 0
      : ((breakdown.price * weights.price)
        + (breakdown.rating * weights.rating)
        + (breakdown.reviews * weights.reviews)
        + (breakdown.experience * weights.experience)) / totalWeight;

    accumulator[vendor.id] = {
      score: Math.round(score * 100),
      breakdown,
    };
    return accumulator;
  }, {});
}

function getKeyDifferences(vendors: CompareVendor[], bestVendorId: string | null) {
  const lowestPrice = winnerIds(vendors, 'price');
  const highestRating = winnerIds(vendors, 'rating');
  const mostReviews = winnerIds(vendors, 'reviews');
  const mostExperience = winnerIds(vendors, 'experience');
  const fastestResponse = winnerIds(vendors, 'response');
  const strongestTrust = winnerIds(vendors, 'trust');
  const nearest = winnerIds(vendors, 'distance');

  return vendors.reduce<Record<string, string[]>>((accumulator, vendor) => {
    const differences: string[] = [];

    if (vendor.id === bestVendorId) differences.push('Best overall match');
    if (lowestPrice.has(vendor.id)) differences.push('Best price');
    if (highestRating.has(vendor.id)) differences.push('Highest rating');
    if (mostReviews.has(vendor.id)) differences.push('Most reviewed');
    if (mostExperience.has(vendor.id)) differences.push('Most experienced');
    if (fastestResponse.has(vendor.id)) differences.push('Fastest response');
    if (strongestTrust.has(vendor.id)) differences.push('Strong trust signals');
    if (nearest.has(vendor.id) && vendor.distanceKm !== null && vendor.distanceKm !== undefined) differences.push('Nearest to venue');

    accumulator[vendor.id] = differences.length > 0 ? differences.slice(0, 3) : ['Balanced option'];
    return accumulator;
  }, {});
}

function WinnerBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
      <Trophy size={10} /> Winner
    </span>
  );
}

function BestMatchBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
      <Trophy size={10} /> Best Match
    </span>
  );
}

function WeightSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{value}/5</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-brand-600"
        aria-label={`${label} importance`}
      />
      <div className="mt-2 flex justify-between text-[11px] text-gray-400">
        <span>Lower</span>
        <span>Higher</span>
      </div>
    </div>
  );
}

export function CompareFloatingBar() {
  const [compareList, setCompareList] = useState<CompareVendor[]>([]);
  const [expanded, setExpanded] = useState(false);

  const refreshList = useCallback(() => {
    setCompareList(loadCompareList());
  }, []);

  useEffect(() => {
    refreshList();
    window.addEventListener('compare-updated', refreshList);
    return () => window.removeEventListener('compare-updated', refreshList);
  }, [refreshList]);

  if (compareList.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 md:bottom-6"
      >
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-b border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    {compareList.map((vendor) => (
                      <div key={vendor.id} className="relative w-24 text-center">
                        <button
                          onClick={() => {
                            removeFromCompare(vendor.id);
                            refreshList();
                          }}
                          className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                          aria-label={`Remove ${vendor.businessName} from comparison`}
                        >
                          <X size={10} />
                        </button>
                        <img
                          src={vendor.coverImage}
                          alt={vendor.businessName}
                          className="mx-auto mb-1 h-14 w-20 rounded-lg object-cover"
                        />
                        <p className="truncate text-xs font-medium text-gray-900">{vendor.businessName}</p>
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                          <Star size={10} className="fill-gold-400 text-gold-400" />
                          {vendor.rating}
                        </div>
                      </div>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, index) => (
                      <div key={`empty-${index}`} className="flex h-20 w-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
                        <Plus size={16} className="text-gray-300" />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
            >
              <GitCompareArrows size={18} className="text-brand-600" />
              <span>{compareList.length} vendor{compareList.length > 1 ? 's' : ''} to compare</span>
            </button>
            <Link
              href={`/compare?ids=${compareList.map((vendor) => vendor.id).join(',')}`}
              className="btn-primary flex items-center gap-1 px-4 py-2 text-xs"
            >
              Compare Now <ArrowRight size={14} />
            </Link>
            <button
              onClick={() => {
                saveCompareList([]);
                refreshList();
              }}
              className="text-xs text-gray-400 transition-colors hover:text-red-500"
            >
              Clear
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function ComparePageContent() {
  const searchParams = useSearchParams();
  const sharedData = searchParams.get('data');
  const [vendors, setVendors] = useState<CompareVendor[]>([]);
  const [eventCity, setEventCity] = useState('your event location');
  const [notes, setNotes] = useState<CompareNotes>({});
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const sharedComparison = decodeSharedComparison(sharedData);
    const storedCity = typeof window !== 'undefined' ? localStorage.getItem(SELECTED_CITY_KEY) || 'Hyderabad' : 'Hyderabad';
    const nextVendors = sharedComparison?.vendors || loadCompareList();
    const nextWeights = sharedComparison?.weights || loadScoringWeights();

    setVendors(nextVendors);
    setEventCity(sharedComparison?.eventCity || storedCity);
    setWeights(nextWeights);
    setNotes(loadCompareNotes());

    if (sharedComparison?.vendors?.length) {
      saveCompareList(sharedComparison.vendors);
    }
  }, [sharedData]);

  useEffect(() => {
    saveScoringWeights(weights);
  }, [weights]);

  const weightedScores = useMemo(() => getWeightedScores(vendors, weights), [vendors, weights]);

  const bestVendorId = useMemo(() => {
    if (vendors.length === 0) return null;

    return vendors.reduce<string | null>((best, vendor) => {
      if (!best) return vendor.id;
      return (weightedScores[vendor.id]?.score || 0) > (weightedScores[best]?.score || 0) ? vendor.id : best;
    }, null);
  }, [vendors, weightedScores]);

  const keyDifferences = useMemo(() => getKeyDifferences(vendors, bestVendorId), [vendors, bestVendorId]);

  const shareUrl = useMemo(() => getShareUrl(vendors, eventCity, weights), [vendors, eventCity, weights]);

  const compareFields = useMemo(() => [
    {
      label: 'Quality Rating',
      key: 'rating' as const,
      icon: Star,
      render: (vendor: CompareVendor) => (
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-gold-400 text-gold-400" />
            <span className="font-semibold">{vendor.rating}</span>
          </div>
          <span className="text-xs text-gray-500">Average customer rating</span>
        </div>
      ),
    },
    {
      label: 'Reviews Count',
      key: 'reviews' as const,
      icon: Users,
      render: (vendor: CompareVendor) => (
        <div className="text-center">
          <div className="font-semibold text-gray-900">{vendor.totalReviews}</div>
          <span className="text-xs text-gray-500">Verified reviews</span>
        </div>
      ),
    },
    {
      label: 'Price Range',
      key: 'price' as const,
      icon: PhoneCall,
      render: (vendor: CompareVendor) => (
        <div className="text-center">
          <div className="font-bold text-brand-700">{vendor.priceLabel || formatPrice(vendor.basePrice, vendor.category)}</div>
          <span className="text-xs text-gray-500">Starting price</span>
        </div>
      ),
    },
    {
      label: 'Years of Experience',
      key: 'experience' as const,
      icon: Briefcase,
      render: (vendor: CompareVendor) => <span className="font-medium">{vendor.yearsExperience}+ years</span>,
    },
    {
      label: 'Team Size',
      key: 'team' as const,
      icon: Users,
      render: (vendor: CompareVendor) => <span className="font-medium">{vendor.teamSize}+ experts</span>,
    },
    {
      label: 'Response Time',
      key: 'response' as const,
      icon: Clock,
      render: (vendor: CompareVendor) => <span className="text-sm font-medium">{formatResponseTime(vendor.responseTimeHours)}</span>,
    },
    {
      label: 'Cancellation Rate',
      key: 'cancellation' as const,
      icon: Shield,
      render: (vendor: CompareVendor) => <span className="font-medium">Less than {vendor.cancellationRate}%</span>,
    },
    {
      label: 'Trust Badges',
      key: 'trust' as const,
      icon: Check,
      render: (vendor: CompareVendor) => (
        <div className="flex flex-wrap justify-center gap-1.5">
          {vendor.verified && <span className="rounded-full bg-green-50 px-2 py-1 text-[11px] font-medium text-green-700">✓ Verified</span>}
          {vendor.topRated && <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700">🔥 Top Rated</span>}
          {vendor.featured && <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">⭐ Featured</span>}
        </div>
      ),
    },
    {
      label: `Distance from ${eventCity}`,
      key: 'distance' as const,
      icon: MapPin,
      render: (vendor: CompareVendor) => <span className="text-sm font-medium">{formatDistance(vendor.distanceKm, eventCity)}</span>,
    },
  ], [eventCity]);

  const handleRemoveVendor = useCallback((vendorId: string) => {
    removeFromCompare(vendorId);
    setVendors(loadCompareList());
    setNotes((previous) => {
      const next = { ...previous };
      delete next[vendorId];
      saveCompareNotes(next);
      return next;
    });
  }, []);

  const handleNoteChange = useCallback((vendorId: string, value: string) => {
    setNotes((previous) => {
      const next = {
        ...previous,
        [vendorId]: value,
      };

      if (!value.trim()) {
        delete next[vendorId];
      }

      saveCompareNotes(next);
      return next;
    });
  }, []);

  const handleWeightChange = useCallback((key: keyof ScoringWeights, value: number) => {
    setWeights((previous) => ({
      ...previous,
      [key]: clampWeight(value),
    }));
  }, []);

  const handleShareComparison = useCallback(async () => {
    if (!shareUrl) {
      toast.error('Add vendors to share this comparison');
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      toast.success('Comparison link copied!', { duration: 2000, position: 'bottom-center' });
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      toast.error('Could not copy comparison link');
    }
  }, [shareUrl]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (vendors.length === 0) {
    return (
      <div className="py-20 text-center">
        <GitCompareArrows size={48} className="mx-auto mb-4 text-gray-300" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">No vendors to compare</h2>
        <p className="mb-6 text-gray-500">Add vendors to your compare list from the vendor listing page.</p>
        <Link href="/vendors" className="btn-primary inline-flex items-center gap-2">
          Browse Vendors <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @page {
          size: landscape;
          margin: 14mm;
        }

        @media screen {
          .compare-print-only {
            display: none !important;
          }
        }

        @media print {
          body {
            background: #ffffff !important;
          }

          nav,
          footer,
          .compare-print-hide {
            display: none !important;
          }

          .compare-page-shell,
          .compare-page-content {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            background: #ffffff !important;
          }

          .compare-print-only {
            display: block !important;
          }

          .compare-grid-wrap {
            overflow: visible !important;
          }

          .compare-grid {
            min-width: 0 !important;
            gap: 10px !important;
          }

          .compare-vendor-card,
          .compare-field-card,
          .compare-score-card,
          .compare-weights-card {
            box-shadow: none !important;
            border-color: #d1d5db !important;
            break-inside: avoid;
          }

          .compare-note-print {
            white-space: pre-wrap;
          }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <GitCompareArrows size={24} className="text-brand-600" />
            <div>
              <h1 className="font-heading text-2xl font-bold text-gray-900">Compare Vendors</h1>
              <p className="text-sm text-gray-500">Trust, pricing, response speed and location — side by side.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 compare-print-hide">
            <button
              onClick={handleShareComparison}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-brand-200 hover:text-brand-700"
            >
              <Share2 size={16} />
              {shareCopied ? 'Copied!' : 'Share comparison'}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              <Download size={16} />
              Export as PDF
            </button>
          </div>
        </div>

        <div className="compare-print-only mb-6 rounded-3xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Vendor comparison summary</h2>
          <p className="mt-1 text-sm text-gray-500">Prepared for {eventCity}. Save this print dialog as a PDF to share with family.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="compare-weights-card compare-print-hide mb-8 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                <SlidersHorizontal size={14} /> Weighted scoring
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Tell us what matters most</h2>
              <p className="text-sm text-gray-500">Adjust priorities to see the strongest fit for your event.</p>
            </div>
            <p className="text-xs text-gray-500">Distances are shown relative to {eventCity} when available.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <WeightSlider label="Price importance" value={weights.price} onChange={(value) => handleWeightChange('price', value)} />
            <WeightSlider label="Quality/Rating importance" value={weights.rating} onChange={(value) => handleWeightChange('rating', value)} />
            <WeightSlider label="Reviews count importance" value={weights.reviews} onChange={(value) => handleWeightChange('reviews', value)} />
            <WeightSlider label="Experience importance" value={weights.experience} onChange={(value) => handleWeightChange('experience', value)} />
          </div>
        </motion.div>

        <div className="compare-grid-wrap overflow-x-auto pb-2">
          <div className="compare-grid grid min-w-[840px] gap-4" style={{ gridTemplateColumns: `200px repeat(${vendors.length}, minmax(220px, 1fr))` }}>
            <div />
            {vendors.map((vendor) => {
              const score = weightedScores[vendor.id]?.score || 0;
              const note = notes[vendor.id] || '';
              const isBestMatch = vendor.id === bestVendorId;

              return (
                <div key={vendor.id} className="compare-vendor-card rounded-3xl border border-gray-200 bg-white p-4 text-center shadow-sm">
                  <div className="relative mb-3 overflow-hidden rounded-2xl">
                    <img
                      src={vendor.coverImage}
                      alt={vendor.businessName}
                      className="h-36 w-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveVendor(vendor.id)}
                      className="compare-print-hide absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm transition-colors hover:text-red-500"
                      aria-label={`Remove ${vendor.businessName} from comparison`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
                    {isBestMatch && <BestMatchBadge />}
                    {vendor.topRated && !isBestMatch && <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700">Top Rated</span>}
                  </div>
                  <h3 className="mb-1 font-semibold text-gray-900">{vendor.businessName}</h3>
                  <p className="mb-3 text-xs capitalize text-gray-500">{vendor.category}</p>
                  <div className="compare-score-card mb-4 rounded-2xl border border-brand-100 bg-brand-50/70 p-3 text-left">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">Weighted score</span>
                      <span className="text-lg font-bold text-brand-700">{score}<span className="text-sm text-brand-500">/100</span></span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/80">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500" style={{ width: `${score}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-gray-600">Based on your price, quality, review count and experience priorities.</p>
                  </div>
                  <div className="mb-4 flex flex-wrap justify-center gap-1.5">
                    {(keyDifferences[vendor.id] || []).map((difference) => (
                      <span key={difference} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                        {difference}
                      </span>
                    ))}
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-2 text-left text-xs text-gray-500">
                    <div className="rounded-xl bg-gray-50 p-2">
                      <p className="font-semibold text-gray-900">{vendor.totalBookings}+</p>
                      <p>Bookings</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-2">
                      <p className="font-semibold text-gray-900">{vendor.responseTimeHours}h</p>
                      <p>Response</p>
                    </div>
                  </div>
                  <div className="mb-4 rounded-2xl border border-dashed border-gray-200 p-3 text-left compare-print-hide">
                    <label htmlFor={`note-${vendor.id}`} className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Personal note
                    </label>
                    <textarea
                      id={`note-${vendor.id}`}
                      value={note}
                      onChange={(event) => handleNoteChange(vendor.id, event.target.value)}
                      rows={4}
                      placeholder="Add your notes, negotiation details or reminders..."
                      className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <div className="compare-print-only rounded-2xl border border-gray-200 bg-gray-50 p-3 text-left">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
                    <p className="compare-note-print text-sm text-gray-700">{note.trim() || 'No personal notes added.'}</p>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 compare-print-hide">
                    <Link href={`/checkout/${vendor.id}`} className="btn-primary w-full py-2.5 text-center text-sm">
                      Book Now
                    </Link>
                    <Link href={`/vendors/${vendor.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                      View full profile →
                    </Link>
                  </div>
                </div>
              );
            })}

            {compareFields.map((field, rowIndex) => {
              const Icon = field.icon;
              const winners = winnerIds(vendors, field.key);

              return (
                <div key={field.key} className="contents">
                  <div className={`compare-field-card flex items-center gap-2 rounded-2xl px-4 py-4 text-sm font-medium text-gray-600 ${rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <Icon size={15} className="text-brand-500" />
                    {field.label}
                  </div>
                  {vendors.map((vendor) => {
                    const isWinner = winners.has(vendor.id);
                    return (
                      <div
                        key={`${field.key}-${vendor.id}`}
                        className={`compare-field-card rounded-2xl border px-4 py-4 text-sm ${rowIndex % 2 === 0 ? 'border-gray-100 bg-gray-50' : 'border-gray-100 bg-white'} ${isWinner ? 'border-green-200 bg-green-50/80' : ''}`}
                      >
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                          {isWinner && <WinnerBadge />}
                          {field.render(vendor)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
