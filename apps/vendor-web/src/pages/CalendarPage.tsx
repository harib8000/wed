import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Lock, CalendarDays, AlertTriangle } from 'lucide-react';
import { calendarApi, type BookedDate } from '../lib/api';

const MOCK_BOOKED: BookedDate[] = [
  { date: '2027-02-14', customer: 'Priya & Rahul', event: 'Wedding', slot: 'Full Day' },
  { date: '2027-02-22', customer: 'Ananya & Vikram', event: 'Reception', slot: 'Evening' },
  { date: '2027-03-05', customer: 'Meera & Arun', event: 'Wedding', slot: 'Full Day' },
  { date: '2027-03-15', customer: 'Kavitha & Sanjay', event: 'Engagement', slot: 'Morning' },
  { date: '2027-03-20', customer: 'Divya & Ravi', event: 'Wedding', slot: 'Full Day' },
];

const MOCK_BLOCKED = ['2027-02-10', '2027-02-11', '2027-03-01', '2027-03-25', '2027-03-26'];

const MOCK_UPCOMING = [
  { date: '14 Feb 2027', customer: 'Priya & Rahul Sharma', event: 'Wedding', package: 'Grand Gold', slot: 'Full Day' },
  { date: '22 Feb 2027', customer: 'Ananya & Vikram Reddy', event: 'Reception', package: 'Silver Basic', slot: 'Evening' },
  { date: '5 Mar 2027', customer: 'Meera & Arun Kumar', event: 'Wedding', package: 'Platinum', slot: 'Full Day' },
  { date: '15 Mar 2027', customer: 'Kavitha & Sanjay', event: 'Engagement', package: 'Basic', slot: 'Morning' },
  { date: '20 Mar 2027', customer: 'Divya & Ravi Verma', event: 'Wedding', package: 'Grand Gold', slot: 'Full Day' },
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

export function CalendarPage() {
  const [year, setYear] = useState(2027);
  const [month, setMonth] = useState(1); // February
  const [blocked, setBlocked] = useState<string[]>(MOCK_BLOCKED);

  const { data, isError } = useQuery({
    queryKey: ['vendor-availability'],
    queryFn: calendarApi.getAvailability,
    retry: 1,
    staleTime: 60_000,
  });

  const bookedDates = data?.bookedDates ?? MOCK_BOOKED;
  const isMock = isError || !data;

  useEffect(() => {
    if (data?.blockedDates) setBlocked(data.blockedDates);
  }, [data?.blockedDates]);

  const updateBlockedMutation = useMutation({
    mutationFn: (dates: string[]) => calendarApi.updateBlockedDates(dates),
    onError: () => toast.error('Failed to update availability.'),
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

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
    if (blocked.includes(dateStr)) return 'blocked';
    return 'available';
  }

  function toggleBlock(day: number) {
    const dateStr = formatDateStr(year, month, day);
    const booked = bookedDates.find((b) => b.date === dateStr);
    if (booked) return;
    const next = blocked.includes(dateStr)
      ? blocked.filter((d) => d !== dateStr)
      : [...blocked, dateStr];
    setBlocked(next);
    updateBlockedMutation.mutate(next);
  }

  const upcomingEvents = bookedDates.length > 0 && !isMock
    ? bookedDates.map((b) => ({
        date: new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        customer: b.customer,
        event: b.event,
        package: b.slot,
        slot: b.slot,
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
              const status = getDateStatus(day);
              const bgClass = status === 'booked'
                ? 'bg-red-100 border-red-200 text-red-700 cursor-not-allowed'
                : status === 'blocked'
                  ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-200'
                  : 'bg-green-50 border-green-200 text-green-700 cursor-pointer hover:bg-green-100';

              return (
                <button
                  key={day}
                  onClick={() => toggleBlock(day)}
                  className={`aspect-square rounded-lg border text-sm font-medium flex items-center justify-center transition-colors ${bgClass}`}
                  title={status === 'booked' ? 'Booked' : status === 'blocked' ? 'Blocked (click to unblock)' : 'Available (click to block)'}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
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
              Blocked
            </div>
          </div>

          {/* Quick block info */}
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700 flex items-center gap-2">
            <Lock size={14} />
            Click any available date to block it. Click a blocked date to unblock it.
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
                <p className="text-xs text-gray-500">{event.event} · {event.package}</p>
              </div>
            ))}
          </div>

          {/* Monthly summary */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">This Month</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Booked days</span>
                <span className="font-semibold text-gray-900">
                  {bookedDates.filter((b) => b.date.startsWith(formatDateStr(year, month, 1).slice(0, 7))).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Blocked days</span>
                <span className="font-semibold text-gray-900">
                  {blocked.filter((b) => b.startsWith(formatDateStr(year, month, 1).slice(0, 7))).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Available days</span>
                <span className="font-semibold text-green-600">
                  {daysInMonth - bookedDates.filter((b) => b.date.startsWith(formatDateStr(year, month, 1).slice(0, 7))).length - blocked.filter((b) => b.startsWith(formatDateStr(year, month, 1).slice(0, 7))).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
