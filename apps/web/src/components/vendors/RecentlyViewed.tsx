'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Star, MapPin, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'wos_recently_viewed';
const MAX_ITEMS = 6;

export interface RecentVendor {
  id: string;
  businessName: string;
  category: string;
  city: string;
  rating: string;
  coverImage: string;
  basePrice: number;
  viewedAt: number;
}

export function addToRecentlyViewed(vendor: Omit<RecentVendor, 'viewedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const items: RecentVendor[] = stored ? JSON.parse(stored) : [];
    const filtered = items.filter((v) => v.id !== vendor.id);
    filtered.unshift({ ...vendor, viewedAt: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {
    // localStorage unavailable
  }
}

export function clearRecentlyViewed() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function formatPrice(price: number): string {
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
  if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K`;
  return `₹${price}`;
}

export function RecentlyViewed() {
  const [items, setItems] = useState<RecentVendor[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: RecentVendor[] = JSON.parse(stored);
        setItems(parsed.slice(0, MAX_ITEMS));
      }
    } catch {
      // ignore
    }
  }, []);

  if (dismissed || items.length === 0) return null;

  return (
    <section className="py-8 bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-brand-600" />
            <h3 className="font-heading text-lg font-semibold text-gray-900">Recently Viewed</h3>
          </div>
          <button
            onClick={() => {
              clearRecentlyViewed();
              setDismissed(true);
            }}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            aria-label="Clear recently viewed"
          >
            <X size={14} />
            Clear
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          <AnimatePresence>
            {items.map((vendor, i) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="snap-start"
              >
                <Link
                  href={`/vendors/${vendor.id}`}
                  className="flex-shrink-0 w-56 bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group block"
                >
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src={vendor.coverImage}
                      alt={vendor.businessName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-medium bg-white/90 text-gray-700 px-2 py-0.5 rounded-full">
                      {vendor.category}
                    </span>
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm text-gray-900 truncate">{vendor.businessName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-0.5 text-xs text-amber-600">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        {vendor.rating}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-0.5 text-xs text-gray-500">
                        <MapPin size={11} />
                        {vendor.city}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-brand-600 mt-1.5">
                      From {formatPrice(vendor.basePrice)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length >= 3 && (
            <Link
              href="/vendors"
              className="flex-shrink-0 w-32 flex flex-col items-center justify-center bg-brand-50 rounded-xl border border-brand-100 hover:bg-brand-100 transition-colors group"
            >
              <ArrowRight size={20} className="text-brand-600 group-hover:translate-x-1 transition-transform" />
              <span className="text-xs font-medium text-brand-600 mt-1">View All</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
