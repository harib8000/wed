'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart, Trash2, MapPin, Star, Building2, Camera, Utensils,
  Sparkles, Music, ChevronRight, Share2, ArrowUpDown, Undo2,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface WishlistItem {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorCategory: string;
  vendorImage: string;
  vendorCity: string;
  vendorRating: number;
  vendorReviews: number;
  vendorPrice: string;
  addedAt: string;
}

const STORAGE_KEY = 'wedding_os_wishlist';

const MOCK_WISHLIST: WishlistItem[] = [
  { id: 'w1', vendorId: 'v1', vendorName: 'Royal Grand Palace', vendorCategory: 'Venue', vendorImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80', vendorCity: 'Hyderabad', vendorRating: 4.9, vendorReviews: 247, vendorPrice: '₹5L onwards', addedAt: '2025-01-05' },
  { id: 'w2', vendorId: 'v2', vendorName: 'Srikanth Photography', vendorCategory: 'Photography', vendorImage: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=600&q=80', vendorCity: 'Hyderabad', vendorRating: 4.8, vendorReviews: 189, vendorPrice: '₹80K onwards', addedAt: '2025-01-06' },
  { id: 'w3', vendorId: 'v3', vendorName: 'Flavours Catering Co.', vendorCategory: 'Catering', vendorImage: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80', vendorCity: 'Hyderabad', vendorRating: 4.7, vendorReviews: 312, vendorPrice: '₹800/plate', addedAt: '2025-01-07' },
  { id: 'w4', vendorId: 'v4', vendorName: 'Blooms & Dreams Decor', vendorCategory: 'Decor', vendorImage: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&q=80', vendorCity: 'Hyderabad', vendorRating: 4.9, vendorReviews: 156, vendorPrice: '₹1.5L onwards', addedAt: '2025-01-08' },
  { id: 'w5', vendorId: 'v5', vendorName: 'Shika Bridal Studio', vendorCategory: 'Makeup', vendorImage: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=600&q=80', vendorCity: 'Hyderabad', vendorRating: 4.8, vendorReviews: 203, vendorPrice: '₹25K onwards', addedAt: '2025-01-09' },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Venue: Building2, Photography: Camera, Catering: Utensils, Decor: Sparkles, Music: Music,
};

type SortOption = 'recent' | 'rating' | 'price' | 'name';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'rating', label: 'Rating (High)' },
  { value: 'price', label: 'Price (Low)' },
  { value: 'name', label: 'Name A-Z' },
];

function parsePriceNumber(price: string): number {
  const cleaned = price.replace(/[^\d.KLkl]/g, '');
  const num = parseFloat(cleaned) || 0;
  if (/L/i.test(price)) return num * 100000;
  if (/K/i.test(price)) return num * 1000;
  return num;
}

function sortItems(items: WishlistItem[], sort: SortOption): WishlistItem[] {
  const copy = [...items];
  switch (sort) {
    case 'recent':
      return copy.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    case 'rating':
      return copy.sort((a, b) => b.vendorRating - a.vendorRating);
    case 'price':
      return copy.sort((a, b) => parsePriceNumber(a.vendorPrice) - parsePriceNumber(b.vendorPrice));
    case 'name':
      return copy.sort((a, b) => a.vendorName.localeCompare(b.vendorName));
    default:
      return copy;
  }
}

function loadFromStorage(): WishlistItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveToStorage(items: WishlistItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* quota errors are non-critical */ }
}

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.85, transition: { duration: 0.25, ease: 'easeIn' } },
};

export default function WishlistPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState<SortOption>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Load from localStorage (or seed with mock data)
  useEffect(() => {
    if (!user) return;
    const stored = loadFromStorage();
    if (stored) {
      setItems(stored);
    } else {
      setItems(MOCK_WISHLIST);
      saveToStorage(MOCK_WISHLIST);
    }
    setIsLoading(false);
  }, [user]);

  // Persist whenever items change (skip initial load)
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (isLoading) return;
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }
    saveToStorage(items);
  }, [items, isLoading]);

  const removeItem = useCallback((id: string) => {
    const removedItem = items.find(i => i.id === id);
    if (!removedItem) return;

    setItems(prev => prev.filter(i => i.id !== id));

    // Clear any existing undo timer
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    const toastId = toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">Removed from wishlist</span>
          <button
            onClick={() => {
              setItems(prev => {
                const exists = prev.some(i => i.id === removedItem.id);
                if (exists) return prev;
                return [...prev, removedItem];
              });
              toast.dismiss(t.id);
              if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
              toast.success('Vendor restored!', { duration: 2000 });
            }}
            className="flex items-center gap-1 text-sm font-semibold text-pink-600 hover:text-pink-700 whitespace-nowrap"
            aria-label="Undo remove"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </button>
        </div>
      ),
      { duration: 5000, position: 'bottom-center' },
    );

    undoTimerRef.current = setTimeout(() => {
      toast.dismiss(toastId);
      undoTimerRef.current = null;
    }, 5000);
  }, [items]);

  const shareWishlist = useCallback(async () => {
    const url = `${window.location.origin}/wishlist`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!', { duration: 2000, position: 'bottom-center' });
    } catch {
      toast.error('Could not copy link');
    }
  }, []);

  const categories = ['All', ...Array.from(new Set(
    (items.length > 0 ? items : MOCK_WISHLIST).map(i => i.vendorCategory),
  ))];
  const filtered = filter === 'All' ? items : items.filter(i => i.vendorCategory === filter);
  const sorted = sortItems(filtered, sort);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-4 pt-8 pb-16">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="w-6 h-6 fill-white" />
                <h1 className="text-2xl font-bold">Wishlist</h1>
              </div>
              <button
                onClick={shareWishlist}
                aria-label="Share wishlist link"
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
            <p className="text-white/70 text-sm">{items.length} vendor{items.length !== 1 ? 's' : ''} saved</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-4">
          {/* Toolbar: filters + sort */}
          <div className="flex items-center gap-3">
            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  aria-label={`Filter by ${cat}`}
                  aria-pressed={filter === cat}
                  className={clsx(
                    'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                    filter === cat
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <div className="relative flex-shrink-0" ref={sortRef}>
              <button
                onClick={() => setSortOpen(o => !o)}
                aria-label="Sort wishlist"
                aria-expanded={sortOpen}
                className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-brand-300 text-gray-600 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">Sort</span>
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30"
                    role="listbox"
                    aria-label="Sort options"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        role="option"
                        aria-selected={sort === opt.value}
                        onClick={() => { setSort(opt.value); setSortOpen(false); }}
                        className={clsx(
                          'w-full text-left px-4 py-2.5 text-sm transition-colors',
                          sort === opt.value
                            ? 'bg-brand-50 text-brand-600 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl h-36 animate-pulse" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-pink-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No saved vendors</h3>
              <p className="text-gray-500 text-sm mb-6">
                {filter !== 'All'
                  ? `No ${filter} vendors in your wishlist`
                  : 'Browse vendors and tap the heart icon to save them here'}
              </p>
              <Link
                href="/vendors"
                aria-label="Explore vendors"
                className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium"
              >
                Explore Vendors <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {sorted.map(item => {
                  const CategoryIcon = CATEGORY_ICONS[item.vendorCategory] ?? Building2;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      variants={cardVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group"
                    >
                      <div className="flex">
                        <Link
                          href={`/vendors/${item.vendorId}`}
                          className="relative w-28 sm:w-36 flex-shrink-0 block"
                          aria-label={`View ${item.vendorName}`}
                        >
                          <Image
                            src={item.vendorImage}
                            alt={item.vendorName}
                            fill
                            className="object-cover"
                            sizes="144px"
                          />
                        </Link>
                        <div className="flex-1 p-4 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/vendors/${item.vendorId}`} className="min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-brand-600 transition-colors truncate">
                                {item.vendorName}
                              </h3>
                              <span className="inline-flex items-center gap-1 text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full mt-1">
                                <CategoryIcon className="w-3 h-3" />
                                {item.vendorCategory}
                              </span>
                            </Link>
                            <button
                              onClick={() => removeItem(item.id)}
                              aria-label={`Remove ${item.vendorName} from wishlist`}
                              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 flex items-center justify-center flex-shrink-0 transition-all active:scale-75"
                            >
                              <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 group-[.removing]:scale-0 transition-transform" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-2">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              {item.vendorRating} ({item.vendorReviews})
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.vendorCity}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-brand-600 font-bold text-sm">{item.vendorPrice}</span>
                            <Link
                              href={`/checkout/${item.vendorId}`}
                              aria-label={`Book ${item.vendorName}`}
                              className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg font-medium transition"
                            >
                              Book Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
