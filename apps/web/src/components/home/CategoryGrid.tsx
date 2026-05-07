import Link from 'next/link';
import { Camera, Music, Utensils, Building2, Palette, Sparkles, Car, FileText, Star } from 'lucide-react';

const CATEGORIES = [
  { id: 'venue', label: 'Venues', icon: Building2, count: '2,400+', color: 'bg-purple-50 text-purple-600', href: '/vendors?category=venue' },
  { id: 'photography', label: 'Photography', icon: Camera, count: '1,800+', color: 'bg-pink-50 text-pink-600', href: '/vendors?category=photography' },
  { id: 'catering', label: 'Catering', icon: Utensils, count: '1,200+', color: 'bg-orange-50 text-orange-600', href: '/vendors?category=catering' },
  { id: 'decor', label: 'Decor & Flowers', icon: Sparkles, count: '900+', color: 'bg-yellow-50 text-yellow-600', href: '/vendors?category=decor' },
  { id: 'makeup', label: 'Makeup & Beauty', icon: Star, count: '750+', color: 'bg-rose-50 text-rose-600', href: '/vendors?category=makeup' },
  { id: 'music', label: 'Music & DJ', icon: Music, count: '600+', color: 'bg-blue-50 text-blue-600', href: '/vendors?category=music' },
  { id: 'transport', label: 'Transport', icon: Car, count: '400+', color: 'bg-green-50 text-green-600', href: '/vendors?category=transport' },
  { id: 'invitation', label: 'Cards & Gifts', icon: FileText, count: '350+', color: 'bg-indigo-50 text-indigo-600', href: '/vendors?category=invitation' },
];

export function CategoryGrid() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="section-heading mb-4">Find the Perfect Vendor</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Browse thousands of verified wedding vendors across all categories, with real reviews and transparent pricing.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={cat.href}
                className="group card p-6 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <div className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon size={26} />
                </div>
                <span className="font-semibold text-gray-900 text-sm">{cat.label}</span>
                <span className="text-xs text-gray-500 mt-1">{cat.count} vendors</span>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link href="/vendors" className="btn-secondary">
            View All Categories →
          </Link>
        </div>
      </div>
    </section>
  );
}
