'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompareArrows, X, Star, MapPin, Check, Plus, ArrowRight, Clock, Shield, Trophy, Briefcase, Users, PhoneCall } from 'lucide-react';
import Link from 'next/link';

const STORAGE_KEY = 'wedding_os_compare_list';
const SELECTED_CITY_KEY = 'wedding_os_selected_city';

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

function formatPrice(p: number, cat: string) {
  if (cat === 'catering') return `₹${p.toLocaleString('en-IN')}/plate`;
  if (p >= 100000) return `₹${(p / 100000).toFixed(1)}L`;
  if (p >= 1000) return `₹${(p / 1000).toFixed(0)}K`;
  return `₹${p}`;
}

function formatResponseTime(hours?: number) {
  if (!hours) return 'Usually responds in a few hours';
  return `Usually responds in ${hours} hour${hours > 1 ? 's' : ''}`;
}

function formatDistance(distanceKm?: number | null, eventCity?: string) {
  if (typeof distanceKm === 'number') return `${distanceKm.toFixed(1)} km away`;
  return eventCity ? `Serves ${eventCity}` : 'Distance unavailable';
}

function trustScore(vendor: CompareVendor) {
  return Number(vendor.verified) + Number(vendor.featured) + Number(vendor.topRated);
}

function winnerIds(vendors: CompareVendor[], key: string): Set<string> {
  if (vendors.length === 0) return new Set();

  const values = vendors.map((vendor) => {
    switch (key) {
      case 'rating': return Number.parseFloat(vendor.rating);
      case 'price': return vendor.basePrice;
      case 'experience': return vendor.yearsExperience || 0;
      case 'team': return vendor.teamSize || 0;
      case 'response': return vendor.responseTimeHours || Number.MAX_SAFE_INTEGER;
      case 'cancellation': return vendor.cancellationRate || Number.MAX_SAFE_INTEGER;
      case 'trust': return trustScore(vendor);
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
            case 'experience': return vendor.yearsExperience || 0;
            case 'team': return vendor.teamSize || 0;
            case 'response': return vendor.responseTimeHours || Number.MAX_SAFE_INTEGER;
            case 'cancellation': return vendor.cancellationRate || Number.MAX_SAFE_INTEGER;
            case 'trust': return trustScore(vendor);
            case 'distance': return vendor.distanceKm ?? Number.MAX_SAFE_INTEGER;
            default: return vendor.totalReviews;
          }
        })();
        return value === target && Number.isFinite(value);
      })
      .map((vendor) => vendor.id),
  );
}

function WinnerBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
      <Trophy size={10} /> Winner
    </span>
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
        className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {compareList.map((vendor) => (
                      <div key={vendor.id} className="relative w-24 text-center">
                        <button
                          onClick={() => {
                            removeFromCompare(vendor.id);
                            refreshList();
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs z-10"
                          aria-label={`Remove ${vendor.businessName} from comparison`}
                        >
                          <X size={10} />
                        </button>
                        <img
                          src={vendor.coverImage}
                          alt={vendor.businessName}
                          className="w-20 h-14 object-cover rounded-lg mx-auto mb-1"
                        />
                        <p className="text-xs font-medium text-gray-900 truncate">{vendor.businessName}</p>
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                          <Star size={10} className="fill-gold-400 text-gold-400" />
                          {vendor.rating}
                        </div>
                      </div>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-24 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
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
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <GitCompareArrows size={18} className="text-brand-600" />
              <span>{compareList.length} vendor{compareList.length > 1 ? 's' : ''} to compare</span>
            </button>
            <Link
              href={`/compare?ids=${compareList.map((v) => v.id).join(',')}`}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1"
            >
              Compare Now <ArrowRight size={14} />
            </Link>
            <button
              onClick={() => {
                saveCompareList([]);
                refreshList();
              }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
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
  const [vendors, setVendors] = useState<CompareVendor[]>([]);
  const [eventCity, setEventCity] = useState('your event location');

  useEffect(() => {
    setVendors(loadCompareList());
    if (typeof window !== 'undefined') {
      setEventCity(localStorage.getItem(SELECTED_CITY_KEY) || 'Hyderabad');
    }
  }, []);

  const compareFields = useMemo(() => [
    {
      label: 'Rating & Reviews',
      key: 'rating',
      icon: Star,
      render: (vendor: CompareVendor) => (
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-gold-400 text-gold-400" />
            <span className="font-semibold">{vendor.rating}</span>
          </div>
          <span className="text-xs text-gray-500">{vendor.totalReviews} reviews</span>
        </div>
      ),
    },
    {
      label: 'Price Range',
      key: 'price',
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
      key: 'experience',
      icon: Briefcase,
      render: (vendor: CompareVendor) => <span className="font-medium">{vendor.yearsExperience}+ years</span>,
    },
    {
      label: 'Team Size',
      key: 'team',
      icon: Users,
      render: (vendor: CompareVendor) => <span className="font-medium">{vendor.teamSize}+ experts</span>,
    },
    {
      label: 'Response Time',
      key: 'response',
      icon: Clock,
      render: (vendor: CompareVendor) => <span className="text-sm font-medium">{formatResponseTime(vendor.responseTimeHours)}</span>,
    },
    {
      label: 'Cancellation Rate',
      key: 'cancellation',
      icon: Shield,
      render: (vendor: CompareVendor) => <span className="font-medium">Less than {vendor.cancellationRate}%</span>,
    },
    {
      label: 'Trust Badges',
      key: 'trust',
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
      key: 'distance',
      icon: MapPin,
      render: (vendor: CompareVendor) => <span className="text-sm font-medium">{formatDistance(vendor.distanceKm, eventCity)}</span>,
    },
  ], [eventCity]);

  if (vendors.length === 0) {
    return (
      <div className="text-center py-20">
        <GitCompareArrows size={48} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No vendors to compare</h2>
        <p className="text-gray-500 mb-6">Add vendors to your compare list from the vendor listing page.</p>
        <Link href="/vendors" className="btn-primary inline-flex items-center gap-2">
          Browse Vendors <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div className="flex items-center gap-3">
          <GitCompareArrows size={24} className="text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold font-heading text-gray-900">Compare Vendors</h1>
            <p className="text-sm text-gray-500">Trust, pricing, response speed and location — side by side.</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">Distances are shown relative to {eventCity} when available.</p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[840px] gap-4" style={{ gridTemplateColumns: `200px repeat(${vendors.length}, minmax(220px, 1fr))` }}>
          <div />
          {vendors.map((vendor) => (
            <div key={vendor.id} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm text-center">
              <div className="relative mb-3 overflow-hidden rounded-2xl">
                <img
                  src={vendor.coverImage}
                  alt={vendor.businessName}
                  className="h-36 w-full object-cover"
                />
                <button
                  onClick={() => {
                    removeFromCompare(vendor.id);
                    setVendors(loadCompareList());
                  }}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm transition-colors hover:text-red-500"
                  aria-label={`Remove ${vendor.businessName} from comparison`}
                >
                  <X size={14} />
                </button>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{vendor.businessName}</h3>
              <p className="mb-3 text-xs text-gray-500 capitalize">{vendor.category}</p>
              <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                {vendor.verified && <span className="rounded-full bg-green-50 px-2 py-1 text-[11px] font-medium text-green-700">Verified</span>}
                {vendor.topRated && <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700">Top Rated</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-left text-xs text-gray-500 mb-4">
                <div className="rounded-xl bg-gray-50 p-2">
                  <p className="font-semibold text-gray-900">{vendor.totalBookings}+</p>
                  <p>Bookings</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-2">
                  <p className="font-semibold text-gray-900">{vendor.responseTimeHours}h</p>
                  <p>Response</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link href={`/checkout/${vendor.id}`} className="btn-primary w-full text-center text-sm py-2.5">
                  Book Now
                </Link>
                <Link href={`/vendors/${vendor.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                  View full profile →
                </Link>
              </div>
            </div>
          ))}

          {compareFields.map((field, rowIndex) => {
            const Icon = field.icon;
            const winners = winnerIds(vendors, field.key);

            return (
              <div key={field.key} className="contents">
                <div className={`flex items-center gap-2 rounded-2xl px-4 py-4 text-sm font-medium text-gray-600 ${rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                  <Icon size={15} className="text-brand-500" />
                  {field.label}
                </div>
                {vendors.map((vendor) => {
                  const isWinner = winners.has(vendor.id);
                  return (
                    <div
                      key={`${field.key}-${vendor.id}`}
                      className={`rounded-2xl border px-4 py-4 text-sm ${rowIndex % 2 === 0 ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100'} ${isWinner ? 'border-green-200 bg-green-50/80' : ''}`}
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
  );
}
