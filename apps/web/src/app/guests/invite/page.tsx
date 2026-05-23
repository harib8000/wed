'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MapPin,
  Calendar,
  Clock,
  Users,
  UtensilsCrossed,
  Send,
  CheckCircle2,
  QrCode,
  ExternalLink,
  Sparkles,
  Music,
} from 'lucide-react';

// Local type definitions (matches @wedding-os/shared-types)
type RsvpStatus = 'pending' | 'accepted' | 'declined' | 'maybe';
type MealPreference = 'veg' | 'non_veg' | 'jain' | 'vegan' | 'no_preference';

/* ------------------------------------------------------------------ */
/*  Event Info (mock)                                                   */
/* ------------------------------------------------------------------ */

const EVENT = {
  coupleName: 'Aisha & Rohan',
  tagline: 'Together is a wonderful place to be',
  date: 'Saturday, 15th March 2025',
  venue: 'The Grand Pavilion',
  address: 'Plot 42, Jubilee Hills, Hyderabad, Telangana 500033',
  mapUrl: 'https://maps.google.com/?q=17.4315,78.4098',
  schedule: [
    { time: '4:00 PM', event: 'Baraat & Welcome Ceremony', icon: Music },
    { time: '5:30 PM', event: 'Wedding Ceremony (Pheras)', icon: Heart },
    { time: '7:00 PM', event: 'Cocktails & Reception', icon: Sparkles },
    { time: '8:30 PM', event: 'Dinner & Celebrations', icon: UtensilsCrossed },
  ],
};

const MEAL_OPTIONS: { value: MealPreference; label: string; emoji: string }[] = [
  { value: 'veg', label: 'Vegetarian', emoji: '🥬' },
  { value: 'non_veg', label: 'Non-Vegetarian', emoji: '🍗' },
  { value: 'jain', label: 'Jain', emoji: '🙏' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'no_preference', label: 'No Preference', emoji: '🍽️' },
];

const RSVP_OPTIONS: { value: RsvpStatus; label: string; desc: string }[] = [
  { value: 'accepted', label: 'Joyfully Accept', desc: 'I/we will attend' },
  { value: 'declined', label: 'Respectfully Decline', desc: 'Unable to attend' },
  { value: 'maybe', label: 'Not Sure Yet', desc: 'Will confirm later' },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function InvitePage() {
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus | null>(null);
  const [mealPref, setMealPref] = useState<MealPreference>('no_preference');
  const [plusOnes, setPlusOnes] = useState(0);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showQR, setShowQR] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rsvpStatus) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 12 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-200"
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-4">
            {rsvpStatus === 'accepted'
              ? "We're thrilled you'll be joining us! 🎉"
              : rsvpStatus === 'declined'
                ? "We'll miss you! Thank you for letting us know. 💕"
                : 'No worries! We hope to see you there. 💫'}
          </p>

          {rsvpStatus === 'accepted' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl border border-rose-100 p-5 mt-6 text-left space-y-3"
            >
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-500" />
                Event Details
              </h3>
              <p className="text-sm text-gray-600">{EVENT.date}</p>
              <p className="text-sm text-gray-600">{EVENT.venue}</p>
              <a
                href={EVENT.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 font-medium"
              >
                <MapPin className="w-4 h-4" />
                Get Directions
                <ExternalLink className="w-3 h-3" />
              </a>
            </motion.div>
          )}

          <button
            onClick={() => {
              setSubmitted(false);
              setRsvpStatus(null);
              setMealPref('no_preference');
              setPlusOnes(0);
              setMessage('');
            }}
            className="mt-6 text-sm text-rose-500 hover:text-rose-600 font-medium"
          >
            Edit Response
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-amber-50/30">
      {/* ---- Decorative Top ---- */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-100/80 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-rose-300/60 to-transparent" />

        <motion.div {...fadeIn} transition={{ duration: 0.6 }} className="relative pt-16 pb-10 px-4 text-center">
          {/* Ornament */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', damping: 15 }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-200"
          >
            <Heart className="w-8 h-8 text-white" fill="white" />
          </motion.div>

          <p className="text-rose-400 text-xs tracking-[0.3em] uppercase font-medium mb-3">
            You are cordially invited to
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 font-serif">
            {EVENT.coupleName}
          </h1>
          <p className="text-gray-500 italic text-sm">&ldquo;{EVENT.tagline}&rdquo;</p>

          {/* Date & Venue */}
          <div className="flex flex-col items-center gap-2 mt-6">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="w-4 h-4 text-rose-500" />
              {EVENT.date}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-rose-500" />
              {EVENT.venue}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ---- Schedule ---- */}
      <motion.section
        {...fadeIn}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="max-w-md mx-auto px-4 mb-8"
      >
        <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-rose-500" />
          Event Schedule
        </h2>
        <div className="space-y-0">
          {EVENT.schedule.map((item, i) => (
            <motion.div
              key={item.event}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-start gap-3 relative"
            >
              {/* Timeline line */}
              {i < EVENT.schedule.length - 1 && (
                <div className="absolute left-[18px] top-9 w-px h-[calc(100%-12px)] bg-rose-100" />
              )}
              <div className="w-9 h-9 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center shrink-0 z-10">
                <item.icon className="w-4 h-4 text-rose-500" />
              </div>
              <div className="pb-5">
                <p className="text-xs font-medium text-rose-500">{item.time}</p>
                <p className="text-sm text-gray-800 font-medium">{item.event}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ---- RSVP Form ---- */}
      <motion.section
        {...fadeIn}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="max-w-md mx-auto px-4 pb-12"
      >
        <div className="bg-white rounded-2xl border border-rose-100 shadow-lg shadow-rose-100/40 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">RSVP</h2>
          <p className="text-xs text-gray-500 text-center mb-6">
            Kindly respond by 1st March 2025
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Attendance */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Will you attend?</label>
              <div className="grid gap-2">
                {RSVP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRsvpStatus(opt.value)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      rsvpStatus === opt.value
                        ? 'border-rose-400 bg-rose-50 ring-1 ring-rose-200'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        rsvpStatus === opt.value ? 'border-rose-500 bg-rose-500' : 'border-gray-300'
                      }`}
                    >
                      {rsvpStatus === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${rsvpStatus === opt.value ? 'text-rose-700' : 'text-gray-800'}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional fields when accepted */}
            <AnimatePresence>
              {rsvpStatus === 'accepted' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5 overflow-hidden"
                >
                  {/* Meal Preference */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                      <UtensilsCrossed className="w-4 h-4 text-rose-400" />
                      Meal Preference
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {MEAL_OPTIONS.map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setMealPref(m.value)}
                          className={`px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
                            mealPref === m.value
                              ? 'border-rose-400 bg-rose-50 text-rose-700 font-medium'
                              : 'border-gray-100 text-gray-700 hover:border-gray-200'
                          }`}
                        >
                          <span className="mr-1.5">{m.emoji}</span>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Plus-Ones */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                      <Users className="w-4 h-4 text-rose-400" />
                      Additional Guests
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPlusOnes(Math.max(0, plusOnes - 1))}
                        className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg text-gray-600 hover:bg-gray-50 transition"
                      >
                        −
                      </button>
                      <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                        {plusOnes}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPlusOnes(Math.min(5, plusOnes + 1))}
                        className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg text-gray-600 hover:bg-gray-50 transition"
                      >
                        +
                      </button>
                      <span className="text-xs text-gray-400">
                        {plusOnes === 0 ? 'Just me' : `+${plusOnes} guest${plusOnes > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Leave a Message <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Congratulations and best wishes…"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!rsvpStatus}
              className={`w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                rsvpStatus
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-pink-600 active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              Send Response
            </button>
          </form>
        </div>

        {/* QR Code Section */}
        <motion.div {...fadeIn} transition={{ delay: 0.5 }} className="mt-6 text-center">
          <button
            onClick={() => setShowQR(!showQR)}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-rose-500 transition"
          >
            <QrCode className="w-4 h-4" />
            {showQR ? 'Hide' : 'Show'} Event QR Code
          </button>
          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <div className="w-40 h-40 mx-auto bg-white border-2 border-dashed border-rose-200 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="w-12 h-12 text-rose-300 mx-auto mb-2" />
                    <p className="text-[10px] text-gray-400">QR Code</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Directions */}
        <motion.div {...fadeIn} transition={{ delay: 0.55 }} className="mt-6">
          <a
            href={EVENT.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{EVENT.venue}</p>
                <p className="text-xs text-gray-500">{EVENT.address}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-rose-500 transition-colors" />
          </a>
        </motion.div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-8 pb-4">
          Made with <Heart className="inline w-3 h-3 text-rose-400" fill="currentColor" /> using WeddingOS
        </p>
      </motion.section>
    </div>
  );
}
