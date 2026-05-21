'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Phone,
  UtensilsCrossed,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AddGuestModal } from '@/components/guests/AddGuestModal';

import type { Guest, RsvpStatus, GuestSide, MealPreference } from '@wedding-os/shared-types';

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_GUESTS: Guest[] = [
  {
    id: '1',
    eventId: 'evt_1',
    name: 'Priya Sharma',
    phone: '9876543210',
    email: 'priya@email.com',
    side: 'bride',
    rsvpStatus: 'accepted',
    mealPreference: 'veg',
    plusOnes: 1,
    inviteSentAt: new Date('2025-01-10'),
    rsvpRespondedAt: new Date('2025-01-12'),
    notes: 'Close family friend',
    createdAt: new Date('2025-01-05'),
  },
  {
    id: '2',
    eventId: 'evt_1',
    name: 'Rahul Verma',
    phone: '9876543211',
    side: 'groom',
    rsvpStatus: 'accepted',
    mealPreference: 'non_veg',
    plusOnes: 2,
    inviteSentAt: new Date('2025-01-10'),
    rsvpRespondedAt: new Date('2025-01-14'),
    createdAt: new Date('2025-01-05'),
  },
  {
    id: '3',
    eventId: 'evt_1',
    name: 'Anita Desai',
    phone: '9876543212',
    email: 'anita.d@email.com',
    side: 'bride',
    rsvpStatus: 'declined',
    mealPreference: 'jain',
    plusOnes: 0,
    inviteSentAt: new Date('2025-01-10'),
    rsvpRespondedAt: new Date('2025-01-11'),
    notes: 'Out of country',
    createdAt: new Date('2025-01-06'),
  },
  {
    id: '4',
    eventId: 'evt_1',
    name: 'Vikram Singh',
    phone: '9876543213',
    side: 'groom',
    rsvpStatus: 'pending',
    mealPreference: 'no_preference',
    plusOnes: 3,
    inviteSentAt: new Date('2025-01-10'),
    createdAt: new Date('2025-01-06'),
  },
  {
    id: '5',
    eventId: 'evt_1',
    name: 'Meera Patel',
    phone: '9876543214',
    side: 'mutual',
    rsvpStatus: 'accepted',
    mealPreference: 'veg',
    plusOnes: 1,
    inviteSentAt: new Date('2025-01-10'),
    rsvpRespondedAt: new Date('2025-01-15'),
    createdAt: new Date('2025-01-06'),
  },
  {
    id: '6',
    eventId: 'evt_1',
    name: 'Arjun Reddy',
    phone: '9876543215',
    side: 'groom',
    rsvpStatus: 'maybe',
    mealPreference: 'non_veg',
    plusOnes: 0,
    inviteSentAt: new Date('2025-01-10'),
    createdAt: new Date('2025-01-07'),
  },
  {
    id: '7',
    eventId: 'evt_1',
    name: 'Sanjana Kapoor',
    email: 'sanjana@email.com',
    side: 'bride',
    rsvpStatus: 'accepted',
    mealPreference: 'vegan',
    plusOnes: 0,
    inviteSentAt: new Date('2025-01-11'),
    rsvpRespondedAt: new Date('2025-01-13'),
    createdAt: new Date('2025-01-07'),
  },
  {
    id: '8',
    eventId: 'evt_1',
    name: 'Deepak Gupta',
    phone: '9876543216',
    side: 'groom',
    rsvpStatus: 'pending',
    mealPreference: 'veg',
    plusOnes: 4,
    createdAt: new Date('2025-01-08'),
  },
  {
    id: '9',
    eventId: 'evt_1',
    name: 'Kavita Joshi',
    phone: '9876543217',
    email: 'kavita.j@email.com',
    side: 'bride',
    rsvpStatus: 'accepted',
    mealPreference: 'veg',
    plusOnes: 1,
    inviteSentAt: new Date('2025-01-11'),
    rsvpRespondedAt: new Date('2025-01-16'),
    createdAt: new Date('2025-01-08'),
  },
  {
    id: '10',
    eventId: 'evt_1',
    name: 'Rajesh Nair',
    phone: '9876543218',
    side: 'mutual',
    rsvpStatus: 'declined',
    mealPreference: 'non_veg',
    plusOnes: 0,
    inviteSentAt: new Date('2025-01-11'),
    rsvpRespondedAt: new Date('2025-01-12'),
    notes: 'Send a gift instead',
    createdAt: new Date('2025-01-09'),
  },
  {
    id: '11',
    eventId: 'evt_1',
    name: 'Neha Agarwal',
    phone: '9876543219',
    side: 'bride',
    rsvpStatus: 'accepted',
    mealPreference: 'jain',
    plusOnes: 2,
    inviteSentAt: new Date('2025-01-12'),
    rsvpRespondedAt: new Date('2025-01-14'),
    createdAt: new Date('2025-01-09'),
  },
  {
    id: '12',
    eventId: 'evt_1',
    name: 'Karthik Iyer',
    phone: '9876543220',
    side: 'groom',
    rsvpStatus: 'pending',
    mealPreference: 'no_preference',
    plusOnes: 1,
    createdAt: new Date('2025-01-10'),
  },
];

/* ------------------------------------------------------------------ */
/*  localStorage persistence                                           */
/* ------------------------------------------------------------------ */

const GUESTS_STORAGE_KEY = 'wedding_os_guests';

function loadGuestsFromStorage(): Guest[] | null {
  try {
    const raw = localStorage.getItem(GUESTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw, (key, value) => {
      if (['createdAt', 'inviteSentAt', 'rsvpRespondedAt'].includes(key) && value) {
        return new Date(value);
      }
      return value;
    });
    return Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
}

function saveGuestsToStorage(guests: Guest[]) {
  try {
    localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(guests));
  } catch {}
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const RSVP_CONFIG: Record<RsvpStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  accepted: { label: 'Accepted', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
  declined: { label: 'Declined', color: 'text-red-700', bg: 'bg-red-50', icon: XCircle },
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock },
  maybe: { label: 'Maybe', color: 'text-blue-700', bg: 'bg-blue-50', icon: HelpCircle },
};

const MEAL_LABELS: Record<MealPreference, string> = {
  veg: '🥬 Veg',
  non_veg: '🍗 Non-Veg',
  jain: '🙏 Jain',
  vegan: '🌱 Vegan',
  no_preference: '— Any',
};

const SIDE_LABELS: Record<GuestSide, string> = {
  bride: '👰 Bride',
  groom: '🤵 Groom',
  mutual: '🤝 Mutual',
};

type SideTab = 'all' | GuestSide;
type RsvpFilter = 'all' | RsvpStatus;

const SIDE_TABS: { value: SideTab; label: string }[] = [
  { value: 'all', label: 'All Guests' },
  { value: 'bride', label: 'Bride Side' },
  { value: 'groom', label: 'Groom Side' },
  { value: 'mutual', label: 'Mutual' },
];

const RSVP_FILTERS: { value: RsvpFilter; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'pending', label: 'Pending' },
  { value: 'maybe', label: 'Maybe' },
];

const RSVP_CYCLE: RsvpStatus[] = ['pending', 'accepted', 'maybe', 'declined'];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' },
  }),
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>(() => {
    if (typeof window === 'undefined') return MOCK_GUESTS;
    return loadGuestsFromStorage() ?? MOCK_GUESTS;
  });
  const [search, setSearch] = useState('');
  const [sideTab, setSideTab] = useState<SideTab>('all');
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  /* -- Persist guests to localStorage -------------------------------- */
  const guestInitRef = useRef(false);
  useEffect(() => {
    if (!guestInitRef.current) { guestInitRef.current = true; return; }
    saveGuestsToStorage(guests);
  }, [guests]);

  /* -- Computed ---------------------------------------------------- */
  const stats = useMemo(() => {
    const total = guests.length;
    const accepted = guests.filter((g) => g.rsvpStatus === 'accepted').length;
    const declined = guests.filter((g) => g.rsvpStatus === 'declined').length;
    const pending = guests.filter((g) => g.rsvpStatus === 'pending').length;
    const maybe = guests.filter((g) => g.rsvpStatus === 'maybe').length;
    const totalWithPlusOnes = guests
      .filter((g) => g.rsvpStatus !== 'declined')
      .reduce((sum, g) => sum + 1 + g.plusOnes, 0);
    return { total, accepted, declined, pending, maybe, totalWithPlusOnes };
  }, [guests]);

  const filtered = useMemo(() => {
    let list = guests;
    if (sideTab !== 'all') list = list.filter((g) => g.side === sideTab);
    if (rsvpFilter !== 'all') list = list.filter((g) => g.rsvpStatus === rsvpFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.phone?.includes(q) ||
          g.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [guests, sideTab, rsvpFilter, search]);

  /* -- Actions ---------------------------------------------------- */
  function handleAddGuest(data: {
    name: string;
    phone: string;
    email: string;
    side: GuestSide;
    mealPreference: MealPreference;
    plusOnes: number;
    notes: string;
  }) {
    const newGuest: Guest = {
      id: `g_${Date.now()}`,
      eventId: 'evt_1',
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      side: data.side,
      rsvpStatus: 'pending',
      mealPreference: data.mealPreference,
      plusOnes: data.plusOnes,
      notes: data.notes || undefined,
      createdAt: new Date(),
    };
    setGuests((prev) => [newGuest, ...prev]);
    toast.success(`${data.name} added to guest list!`, { duration: 2000 });
  }

  function handleExportCSV() {
    const header = 'Name,Phone,Email,Side,RSVP,Meal,Plus-Ones,Notes';
    const rows = guests.map(
      (g) =>
        `"${g.name}","${g.phone ?? ''}","${g.email ?? ''}","${g.side}","${g.rsvpStatus}","${g.mealPreference}","${g.plusOnes}","${g.notes ?? ''}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guest-list.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(`Exported ${guests.length} guests to CSV`, { duration: 2000 });
  }

  function handleWhatsAppBulk() {
    const pendingGuests = guests.filter((g) => g.rsvpStatus === 'pending' && g.phone);
    const msg = encodeURIComponent(
      `You're invited to our wedding! 💍\nPlease RSVP here: ${window.location.origin}/guests/invite`
    );
    if (pendingGuests.length > 0) {
      window.open(`https://wa.me/91${pendingGuests[0].phone}?text=${msg}`, '_blank');
      toast.success(`Opening WhatsApp for ${pendingGuests[0].name}`, { duration: 2000 });
    } else {
      toast.error('No pending guests with phone numbers', { duration: 2000 });
    }
  }

  function handleToggleRsvp(guestId: string) {
    setGuests((prev) =>
      prev.map((g) => {
        if (g.id !== guestId) return g;
        const currentIndex = RSVP_CYCLE.indexOf(g.rsvpStatus);
        const nextStatus = RSVP_CYCLE[(currentIndex + 1) % RSVP_CYCLE.length];
        toast.success(`${g.name}: ${RSVP_CONFIG[nextStatus].label}`, { duration: 2000 });
        return {
          ...g,
          rsvpStatus: nextStatus,
          rsvpRespondedAt: nextStatus !== 'pending' ? new Date() : undefined,
        };
      })
    );
  }

  /* -- Stat cards ------------------------------------------------- */
  const STAT_CARDS = [
    { label: 'Total Guests', value: stats.total, icon: Users, color: 'from-violet-500 to-purple-500' },
    { label: 'Accepted', value: stats.accepted, icon: CheckCircle2, color: 'from-emerald-500 to-green-500' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'from-amber-500 to-orange-500' },
    { label: 'Declined', value: stats.declined, icon: XCircle, color: 'from-red-400 to-rose-500' },
    { label: 'With +1s', value: stats.totalWithPlusOnes, icon: Sparkles, color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pb-28 sm:pb-12">
        {/* ---- Hero Header ---- */}
        <motion.section
          {...fadeIn}
          className="bg-gradient-to-br from-rose-600 via-pink-600 to-purple-600 text-white"
        >
          <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Guest Management</h1>
            <p className="text-rose-100 text-sm sm:text-base">
              Track RSVPs, manage seating, and keep everyone in the loop.
            </p>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
              {STAT_CARDS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-tight">{s.value}</p>
                    <p className="text-[11px] text-rose-100 leading-tight">{s.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ---- Toolbar ---- */}
        <div className="max-w-6xl mx-auto px-4 -mt-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl shadow-lg shadow-gray-200/60 p-4"
          >
            {/* Search + Actions Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search guests by name, phone, or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                />
              </div>

              {/* RSVP Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition w-full sm:w-auto"
                >
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    {rsvpFilter === 'all' ? 'Filter RSVP' : RSVP_CONFIG[rsvpFilter].label}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <AnimatePresence>
                  {showFilterDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-20 min-w-[160px]"
                    >
                      {RSVP_FILTERS.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => {
                            setRsvpFilter(f.value);
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${rsvpFilter === f.value ? 'text-rose-600 font-medium' : 'text-gray-700'}`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleWhatsAppBulk}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600 transition shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-sm hover:from-rose-600 hover:to-pink-600 transition shadow-md shadow-rose-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Guest</span>
                </button>
              </div>
            </div>

            {/* Side Tabs */}
            <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
              {SIDE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setSideTab(tab.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    sideTab === tab.value
                      ? 'bg-rose-50 text-rose-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                  {tab.value === 'all' && (
                    <span className="ml-1.5 text-xs text-gray-400">({guests.length})</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ---- Guest List ---- */}
        <div className="max-w-6xl mx-auto px-4 mt-6">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <motion.div
                className="text-5xl mb-4"
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                🎊
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-800">No guests found</h3>
              <p className="text-gray-500 text-sm mt-1">
                {search ? 'Try a different search term.' : 'Add your first guest to get started!'}
              </p>
              {!search && (
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:from-rose-600 hover:to-pink-600 transition shadow-md"
                >
                  <UserPlus className="w-4 h-4 inline mr-1.5" />
                  Add Your First Guest
                </button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid gap-3">
                {filtered.map((guest, i) => {
                  const rsvp = RSVP_CONFIG[guest.rsvpStatus];
                  const RsvpIcon = rsvp.icon;
                  return (
                    <motion.div
                      key={guest.id}
                      layout
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center text-rose-600 font-semibold text-sm shrink-0">
                          {guest.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                              {guest.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => handleToggleRsvp(guest.id)}
                              title="Click to change RSVP status"
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition ${rsvp.bg} ${rsvp.color}`}
                            >
                              <RsvpIcon className="w-3 h-3" />
                              {rsvp.label}
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                            {guest.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {guest.phone}
                              </span>
                            )}
                            <span>{SIDE_LABELS[guest.side]}</span>
                            <span className="flex items-center gap-1">
                              <UtensilsCrossed className="w-3 h-3" />
                              {MEAL_LABELS[guest.mealPreference]}
                            </span>
                            {guest.plusOnes > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                +{guest.plusOnes}
                              </span>
                            )}
                          </div>

                          {guest.notes && (
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              📝 {guest.notes}
                            </p>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 sm:shrink-0">
                          {guest.phone && (
                            <a
                              href={`https://wa.me/91${guest.phone}?text=${encodeURIComponent('You\'re invited! 💍 RSVP here: ' + (typeof window !== 'undefined' ? window.location.origin : '') + '/guests/invite')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition"
                              title="Send WhatsApp invite"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          {!guest.inviteSentAt && (
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                              Not invited
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setGuests((prev) => prev.filter((g) => g.id !== guest.id));
                              toast.success(`${guest.name} removed`, { duration: 2000 });
                            }}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                            title="Remove guest"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>
      <Footer />

      {/* Add Guest Modal */}
      <AddGuestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddGuest}
      />
    </>
  );
}
