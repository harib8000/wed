import Link from 'next/link';
import { Camera, Music, Utensils, Building2, Palette, Sparkles, Car, FileText, Star, ArrowRight, Flame, Video } from 'lucide-react';

const CATEGORIES = [
  { id: 'venue', label: 'Wedding Venues', subtitle: 'Function Halls · Hotels · Resorts · Farmhouses', icon: Building2, count: '2,400+', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80', gradient: 'from-purple-600/80 to-purple-900/90', popular: true },
  { id: 'photography', label: 'Photography', subtitle: 'Candid · Traditional · Pre-wedding · Drone', icon: Camera, count: '1,800+', image: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=600&q=80', gradient: 'from-pink-600/80 to-rose-900/90', popular: true },
  { id: 'catering', label: 'Catering', subtitle: 'Multi-cuisine · Live Counters · Biryani · Desserts', icon: Utensils, count: '1,200+', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80', gradient: 'from-orange-600/80 to-orange-900/90', popular: true },
  { id: 'decor', label: 'Decor & Flowers', subtitle: 'Stage · Mandap · LED · Floral · Theme', icon: Sparkles, count: '900+', image: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&q=80', gradient: 'from-yellow-600/80 to-amber-900/90', popular: false },
  { id: 'makeup', label: 'Makeup & Beauty', subtitle: 'Bridal · Airbrush · HD · Hairstyling', icon: Palette, count: '750+', image: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=600&q=80', gradient: 'from-rose-600/80 to-rose-900/90', popular: false },
  { id: 'music', label: 'Music & DJ', subtitle: 'Live Band · DJ · Dhol · Nadaswaram', icon: Music, count: '600+', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80', gradient: 'from-blue-600/80 to-blue-900/90', popular: false },
  { id: 'videography', label: 'Videography', subtitle: 'Cinematic · Drone · Highlight Reels', icon: Video, count: '500+', image: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=600&q=80', gradient: 'from-indigo-600/80 to-indigo-900/90', popular: false },
  { id: 'transport', label: 'Wedding Cars', subtitle: 'Vintage · Luxury · Horse Cart · Limos', icon: Car, count: '400+', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', gradient: 'from-green-600/80 to-green-900/90', popular: false },
  { id: 'invitation', label: 'Cards & Gifts', subtitle: 'Digital · Printed · Custom Hampers', icon: FileText, count: '350+', image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&q=80', gradient: 'from-teal-600/80 to-teal-900/90', popular: false },
  { id: 'mehendi', label: 'Mehendi Artists', subtitle: 'Bridal · Arabic · Rajasthani · Fusion', icon: Sparkles, count: '300+', image: 'https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&q=80', gradient: 'from-emerald-600/80 to-emerald-900/90', popular: false },
];

export function CategoryGrid() {
  return (
    <section className="py-16 bg-white" id="categories">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <Star size={12} className="fill-brand-500" /> 10 CATEGORIES
          </span>
          <h2 className="section-heading mb-3">What Are You Looking For?</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Tap any category to browse verified vendors with real portfolios, transparent pricing, and verified reviews.
          </p>
        </div>

        {/* Top 3 Featured Categories — Full Width Large Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {CATEGORIES.filter(c => c.popular).map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={`/vendors?category=${cat.id}`}
                className="group relative h-64 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient}`} />
                <div className="relative h-full flex flex-col justify-between p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Icon size={24} />
                    </div>
                    <span className="bg-white/20 backdrop-blur-sm text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                      <Flame size={12} /> Popular
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">{cat.label}</h3>
                    <p className="text-white/80 text-sm mb-2">{cat.subtitle}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">{cat.count} vendors available</span>
                      <span className="flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all">
                        Explore <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Remaining Categories — Compact Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
          {CATEGORIES.filter(c => !c.popular).map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={`/vendors?category=${cat.id}`}
                className="group relative h-40 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient}`} />
                <div className="relative h-full flex flex-col justify-end p-3 text-white">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2">
                    <Icon size={16} />
                  </div>
                  <h3 className="text-sm font-bold leading-tight">{cat.label}</h3>
                  <p className="text-white/60 text-[10px] mt-0.5">{cat.count} vendors</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center">
          <Link href="/vendors" className="btn-secondary inline-flex items-center gap-2">
            View All Categories <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
