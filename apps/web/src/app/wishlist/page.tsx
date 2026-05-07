'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2, MapPin, Star, Filter, Building2, Camera, Utensils, Sparkles, Music, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

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

export default function WishlistPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    // Try API — fall back to mock data
    setTimeout(() => {
      setItems(MOCK_WISHLIST);
      setIsLoading(false);
    }, 500);
  }, [user]);

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Removed from wishlist');
  };

  const categories = ['All', ...Array.from(new Set(MOCK_WISHLIST.map(i => i.vendorCategory)))];
  const filtered = filter === 'All' ? items : items.filter(i => i.vendorCategory === filter);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-4 pt-8 pb-16">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-6 h-6 fill-white" />
              <h1 className="text-2xl font-bold">Wishlist</h1>
            </div>
            <p className="text-white/70 text-sm">{items.length} vendors saved</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-4">
          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === cat ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-36 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-pink-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No saved vendors</h3>
              <p className="text-gray-500 text-sm mb-6">Browse vendors and tap the heart icon to save them here</p>
              <Link href="/vendors" className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium">
                Explore Vendors <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(item => {
                const CategoryIcon = CATEGORY_ICONS[item.vendorCategory] ?? Building2;
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
                    <div className="flex">
                      <Link href={`/vendors/${item.vendorId}`} className="relative w-28 sm:w-36 flex-shrink-0 block">
                        <Image src={item.vendorImage} alt={item.vendorName} fill className="object-cover" sizes="144px" />
                      </Link>
                      <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/vendors/${item.vendorId}`} className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm group-hover:text-brand-600 transition-colors truncate">{item.vendorName}</h3>
                            <span className="inline-flex items-center gap-1 text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full mt-1">
                              <CategoryIcon className="w-3 h-3" />{item.vendorCategory}
                            </span>
                          </Link>
                          <button onClick={() => removeItem(item.id)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 flex items-center justify-center flex-shrink-0 transition">
                            <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 transition-colors" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-2">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{item.vendorRating} ({item.vendorReviews})</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.vendorCity}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-brand-600 font-bold text-sm">{item.vendorPrice}</span>
                          <Link href={`/checkout/${item.vendorId}`} className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg font-medium transition">
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
