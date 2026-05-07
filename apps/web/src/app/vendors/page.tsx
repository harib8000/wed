'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, MapPin, Star, Heart, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const CATEGORIES = ['All', 'Venue', 'Photography', 'Catering', 'Decor', 'Makeup', 'Music', 'Mehendi', 'Videography', 'Transport'];
const CITIES = ['Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Jaipur'];
const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'reviews', label: 'Most Reviewed' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

// Mock vendors for display
const MOCK_VENDORS = Array.from({ length: 12 }, (_, i) => ({
  id: `vendor-${i + 1}`,
  businessName: ['Royal Grand Palace', 'Srikanth Photography', 'Flavours Catering', 'Blooms & Dreams', 'Shika Makeup', 'Beats & Celebrations', 'Heritage Banquets', 'Frame Perfect Studios', 'Royal Feast', 'Garden of Eden Decor', 'Glamour Touch', 'Melody Masters'][i],
  category: ['venue', 'photography', 'catering', 'decor', 'makeup', 'music', 'venue', 'photography', 'catering', 'decor', 'makeup', 'music'][i],
  citiesServed: ['Hyderabad'],
  rating: (4.5 + Math.random() * 0.5).toFixed(1),
  totalReviews: Math.floor(50 + Math.random() * 300),
  basePrice: [500000, 80000, 800, 150000, 25000, 60000, 300000, 100000, 1200, 200000, 35000, 80000][i],
  coverImage: `https://images.unsplash.com/photo-${['1519741497674-611481863552', '1537907690979-13c0f6a4c7f4', '1555244162-803834f70033', '1478146059778-26028b07395a', '1487412912498-0447578fcca8', '1470225620780-dba8ba36b745', '1519225421980-715cb0215aed', '1493863641943-9b68992a8d07', '1414235077428-338989a2e8c0', '1519167758481-83f550bb49b3', '1512290923902-8a9f81dc236c', '1483133440078-16c4d1e7ddc0'][i]}?w=400&q=80`,
  featured: i < 3,
}));

function VendorCard({ vendor }: { vendor: typeof MOCK_VENDORS[0] }) {
  const [liked, setLiked] = useState(false);
  const formatPrice = (p: number, cat: string) => {
    if (cat === 'catering') return `₹${p.toLocaleString('en-IN')}/plate`;
    if (p >= 100000) return `₹${(p / 100000).toFixed(1)}L`;
    if (p >= 1000) return `₹${(p / 1000).toFixed(0)}K`;
    return `₹${p}`;
  };

  return (
    <div className="card group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <img src={vendor.coverImage} alt={vendor.businessName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <button onClick={() => setLiked(!liked)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors">
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
          <Link href={`/vendors/${vendor.id}`} className="btn-primary text-xs py-2 px-4">View Profile</Link>
        </div>
      </div>
    </div>
  );
}

export default function VendorsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('Hyderabad');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = MOCK_VENDORS.filter((v) => {
    const matchCategory = selectedCategory === 'All' || v.category === selectedCategory.toLowerCase();
    const matchSearch = !search || v.businessName.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

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
                />
                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={16} className="text-gray-400" /></button>}
              </div>
              {/* City */}
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="input-field pl-9 pr-8 py-2.5 text-sm appearance-none cursor-pointer min-w-[140px]">
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              {/* Sort */}
              <div className="relative">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field pr-8 py-2.5 text-sm appearance-none cursor-pointer min-w-[160px]">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Category tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600 text-sm">
              Showing <strong>{filtered.length}</strong> vendors in <strong>{selectedCity}</strong>
              {selectedCategory !== 'All' && <> · <strong>{selectedCategory}</strong></>}
            </p>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No vendors found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
              <button onClick={() => { setSearch(''); setSelectedCategory('All'); }} className="btn-primary mt-4">Clear Filters</button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
