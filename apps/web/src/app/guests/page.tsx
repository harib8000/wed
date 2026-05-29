'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Upload,
  UserPlus,
  Users,
  UtensilsCrossed,
  X,
  XCircle,
} from 'lucide-react';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AddGuestModal } from '@/components/guests/AddGuestModal';
import { guestApi } from '@/lib/api';

type RsvpStatus = 'pending' | 'accepted' | 'declined' | 'maybe';
type GuestSide = 'bride' | 'groom' | 'mutual';
type MealPreference = 'veg' | 'non_veg' | 'jain' | 'vegan' | 'no_preference';
type GuestGroup = 'family' | 'friends' | 'colleagues' | 'neighbours' | 'others';

interface Guest {
  id: string;
  eventId: string;
  name: string;
  phone?: string;
  email?: string;
  side: GuestSide;
  group: GuestGroup;
  rsvpStatus: RsvpStatus;
  mealPreference: MealPreference;
  plusOnes: number;
  tableNumber?: string;
  roomAllocation?: string;
  inviteSentAt?: Date;
  rsvpRespondedAt?: Date;
  qrCode?: string;
  notes?: string;
  createdAt: Date;
}

interface ParsedGuestRow {
  name: string;
  phone: string;
  email: string;
  side: string;
  group: string;
}

const GUESTS_STORAGE_KEY = 'wedding_os_guests';

const RSVP_CONFIG: Record<RsvpStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  accepted: { label: 'Accepted', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
  declined: { label: 'Declined', color: 'text-red-700', bg: 'bg-red-50', icon: XCircle },
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock },
  maybe: { label: 'Maybe', color: 'text-blue-700', bg: 'bg-blue-50', icon: HelpCircle },
};

const MEAL_LABELS: Record<MealPreference, string> = {
  veg: 'Veg',
  non_veg: 'Non-Veg',
  jain: 'Jain',
  vegan: 'Vegan',
  no_preference: 'Any',
};

const SIDE_LABELS: Record<GuestSide, string> = {
  bride: 'Bride',
  groom: 'Groom',
  mutual: 'Mutual',
};

const GROUP_LABELS: Record<GuestGroup, string> = {
  family: 'Family',
  friends: 'Friends',
  colleagues: 'Colleagues',
  neighbours: 'Neighbours',
  others: 'Others',
};

const GROUP_BADGES: Record<GuestGroup, string> = {
  family: 'bg-rose-50 text-rose-700',
  friends: 'bg-violet-50 text-violet-700',
  colleagues: 'bg-sky-50 text-sky-700',
  neighbours: 'bg-amber-50 text-amber-700',
  others: 'bg-gray-100 text-gray-700',
};

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

const GROUP_FILTERS: { value: GroupFilter; label: string }[] = [
  { value: 'all', label: 'All Groups' },
  { value: 'family', label: 'Family' },
  { value: 'friends', label: 'Friends' },
  { value: 'colleagues', label: 'Colleagues' },
  { value: 'neighbours', label: 'Neighbours' },
  { value: 'others', label: 'Others' },
];

const RSVP_CYCLE: RsvpStatus[] = ['pending', 'accepted', 'maybe', 'declined'];
const GROUP_ORDER: GuestGroup[] = ['family', 'friends', 'colleagues', 'neighbours', 'others'];
const MEAL_ORDER: MealPreference[] = ['veg', 'non_veg', 'vegan', 'jain', 'no_preference'];

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

type SideTab = 'all' | GuestSide;
type RsvpFilter = 'all' | RsvpStatus;
type GroupFilter = 'all' | GuestGroup;

const MOCK_GUESTS: Guest[] = [
  {
    id: '1',
    eventId: 'evt_1',
    name: 'Priya Sharma',
    phone: '9876543210',
    email: 'priya@email.com',
    side: 'bride',
    group: 'family',
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
    group: 'friends',
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
    group: 'colleagues',
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
    group: 'family',
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
    group: 'friends',
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
    group: 'colleagues',
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
    group: 'friends',
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
    group: 'neighbours',
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
    group: 'family',
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
    group: 'others',
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
    group: 'family',
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
    group: 'colleagues',
    rsvpStatus: 'pending',
    mealPreference: 'no_preference',
    plusOnes: 1,
    createdAt: new Date('2025-01-10'),
  },
];

function createGuestId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSide(value: unknown): GuestSide {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized.startsWith('bride')) return 'bride';
  if (normalized.startsWith('groom')) return 'groom';
  if (normalized.startsWith('mutual')) return 'mutual';
  return 'bride';
}

function normalizeGroup(value: unknown): GuestGroup {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized.startsWith('family')) return 'family';
  if (normalized.startsWith('friend')) return 'friends';
  if (normalized.startsWith('colleague')) return 'colleagues';
  if (normalized.startsWith('neighbour') || normalized.startsWith('neighbor')) return 'neighbours';
  if (normalized.startsWith('other')) return 'others';
  return 'friends';
}

function normalizeRsvp(value: unknown): RsvpStatus {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'accepted' || normalized === 'declined' || normalized === 'pending' || normalized === 'maybe') {
    return normalized;
  }
  return 'pending';
}

function normalizeMealPreference(value: unknown): MealPreference {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'veg' || normalized === 'non_veg' || normalized === 'jain' || normalized === 'vegan' || normalized === 'no_preference') {
    return normalized;
  }
  return 'no_preference';
}

function normalizeGuest(raw: Partial<Guest> & Record<string, unknown>): Guest {
  return {
    id: typeof raw.id === 'string' ? raw.id : createGuestId(),
    eventId: typeof raw.eventId === 'string' ? raw.eventId : 'evt_1',
    name: typeof raw.name === 'string' ? raw.name : 'Guest',
    phone: typeof raw.phone === 'string' && raw.phone.trim() ? raw.phone : undefined,
    email: typeof raw.email === 'string' && raw.email.trim() ? raw.email : undefined,
    side: normalizeSide(raw.side),
    group: normalizeGroup(raw.group),
    rsvpStatus: normalizeRsvp(raw.rsvpStatus),
    mealPreference: normalizeMealPreference(raw.mealPreference),
    plusOnes: typeof raw.plusOnes === 'number' ? raw.plusOnes : Number(raw.plusOnes) || 0,
    tableNumber: typeof raw.tableNumber === 'string' && raw.tableNumber.trim() ? raw.tableNumber : undefined,
    roomAllocation: typeof raw.roomAllocation === 'string' && raw.roomAllocation.trim() ? raw.roomAllocation : undefined,
    inviteSentAt: raw.inviteSentAt instanceof Date ? raw.inviteSentAt : raw.inviteSentAt ? new Date(String(raw.inviteSentAt)) : undefined,
    rsvpRespondedAt: raw.rsvpRespondedAt instanceof Date ? raw.rsvpRespondedAt : raw.rsvpRespondedAt ? new Date(String(raw.rsvpRespondedAt)) : undefined,
    qrCode: typeof raw.qrCode === 'string' && raw.qrCode.trim() ? raw.qrCode : undefined,
    notes: typeof raw.notes === 'string' && raw.notes.trim() ? raw.notes : undefined,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt : raw.createdAt ? new Date(String(raw.createdAt)) : new Date(),
  };
}

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

    return Array.isArray(parsed) ? parsed.map((guest) => normalizeGuest(guest)) : null;
  } catch {
    return null;
  }
}

function saveGuestsToStorage(guests: Guest[]) {
  try {
    localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(guests));
  } catch {
    // Ignore storage write failures in demo mode.
  }
}

function parseCSV(text: string): Array<{ name: string; phone: string; email: string; side: string; group: string }> {
  const lines = text.trim().split('\n');
  return lines.slice(1).filter((line) => line.trim()).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    return {
      name: cols[0] || '',
      phone: cols[1] || '',
      email: cols[2] || '',
      side: cols[3] || 'Bride',
      group: cols[4] || 'Friends',
    };
  });
}

function formatSideLabel(side: string) {
  if (side.toLowerCase().startsWith('groom')) return 'Groom';
  if (side.toLowerCase().startsWith('mutual')) return 'Mutual';
  return 'Bride';
}

function formatGroupLabel(group: string) {
  const normalized = normalizeGroup(group);
  return GROUP_LABELS[normalized];
}

function BulkImportModal({
  isOpen,
  onClose,
  onImport,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: ParsedGuestRow[]) => void;
}) {
  const [parsedRows, setParsedRows] = useState<ParsedGuestRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setParsedRows([]);
      setFileName('');
      setInputKey((prev) => prev + 1);
      setIsReading(false);
    }
  }, [isOpen]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a .csv file');
      setInputKey((prev) => prev + 1);
      return;
    }

    setIsReading(true);

    try {
      const text = await file.text();
      if (!text.trim()) {
        toast.error('The CSV file is empty');
        return;
      }

      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        toast.error('Add at least one guest row below the header');
        return;
      }

      const header = lines[0].toLowerCase();
      if (!header.includes('name') || !header.includes('phone') || !header.includes('email') || !header.includes('side') || !header.includes('group')) {
        toast.error('CSV header should be: Name, Phone, Email, Side, Group');
        return;
      }

      const rows = parseCSV(text).filter((row) => row.name.trim());
      if (!rows.length) {
        toast.error('No valid guests found in the CSV');
        return;
      }

      setParsedRows(rows);
      setFileName(file.name);
      toast.success(`${rows.length} guests ready to import`, { duration: 2000 });
    } catch {
      toast.error('Could not read the CSV file');
    } finally {
      setIsReading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className="relative w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 z-10 rounded-t-2xl border-b border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Bulk Import Guests</h2>
                  <p className="text-sm text-gray-500">Upload a CSV and confirm before adding everyone.</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
                <div className="flex items-center gap-2 text-rose-700 font-medium text-sm">
                  <FileSpreadsheet className="w-4 h-4" />
                  Expected CSV format
                </div>
                <p className="mt-2 text-sm text-rose-800">
                  Name, Phone, Email, Side (Bride/Groom), Group (Family/Friends/Colleagues)
                </p>
                <div className="mt-3 rounded-xl bg-white border border-rose-100 p-3 font-mono text-xs text-gray-700 overflow-x-auto">
                  <p>Name,Phone,Email,Side,Group</p>
                  <p>Ananya Rao,9876543210,ananya@email.com,Bride,Family</p>
                  <p>Rohan Mehta,9876543211,rohan@email.com,Groom,Friends</p>
                </div>
              </div>

              <label className="block rounded-2xl border-2 border-dashed border-gray-200 hover:border-rose-300 transition-colors p-6 text-center cursor-pointer bg-gray-50/80">
                <input
                  key={inputKey}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload className="w-8 h-8 text-rose-500 mx-auto mb-3" />
                <p className="font-medium text-gray-900">Choose CSV file</p>
                <p className="text-sm text-gray-500 mt-1">
                  {isReading ? 'Parsing your guest list…' : fileName || 'Select a file to preview guests before importing'}
                </p>
              </label>

              {parsedRows.length > 0 && (
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Preview</p>
                        <p className="text-xs text-gray-500">{parsedRows.length} guests will be added as pending RSVPs.</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-700">
                      {fileName}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white text-left text-gray-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Phone</th>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">Side</th>
                          <th className="px-4 py-3 font-medium">Group</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 8).map((row, index) => (
                          <tr key={`${row.name}-${index}`} className="border-t border-gray-100 text-gray-700">
                            <td className="px-4 py-3 font-medium">{row.name}</td>
                            <td className="px-4 py-3">{row.phone || '—'}</td>
                            <td className="px-4 py-3">{row.email || '—'}</td>
                            <td className="px-4 py-3">{formatSideLabel(row.side)}</td>
                            <td className="px-4 py-3">{formatGroupLabel(row.group)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedRows.length > 8 && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500">
                      + {parsedRows.length - 8} more guests will be imported.
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!parsedRows.length}
                  onClick={() => onImport(parsedRows)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-sm font-medium text-white hover:from-rose-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import {parsedRows.length || ''} Guests
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestsLoading, setGuestsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sideTab, setSideTab] = useState<SideTab>('all');
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>('all');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    guestApi.list()
      .then((res) => {
        const raw: unknown[] = res.data.data?.guests ?? [];
        setGuests(raw.map((g) => {
          const guest = g as Record<string, unknown>;
          return {
            ...guest,
            side: (guest.side as string).toLowerCase() as GuestSide,
            group: (guest.group as string).toLowerCase() as GuestGroup,
            rsvpStatus: (guest.rsvpStatus as string).toLowerCase() as RsvpStatus,
            mealPreference: (guest.mealPreference as string).toLowerCase() as MealPreference,
            createdAt: new Date(guest.createdAt as string),
            inviteSentAt: guest.inviteSentAt ? new Date(guest.inviteSentAt as string) : undefined,
            rsvpRespondedAt: guest.rsvpRespondedAt ? new Date(guest.rsvpRespondedAt as string) : undefined,
            plusOnes: (guest.plusOnes as number) ?? 0,
          } as Guest;
        }));
      })
      .catch(() => setGuests([]))
      .finally(() => setGuestsLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = guests.length;
    const accepted = guests.filter((g) => g.rsvpStatus === 'accepted').length;
    const declined = guests.filter((g) => g.rsvpStatus === 'declined').length;
    const pending = guests.filter((g) => g.rsvpStatus === 'pending').length;
    const maybe = guests.filter((g) => g.rsvpStatus === 'maybe').length;
    const responded = guests.filter((g) => g.rsvpStatus !== 'pending').length;
    const completionRate = total ? Math.round((responded / total) * 100) : 0;
    const totalWithPlusOnes = guests
      .filter((g) => g.rsvpStatus !== 'declined')
      .reduce((sum, g) => sum + 1 + g.plusOnes, 0);

    const mealCounts = MEAL_ORDER.reduce(
      (acc, meal) => ({ ...acc, [meal]: 0 }),
      {} as Record<MealPreference, number>
    );
    const relevantMealGuests = guests.filter((guest) => guest.rsvpStatus !== 'declined');
    relevantMealGuests.forEach((guest) => {
      mealCounts[guest.mealPreference] += 1 + guest.plusOnes;
    });

    const groupCounts = GROUP_ORDER.reduce(
      (acc, group) => ({ ...acc, [group]: 0 }),
      {} as Record<GuestGroup, number>
    );
    guests.forEach((guest) => {
      groupCounts[guest.group] += 1;
    });

    const sideCounts = {
      bride: guests.filter((g) => g.side === 'bride').length,
      groom: guests.filter((g) => g.side === 'groom').length,
      mutual: guests.filter((g) => g.side === 'mutual').length,
    };

    return {
      total,
      accepted,
      declined,
      pending,
      maybe,
      responded,
      completionRate,
      totalWithPlusOnes,
      mealCounts,
      groupCounts,
      sideCounts,
    };
  }, [guests]);

  const filtered = useMemo(() => {
    let list = guests;

    if (sideTab !== 'all') list = list.filter((g) => g.side === sideTab);
    if (rsvpFilter !== 'all') list = list.filter((g) => g.rsvpStatus === rsvpFilter);
    if (groupFilter !== 'all') list = list.filter((g) => g.group === groupFilter);

    if (search.trim()) {
      const query = search.toLowerCase();
      list = list.filter(
        (guest) =>
          guest.name.toLowerCase().includes(query) ||
          guest.phone?.toLowerCase().includes(query) ||
          guest.email?.toLowerCase().includes(query)
      );
    }

    return list;
  }, [guests, sideTab, rsvpFilter, groupFilter, search]);

  const mealSummaryText = useMemo(
    () => [
      'WeddingOS meal summary',
      `Total likely plates: ${stats.totalWithPlusOnes}`,
      `Veg: ${stats.mealCounts.veg}`,
      `Non-Veg: ${stats.mealCounts.non_veg}`,
      `Vegan: ${stats.mealCounts.vegan}`,
      `Jain: ${stats.mealCounts.jain}`,
      `Any: ${stats.mealCounts.no_preference}`,
    ].join('\n'),
    [stats.mealCounts, stats.totalWithPlusOnes]
  );

  function handleAddGuest(data: {
    name: string;
    phone: string;
    email: string;
    side: GuestSide;
    group: GuestGroup;
    mealPreference: MealPreference;
    plusOnes: number;
    notes: string;
  }) {
    const newGuest: Guest = {
      id: createGuestId(),
      eventId: 'evt_1',
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      side: data.side,
      group: data.group,
      rsvpStatus: 'pending',
      mealPreference: data.mealPreference,
      plusOnes: data.plusOnes,
      notes: data.notes || undefined,
      createdAt: new Date(),
    };

    // Persist to backend
    const payload = {
      name: newGuest.name,
      phone: newGuest.phone,
      email: newGuest.email,
      side: (newGuest.side as string).toUpperCase(),
      group: (newGuest.group as string).toUpperCase(),
      rsvpStatus: (newGuest.rsvpStatus as string).toUpperCase(),
      mealPreference: (newGuest.mealPreference as string).toUpperCase(),
      plusOnes: newGuest.plusOnes,
      tableNumber: newGuest.tableNumber,
      notes: newGuest.notes,
    };
    guestApi.create(payload).then((res) => {
      const created = res.data.data?.guest as Record<string, unknown> | undefined;
      if (created?.id) {
        setGuests((prev) => prev.map((g) => g.id === newGuest.id ? { ...g, id: created.id as string } : g));
      }
    }).catch(() => {}); // optimistic - keep local add
    setGuests((prev) => [newGuest, ...prev]);
    toast.success(`${data.name} added to guest list!`, { duration: 2000 });
  }

  function handleBulkImport(rows: ParsedGuestRow[]) {
    const importedGuests = rows.map((row) => ({
      id: createGuestId(),
      eventId: 'evt_1',
      name: row.name.trim(),
      phone: row.phone.trim() || undefined,
      email: row.email.trim() || undefined,
      side: normalizeSide(row.side),
      group: normalizeGroup(row.group),
      rsvpStatus: 'pending' as const,
      mealPreference: 'no_preference' as const,
      plusOnes: 0,
      createdAt: new Date(),
    }));

    setGuests((prev) => [...importedGuests.reverse(), ...prev]);
    setShowImportModal(false);
    toast.success(`Imported ${importedGuests.length} guests`, { duration: 2500 });
  }

  function handleExportCSV() {
    const header = 'Name,Phone,Email,Side,Group,RSVP,Meal,Plus-Ones,Notes';
    const rows = guests.map(
      (guest) =>
        `"${guest.name}","${guest.phone ?? ''}","${guest.email ?? ''}","${SIDE_LABELS[guest.side]}","${GROUP_LABELS[guest.group]}","${guest.rsvpStatus}","${guest.mealPreference}","${guest.plusOnes}","${guest.notes ?? ''}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'guest-list.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(`Exported ${guests.length} guests to CSV`, { duration: 2000 });
  }

  function handleWhatsAppBulk() {
    const pendingGuests = guests.filter((guest) => guest.rsvpStatus === 'pending' && guest.phone);
    const message = encodeURIComponent(
      `You're invited to our wedding! 💍\nPlease RSVP here: ${window.location.origin}/guests/invite`
    );

    if (pendingGuests.length > 0) {
      window.open(`https://wa.me/91${pendingGuests[0].phone}?text=${message}`, '_blank');
      toast.success(`Opening WhatsApp for ${pendingGuests[0].name}`, { duration: 2000 });
      return;
    }

    toast.error('No pending guests with phone numbers', { duration: 2000 });
  }

  function handleToggleRsvp(guestId: string) {
    setGuests((prev) =>
      prev.map((guest) => {
        if (guest.id !== guestId) return guest;
        const currentIndex = RSVP_CYCLE.indexOf(guest.rsvpStatus);
        const nextStatus = RSVP_CYCLE[(currentIndex + 1) % RSVP_CYCLE.length];
        toast.success(`${guest.name}: ${RSVP_CONFIG[nextStatus].label}`, { duration: 2000 });
        return {
          ...guest,
          rsvpStatus: nextStatus,
          rsvpRespondedAt: nextStatus !== 'pending' ? new Date() : undefined,
        };
      })
    );
  }

  async function handleCopyMealSummary() {
    try {
      await navigator.clipboard.writeText(mealSummaryText);
      toast.success('Meal summary copied for your caterer');
    } catch {
      toast.error('Could not copy meal summary');
    }
  }

  const heroCards = [
    { label: 'Total Guests', value: stats.total, icon: Users, color: 'from-violet-500 to-purple-500' },
    { label: 'Accepted', value: stats.accepted, icon: CheckCircle2, color: 'from-emerald-500 to-green-500' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'from-amber-500 to-orange-500' },
    { label: 'Completion', value: `${stats.completionRate}%`, icon: BarChart3, color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pb-28 sm:pb-12">
        <motion.section
          {...fadeIn}
          className="bg-gradient-to-br from-rose-600 via-pink-600 to-purple-600 text-white"
        >
          <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Guest Management</h1>
            <p className="text-rose-100 text-sm sm:text-base max-w-2xl">
              Track RSVPs, import guest lists, share meal counts with your caterer, and keep every invite organized.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {heroCards.map((card, index) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.06 }}
                  className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shrink-0`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-tight">{card.value}</p>
                    <p className="text-[11px] text-rose-100 leading-tight">{card.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <div className="max-w-6xl mx-auto px-4 -mt-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl shadow-lg shadow-gray-200/60 p-4"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search guests by name, phone, or email…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown((prev) => !prev)}
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
                      {RSVP_FILTERS.map((filterOption) => (
                        <button
                          key={filterOption.value}
                          onClick={() => {
                            setRsvpFilter(filterOption.value);
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                            rsvpFilter === filterOption.value ? 'text-rose-600 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {filterOption.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleWhatsAppBulk}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600 transition shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Bulk Import</span>
                  <span className="sm:hidden">Import</span>
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
                  <span className="ml-1.5 text-xs text-gray-400">
                    ({tab.value === 'all' ? guests.length : stats.sideCounts[tab.value]})
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {GROUP_FILTERS.map((filterOption) => (
                <button
                  key={filterOption.value}
                  onClick={() => setGroupFilter(filterOption.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    groupFilter === filterOption.value
                      ? 'bg-violet-50 text-violet-700'
                      : 'bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                  <span className="ml-1 text-[11px] opacity-70">
                    ({filterOption.value === 'all' ? guests.length : stats.groupCounts[filterOption.value]})
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <section className="max-w-6xl mx-auto px-4 mt-6 grid gap-4 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 rounded-2xl bg-white border border-gray-100 shadow-sm p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-rose-600">RSVP Dashboard Summary</p>
                <h2 className="text-xl font-semibold text-gray-900 mt-1">{stats.total} guests in your celebration list</h2>
              </div>
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                <BarChart3 className="w-4 h-4 text-rose-500" />
                {stats.completionRate}% RSVP complete
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mt-5">
              {(['accepted', 'pending', 'declined', 'maybe'] as RsvpStatus[]).map((status) => {
                const config = RSVP_CONFIG[status];
                const Icon = config.icon;
                const count = stats[status];

                return (
                  <div key={status} className={`rounded-2xl border ${config.bg} border-transparent p-4`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{config.label}</p>
                        <p className="text-xl font-bold text-gray-900">{count}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-gray-700">RSVP completion rate</span>
                <span className="text-gray-500">{stats.responded}/{stats.total} responded</span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-gray-200 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.completionRate}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Accepted {stats.accepted}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  <Clock className="w-3.5 h-3.5" />
                  Pending {stats.pending}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                  <XCircle className="w-3.5 h-3.5" />
                  Declined {stats.declined}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <UtensilsCrossed className="w-4 h-4 text-rose-500" />
                  Meal snapshot
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                  <div className="rounded-xl bg-emerald-50 px-3 py-2">
                    <p className="text-emerald-700 font-medium">Veg</p>
                    <p className="text-lg font-bold text-gray-900">{stats.mealCounts.veg}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 px-3 py-2">
                    <p className="text-amber-700 font-medium">Non-Veg</p>
                    <p className="text-lg font-bold text-gray-900">{stats.mealCounts.non_veg}</p>
                  </div>
                  <div className="rounded-xl bg-violet-50 px-3 py-2">
                    <p className="text-violet-700 font-medium">Vegan</p>
                    <p className="text-lg font-bold text-gray-900">{stats.mealCounts.vegan}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Users className="w-4 h-4 text-violet-500" />
                  Guest groups
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  {GROUP_ORDER.map((group) => (
                    <div key={group} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                      <span className="text-gray-600">{GROUP_LABELS[group]}</span>
                      <span className="font-semibold text-gray-900">{stats.groupCounts[group]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-rose-600">Meal Summary</p>
                <h2 className="text-xl font-semibold text-gray-900 mt-1">Ready for your caterer</h2>
              </div>
              <button
                onClick={handleCopyMealSummary}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <Copy className="w-4 h-4" />
                Share with caterer
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {MEAL_ORDER.map((meal) => (
                <div key={meal} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-500">
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{MEAL_LABELS[meal]}</p>
                      <p className="text-xs text-gray-500">Likely plates excluding declined RSVPs</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{stats.mealCounts[meal]}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-violet-50 p-4">
              <p className="text-sm font-medium text-violet-800">Estimated serving count</p>
              <p className="text-2xl font-bold text-violet-950 mt-1">{stats.totalWithPlusOnes}</p>
              <p className="text-sm text-violet-700 mt-1">Includes accepted, pending, and maybe guests with plus-ones.</p>
            </div>
          </motion.div>
        </section>

        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Guest List</h3>
              <p className="text-sm text-gray-500">
                Showing {filtered.length} of {guests.length} guests
              </p>
            </div>
            {(search || groupFilter !== 'all' || rsvpFilter !== 'all' || sideTab !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setGroupFilter('all');
                  setRsvpFilter('all');
                  setSideTab('all');
                }}
                className="text-sm font-medium text-rose-600 hover:text-rose-700"
              >
                Clear filters
              </button>
            )}
          </div>

          {guestsLoading ? (
            <div className="text-center py-20 text-sm text-gray-500">Loading guests...</div>
          ) : filtered.length === 0 ? (
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
                {search ? 'Try a different search term or clear a filter.' : 'Add your first guest to get started!'}
              </p>
              {!search && (
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:from-rose-600 hover:to-pink-600 transition shadow-md"
                  >
                    <UserPlus className="w-4 h-4 inline mr-1.5" />
                    Add Your First Guest
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Upload className="w-4 h-4 inline mr-1.5" />
                    Import CSV
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid gap-3">
                {filtered.map((guest, index) => {
                  const rsvp = RSVP_CONFIG[guest.rsvpStatus];
                  const RsvpIcon = rsvp.icon;
                  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/guests/invite` : '/guests/invite';

                  return (
                    <motion.div
                      key={guest.id}
                      layout
                      custom={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center text-rose-600 font-semibold text-sm shrink-0">
                          {guest.name
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

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
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${GROUP_BADGES[guest.group]}`}>
                              {GROUP_LABELS[guest.group]}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                            {guest.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {guest.phone}
                              </span>
                            )}
                            {guest.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {guest.email}
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

                        <div className="flex items-center gap-2 sm:shrink-0">
                          {guest.phone && (
                            <a
                              href={`https://wa.me/91${guest.phone}?text=${encodeURIComponent(`You're invited! 💍 RSVP here: ${inviteUrl}`)}`}
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
                              guestApi.remove(guest.id).catch(() => {}); // fire-and-forget
                              setGuests((prev) => prev.filter((entry) => entry.id !== guest.id));
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

      <AddGuestModal isOpen={showModal} onClose={() => setShowModal(false)} onAdd={handleAddGuest} />
      <BulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleBulkImport}
      />
    </>
  );
}
