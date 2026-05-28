'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompareArrows, X, Star, MapPin, Check, Minus, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const STORAGE_KEY = 'wedding_os_compare_list';

export interface CompareVendor {
  id: string;
  businessName: string;
  category: string;
  rating: string;
  totalReviews: number;
  basePrice: number;
  coverImage: string;
  citiesServed: string[];
}

function loadCompareList(): CompareVendor[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveCompareList(list: CompareVendor[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('compare-updated'));
}

export function addToCompare(vendor: CompareVendor): boolean {
  const list = loadCompareList();
  if (list.length >= 3) return false;
  if (list.some((v) => v.id === vendor.id)) return false;
  list.push(vendor);
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
          {/* Expanded comparison preview */}
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

          {/* Bottom bar */}
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

/* ─── Full Comparison Page Content ─── */
export function ComparePageContent() {
  const [vendors, setVendors] = useState<CompareVendor[]>([]);

  useEffect(() => {
    setVendors(loadCompareList());
  }, []);

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

  const compareFields = [
    { label: 'Rating', key: 'rating', render: (v: CompareVendor) => (
      <div className="flex items-center gap-1">
        <Star size={14} className="fill-gold-400 text-gold-400" />
        <span className="font-semibold">{v.rating}</span>
        <span className="text-gray-400 text-xs">({v.totalReviews})</span>
      </div>
    )},
    { label: 'Starting Price', key: 'price', render: (v: CompareVendor) => (
      <span className="font-bold text-brand-700">{formatPrice(v.basePrice, v.category)}</span>
    )},
    { label: 'Category', key: 'category', render: (v: CompareVendor) => (
      <span className="capitalize badge bg-brand-50 text-brand-600">{v.category}</span>
    )},
    { label: 'Location', key: 'location', render: (v: CompareVendor) => (
      <div className="flex items-center gap-1 text-sm">
        <MapPin size={12} className="text-gray-400" />
        {v.citiesServed.join(', ')}
      </div>
    )},
    { label: 'Reviews', key: 'reviews', render: (v: CompareVendor) => (
      <span className="font-medium">{v.totalReviews} reviews</span>
    )},
  ];

  // Find best values for highlighting
  const bestRating = Math.max(...vendors.map((v) => parseFloat(v.rating)));
  const lowestPrice = Math.min(...vendors.map((v) => v.basePrice));
  const mostReviews = Math.max(...vendors.map((v) => v.totalReviews));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <GitCompareArrows size={24} className="text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">Compare Vendors</h1>
          <p className="text-sm text-gray-500">Side-by-side comparison to help you decide</p>
        </div>
      </div>

      {/* Vendor headers */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `180px repeat(${vendors.length}, 1fr)` }}>
        <div /> {/* Empty corner */}
        {vendors.map((vendor) => (
          <div key={vendor.id} className="text-center p-4">
            <img
              src={vendor.coverImage}
              alt={vendor.businessName}
              className="w-full h-32 object-cover rounded-xl mb-3"
            />
            <h3 className="font-semibold text-gray-900 mb-1">{vendor.businessName}</h3>
            <Link
              href={`/vendors/${vendor.id}`}
              className="text-xs text-brand-600 hover:underline"
            >
              View full profile →
            </Link>
          </div>
        ))}

        {/* Comparison rows */}
        {compareFields.map((field, rowIndex) => (
          <>
            <div
              key={`label-${field.key}`}
              className={`flex items-center px-4 py-3 text-sm font-medium text-gray-600 ${
                rowIndex % 2 === 0 ? 'bg-gray-50' : ''
              } rounded-l-xl`}
            >
              {field.label}
            </div>
            {vendors.map((vendor) => {
              let isBest = false;
              if (field.key === 'rating') isBest = parseFloat(vendor.rating) === bestRating;
              if (field.key === 'price') isBest = vendor.basePrice === lowestPrice;
              if (field.key === 'reviews') isBest = vendor.totalReviews === mostReviews;

              return (
                <div
                  key={`${field.key}-${vendor.id}`}
                  className={`flex items-center justify-center px-4 py-3 text-sm ${
                    rowIndex % 2 === 0 ? 'bg-gray-50' : ''
                  } ${isBest ? 'ring-2 ring-green-200 bg-green-50 rounded-xl' : ''}`}
                >
                  {field.render(vendor)}
                  {isBest && <Check size={14} className="text-green-500 ml-1" />}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
