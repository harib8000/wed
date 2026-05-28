'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, AlertTriangle, Phone, MessageCircle, MapPin, CalendarDays, ChevronRight, Sparkles, UserCircle, Plus } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

// ─── Types ─────────────────────────────────────────────────
type EntryStatus = 'upcoming' | 'in_progress' | 'completed' | 'delayed';

interface TimelineEntry {
  id: string;
  time: string;
  activity: string;
  vendorName: string;
  vendorCategory: string;
  vendorPhone: string;
  status: EntryStatus;
  vendorCheckedIn: boolean;
  note?: string;
  assignee?: string;
}

type EventFunction = 'Mehendi' | 'Haldi' | 'Wedding' | 'Reception';

// ─── Mock Data ─────────────────────────────────────────────
const MOCK_TIMELINE: Record<EventFunction, TimelineEntry[]> = {
  Mehendi: [
    { id: 'm1', time: '3:00 PM', activity: 'Mehendi artist setup', vendorName: 'Heena by Rashmi', vendorCategory: 'Mehendi Artist', vendorPhone: '+919876543210', status: 'completed', vendorCheckedIn: true },
    { id: 'm2', time: '3:30 PM', activity: 'Photographer arrives', vendorName: 'Srikanth Photography', vendorCategory: 'Photography', vendorPhone: '+919876543211', status: 'completed', vendorCheckedIn: true },
    { id: 'm3', time: '4:00 PM', activity: 'Mehendi ceremony begins', vendorName: 'Heena by Rashmi', vendorCategory: 'Mehendi Artist', vendorPhone: '+919876543210', status: 'in_progress', vendorCheckedIn: true },
    { id: 'm4', time: '5:00 PM', activity: 'Snacks & drinks served', vendorName: 'Flavours Catering Co.', vendorCategory: 'Catering', vendorPhone: '+919876543212', status: 'upcoming', vendorCheckedIn: false },
    { id: 'm5', time: '7:00 PM', activity: 'Music & sangeet performances', vendorName: 'DJ Akash', vendorCategory: 'Music & DJ', vendorPhone: '+919876543213', status: 'upcoming', vendorCheckedIn: false },
  ],
  Haldi: [
    { id: 'h1', time: '8:00 AM', activity: 'Venue decoration begins', vendorName: 'Blooms & Dreams Decor', vendorCategory: 'Decor', vendorPhone: '+919876543214', status: 'completed', vendorCheckedIn: true },
    { id: 'h2', time: '9:00 AM', activity: 'Photographer setup', vendorName: 'Srikanth Photography', vendorCategory: 'Photography', vendorPhone: '+919876543211', status: 'completed', vendorCheckedIn: true },
    { id: 'h3', time: '9:30 AM', activity: 'Bride makeup begins', vendorName: 'Glow Studio', vendorCategory: 'Makeup', vendorPhone: '+919876543215', status: 'in_progress', vendorCheckedIn: true },
    { id: 'h4', time: '10:00 AM', activity: 'Haldi ceremony starts', vendorName: 'Pandit Sharma Ji', vendorCategory: 'Priest', vendorPhone: '+919876543216', status: 'upcoming', vendorCheckedIn: false },
    { id: 'h5', time: '12:00 PM', activity: 'Lunch service begins', vendorName: 'Flavours Catering Co.', vendorCategory: 'Catering', vendorPhone: '+919876543212', status: 'upcoming', vendorCheckedIn: false },
  ],
  Wedding: [
    { id: 'w1', time: '6:00 AM', activity: 'Makeup artist arrives for bride', vendorName: 'Glow Studio', vendorCategory: 'Makeup', vendorPhone: '+919876543215', status: 'completed', vendorCheckedIn: true },
    { id: 'w2', time: '7:00 AM', activity: 'Photographer & videographer setup', vendorName: 'Srikanth Photography', vendorCategory: 'Photography', vendorPhone: '+919876543211', status: 'completed', vendorCheckedIn: true },
    { id: 'w3', time: '8:00 AM', activity: 'Venue decoration check', vendorName: 'Blooms & Dreams Decor', vendorCategory: 'Decor', vendorPhone: '+919876543214', status: 'completed', vendorCheckedIn: true },
    { id: 'w4', time: '9:00 AM', activity: 'Baraat band & horse arrive', vendorName: 'Royal Band Hyderabad', vendorCategory: 'Music & DJ', vendorPhone: '+919876543217', status: 'completed', vendorCheckedIn: true },
    { id: 'w5', time: '9:30 AM', activity: 'Baraat procession begins', vendorName: 'Royal Band Hyderabad', vendorCategory: 'Music & DJ', vendorPhone: '+919876543217', status: 'in_progress', vendorCheckedIn: true },
    { id: 'w6', time: '10:00 AM', activity: 'Jaimala ceremony', vendorName: 'Pandit Sharma Ji', vendorCategory: 'Priest', vendorPhone: '+919876543216', status: 'upcoming', vendorCheckedIn: true, note: 'Mandap must be ready by 9:45 AM' },
    { id: 'w7', time: '10:30 AM', activity: 'Pheras & wedding rituals', vendorName: 'Pandit Sharma Ji', vendorCategory: 'Priest', vendorPhone: '+919876543216', status: 'upcoming', vendorCheckedIn: true },
    { id: 'w8', time: '12:00 PM', activity: 'Lunch buffet opens', vendorName: 'Flavours Catering Co.', vendorCategory: 'Catering', vendorPhone: '+919876543212', status: 'upcoming', vendorCheckedIn: false },
    { id: 'w9', time: '12:30 PM', activity: 'Couple photoshoot session', vendorName: 'Srikanth Photography', vendorCategory: 'Photography', vendorPhone: '+919876543211', status: 'upcoming', vendorCheckedIn: true },
    { id: 'w10', time: '1:30 PM', activity: 'Vidaai ceremony', vendorName: 'Pandit Sharma Ji', vendorCategory: 'Priest', vendorPhone: '+919876543216', status: 'upcoming', vendorCheckedIn: true },
    { id: 'w11', time: '2:00 PM', activity: 'Catering wrap-up & cleanup', vendorName: 'Flavours Catering Co.', vendorCategory: 'Catering', vendorPhone: '+919876543212', status: 'delayed', vendorCheckedIn: false, note: 'Vendor running 20 mins behind schedule' },
    { id: 'w12', time: '3:00 PM', activity: 'Venue handover & checkout', vendorName: 'Royal Grand Palace', vendorCategory: 'Venue', vendorPhone: '+919876543218', status: 'upcoming', vendorCheckedIn: false },
  ],
  Reception: [
    { id: 'r1', time: '4:00 PM', activity: 'Venue lighting setup', vendorName: 'Blooms & Dreams Decor', vendorCategory: 'Decor', vendorPhone: '+919876543214', status: 'completed', vendorCheckedIn: true },
    { id: 'r2', time: '5:00 PM', activity: 'DJ sound check', vendorName: 'DJ Akash', vendorCategory: 'Music & DJ', vendorPhone: '+919876543213', status: 'in_progress', vendorCheckedIn: true },
    { id: 'r3', time: '5:30 PM', activity: 'Couple styling & dress change', vendorName: 'Glow Studio', vendorCategory: 'Makeup', vendorPhone: '+919876543215', status: 'upcoming', vendorCheckedIn: false },
    { id: 'r4', time: '6:30 PM', activity: 'Guest arrival & welcome drinks', vendorName: 'Flavours Catering Co.', vendorCategory: 'Catering', vendorPhone: '+919876543212', status: 'upcoming', vendorCheckedIn: false },
    { id: 'r5', time: '7:00 PM', activity: 'Couple grand entry', vendorName: 'DJ Akash', vendorCategory: 'Music & DJ', vendorPhone: '+919876543213', status: 'upcoming', vendorCheckedIn: false },
    { id: 'r6', time: '8:00 PM', activity: 'Dinner service', vendorName: 'Flavours Catering Co.', vendorCategory: 'Catering', vendorPhone: '+919876543212', status: 'upcoming', vendorCheckedIn: false },
    { id: 'r7', time: '9:30 PM', activity: 'Dance floor & performances', vendorName: 'DJ Akash', vendorCategory: 'Music & DJ', vendorPhone: '+919876543213', status: 'upcoming', vendorCheckedIn: false },
    { id: 'r8', time: '11:00 PM', activity: 'Event wrap-up & farewell', vendorName: 'Royal Grand Palace', vendorCategory: 'Venue', vendorPhone: '+919876543218', status: 'upcoming', vendorCheckedIn: false },
  ],
};

const EVENT_TABS: { label: EventFunction; emoji: string }[] = [
  { label: 'Mehendi', emoji: '🌿' },
  { label: 'Haldi', emoji: '💛' },
  { label: 'Wedding', emoji: '💍' },
  { label: 'Reception', emoji: '🥂' },
];

const STATUS_CONFIG: Record<EntryStatus, { label: string; color: string; bg: string; icon: React.ElementType; ring?: string }> = {
  upcoming: { label: 'Upcoming', color: 'text-gray-500', bg: 'bg-gray-100', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock, ring: 'ring-2 ring-blue-400 ring-offset-2' },
  completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
  delayed: { label: 'Delayed', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
};

// ─── Helpers ───────────────────────────────────────────────
function getCountdown(targetDate: Date) {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, isToday: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes, isToday: days === 0 && hours === 0 };
}

// ─── Components ────────────────────────────────────────────
function CountdownBanner() {
  const weddingDate = new Date('2025-03-15T06:00:00');
  const [countdown, setCountdown] = useState(getCountdown(weddingDate));

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getCountdown(weddingDate)), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 p-5 sm:p-6 text-white shadow-xl"
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjcCkiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-30" />
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium">Your Wedding Day</p>
            <p className="text-lg font-bold">March 15, 2025</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <CountdownUnit value={countdown.days} label="Days" />
          <span className="text-2xl font-light text-white/60">:</span>
          <CountdownUnit value={countdown.hours} label="Hours" />
          <span className="text-2xl font-light text-white/60">:</span>
          <CountdownUnit value={countdown.minutes} label="Mins" />
        </div>
      </div>
    </motion.div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[56px]">
        <span className="text-2xl sm:text-3xl font-bold tabular-nums">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-xs text-white/70 mt-1 block">{label}</span>
    </div>
  );
}

function DelayAlert({ entries }: { entries: TimelineEntry[] }) {
  const delayedEntries = entries.filter(e => e.status === 'delayed');
  if (delayedEntries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3"
    >
      <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-5 h-5 text-red-600" />
      </div>
      <div>
        <p className="font-semibold text-red-800 text-sm">Delay Alert</p>
        {delayedEntries.map(e => (
          <p key={e.id} className="text-red-700 text-sm mt-1">
            <span className="font-medium">{e.vendorName}</span> — {e.note || 'Running behind schedule'}
          </p>
        ))}
      </div>
    </motion.div>
  );
}

function TimelineCard({ entry, index, onAssign, onAddNote }: { entry: TimelineEntry; index: number; onAssign: (id: string, assignee: string) => void; onAddNote: (id: string, note: string) => void }) {
  const cfg = STATUS_CONFIG[entry.status];
  const StatusIcon = cfg.icon;
  const [showAssign, setShowAssign] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState(entry.note ?? '');

  const FAMILY_MEMBERS = ['Rahul', 'Priya', 'Mom', 'Dad', 'Brother', 'Sister', 'Cousin', 'Wedding Planner'];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative"
    >
      {/* Desktop timeline connector */}
      <div className="hidden md:flex absolute left-0 top-0 bottom-0 w-20 flex-col items-center">
        <div className="text-sm font-semibold text-gray-700 whitespace-nowrap">{entry.time}</div>
        <div className={`mt-2 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
          entry.status === 'completed' ? 'bg-green-500 border-green-500' :
          entry.status === 'in_progress' ? 'bg-blue-500 border-blue-500 animate-pulse' :
          entry.status === 'delayed' ? 'bg-red-500 border-red-500' :
          'bg-white border-gray-300'
        }`} />
        <div className="flex-1 w-0.5 bg-gray-200 mt-1" />
      </div>

      {/* Card */}
      <div className={`md:ml-24 rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${
        entry.status === 'in_progress' ? 'border-blue-200 bg-blue-50/50 shadow-sm shadow-blue-100' :
        entry.status === 'delayed' ? 'border-red-200 bg-red-50/30' :
        entry.status === 'completed' ? 'border-gray-100 bg-gray-50/50' :
        'border-gray-100 bg-white'
      }`}>
        {/* Mobile time badge */}
        <div className="md:hidden flex items-center gap-2 mb-2">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">{entry.time}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-base">{entry.activity}</h4>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm text-gray-600">{entry.vendorName}</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500">{entry.vendorCategory}</span>
            </div>
            {entry.note && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1 mt-2 inline-block">
                📝 {entry.note}
              </p>
            )}
          </div>

          {/* Status + check-in */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg} ${cfg.ring || ''}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {cfg.label}
            </span>
            {entry.vendorCheckedIn && (
              <span className="inline-flex items-center gap-1 text-xs text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Checked in
              </span>
            )}
          </div>
        </div>

        {/* Quick contact + assignment buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <a
            href={`https://wa.me/${entry.vendorPhone.replace('+', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
          <a
            href={`tel:${entry.vendorPhone}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 text-xs font-medium hover:bg-gray-100 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </a>
          {entry.assignee ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">
              <UserCircle className="w-3.5 h-3.5" />
              {entry.assignee}
            </span>
          ) : (
            <button
              onClick={() => setShowAssign(!showAssign)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 text-gray-500 text-xs font-medium hover:bg-gray-100 transition-colors"
            >
              <UserCircle className="w-3.5 h-3.5" />
              Assign
            </button>
          )}
          {!entry.note && (
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 text-gray-500 text-xs font-medium hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Note
            </button>
          )}
          <div className="flex-1" />
          <span className="text-xs text-gray-400 hidden sm:inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Hyderabad
          </span>
        </div>

        {/* Assign dropdown */}
        {showAssign && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FAMILY_MEMBERS.map((name) => (
              <button
                key={name}
                onClick={() => { onAssign(entry.id, name); setShowAssign(false); }}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {/* Note input */}
        {showNoteInput && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <button
              onClick={() => { if (noteText.trim()) { onAddNote(entry.id, noteText.trim()); setShowNoteInput(false); } }}
              className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-medium hover:bg-rose-600 transition"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function TimelinePage() {
  const [activeTab, setActiveTab] = useState<EventFunction>('Wedding');
  const [timelineData, setTimelineData] = useState(MOCK_TIMELINE);
  const entries = timelineData[activeTab];

  const handleAssign = (id: string, assignee: string) => {
    setTimelineData((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((e) => e.id === id ? { ...e, assignee } : e),
    }));
  };

  const handleAddNote = (id: string, note: string) => {
    setTimelineData((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((e) => e.id === id ? { ...e, note } : e),
    }));
  };

  const completedCount = entries.filter(e => e.status === 'completed').length;
  const totalCount = entries.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50/40 via-white to-purple-50/30">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            D-Day Execution
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            Your Wedding Timeline
          </h1>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Every moment planned, every vendor tracked. Your perfect day, beautifully orchestrated.
          </p>
        </motion.div>

        {/* Countdown Banner */}
        <div className="mb-6">
          <CountdownBanner />
        </div>

        {/* Event Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide"
        >
          {EVENT_TABS.map(tab => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.label
                  ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md shadow-rose-200'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-rose-200 hover:bg-rose-50'
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-6 bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{completedCount}/{totalCount} completed</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-rose-500 to-purple-500 rounded-full"
            />
          </div>
        </motion.div>

        {/* Delay Alert */}
        <div className="mb-6">
          <DelayAlert entries={entries} />
        </div>

        {/* Timeline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {entries.map((entry, idx) => (
              <TimelineCard key={entry.id} entry={entry} index={idx} onAssign={handleAssign} onAddNote={handleAddNote} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-gray-200 text-gray-600 text-sm shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            All vendors confirmed for {activeTab}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
