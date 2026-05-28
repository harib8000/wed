'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Heart, CheckSquare, Search, Shield, ArrowRight, Star, MapPin, Building2, Camera, Utensils, Sparkles, Music, Palette, Car, FileText, Users, ChevronRight, TrendingUp, Flame, Zap, Plus, X, Activity, PartyPopper, MessageCircle, ListChecks, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { authApi, bookingApi, userApi } from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SmartNextSteps } from '@/components/engagement/SmartNextSteps';
import { PlanningProgress } from '@/components/engagement/PlanningProgress';
import { SocialProofBadges, BookingActivityIndicator } from '@/components/engagement/SocialProof';
import { getStoredPreferences } from '@/components/onboarding/WelcomeWizard';

const WEDDING_CATEGORIES = [
  { id: 'venue', label: 'Wedding Venues', subtitle: 'Function Halls, Hotels, Resorts', icon: Building2, count: '2,400+', color: 'from-purple-500 to-purple-700', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80', popular: true },
  { id: 'photography', label: 'Photography', subtitle: 'Candid, Traditional, Pre-wedding', icon: Camera, count: '1,800+', color: 'from-pink-500 to-rose-600', image: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=600&q=80', popular: true },
  { id: 'catering', label: 'Catering', subtitle: 'Multi-cuisine, Live Counters, Biryani', icon: Utensils, count: '1,200+', color: 'from-orange-500 to-orange-700', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80', popular: true },
  { id: 'decor', label: 'Decor & Flowers', subtitle: 'Stage, Mandap, LED, Floral', icon: Sparkles, count: '900+', color: 'from-yellow-500 to-amber-600', image: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&q=80', popular: false },
  { id: 'makeup', label: 'Makeup & Beauty', subtitle: 'Bridal, Airbrush, HD, Hair', icon: Palette, count: '750+', color: 'from-rose-500 to-rose-700', image: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=600&q=80', popular: false },
  { id: 'music', label: 'Music & DJ', subtitle: 'Live Band, DJ, Dhol, Nadaswaram', icon: Music, count: '600+', color: 'from-blue-500 to-blue-700', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80', popular: false },
  { id: 'videography', label: 'Videography', subtitle: 'Cinematic, Drone, Highlights', icon: Camera, count: '500+', color: 'from-indigo-500 to-indigo-700', image: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=600&q=80', popular: false },
  { id: 'transport', label: 'Wedding Cars', subtitle: 'Vintage, Luxury, Horse Cart', icon: Car, count: '400+', color: 'from-green-500 to-green-700', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', popular: false },
  { id: 'invitation', label: 'Cards & Gifts', subtitle: 'Digital, Printed, Custom Hampers', icon: FileText, count: '350+', color: 'from-teal-500 to-teal-700', image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&q=80', popular: false },
  { id: 'mehendi', label: 'Mehendi Artists', subtitle: 'Bridal, Arabic, Rajasthani', icon: Sparkles, count: '300+', color: 'from-emerald-500 to-emerald-700', image: 'https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&q=80', popular: false },
];

const TRENDING_VENDORS = [
  { id: 'v1', name: 'Royal Grand Palace', category: 'Venue', city: 'Hyderabad', rating: 4.9, reviews: 247, price: '₹5L onwards', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80', badge: 'Top Rated' },
  { id: 'v2', name: 'Srikanth Photography', category: 'Photography', city: 'Hyderabad', rating: 4.8, reviews: 189, price: '₹80K onwards', image: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=400&q=80', badge: 'Verified Pro' },
  { id: 'v3', name: 'Flavours Catering Co.', category: 'Catering', city: 'Hyderabad', rating: 4.7, reviews: 312, price: '₹800/plate', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&q=80', badge: 'Most Booked' },
  { id: 'v4', name: 'The Starlight Ballroom', category: 'Venue', city: 'Mumbai', rating: 4.8, reviews: 216, price: '₹7L onwards', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=80', badge: 'Luxury Pick' },
  { id: 'v5', name: 'Frame Story Studios', category: 'Photography', city: 'Mumbai', rating: 4.9, reviews: 274, price: '₹1.2L onwards', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80', badge: "Editor's Choice" },
  { id: 'v6', name: 'Blue Orchid Events', category: 'Decor', city: 'Bangalore', rating: 4.7, reviews: 162, price: '₹1.8L onwards', image: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=400&q=80', badge: 'Trending' },
  { id: 'v7', name: 'Carnatic Celebrations', category: 'Music', city: 'Chennai', rating: 4.6, reviews: 119, price: '₹65K onwards', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80', badge: 'Popular' },
  { id: 'v8', name: 'Imperial Udaipur Weddings', category: 'Venue', city: 'Udaipur', rating: 5, reviews: 142, price: '₹12L onwards', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&q=80', badge: 'Destination Favourite' },
  { id: 'v9', name: 'Delhi Royale Decor', category: 'Decor', city: 'Delhi', rating: 4.8, reviews: 194, price: '₹2L onwards', image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=400&q=80', badge: 'Award Winner' },
  { id: 'v10', name: 'Pink City Mehendi Co.', category: 'Mehendi', city: 'Jaipur', rating: 4.9, reviews: 128, price: '₹18K onwards', image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=400&q=80', badge: 'Bride Favourite' },
  { id: 'v11', name: 'Kochi Coastal Catering', category: 'Catering', city: 'Kochi', rating: 4.7, reviews: 141, price: '₹950/plate', image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&q=80', badge: 'Most Loved' },
  { id: 'v12', name: 'Platinum Bridal Cars', category: 'Transport', city: 'Delhi', rating: 4.6, reviews: 88, price: '₹22K onwards', image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80', badge: 'Fast Booking' },
];

const DEFAULT_TASKS = [
  { id: 1, title: 'Book main venue', due: '2 weeks', priority: 'high' as const, done: false },
  { id: 2, title: 'Finalize catering menu', due: '1 month', priority: 'medium' as const, done: true },
  { id: 3, title: 'Book photographer', due: '3 weeks', priority: 'high' as const, done: false },
  { id: 4, title: 'Send invitations', due: '2 months', priority: 'low' as const, done: false },
];

const RECENT_ACTIVITIES = [
  { id: 1, text: 'Venue "Royal Grand Palace" confirmed your booking', time: '2 hours ago', icon: '🏛️' },
  { id: 2, text: 'Escrow payment of ₹2,00,000 held for venue', time: '3 hours ago', icon: '💰' },
  { id: 3, text: 'Catering menu finalized with Flavours Catering', time: '1 day ago', icon: '🍽️' },
  { id: 4, text: 'New message from Srikanth Photography', time: '2 days ago', icon: '📸' },
];

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const TASKS_STORAGE_KEY = 'wedding_os_dashboard_tasks';

function loadTasksFromStorage(): typeof DEFAULT_TASKS | null {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveTasksToStorage(tasks: typeof DEFAULT_TASKS) {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    return;
  }
}

function getCountdownBreakdown(dateString?: string | null) {
  if (!dateString) return null;
  const targetDate = new Date(dateString);
  if (Number.isNaN(targetDate.getTime())) return null;

  const totalDays = Math.max(0, Math.ceil((targetDate.getTime() - Date.now()) / 86_400_000));
  const months = Math.floor(totalDays / 30);
  const remainingAfterMonths = totalDays % 30;
  const weeks = Math.floor(remainingAfterMonths / 7);
  const days = remainingAfterMonths % 7;

  return { totalDays, months, weeks, days };
}

function getProgressTone(progress: number) {
  if (progress > 70) {
    return {
      bar: 'from-green-500 to-emerald-500',
      badge: 'bg-green-50 text-green-700 border-green-200',
      track: 'bg-green-100',
    };
  }

  if (progress >= 30) {
    return {
      bar: 'from-yellow-500 to-amber-500',
      badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      track: 'bg-yellow-100',
    };
  }

  return {
    bar: 'from-red-500 to-rose-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
    track: 'bg-red-100',
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [tasks, setTasks] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_TASKS;
    return loadTasksFromStorage() ?? DEFAULT_TASKS;
  });
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [preferences, setPreferences] = useState<ReturnType<typeof getStoredPreferences>>(null);
  const [selectedCity, setSelectedCityState] = useState('All India');

  const nextIdRef = useRef(100);
  const taskInitRef = useRef(false);

  const { data: bookingsData } = useQuery({
    queryKey: ['dashboard-bookings'],
    queryFn: async () => {
      const res = await bookingApi.list();
      return res.data?.data ?? res.data;
    },
    enabled: !!user,
    retry: 1,
  });

  const { data: profileData } = useQuery({
    queryKey: ['dashboard-profile'],
    queryFn: async () => {
      const res = await userApi.getProfile();
      return res.data?.data ?? res.data;
    },
    enabled: !!user,
    retry: 1,
  });

  useEffect(() => {
    const hydratePreferences = () => {
      const storedPreferences = getStoredPreferences();
      const locationCity = typeof window !== 'undefined' ? localStorage.getItem('wedding_os_selected_city') : null;
      setPreferences(storedPreferences);
      setSelectedCityState(locationCity || storedPreferences?.city || 'All India');
    };

    hydratePreferences();

    const handleLocationChange = (event: Event) => {
      const city = (event as CustomEvent<{ city?: string }>).detail?.city;
      if (city) {
        setSelectedCityState(city);
      }
    };

    window.addEventListener('locationChanged', handleLocationChange as EventListener);
    return () => window.removeEventListener('locationChanged', handleLocationChange as EventListener);
  }, []);

  const countdownTargetDate = preferences?.weddingDate || profileData?.eventDate || profileData?.weddingDate || null;
  const countdown = useMemo(() => getCountdownBreakdown(countdownTargetDate), [countdownTargetDate]);

  const smartDaysToGo = useMemo(() => {
    if (countdown) return countdown.totalDays;
    const eventDate = profileData?.eventDate || profileData?.weddingDate;
    if (eventDate) {
      const diff = Math.ceil((new Date(eventDate).getTime() - Date.now()) / 86_400_000);
      return diff > 0 ? diff : 0;
    }
    return 247;
  }, [countdown, profileData]);

  const daysToGoDisplay = countdown ? String(countdown.totalDays) : '—';

  const bookingCount = bookingsData?.length ?? 8;

  const totalSpent = useMemo(() => {
    if (!bookingsData?.length) return '₹4.2L';
    const total = bookingsData.reduce((sum: number, booking: any) => sum + (booking.totalAmount || booking.amount || 0), 0);
    if (total === 0) return '₹4.2L';
    if (total >= 100000) return `₹${(total / 100000).toFixed(1)}L`;
    if (total >= 1000) return `₹${(total / 1000).toFixed(0)}K`;
    return `₹${total}`;
  }, [bookingsData]);

  const escrowHeld = useMemo(() => {
    if (!bookingsData?.length) return '₹3,20,000';
    const held = bookingsData
      .filter((booking: any) => booking.status === 'CONFIRMED' || booking.status === 'ADVANCE_PAID')
      .reduce((sum: number, booking: any) => sum + (booking.escrowAmount || booking.totalAmount || 0), 0);
    if (held === 0) return '₹3,20,000';
    return `₹${held.toLocaleString('en-IN')}`;
  }, [bookingsData]);

  useEffect(() => {
    if (!taskInitRef.current) {
      taskInitRef.current = true;
      return;
    }
    saveTasksToStorage(tasks);
  }, [tasks]);

  const toggleTask = (id: number) => {
    setTasks((prev) => prev.map((task) => {
      if (task.id !== id) return task;
      const updated = { ...task, done: !task.done };
      if (updated.done) toast.success(`"${task.title}" marked done!`, { duration: 2000 });
      return updated;
    }));
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const id = nextIdRef.current++;
    setTasks((prev) => [...prev, { id, title: newTaskTitle.trim(), due: 'TBD', priority: newTaskPriority, done: false }]);
    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setShowAddTask(false);
  };

  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    authApi.me().then((res) => setUser(res.data.data)).catch(() => router.push('/login')).finally(() => setLoading(false));
  }, []);

  const completedTasks = tasks.filter((task) => task.done).length;
  const totalTasks = tasks.length;
  const planningProgressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const planningProgressTone = getProgressTone(planningProgressPercent);
  const unreadMessages = Math.max(1, RECENT_ACTIVITIES.filter((activity) => activity.text.toLowerCase().includes('message')).length);

  const recommendedCategoryIds = useMemo(() => {
    const mapping: Record<string, string> = {
      Venue: 'venue',
      Photographer: 'photography',
      Caterer: 'catering',
      Decorator: 'decor',
      'Makeup Artist': 'makeup',
      'DJ/Music': 'music',
      Videographer: 'videography',
      'Mehendi Artist': 'mehendi',
      'Wedding Car': 'transport',
      Invitations: 'invitation',
    };

    return new Set((preferences?.vendorNeeds ?? []).map((vendor) => mapping[vendor]).filter(Boolean));
  }, [preferences]);

  const filteredCategories = activeTab === 'all'
    ? WEDDING_CATEGORIES
    : WEDDING_CATEGORIES.filter((category) => category.popular);

  const personalizedCategories = useMemo(
    () => [...filteredCategories].sort((a, b) => Number(recommendedCategoryIds.has(b.id)) - Number(recommendedCategoryIds.has(a.id))),
    [filteredCategories, recommendedCategoryIds]
  );

  const trendingVendors = useMemo(() => {
    if (!selectedCity || selectedCity === 'All India') {
      return TRENDING_VENDORS;
    }

    const cityMatches = TRENDING_VENDORS.filter((vendor) => vendor.city === selectedCity);
    return cityMatches.length > 0 ? cityMatches : TRENDING_VENDORS;
  }, [selectedCity]);

  if (isLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.5 }} className="bg-gradient-to-r from-brand-700 via-purple-700 to-brand-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur">
                    👋
                  </div>
                  <div>
                    <h1 className="font-heading text-2xl font-bold">Welcome back!</h1>
                    <p className="text-sm text-white/70">{user.phone} · {user.role === 'customer' ? 'Planning your dream wedding' : user.role}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/10 px-4 py-2 text-center backdrop-blur">
                  <div className="text-2xl font-bold">{daysToGoDisplay}</div>
                  <div className="text-xs text-white/70">Days to go</div>
                </div>
                <div className="rounded-xl bg-white/10 px-4 py-2 text-center backdrop-blur">
                  <div className="text-2xl font-bold">{bookingCount}</div>
                  <div className="text-xs text-white/70">Vendors</div>
                </div>
                <div className="rounded-xl bg-white/10 px-4 py-2 text-center backdrop-blur">
                  <div className="text-2xl font-bold">{totalSpent}</div>
                  <div className="text-xs text-white/70">Spent</div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="relative max-w-2xl">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && searchQuery && router.push(`/vendors?q=${encodeURIComponent(searchQuery)}`)}
                  placeholder="Search for venues, photographers, caterers..."
                  className="w-full rounded-xl bg-white py-3.5 pl-12 pr-4 text-gray-900 shadow-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.45 }} className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="card overflow-hidden bg-gradient-to-br from-white to-brand-50/70 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                    <PartyPopper size={14} /> Wedding Countdown
                  </div>
                  {countdown ? (
                    <>
                      <h2 className="mt-4 font-heading text-3xl font-bold text-gray-900">{countdown.totalDays} days to your wedding! 🎊</h2>
                      <p className="mt-2 text-sm text-gray-500">Here&apos;s the time left to lock in your dream vendors and finish planning.</p>
                    </>
                  ) : (
                    <>
                      <h2 className="mt-4 font-heading text-3xl font-bold text-gray-900">Set your wedding date</h2>
                      <p className="mt-2 text-sm text-gray-500">Add your date to unlock countdowns, reminders, and smart planning suggestions.</p>
                    </>
                  )}
                </div>
                <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg sm:flex">
                  <Calendar size={28} />
                </div>
              </div>

              {countdown ? (
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Months', value: countdown.months },
                    { label: 'Weeks', value: countdown.weeks },
                    { label: 'Days', value: countdown.days },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-brand-100">
                      <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">{item.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <Link href="/profile" className="btn-primary mt-6 inline-flex items-center gap-2">
                  <Calendar size={16} /> Set your wedding date
                </Link>
              )}
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${planningProgressTone.badge}`}>
                    <ListChecks size={14} /> Planning Progress
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-gray-900">{completedTasks} of {totalTasks} tasks completed</h2>
                  <p className="mt-2 text-sm text-gray-500">Keep momentum going with the next important planning steps.</p>
                </div>
                <div className={`rounded-2xl px-3 py-2 text-sm font-bold ${planningProgressTone.track} text-gray-700`}>
                  {planningProgressPercent}%
                </div>
              </div>
              <div className={`mt-5 h-3 w-full overflow-hidden rounded-full ${planningProgressTone.track}`}>
                <div className={`h-full rounded-full bg-gradient-to-r ${planningProgressTone.bar}`} style={{ width: `${planningProgressPercent}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{Math.max(totalTasks - completedTasks, 0)} tasks remaining</span>
                <span>{planningProgressPercent > 70 ? 'Amazing progress!' : planningProgressPercent >= 30 ? "You're on track." : "Let's get started."}</span>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.45, delay: 0.05 }} className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold text-gray-900">Quick Actions</h2>
                <p className="mt-1 text-sm text-gray-500">Jump straight into your most-used planning tools.</p>
              </div>
              <span className="hidden items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 md:inline-flex">
                <MapPin size={14} /> {selectedCity}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {[
                { label: 'Find Vendors', desc: 'Search by city & budget', icon: Search, href: '/vendors', color: 'bg-brand-50 text-brand-600' },
                { label: 'My Bookings', desc: `${bookingCount} active vendor connections`, icon: Calendar, href: '/bookings', color: 'bg-blue-50 text-blue-600' },
                { label: 'Messages', desc: 'Vendor chats', icon: MessageCircle, href: '/chat', color: 'bg-purple-50 text-purple-600', badge: unreadMessages },
                { label: 'Checklist', desc: `${Math.max(totalTasks - completedTasks, 0)} tasks pending`, icon: CheckSquare, href: '/timeline', color: 'bg-green-50 text-green-600' },
                { label: 'Guest List', desc: 'Manage invites', icon: UserPlus, href: '/guests', color: 'bg-pink-50 text-pink-600' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href} className="card group relative p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}>
                      <Icon size={22} />
                    </div>
                    {'badge' in action && action.badge ? (
                      <span className="absolute right-4 top-4 inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {action.badge}
                      </span>
                    ) : null}
                    <div className="text-sm font-semibold text-gray-800">{action.label}</div>
                    <div className="mt-1 text-xs text-gray-500">{action.desc}</div>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          <SmartNextSteps daysToGo={smartDaysToGo} bookingCount={bookingCount} />
          <PlanningProgress />

          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.1 }} className="mb-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold text-gray-900">What are you looking for?</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Browse categories to find the perfect vendors for your wedding.
                  {recommendedCategoryIds.size > 0 ? ' We prioritized your onboarding picks first.' : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {recommendedCategoryIds.size > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                    <Sparkles size={13} /> Personalized for you
                  </span>
                )}
                <button
                  onClick={() => setActiveTab('popular')}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === 'popular' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <Flame size={14} className="mr-1 inline" /> Popular
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  All Categories
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {personalizedCategories.map((category) => {
                const Icon = category.icon;
                const isRecommended = recommendedCategoryIds.has(category.id);
                const categoryHref = `/vendors?category=${category.id}${selectedCity && selectedCity !== 'All India' ? `&city=${encodeURIComponent(selectedCity)}` : ''}`;
                return (
                  <Link
                    key={category.id}
                    href={categoryHref}
                    className={`group relative h-52 overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isRecommended ? 'ring-2 ring-brand-300' : ''}`}
                  >
                    <img
                      src={category.image}
                      alt={category.label}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-70 transition-opacity group-hover:opacity-80`} />
                    <div className="relative flex h-full flex-col justify-between p-5 text-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                          <Icon size={24} />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {category.popular && (
                            <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur-sm">
                              <Flame size={12} /> Popular
                            </span>
                          )}
                          {isRecommended && (
                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-brand-700 shadow-sm">
                              Recommended for you
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-0.5 text-lg font-bold">{category.label}</h3>
                        <p className="text-sm text-white/80">{category.subtitle}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-white/70">{category.count} vendors</span>
                          <span className="flex items-center gap-1 text-sm font-medium transition-all group-hover:gap-2">
                            Explore <ArrowRight size={16} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} className="mb-10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <TrendingUp size={20} className="text-brand-600" />
                  <h2 className="font-heading text-xl font-bold text-gray-900">Trending in {selectedCity}</h2>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedCity === 'All India'
                    ? 'Most booked vendors by couples across India.'
                    : `Most booked vendors by couples in ${selectedCity}.`}
                </p>
              </div>
              <Link href={selectedCity && selectedCity !== 'All India' ? `/vendors?city=${encodeURIComponent(selectedCity)}` : '/vendors'} className="hidden items-center gap-1 text-sm font-medium text-brand-600 hover:underline md:flex">
                View All <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trendingVendors.slice(0, 6).map((vendor) => (
                <Link key={vendor.id} href={`/vendors/vendor-${vendor.id.slice(1)}`} className="card group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative h-44 overflow-hidden">
                    <img src={vendor.image} alt={vendor.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-900 shadow-sm backdrop-blur">
                      {vendor.badge}
                    </span>
                    <span className="absolute bottom-3 left-3 rounded-full bg-brand-600 px-2.5 py-1 text-xs text-white">
                      {vendor.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-1 font-semibold text-gray-900">{vendor.name}</h3>
                    <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
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
                    <SocialProofBadges rating={String(vendor.rating)} reviews={vendor.reviews} featured={true} />
                    <BookingActivityIndicator reviews={vendor.reviews} />
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <span className="text-sm font-bold text-brand-700">{vendor.price}</span>
                      <span className="flex items-center gap-1 text-xs font-medium text-brand-600 transition-all group-hover:gap-2">
                        View Profile <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.3 }} className="mb-10">
            <h2 className="mb-4 font-heading text-xl font-bold text-gray-900">Your Planning Tools</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: 'Find Vendors', desc: 'Browse all categories', icon: Search, href: '/vendors', color: 'bg-brand-50 text-brand-600' },
                { label: 'My Bookings', desc: '8 vendors booked', icon: Calendar, href: '/dashboard/bookings', color: 'bg-blue-50 text-blue-600' },
                { label: 'Checklist', desc: '4 tasks pending', icon: CheckSquare, href: '/dashboard/checklist', color: 'bg-green-50 text-green-600' },
                { label: 'Wishlist', desc: '12 vendors saved', icon: Heart, href: '/dashboard/wishlist', color: 'bg-pink-50 text-pink-600' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href} className="card group flex flex-col items-center p-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${action.color} transition-transform group-hover:scale-110`}>
                      <Icon size={22} />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{action.label}</span>
                    <span className="mt-0.5 text-xs text-gray-400">{action.desc}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.4 }} className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Upcoming Tasks</h2>
                <Link href="/dashboard/checklist" className="text-sm text-brand-600 hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className={`group/task flex items-center gap-3 rounded-xl p-3 transition-colors ${task.done ? 'opacity-50' : 'hover:bg-gray-50'}`}>
                    <button
                      onClick={() => toggleTask(task.id)}
                      aria-label={task.done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
                      className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 ${task.done ? 'border-green-500 bg-green-500' : task.priority === 'high' ? 'border-red-400' : 'border-gray-300'}`}
                    >
                      {task.done && <span className="text-xs text-white">✓</span>}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</p>
                      <p className="text-xs text-gray-400">Due in {task.due}</p>
                    </div>
                    <span className={`badge text-xs ${task.priority === 'high' ? 'bg-red-100 text-red-600' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                      {task.priority}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      aria-label={`Delete task "${task.title}"`}
                      className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover/task:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {showAddTask ? (
                <div className="mt-4 space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(event) => setNewTaskTitle(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && addTask()}
                    placeholder="Task title..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={newTaskPriority}
                      onChange={(event) => setNewTaskPriority(event.target.value as 'high' | 'medium' | 'low')}
                      aria-label="Task priority"
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <button onClick={addTask} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700">
                      Add
                    </button>
                    <button onClick={() => setShowAddTask(false)} aria-label="Cancel adding task" className="px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddTask(true)}
                  aria-label="Add a new task"
                  className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
                >
                  <Plus size={16} /> Add Task
                </button>
              )}
            </div>

            <div className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Budget Overview</h2>
                <Link href="/dashboard/budget" className="text-sm text-brand-600 hover:underline">Manage</Link>
              </div>
              <div className="mb-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-600">Total Budget</span>
                  <span className="font-semibold">₹15,00,000</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100">
                  <div className="h-3 rounded-full bg-gradient-to-r from-brand-500 to-purple-500" style={{ width: '28%' }} />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
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
                    <div className={`h-2 w-2 shrink-0 rounded-full ${item.color}`} />
                    <span className="flex-1 text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-medium">{item.amount}</span>
                    <span className="w-8 text-right text-xs text-gray-400">{item.percent}%</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/budget" className="btn-secondary mt-4 block w-full py-2 text-center text-sm">
                Add Expense
              </Link>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.45 }} className="mb-10">
            <div className="card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Activity size={18} className="text-brand-600" />
                <h2 className="font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="space-y-3">
                {RECENT_ACTIVITIES.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50">
                    <span className="shrink-0 text-lg">{activity.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-700">{activity.text}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.5 }} className="mb-10 flex flex-col items-start gap-4 rounded-2xl border border-green-200 bg-green-50 p-5 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100">
              <Shield size={22} className="text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-800">All Your Payments are Escrow Protected</h3>
              <p className="mt-0.5 text-xs text-green-600">{escrowHeld} currently held in escrow · Released after event confirmation</p>
            </div>
            <Link href="/dashboard/payments" className="btn-secondary whitespace-nowrap border-green-200 px-4 py-2 text-xs text-green-700">
              View Details
            </Link>
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.6 }} className="mb-10">
            <h2 className="mb-6 font-heading text-xl font-bold text-gray-900">How Wedding OS Works</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { step: '1', icon: Search, title: 'Browse & Search', desc: 'Find verified vendors by category, city, and budget', color: 'bg-brand-50 text-brand-600' },
                { step: '2', icon: Users, title: 'Compare & Connect', desc: 'View portfolios, read reviews, request quotes', color: 'bg-gold-50 text-gold-600' },
                { step: '3', icon: Shield, title: 'Book with Escrow', desc: 'Pay securely — funds released after event', color: 'bg-green-50 text-green-600' },
                { step: '4', icon: Zap, title: 'Execute Perfectly', desc: 'Real-time coordination on your wedding day', color: 'bg-purple-50 text-purple-600' },
              ].map((stepInfo) => {
                const Icon = stepInfo.icon;
                return (
                  <div key={stepInfo.step} className="card p-5 text-center">
                    <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${stepInfo.color}`}>
                      <Icon size={22} />
                    </div>
                    <div className="mb-1 text-xs font-bold text-gray-300">STEP {stepInfo.step}</div>
                    <h3 className="mb-1 text-sm font-semibold text-gray-900">{stepInfo.title}</h3>
                    <p className="text-xs text-gray-500">{stepInfo.desc}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
