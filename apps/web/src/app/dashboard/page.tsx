'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Heart, CheckSquare, Bell, Search, TrendingUp, Clock, Star, Shield, ArrowRight, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';

const QUICK_ACTIONS = [
  { label: 'Find Vendors', icon: Search, href: '/vendors', color: 'bg-brand-50 text-brand-600' },
  { label: 'My Bookings', icon: Calendar, href: '/dashboard/bookings', color: 'bg-blue-50 text-blue-600' },
  { label: 'Wedding Checklist', icon: CheckSquare, href: '/dashboard/checklist', color: 'bg-green-50 text-green-600' },
  { label: 'Wishlist', icon: Heart, href: '/dashboard/wishlist', color: 'bg-pink-50 text-pink-600' },
];

const UPCOMING_TASKS = [
  { id: 1, title: 'Book main venue', due: '2 weeks', priority: 'high', done: false },
  { id: 2, title: 'Finalize catering menu', due: '1 month', priority: 'medium', done: true },
  { id: 3, title: 'Book photographer', due: '3 weeks', priority: 'high', done: false },
  { id: 4, title: 'Send invitations', due: '2 months', priority: 'low', done: false },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) { router.push('/login'); return; }
    authApi.me().then((res) => setUser(res.data.data)).catch(() => router.push('/login')).finally(() => setLoading(false));
  }, []);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-heading text-gray-900">
                Welcome back! 👋
              </h1>
              <p className="text-gray-500 text-sm mt-1">{user?.phone} · {user?.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>
        </div>

        {/* Wedding Countdown Card */}
        <div className="gradient-brand rounded-2xl p-6 text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
          <div className="relative">
            <p className="text-white/80 text-sm mb-1">Your Wedding Day</p>
            <h2 className="text-3xl font-bold font-heading mb-1">247 Days to go!</h2>
            <p className="text-white/70 text-sm mb-4">February 14, 2027 · Hyderabad</p>
            <div className="flex items-center gap-4">
              <div className="text-center"><div className="text-2xl font-bold">8</div><div className="text-xs text-white/70">Vendors Booked</div></div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-center"><div className="text-2xl font-bold">4</div><div className="text-xs text-white/70">Pending Tasks</div></div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-center"><div className="text-2xl font-bold">₹4.2L</div><div className="text-xs text-white/70">Budget Used</div></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href} className="card p-5 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                  <Icon size={22} />
                </div>
                <span className="font-medium text-sm text-gray-800">{action.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tasks */}
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

        {/* Escrow Protection Banner */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
            <Shield size={22} className="text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-800 text-sm">All Your Payments are Escrow Protected</h3>
            <p className="text-xs text-green-600 mt-0.5">₹3,20,000 currently held in escrow · Released after event confirmation</p>
          </div>
          <Link href="/dashboard/payments" className="btn-secondary text-xs py-2 px-4 border-green-200 text-green-700">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
