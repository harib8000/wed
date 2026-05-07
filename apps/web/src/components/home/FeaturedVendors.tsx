'use client';
import Link from 'next/link';
import { Star, MapPin, CheckCircle, Heart } from 'lucide-react';
import { useState } from 'react';

// Mock featured vendors for display (would load from API in real implementation)
const FEATURED_VENDORS = [
  {
    id: '1', name: 'Royal Grand Palace', category: 'Venue', city: 'Hyderabad',
    rating: 4.9, reviews: 247, price: '₹5L – ₹15L', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80',
    badge: 'Top Rated', tags: ['5-Star', 'Garden', 'Banquet'],
  },
  {
    id: '2', name: 'Srikanth Photography', category: 'Photography', city: 'Hyderabad',
    rating: 4.8, reviews: 189, price: '₹80K – ₹2.5L', image: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=400&q=80',
    badge: 'Verified Pro', tags: ['Candid', 'Traditional', 'Cinematic'],
  },
  {
    id: '3', name: 'Flavours Catering Co.', category: 'Catering', city: 'Hyderabad',
    rating: 4.7, reviews: 312, price: '₹800 – ₹2,000/plate', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&q=80',
    badge: 'Most Booked', tags: ['Multi-cuisine', 'Live Counters', 'Hygienic'],
  },
  {
    id: '4', name: 'Blooms & Dreams Decor', category: 'Decor', city: 'Hyderabad',
    rating: 4.9, reviews: 156, price: '₹1.5L – ₹8L', image: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=400&q=80',
    badge: 'Award Winner', tags: ['Floral', 'LED', 'Theme Decor'],
  },
  {
    id: '5', name: 'Shika Makeup Studio', category: 'Makeup', city: 'Hyderabad',
    rating: 4.8, reviews: 203, price: '₹25K – ₹75K', image: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=400&q=80',
    badge: 'Celebrity Artist', tags: ['Bridal', 'HD', 'Airbrush'],
  },
  {
    id: '6', name: 'Beats & Celebrations', category: 'Music', city: 'Hyderabad',
    rating: 4.6, reviews: 94, price: '₹60K – ₹2L', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
    badge: 'Popular', tags: ['Live Band', 'DJ', 'Dhol'],
  },
];

function VendorCard({ vendor }: { vendor: typeof FEATURED_VENDORS[0] }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="card group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3">
          <span className="badge bg-white/90 text-gray-900 text-xs shadow-sm">{vendor.badge}</span>
        </div>
        <button
          onClick={() => setLiked(!liked)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <Heart size={16} className={liked ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>
        <div className="absolute bottom-3 left-3">
          <span className="badge bg-brand-600 text-white text-xs">{vendor.category}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{vendor.name}</h3>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Star size={14} className="fill-gold-400 text-gold-400" />
            <span className="text-sm font-semibold">{vendor.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
          <MapPin size={12} />
          <span>{vendor.city}</span>
          <span className="mx-1">·</span>
          <span>{vendor.reviews} reviews</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {vendor.tags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-400">Starting from</span>
            <p className="text-sm font-semibold text-brand-700">{vendor.price}</p>
          </div>
          <Link href={`/vendors/${vendor.id}`} className="btn-primary text-xs py-2 px-4">
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

export function FeaturedVendors() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <span className="badge bg-gold-100 text-gold-700 mb-3">Featured</span>
            <h2 className="section-heading">Top Verified Vendors</h2>
            <p className="text-gray-500 mt-2">Hand-picked, verified vendors loved by couples across Hyderabad.</p>
          </div>
          <Link href="/vendors" className="hidden md:flex btn-secondary items-center gap-2">
            View All <CheckCircle size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_VENDORS.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>

        <div className="md:hidden text-center mt-8">
          <Link href="/vendors" className="btn-secondary">View All Vendors →</Link>
        </div>
      </div>
    </section>
  );
}
