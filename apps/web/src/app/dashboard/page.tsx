'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Heart, CheckSquare, Bell, Search, Clock, Shield, ArrowRight, Star, MapPin, Building2, Camera, Utensils, Sparkles, Music, Palette, Car, FileText, Users, ChevronRight, TrendingUp, Flame, Award, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

// ─── Category data ─────────────────────────────────────────
const WEDDING_CATEGORIES = [
  { id: 'venue', label: 'Wedding Venues', subtitle: 'Function Halls, Hotels, Resorts', icon: Building2, count: '2,400+', color: 'from-purple-500 to-purple-700', bgLight: 'bg-purple-50', textColor: 'text-purple-600', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80', popular: true },
  { id: 'photography', label: 'Photography', subtitle: 'Candid, Traditional, Pre-wedding', icon: Camera, count: '1,800+', color: 'from-pink-500 to-rose-600', bgLight: 'bg-pink-50', textColor: 'text-pink-600', image: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=600&q=80', popular: true },
  { id: 'catering', label: 'Catering', subtitle: 'Multi-cuisine, Live Counters, Biryani', icon: Utensils, count: '1,200+', color: 'from-orange-500 to-orange-700', bgLight: 'bg-orange-50', textColor: 'text-orange-600', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80', popular: true },
  { id: 'decor', label: 'Decor & Flowers', subtitle: 'Stage, Mandap, LED, Floral', icon: Sparkles, count: '900+', color: 'from-yellow-500 to-amber-600', bgLight: 'bg-yellow-50', textColor: 'text-yellow-600', image: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&q=80', popular: false },
  { id: 'makeup', label: 'Makeup & Beauty', subtitle: 'Bridal, Airbrush, HD, Hair', icon: Palette, count: '750+', color: 'from-rose-500 to-rose-700', bgLight: 'bg-rose-50', textColor: 'text-rose-600', image: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=600&q=80', popular: false },
  { id: 'music', label: 'Music & DJ', subtitle: 'Live Band, DJ, Dhol, Nadaswaram', icon: Music, count: '600+', color: 'from-blue-500 to-blue-700', bgLight: 'bg-blue-50', textColor: 'text-blue-600', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80', popular: false },
  { id: 'videography', label: 'Videography', subtitle: 'Cinematic, Drone, Highlights', icon: Camera, count: '500+', color: 'from-indigo-500 to-indigo-700', bgLight: 'bg-indigo-50', textColor: 'text-indigo-600', image: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=600&q=80', popular: false },
  { id: 'transport', label: 'Wedding Cars', subtitle: 'Vintage, Luxury, Horse Cart', icon: Car, count: '400+', color: 'from-green-500 to-green-700', bgLight: 'bg-green-50', textColor: 'text-green-600', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', popular: false },
  { id: 'invitation', label: 'Cards & Gifts', subtitle: 'Digital, Printed, Custom Hampers', icon: FileText, count: '350+', color: 'from-teal-500 to-teal-700', bgLight: 'bg-teal-50', textColor: 'text-teal-600', image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&q=80', popular: false },
  { id: 'mehendi', label: 'Mehendi Artists', subtitle: 'Bridal, Arabic, Rajasthani', icon: Sparkles, count: '300+', color: 'from-emerald-500 to-emerald-700', bgLight: 'bg-emerald-50', textColor: 'text-emerald-600', image: 'https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&q=80', popular: false },
];

// ─── Trending vendors per category ─────────────────────────
const TRENDING_VENDORS = [
  { id: 'v1', name: 'Royal Grand Palace', category: 'Venue', city: 'Hyderabad', rating: 4.9, reviews: 247, price: '₹5L onwards', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80', badge: 'Top Rated' },
  { id: 'v2', name: 'Srikanth Photography', category: 'Photography', city: 'Hyderabad', rating: 4.8, reviews: 189, price: '₹80K onwards', image: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=400&q=80', badge: 'Verified Pro' },
  { id: 'v3', name: 'Flavours Catering Co.', category: 'Catering', city: 'Hyderabad', rating: 4.7, reviews: 312, price: '₹800/plate', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&q=80', badge: 'Most Booked' },
  { id: 'v4', name: 'Blooms & Dreams Decor', category: 'Decor', city: 'Hyderabad', rating: 4.9, reviews: 156, price: '₹1.5L onwards', image: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=400&q=80', badge: 'Award Winner' },
  { id: 'v5', name: 'Shika Makeup Studio', category: 'Makeup', city: 'Hyderabad', rating: 4.8, reviews: 203, price: '₹25K onwards', image: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=400&q=80', badge: 'Celebrity Artist' },
  { id: 'v6', name: 'Beats & Celebrations', category: 'Music', city: 'Hyderabad', rating: 4.6, reviews: 94, price: '₹60K onwards', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', badge: 'Popular' },
];

const UPCOMING_TASKS = [
  { id: 1, title: 'Book main venue', due: '2 weeks', priority: 'high' as const, done: false },
  { id: 2, title: 'Finalize catering menu', due: '1 month', priority: 'medium' as const, done: true },
  { id: 3, title: 'Book photographer', due: '3 weeks', priority: 'high' as const, done: false },
  { id: 4, title: 'Send invitations', due: '2 months', priority: 'low' as const, done: false },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) { router.push('/login'); return; }
    authApi.me().then((res) => setUser(res.data.data)).catch(() => router.push('/login')).finally(() => setLoading(false));
  }, []);

  if (isLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
    </div>
  );

  const filteredCategories = activeTab === 'all'
    ? WEDDING_CATEGORIES
    : WEDDING_CATEGORIES.filter((c) => c.popular);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">

        {/* ─── Hero Welcome Banner ─────────────────────────────── */}
        <div className="bg-gradient-to-r from-brand-700 via-purple-700 to-brand-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl">
                    👋
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold font-heading">Welcome back!</h1>
                    <p className="text-white/70 text-sm">{user.phone} · {user.role === 'customer' ? 'Planning your dream wedding' : user.role}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center">
                  <div className="text-2xl font-bold">247</div>
                  <div className="text-xs text-white/70">Days to go</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center">
                  <div className="text-2xl font-bold">8</div>
                  <div className="text-xs text-white/70">Vendors</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center">
                  <div className="text-2xl font-bold">₹4.2L</div>
                  <div className="text-xs text-white/70">Spent</div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mt-6">
              <div className="relative max-w-2xl">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchQuery && router.push(`/vendors?q=${encodeURIComponent(searchQuery)}`)}
                  placeholder="Search for venues, photographers, caterers..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-900 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ─── Category Cards (Main Feature) ────────────────── */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold font-heading text-gray-900">What are you looking for?</h2>
                <p className="text-sm text-gray-500 mt-1">Browse categories to find the perfect vendors for your wedding</p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('popular')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'popular' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <Flame size={14} className="inline mr-1" /> Popular
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  All Categories
                </button>
              </div>
            </div>

            {/* Large Category Cards — Image + Overlay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.id}
                    href={`/vendors?category=${cat.id}`}
                    className="group relative h-52 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Background Image */}
                    <img
                      src={cat.image}
                      alt={cat.label}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-70 group-hover:opacity-80 transition-opacity`} />

                    {/* Content */}
                    <div className="relative h-full flex flex-col justify-between p-5 text-white">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Icon size={24} />
                        </div>
                        {cat.popular && (
                          <span className="bg-white/20 backdrop-blur-sm text-xs px-3 py-1 rounded-full flex items-center gap-1">
                            <Flame size={12} /> Popular
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-0.5">{cat.label}</h3>
                        <p className="text-white/80 text-sm">{cat.subtitle}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-white/70 text-xs">{cat.count} vendors</span>
                          <span className="flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all">
                            Explore <ArrowRight size={16} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ─── Trending Vendors ──────────────────────────────── */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={20} className="text-brand-600" />
                  <h2 className="text-xl font-bold font-heading text-gray-900">Trending This Week</h2>
                </div>
                <p className="text-sm text-gray-500">Most booked vendors by couples in your city</p>
              </div>
              <Link href="/vendors" className="hidden md:flex items-center gap-1 text-sm text-brand-600 font-medium hover:underline">
                View All <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {TRENDING_VENDORS.map((vendor) => (
                <Link key={vendor.id} href={`/vendors/vendor-${vendor.id.slice(1)}`} className="card group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-44 overflow-hidden">
                    <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-gray-900 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                      {vendor.badge}
                    </span>
                    <span className="absolute bottom-3 left-3 bg-brand-600 text-white text-xs px-2.5 py-1 rounded-full">
                      {vendor.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{vendor.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <Star size={13} className="fill-gold-400 text-gold-400" />
                        <span className="font-medium text-gray-900">{vendor.rating}</span>
                        <span>({vendor.reviews})</span>
                      </div>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        <MapPin size={13} />
                        <span>{vendor.city}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-sm font-bold text-brand-700">{vendor.price}</span>
                      <span className="text-xs text-brand-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        View Profile <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ─── Planning Tools Row ───────────────────────────── */}
          <div className="mb-10">
            <h2 className="text-xl font-bold font-heading text-gray-900 mb-4">Your Planning Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Find Vendors', desc: 'Browse all categories', icon: Search, href: '/vendors', color: 'bg-brand-50 text-brand-600' },
                { label: 'My Bookings', desc: '8 vendors booked', icon: Calendar, href: '/dashboard/bookings', color: 'bg-blue-50 text-blue-600' },
                { label: 'Checklist', desc: '4 tasks pending', icon: CheckSquare, href: '/dashboard/checklist', color: 'bg-green-50 text-green-600' },
                { label: 'Wishlist', desc: '12 vendors saved', icon: Heart, href: '/dashboard/wishlist', color: 'bg-pink-50 text-pink-600' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href} className="card p-5 flex flex-col items-center text-center group hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon size={22} />
                    </div>
                    <span className="font-semibold text-sm text-gray-800">{action.label}</span>
                    <span className="text-xs text-gray-400 mt-0.5">{action.desc}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ─── Tasks + Budget Row ────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Upcoming Tasks */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Upcoming Tasks</h2>
                <Link href="/dashboard/checklist" className="text-sm text-brand-600 hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {UPCOMING_TASKS.map((task) => (
                  <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl ${task.done ? 'opacity-50' : 'hover:bg-gray-50'} transition-colors`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${task.done ? 'bg-green-500 border-green-500' : task.priority === 'high' ? 'border-red-400' : 'border-gray-300'}`}>
                      {task.done && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</p>
                      <p className="text-xs text-gray-400">Due in {task.due}</p>
                    </div>
                    <span className={`badge text-xs ${task.priority === 'high' ? 'bg-red-100 text-red-600' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Overview */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Budget Overview</h2>
                <Link href="/dashboard/budget" className="text-sm text-brand-600 hover:underline">Manage</Link>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Total Budget</span>
                  <span className="font-semibold">₹15,00,000</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-gradient-to-r from-brand-500 to-purple-500 h-3 rounded-full" style={{ width: '28%' }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>₹4,20,000 spent (28%)</span>
                  <span>₹10,80,000 remaining</span>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Venue', amount: '₹2,00,000', percent: 47, color: 'bg-brand-500' },
                  { label: 'Catering', amount: '₹1,20,000', percent: 28, color: 'bg-blue-500' },
                  { label: 'Photography', amount: '₹80,000', percent: 19, color: 'bg-gold-500' },
                  { label: 'Decor', amount: '₹20,000', percent: 6, color: 'bg-green-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                    <span className="text-sm text-gray-600 flex-1">{item.label}</span>
                    <span className="text-sm font-medium">{item.amount}</span>
                    <span className="text-xs text-gray-400 w-8 text-right">{item.percent}%</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/budget" className="btn-secondary w-full text-center text-sm mt-4 py-2">
                Add Expense
              </Link>
            </div>
          </div>

          {/* ─── Escrow Protection Banner ──────────────────────── */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <Shield size={22} className="text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 text-sm">All Your Payments are Escrow Protected</h3>
              <p className="text-xs text-green-600 mt-0.5">₹3,20,000 currently held in escrow · Released after event confirmation</p>
            </div>
            <Link href="/dashboard/payments" className="btn-secondary text-xs py-2 px-4 border-green-200 text-green-700 whitespace-nowrap">
              View Details
            </Link>
          </div>

          {/* ─── How It Works Mini ─────────────────────────────── */}
          <div className="mb-10">
            <h2 className="text-xl font-bold font-heading text-gray-900 mb-6">How Wedding OS Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '1', icon: Search, title: 'Browse & Search', desc: 'Find verified vendors by category, city, and budget', color: 'bg-brand-50 text-brand-600' },
                { step: '2', icon: Users, title: 'Compare & Connect', desc: 'View portfolios, read reviews, request quotes', color: 'bg-gold-50 text-gold-600' },
                { step: '3', icon: Shield, title: 'Book with Escrow', desc: 'Pay securely — funds released after event', color: 'bg-green-50 text-green-600' },
                { step: '4', icon: Zap, title: 'Execute Perfectly', desc: 'Real-time coordination on your wedding day', color: 'bg-purple-50 text-purple-600' },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.step} className="card p-5 text-center">
                    <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                      <Icon size={22} />
                    </div>
                    <div className="text-xs font-bold text-gray-300 mb-1">STEP {s.step}</div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{s.title}</h3>
                    <p className="text-xs text-gray-500">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
