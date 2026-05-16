'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, CalendarCheck, PartyPopper, Sparkles, Home } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

// ─── CSS keyframe animations (injected via style tag) ─────────
const confettiStyles = `
@keyframes confetti-fall {
  0%   { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
@keyframes confetti-sway {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(15px); }
  75%      { transform: translateX(-15px); }
}
@keyframes checkmark-pop {
  0%   { transform: scale(0); opacity: 0; }
  50%  { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes pulse-ring {
  0%   { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2.2); opacity: 0; }
}
`;

const EMOJIS = ['🎉', '💐', '🎊', '✨', '💍', '🥂', '🎶', '❤️', '🌸', '🪷', '💒', '🎀'];

function ConfettiPiece({ index }: { index: number }) {
  const emoji = EMOJIS[index % EMOJIS.length];
  const left = `${(index * 17 + 5) % 95}%`;
  const delay = `${(index * 0.3) % 3}s`;
  const duration = `${3 + (index % 3)}s`;
  const size = 18 + (index % 3) * 6;

  return (
    <span
      className="fixed pointer-events-none select-none"
      style={{
        left,
        top: '-40px',
        fontSize: `${size}px`,
        animation: `confetti-fall ${duration} ${delay} ease-in forwards, confetti-sway 2s ${delay} ease-in-out infinite`,
        zIndex: 50,
      }}
    >
      {emoji}
    </span>
  );
}

const TIMELINE_STEPS = [
  { step: 1, title: 'Vendor Confirms', desc: 'Your vendor will review and accept the booking', icon: '📋' },
  { step: 2, title: 'Prepare Together', desc: 'Finalize details, schedule meetings, and plan', icon: '🤝' },
  { step: 3, title: 'Wedding Day!', desc: 'Enjoy your perfect celebration 🎉', icon: '💒' },
];

function formatAmount(paise: string | null) {
  if (!paise) return '—';
  const num = parseInt(paise, 10);
  if (isNaN(num)) return paise;
  return `₹${(num / 100).toLocaleString('en-IN')}`;
}

function CheckoutSuccessPageInner() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const vendorName = searchParams.get('vendorName');
  const amount = searchParams.get('amount');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: confettiStyles }} />
      <Navbar />

      {/* Emoji confetti */}
      {Array.from({ length: 14 }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}

      <main className="min-h-screen bg-gradient-to-b from-green-50 via-white to-purple-50 pt-16 pb-24">
        <div className="max-w-lg mx-auto px-4 py-10 text-center">

          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
            className="relative mx-auto mb-6 w-24 h-24"
          >
            {/* Pulse ring */}
            <span
              className="absolute inset-0 rounded-full bg-green-400"
              style={{ animation: 'pulse-ring 1.5s ease-out infinite' }}
            />
            <div className="relative w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
              <Check className="w-12 h-12 text-white" strokeWidth={3} style={{ animation: 'checkmark-pop 0.6s 0.5s both' }} />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
          >
            Booking Confirmed! 🎉
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="text-gray-500 mb-8"
          >
            Your dream wedding just got one step closer
          </motion.p>

          {/* Booking details card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <PartyPopper className="w-5 h-5 text-purple-500" />
              <h2 className="font-semibold text-gray-900">Booking Details</h2>
            </div>
            <div className="space-y-3">
              {bookingId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Booking ID</span>
                  <span className="font-mono font-medium text-gray-900">{bookingId}</span>
                </div>
              )}
              {vendorName && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Vendor</span>
                  <span className="font-medium text-gray-900">{decodeURIComponent(vendorName)}</span>
                </div>
              )}
              {amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Advance Paid</span>
                  <span className="font-bold text-green-600">{formatAmount(amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                  <Sparkles className="w-3 h-3" /> Confirmed
                </span>
              </div>
            </div>
          </motion.div>

          {/* Next steps timeline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left mb-8"
          >
            <div className="flex items-center gap-2 mb-5">
              <CalendarCheck className="w-5 h-5 text-brand-500" />
              <h2 className="font-semibold text-gray-900">What Happens Next</h2>
            </div>
            <div className="space-y-0">
              {TIMELINE_STEPS.map((item, idx) => (
                <div key={item.step} className="flex gap-4">
                  {/* Vertical connector */}
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-lg flex-shrink-0">
                      {item.icon}
                    </div>
                    {idx < TIMELINE_STEPS.length - 1 && (
                      <div className="w-0.5 flex-1 bg-brand-200 my-1" />
                    )}
                  </div>
                  <div className="pb-5">
                    <p className="font-semibold text-gray-900 text-sm">
                      Step {item.step}: {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="space-y-3"
          >
            {bookingId && (
              <Link
                href={`/bookings/${bookingId}`}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition shadow-lg shadow-brand-200"
              >
                <CalendarCheck className="w-4 h-4" />
                View Booking
              </Link>
            )}
            <Link
              href="/"
              className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-3.5 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </motion.div>
        </div>
      </main>
    </>
  );
}

export default function CheckoutSuccessPage() {
  return <Suspense><CheckoutSuccessPageInner /></Suspense>;
}
