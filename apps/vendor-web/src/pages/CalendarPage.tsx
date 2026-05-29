import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Lock, CalendarDays, AlertTriangle } from 'lucide-react';
import { calendarApi, type BookedDate } from '../lib/api';

type BlockSlot = 'full_day' | 'morning' | 'afternoon' | 'evening';
type BlockedDateMap = Record<string, BlockSlot>;

const SLOT_OPTIONS = ['full_day', 'morning', 'afternoon', 'evening'] as const;
const SLOT_META: Record<BlockSlot, { label: string; emoji: string }> = {
  full_day: { label: 'Full Day', emoji: '🌅' },
  morning: { label: 'Morning', emoji: '🌤️' },
  afternoon: { label: 'Afternoon', emoji: '☀️' },
  evening: { label: 'Evening', emoji: '🌙' },
};

const MOCK_BOOKED: BookedDate[] = [
  { date: '2027-02-14', customer: 'Priya & Rahul', event: 'Wedding', slot: 'Full Day' },
  { date: '2027-02-22', customer: 'Ananya & Vikram', event: 'Reception', slot: 'Evening' },
  { date: '2027-03-05', customer: 'Meera & Arun', event: 'Wedding', slot: 'Full Day' },
  { date: '2027-03-15', customer: 'Kavitha & Sanjay', event: 'Engagement', slot: 'Morning' },
  { date: '2027-03-20', customer: 'Divya & Ravi', event: 'Wedding', slot: 'Full Day' },
];

const MOCK_BLOCKED: Array<{ date: string; slot: BlockSlot }> = [
  { date: '2027-02-10', slot: 'full_day' },
  { date: '2027-02-11', slot: 'morning' },
  { date: '2027-03-01', slot: 'full_day' },
  { date: '2027-03-25', slot: 'evening' },
  { date: '2027-03-26', slot: 'full_day' },
];

const MOCK_UPCOMING = [
  { date: '14 Feb 2027', customer: 'Priya & Rahul Sharma', event: 'Wedding', slot: 'Full Day' },
  { date: '22 Feb 2027', customer: 'Ananya & Vikram Reddy', event: 'Reception', slot: 'Evening' },
  { date: '5 Mar 2027', customer: 'Meera & Arun Kumar', event: 'Wedding', slot: 'Full Day' },
  { date: '15 Mar 2027', customer: 'Kavitha & Sanjay', event: 'Engagement', slot: 'Morning' },
  { date: '20 Mar 2027', customer: 'Divya & Ravi Verma', event: 'Wedding', slot: 'Full Day' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplayDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function createBlockedDateMap(entries: Array<{ date: string; slot: BlockSlot }>) {
  return Object.fromEntries(entries.map(({ date, slot }) => [date, slot])) as BlockedDateMap;
}

export function CalendarPage() {
  const [year, setYear] = useState(2027);
  const [month, setMonth] = useState(1); // February
  const [blockedDates, setBlockedDates] = useState<BlockedDateMap>(() => createBlockedDateMap(MOCK_BLOCKED));
  const [pendingBlockDate, setPendingBlockDate] = useState<string | null>(null);
  const [blockSlot, setBlockSlot] = useState<BlockSlot>('full_day');

  const { data, isError } = useQuery({
    queryKey: ['vendor-availability'],
    queryFn: calendarApi.getAvailability,
    retry: 1,
    staleTime: 60_000,
  });

  const bookedDates = data?.bookedDates ?? MOCK_BOOKED;
  const isMock = isError || !data;

  useEffect(() => {
    if (!data?.blockedDates) return;
    setBlockedDates((current) => Object.fromEntries(
      data.blockedDates.map((date) => [date, current[date] ?? 'full_day'])
    ) as BlockedDateMap);
  }, [data?.blockedDates]);

  const updateBlockedMutation = useMutation({
    mutationFn: (dates: string[]) => calendarApi.updateBlockedDates(dates),
    onError: () => toast.error('Failed to update availability.'),
  });

  const blockedDateList = useMemo(() => Object.keys(blockedDates), [blockedDates]);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthPrefix = formatDateStr(year, month, 1).slice(0, 7);
  const bookedThisMonth = bookedDates.filter((booking) => booking.date.startsWith(monthPrefix)).length;
  const blockedThisMonth = blockedDateList.filter((date) => date.startsWith(monthPrefix)).length;

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  function getDateStatus(day: number) {
    const dateStr = formatDateStr(year, month, day);
    const booked = bookedDates.find((b) => b.date === dateStr);
    if (booked) return 'booked';
    const blockedSlot = blockedDates[dateStr];
    if (blockedSlot === 'full_day') return 'blocked';
    if (blockedSlot) return 'partial';
    return 'available';
  }

  function handleDateClick(day: number) {
    const dateStr = formatDateStr(year, month, day);
    const booked = bookedDates.find((b) => b.date === dateStr);
    if (booked) return;

    if (blockedDates[dateStr]) {
      const next = { ...blockedDates };
      delete next[dateStr];
      setBlockedDates(next);
      if (pendingBlockDate === dateStr) {
        setPendingBlockDate(null);
        setBlockSlot('full_day');
      }
      updateBlockedMutation.mutate(Object.keys(next));
      toast.success('Availability reopened for this date.');
      return;
    }

    setPendingBlockDate(dateStr);
    setBlockSlot('full_day');
  }

  function confirmBlockDate() {
    if (!pendingBlockDate) return;
    const next = { ...blockedDates, [pendingBlockDate]: blockSlot };
    setBlockedDates(next);
    updateBlockedMutation.mutate(Object.keys(next));
    toast.success(`${SLOT_META[blockSlot].label} blocked for ${formatDisplayDate(pendingBlockDate)}.`);
    setPendingBlockDate(null);
    setBlockSlot('full_day');
  }

  function cancelBlockSelection() {
    setPendingBlockDate(null);
    setBlockSlot('full_day');
  }

  const upcomingEvents = bookedDates.length > 0 && !isMock
    ? bookedDates.map((booking) => ({
        date: new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        customer: booking.customer,
        event: booking.event,
        slot: booking.slot,
      }))
    : MOCK_UPCOMING;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Availability Calendar</h1>
        <p className="text-gray-500 text-sm">
          {isMock && <span className="text-amber-600"><AlertTriangle size={13} className="inline mr-1 -mt-0.5" />API unavailable — showing demo data. </span>}
          Manage your availability and view upcoming events
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDateStr(year, month, day);
              const status = getDateStatus(day);
              const blockedSlot = blockedDates[dateStr];
              const bgClass = status === 'booked'
                ? 'bg-red-100 border-red-200 text-red-700 cursor-not-allowed'
                : status === 'blocked'
                  ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-200'
                  : status === 'partial'
                    ? 'bg-brand-50 border-brand-200 text-brand-700 cursor-pointer hover:bg-brand-100'
                    : 'bg-green-50 border-green-200 text-green-700 cursor-pointer hover:bg-green-100';
              const title = status === 'booked'
                ? 'Booked'
                : status === 'blocked'
                  ? 'Blocked for the full day (click to unblock)'
                  : status === 'partial' && blockedSlot
                    ? `${SLOT_META[blockedSlot].label} blocked (click to unblock)`
                    : 'Available (click to block)';

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`relative aspect-square rounded-lg border text-sm font-medium transition-colors ${bgClass}`}
                  title={title}
                >
                  <span className="flex h-full items-center justify-center">{day}</span>
                  {status === 'partial' ? <span className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full bg-brand-600" /> : null}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-4 h-4 rounded bg-green-50 border border-green-200" />
              Available
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
              Booked
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
              Full-day block
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="relative w-4 h-4 rounded bg-brand-50 border border-brand-200">
                <span className="absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-brand-600" />
              </div>
              Partial slot block
            </div>
          </div>

          {pendingBlockDate ? (
            <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Block {formatDisplayDate(pendingBlockDate)}</h3>
                  <p className="mt-1 text-xs text-gray-500">Choose whether you want to block the full day or only a specific time slot.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={cancelBlockSelection} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-white">
                    Cancel
                  </button>
                  <button onClick={confirmBlockDate} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700">
                    Block slot
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {SLOT_OPTIONS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setBlockSlot(slot)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${blockSlot === slot ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:border-brand-300'}`}
                  >
                    {SLOT_META[slot].emoji} {SLOT_META[slot].label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Quick block info */}
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700 flex items-center gap-2">
            <Lock size={14} />
            Click any available date to choose a slot to block. Click a blocked date to unblock it instantly.
          </div>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarDays size={16} className="text-brand-600" />
            Upcoming Events
          </h3>
          <div className="space-y-3">
            {upcomingEvents.map((event, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-brand-600">{event.date}</span>
                  <span className="badge bg-brand-50 text-brand-700 text-xs">{event.slot}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{event.customer}</p>
                <p className="text-xs text-gray-500">{event.event} · Slot: {event.slot}</p>
              </div>
            ))}
          </div>

          {/* Monthly summary */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">This Month</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Booked days</span>
                <span className="font-semibold text-gray-900">{bookedThisMonth}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Blocked days</span>
                <span className="font-semibold text-gray-900">{blockedThisMonth}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Available days</span>
                <span className="font-semibold text-green-600">{daysInMonth - bookedThisMonth - blockedThisMonth}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
