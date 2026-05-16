'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  addDays,
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Sun,
  Moon,
  Check,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SlotType = 'morning' | 'evening' | 'full_day';

interface SlotInfo {
  type: SlotType;
  label: string;
  time: string;
  icon: typeof Sun;
  booked: boolean;
}

interface BookedSlots {
  [dateKey: string]: SlotType[];
}

export interface AvailabilityCalendarProps {
  vendorId: string;
  vendorCategory: string;
  onSlotSelect?: (date: string, slot: SlotType) => void;
}

/* ------------------------------------------------------------------ */
/*  Mock data – current & next month bookings                         */
/* ------------------------------------------------------------------ */

function buildMockBookings(): BookedSlots {
  const today = new Date();
  const cm = today.getMonth();
  const cy = today.getFullYear();

  const key = (d: Date) => format(d, 'yyyy-MM-dd');

  const bookings: BookedSlots = {};
  const add = (d: Date, slots: SlotType[]) => {
    bookings[key(d)] = slots;
  };

  // Current month – scattered bookings
  add(new Date(cy, cm, 5), ['morning', 'evening', 'full_day']); // fully booked
  add(new Date(cy, cm, 8), ['morning']);
  add(new Date(cy, cm, 12), ['morning', 'evening']);
  add(new Date(cy, cm, 15), ['full_day']);
  add(new Date(cy, cm, 18), ['evening']);
  add(new Date(cy, cm, 22), ['morning', 'evening', 'full_day']);
  add(new Date(cy, cm, 25), ['morning']);
  add(new Date(cy, cm, 28), ['evening', 'full_day']);

  // Next month
  const nm = addMonths(today, 1).getMonth();
  const ny = addMonths(today, 1).getFullYear();
  add(new Date(ny, nm, 3), ['morning', 'evening', 'full_day']);
  add(new Date(ny, nm, 7), ['full_day']);
  add(new Date(ny, nm, 10), ['morning']);
  add(new Date(ny, nm, 14), ['morning', 'evening']);
  add(new Date(ny, nm, 20), ['evening']);
  add(new Date(ny, nm, 26), ['morning', 'evening', 'full_day']);

  return bookings;
}

/* ------------------------------------------------------------------ */
/*  Slot metadata                                                      */
/* ------------------------------------------------------------------ */

const SLOT_META: { type: SlotType; label: string; time: string; icon: typeof Sun }[] = [
  { type: 'morning', label: 'Morning', time: '6 AM – 12 PM', icon: Sun },
  { type: 'evening', label: 'Evening', time: '4 PM – 10 PM', icon: Moon },
  { type: 'full_day', label: 'Full Day', time: '6 AM – 10 PM', icon: Clock },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AvailabilityCalendar({
  vendorId,
  vendorCategory,
  onSlotSelect,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotType | null>(null);
  const [direction, setDirection] = useState(0); // -1 prev, 1 next

  const bookedSlots = useMemo(() => buildMockBookings(), []);

  /* ---------- calendar grid ---------- */
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  /* ---------- helpers ---------- */
  const dateKey = (d: Date) => format(d, 'yyyy-MM-dd');

  const bookedForDate = useCallback(
    (d: Date): SlotType[] => bookedSlots[dateKey(d)] ?? [],
    [bookedSlots],
  );

  type DateStatus = 'available' | 'partial' | 'booked' | 'past';

  const dateStatus = useCallback(
    (d: Date): DateStatus => {
      if (isBefore(startOfDay(d), startOfDay(new Date()))) return 'past';
      const booked = bookedForDate(d);
      if (booked.length === 0) return 'available';
      if (booked.length >= 3) return 'booked';
      return 'partial';
    },
    [bookedForDate],
  );

  const statusColor: Record<DateStatus, string> = {
    available: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
    partial: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200',
    booked: 'bg-red-50 text-red-400 border-red-200 cursor-not-allowed',
    past: 'bg-gray-50 text-gray-300 cursor-not-allowed',
  };

  /* ---------- navigation ---------- */
  const goNext = () => {
    setDirection(1);
    setCurrentMonth((m: Date) => addMonths(m, 1));
    setSelectedDate(null);
    setSelectedSlot(null);
  };
  const goPrev = () => {
    setDirection(-1);
    setCurrentMonth((m: Date) => subMonths(m, 1));
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  /* ---------- slot selection ---------- */
  const handleDateClick = (d: Date) => {
    const status = dateStatus(d);
    if (status === 'past' || status === 'booked') return;
    setSelectedDate(d);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: SlotType) => {
    if (!selectedDate) return;
    setSelectedSlot(slot);
    onSlotSelect?.(dateKey(selectedDate), slot);
  };

  /* ---------- build slot list for selected date ---------- */
  const slotsForSelected: SlotInfo[] = useMemo(() => {
    if (!selectedDate) return [];
    const booked = bookedForDate(selectedDate);
    return SLOT_META.map((s) => ({
      ...s,
      booked: booked.includes(s.type),
    }));
  }, [selectedDate, bookedForDate]);

  /* ---------- animation variants ---------- */
  const gridVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0, transition: { duration: 0.2 } }),
  };

  const slotPanelVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: 8, scale: 0.97, transition: { duration: 0.15 } },
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="card p-6 space-y-5">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-brand-600" />
          <h3 className="font-semibold text-gray-900 text-lg">Availability</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors focus-ring"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-800 min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={goNext}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors focus-ring"
            aria-label="Next month"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* ---- Legend ---- */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-400" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400" /> Partially Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" /> Fully Booked
        </span>
      </div>

      {/* ---- Weekday headers ---- */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* ---- Calendar grid ---- */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={format(currentMonth, 'yyyy-MM')}
          custom={direction}
          variants={gridVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="grid grid-cols-7 gap-1"
        >
          {days.map((day) => {
            const inMonth = isSameMonth(day, currentMonth);
            const status = dateStatus(day);
            const selected = selectedDate ? isSameDay(day, selectedDate) : false;
            const todayFlag = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => inMonth && handleDateClick(day)}
                disabled={!inMonth || status === 'past' || status === 'booked'}
                className={`
                  relative aspect-square flex items-center justify-center rounded-xl text-sm
                  font-medium transition-all duration-200 border
                  ${!inMonth ? 'invisible' : ''}
                  ${inMonth ? statusColor[status] : ''}
                  ${selected ? 'ring-2 ring-brand-500 ring-offset-1 !bg-brand-50 !text-brand-700 !border-brand-300' : ''}
                  ${todayFlag && !selected ? 'font-bold underline decoration-brand-500 underline-offset-2' : ''}
                `}
                aria-label={`${format(day, 'MMMM d')}, ${status}`}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* ---- Time slot panel ---- */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={dateKey(selectedDate)}
            variants={slotPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3"
          >
            <p className="text-sm font-semibold text-gray-800">
              Slots for{' '}
              <span className="text-brand-600">{format(selectedDate, 'EEE, d MMM yyyy')}</span>
            </p>

            <div className="grid gap-2 sm:grid-cols-3">
              {slotsForSelected.map((slot) => {
                const Icon = slot.icon;
                const isSelected = selectedSlot === slot.type;

                return (
                  <motion.button
                    key={slot.type}
                    whileHover={!slot.booked ? { scale: 1.02 } : undefined}
                    whileTap={!slot.booked ? { scale: 0.98 } : undefined}
                    disabled={slot.booked}
                    onClick={() => handleSlotSelect(slot.type)}
                    className={`
                      flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center
                      transition-all duration-200
                      ${
                        slot.booked
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : isSelected
                            ? 'border-brand-400 bg-brand-50 text-brand-700 ring-2 ring-brand-400 ring-offset-1'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50/40'
                      }
                    `}
                  >
                    <Icon size={20} className={slot.booked ? 'text-gray-300' : isSelected ? 'text-brand-600' : 'text-gray-500'} />
                    <span className="text-sm font-medium">{slot.label}</span>
                    <span className="text-[11px] text-gray-400">{slot.time}</span>

                    {slot.booked ? (
                      <span className="badge bg-red-100 text-red-500 text-[10px] mt-0.5">Booked</span>
                    ) : isSelected ? (
                      <span className="badge bg-brand-100 text-brand-700 text-[10px] mt-0.5 flex items-center gap-0.5">
                        <Check size={10} /> Selected
                      </span>
                    ) : (
                      <span className="badge bg-emerald-100 text-emerald-600 text-[10px] mt-0.5">
                        Available
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
