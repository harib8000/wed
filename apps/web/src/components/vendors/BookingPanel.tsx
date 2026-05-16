'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Sun,
  Moon,
  Users,
  Shield,
  CreditCard,
  ChevronDown,
  Sparkles,
  FileText,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SlotType = 'morning' | 'evening' | 'full_day';

export interface BookingPanelProps {
  vendorName: string;
  vendorCategory: string;
  selectedDate: string | null;
  selectedSlot: SlotType | null;
  basePrice: number; // in paise
  onProceed: () => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const EVENT_TYPES = [
  'Wedding',
  'Engagement',
  'Dhoti Ceremony',
  'Saree Function',
  'Birthday',
  'Reception',
  'Housewarming',
  'Baby Shower',
  'Anniversary',
  'Corporate Event',
] as const;

const SLOT_LABELS: Record<SlotType, { label: string; time: string; icon: typeof Sun }> = {
  morning: { label: 'Morning', time: '6 AM – 12 PM', icon: Sun },
  evening: { label: 'Evening', time: '4 PM – 10 PM', icon: Moon },
  full_day: { label: 'Full Day', time: '6 AM – 10 PM', icon: Clock },
};

const PLATFORM_FEE_PERCENT = 5;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BookingPanel({
  vendorName,
  vendorCategory,
  selectedDate,
  selectedSlot,
  basePrice,
  onProceed,
}: BookingPanelProps) {
  const [eventType, setEventType] = useState<string>('');
  const [guestCount, setGuestCount] = useState<string>('');
  const [requirements, setRequirements] = useState('');
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);

  const hasSelection = selectedDate && selectedSlot;

  /* ---- pricing ---- */
  const pricing = useMemo(() => {
    const platformFee = Math.round(basePrice * (PLATFORM_FEE_PERCENT / 100));
    return { base: basePrice, fee: platformFee, total: basePrice + platformFee };
  }, [basePrice]);

  const canProceed = hasSelection && eventType !== '';

  /* ---- slot display ---- */
  const slotInfo = selectedSlot ? SLOT_LABELS[selectedSlot] : null;
  const SlotIcon = slotInfo?.icon ?? Calendar;

  /* ---- animations ---- */
  const panelVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.06, duration: 0.25, ease: 'easeOut' },
    }),
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <motion.div
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      className="card p-6 space-y-5 sticky top-24"
    >
      {/* ---- Header ---- */}
      <div>
        <h3 className="font-semibold text-gray-900 text-lg">Book {vendorName}</h3>
        <p className="text-sm text-gray-500 capitalize">{vendorCategory.replace('_', ' ')}</p>
      </div>

      {/* ---- Selected date & slot ---- */}
      <motion.div custom={0} variants={itemVariants} initial="hidden" animate="visible">
        {hasSelection ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-brand-700 font-medium">
              <Calendar size={16} />
              <span>{selectedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-brand-700">
              <SlotIcon size={16} />
              <span>{slotInfo?.label} — {slotInfo?.time}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-400">
            <Calendar size={20} className="mx-auto mb-1 text-gray-300" />
            Select a date and slot from the calendar
          </div>
        )}
      </motion.div>

      {/* ---- Event type selector ---- */}
      <motion.div custom={1} variants={itemVariants} initial="hidden" animate="visible" className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <Sparkles size={14} className="text-brand-500" />
          Event Type
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
            className="input-field flex items-center justify-between text-left text-sm"
          >
            <span className={eventType ? 'text-gray-900' : 'text-gray-400'}>
              {eventType || 'Select event type'}
            </span>
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform duration-200 ${eventDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {eventDropdownOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
              >
                {EVENT_TYPES.map((ev) => (
                  <li key={ev}>
                    <button
                      type="button"
                      onClick={() => {
                        setEventType(ev);
                        setEventDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                        ${eventType === ev ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}
                      `}
                    >
                      {ev}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ---- Guest count ---- */}
      <motion.div custom={2} variants={itemVariants} initial="hidden" animate="visible" className="space-y-1.5">
        <label htmlFor="guest-count" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <Users size={14} className="text-brand-500" />
          Guest Count
        </label>
        <input
          id="guest-count"
          type="number"
          min={1}
          max={10000}
          placeholder="e.g. 250"
          value={guestCount}
          onChange={(e) => setGuestCount(e.target.value)}
          className="input-field text-sm"
        />
      </motion.div>

      {/* ---- Special requirements ---- */}
      <motion.div custom={3} variants={itemVariants} initial="hidden" animate="visible" className="space-y-1.5">
        <label htmlFor="requirements" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <FileText size={14} className="text-brand-500" />
          Special Requirements
        </label>
        <textarea
          id="requirements"
          rows={3}
          placeholder="Any specific requests or notes for the vendor..."
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          className="input-field text-sm resize-none"
        />
      </motion.div>

      {/* ---- Price summary ---- */}
      <motion.div
        custom={4}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2 text-sm"
      >
        <div className="flex justify-between text-gray-600">
          <span>Base Price</span>
          <span className="font-medium text-gray-800">{formatCurrency(pricing.base)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
          <span className="font-medium text-gray-800">{formatCurrency(pricing.fee)}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-gray-900">
          <span>Total</span>
          <span className="text-brand-700">{formatCurrency(pricing.total)}</span>
        </div>
      </motion.div>

      {/* ---- Proceed button ---- */}
      <motion.button
        whileHover={canProceed ? { scale: 1.01 } : undefined}
        whileTap={canProceed ? { scale: 0.98 } : undefined}
        disabled={!canProceed}
        onClick={onProceed}
        className={`
          w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-sm
          transition-all duration-200 shadow-sm focus-ring
          ${
            canProceed
              ? 'bg-brand-600 hover:bg-brand-700 text-white hover:shadow-md active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        <CreditCard size={18} />
        Proceed to Payment
      </motion.button>

      {/* ---- Escrow badge ---- */}
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
        <Shield size={18} className="text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-emerald-700">Escrow Protection</p>
          <p className="text-[11px] text-emerald-600 leading-relaxed mt-0.5">
            Your payment is held securely in escrow and released to the vendor only after the event
            is completed to your satisfaction.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
