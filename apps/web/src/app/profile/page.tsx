'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, Mail, Calendar, MapPin, Edit3, Save, LogOut, Bell, Shield, ChevronRight, Heart, MessageSquare, CreditCard, CheckSquare, Star, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/authStore';
import { userApi, authApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface UserProfile {
  name?: string;
  email?: string;
  phone: string;
  weddingDate?: string;
  partnerName?: string;
  city?: string;
  budget?: number;
  profilePhoto?: string;
}

const MENU_ITEMS = [
  { icon: Calendar, label: 'My Bookings', desc: 'View all vendor bookings', href: '/bookings' },
  { icon: Heart, label: 'Wishlist', desc: 'Saved vendors', href: '/wishlist' },
  { icon: CreditCard, label: 'Payments & Escrow', desc: 'Transaction history', href: '/bookings' },
  { icon: CheckSquare, label: 'Wedding Checklist', desc: 'Track your milestones', href: '/dashboard' },
  { icon: MessageSquare, label: 'Messages', desc: 'Vendor conversations', href: '/chat' },
  { icon: Bell, label: 'Notifications', desc: 'Alerts & reminders', href: '/bookings' },
  { icon: Shield, label: 'Privacy & Security', desc: 'Account security settings', href: '/privacy' },
  { icon: Star, label: 'My Reviews', desc: 'Reviews you\'ve written', href: '/vendors' },
];

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile>({ phone: '', name: '', email: '', weddingDate: '', city: 'Hyderabad', budget: 2000000 });
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<UserProfile>({ phone: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    userApi.getProfile()
      .then((res) => {
        const p = res.data.data.user;
        setProfile(p);
        setDraft(p);
      })
      .catch(() => {
        const fallback: UserProfile = { phone: user.phone ?? '+91 98765 43210', name: 'Rahul Sharma', email: 'rahul@example.com', weddingDate: '2025-03-15', partnerName: 'Priya', city: 'Hyderabad', budget: 2000000 };
        setProfile(fallback);
        setDraft(fallback);
      });
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await userApi.updateProfile(draft);
      setProfile(draft);
      setEditMode(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await authApi.logout().catch(() => null);
    logout();
    router.push('/');
  };

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const daysLeft = profile.weddingDate ? daysUntil(profile.weddingDate) : null;
  const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  const fadeIn = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pb-24">
        {/* ── Hero Card ── */}
        <motion.div {...fadeIn} className="bg-gradient-to-br from-brand-600 via-brand-700 to-purple-800 text-white px-4 pt-8 pb-12">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold ring-4 ring-white/20 overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                {editMode && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                          setAvatarPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Change profile photo"
                      className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition"
                    >
                      <Camera className="w-3.5 h-3.5 text-brand-600" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{profile.name || 'Your Name'}</h1>
                <p className="text-white/70 text-sm mt-0.5">{profile.phone}</p>
                {profile.weddingDate && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                      {daysLeft !== null && daysLeft > 0 ? `${daysLeft} days to wedding` : daysLeft === 0 ? '🎊 Wedding Day!' : 'Wedding complete'}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => { setEditMode(!editMode); if (editMode) setDraft(profile); }}
                aria-label={editMode ? 'Cancel editing profile' : 'Edit profile'}
                className="w-9 h-9 bg-white/15 hover:bg-white/25 rounded-xl flex items-center justify-center transition"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* Wedding countdown strip */}
            {profile.weddingDate && daysLeft !== null && daysLeft > 0 && (
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { val: Math.floor(daysLeft / 30), label: 'Months' },
                  { val: daysLeft % 30, label: 'Days' },
                  { val: new Date(profile.weddingDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), label: 'Date' },
                ].map(item => (
                  <div key={item.label} className="bg-white/10 rounded-xl py-2 text-center">
                    <div className="text-lg font-bold">{item.val}</div>
                    <div className="text-white/60 text-xs">{item.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div {...fadeIn} transition={{ duration: 0.4, delay: 0.1 }} className="max-w-xl mx-auto px-4 -mt-6 space-y-4">
          {/* ── Edit Form ── */}
          {editMode ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Edit Profile</h2>
              {[
                { key: 'name',        label: 'Your Name',      type: 'text',  placeholder: 'e.g. Rahul Sharma',   icon: User },
                { key: 'email',       label: 'Email',          type: 'email', placeholder: 'you@example.com',     icon: Mail },
                { key: 'partnerName', label: 'Partner\'s Name',type: 'text',  placeholder: 'e.g. Priya',          icon: User },
                { key: 'weddingDate', label: 'Wedding Date',   type: 'date',  placeholder: '',                    icon: Calendar },
                { key: 'city',        label: 'City',           type: 'text',  placeholder: 'e.g. Hyderabad',      icon: MapPin },
              ].map(({ key, label, type, placeholder, icon: Icon }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Icon className="w-3.5 h-3.5 inline mr-1.5 text-brand-400" />{label}
                  </label>
                  <input
                    type={type}
                    value={draft[key as keyof UserProfile] ?? ''}
                    onChange={(e) => setDraft({ ...draft, [key]: key === 'budget' ? Number(e.target.value) : e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <CreditCard className="w-3.5 h-3.5 inline mr-1.5 text-brand-400" />Budget (₹)
                </label>
                <input
                  type="number"
                  value={draft.budget ? draft.budget / 100 : ''}
                  onChange={(e) => setDraft({ ...draft, budget: Number(e.target.value) * 100 })}
                  placeholder="e.g. 2000000"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setEditMode(false); setDraft(profile); }} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            /* ── Profile summary ── */
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Your Details</h2>
              <div className="space-y-3">
                {[
                  { icon: User, label: 'Name', value: profile.name || '—' },
                  { icon: Phone, label: 'Phone', value: profile.phone },
                  { icon: Mail, label: 'Email', value: profile.email || '—' },
                  { icon: User, label: 'Partner', value: profile.partnerName || '—' },
                  { icon: Calendar, label: 'Wedding', value: profile.weddingDate ? new Date(profile.weddingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                  { icon: MapPin, label: 'City', value: profile.city || '—' },
                  { icon: CreditCard, label: 'Budget', value: profile.budget ? `₹${(profile.budget / 100).toLocaleString('en-IN')}` : '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    <Icon className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    <span className="text-gray-400 w-16 flex-shrink-0">{label}</span>
                    <span className="text-gray-800 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Menu ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {MENU_ITEMS.map(({ icon: Icon, label, desc, href }) => (
              <Link key={label} href={href} aria-label={label} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition first:rounded-t-2xl last:rounded-b-2xl">
                <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 truncate">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>

          {/* ── Logout ── */}
          <button
            onClick={handleLogout}
            aria-label="Log out of your account"
            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 py-3.5 rounded-2xl text-sm font-semibold transition"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>

          <p className="text-center text-xs text-gray-400 pb-4">Wedding OS v1.0 · <Link href="/privacy" className="hover:text-brand-500">Privacy Policy</Link> · <Link href="/terms" className="hover:text-brand-500">Terms</Link></p>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
