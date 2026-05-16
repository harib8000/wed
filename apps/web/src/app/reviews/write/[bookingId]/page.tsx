'use client';
import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, ArrowLeft, Camera, Send, CheckCircle2, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/authStore';
import { reviewApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SubRating {
  key: string;
  label: string;
  emoji: string;
  value: number;
}

/* ------------------------------------------------------------------ */
/*  Mock booking for fallback                                          */
/* ------------------------------------------------------------------ */

const MOCK_BOOKINGS: Record<string, { vendorId: string; vendorName: string; vendorCategory: string; eventDate: string; eventCity: string }> = {
  b1: { vendorId: 'v1', vendorName: 'Royal Grand Palace', vendorCategory: 'Venue', eventDate: '2025-03-15', eventCity: 'Hyderabad' },
  b2: { vendorId: 'v2', vendorName: 'Srikanth Photography', vendorCategory: 'Photography', eventDate: '2025-03-15', eventCity: 'Hyderabad' },
  b3: { vendorId: 'v3', vendorName: 'Flavours Catering Co.', vendorCategory: 'Catering', eventDate: '2025-03-15', eventCity: 'Hyderabad' },
  b4: { vendorId: 'v4', vendorName: 'Blooms & Dreams Decor', vendorCategory: 'Decor', eventDate: '2025-03-14', eventCity: 'Hyderabad' },
};

/* ------------------------------------------------------------------ */
/*  Star Rating Component                                              */
/* ------------------------------------------------------------------ */

function StarRating({ value, onChange, size = 32 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="transition-transform hover:scale-110 focus:outline-none"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
        >
          <Star
            size={size}
            className={`transition-colors ${
              star <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function WriteReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  // Form state
  const [overallRating, setOverallRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subRatings, setSubRatings] = useState<SubRating[]>([
    { key: 'qualityRating', label: 'Quality of Service', emoji: '✨', value: 0 },
    { key: 'valueRating', label: 'Value for Money', emoji: '💰', value: 0 },
    { key: 'professionalismRating', label: 'Professionalism', emoji: '🤝', value: 0 },
    { key: 'punctualityRating', label: 'Punctuality', emoji: '⏰', value: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const booking = MOCK_BOOKINGS[bookingId] ?? {
    vendorId: bookingId,
    vendorName: 'Wedding Vendor',
    vendorCategory: 'Service',
    eventDate: new Date().toISOString().slice(0, 10),
    eventCity: 'Your City',
  };

  const updateSubRating = useCallback((key: string, value: number) => {
    setSubRatings((prev) => prev.map((r) => (r.key === key ? { ...r, value } : r)));
  }, []);

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (overallRating === 0) {
      toast.error('Please select an overall rating');
      return;
    }
    const trimmedBody = body.trim();
    if (!trimmedBody || trimmedBody.length < 10) {
      toast.error('Please write at least 10 characters in your review');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        bookingId,
        vendorId: booking.vendorId,
        rating: overallRating,
        title: title.trim() || undefined,
        body: trimmedBody,
      };
      subRatings.forEach((r) => {
        if (r.value > 0) payload[r.key] = r.value;
      });

      await reviewApi.create(payload);
      setSubmitted(true);
      toast.success('Review submitted! Thank you 🎉');
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? 'Failed to submit review';
      if (err?.response?.status === 409) {
        toast.error('You have already reviewed this booking');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success state ──────────────────────────────────────────────── */
  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto px-4 py-16 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Thank You!</h1>
            <p className="text-gray-600 mb-2">
              Your review for <strong>{booking.vendorName}</strong> has been submitted.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Your feedback helps other couples make informed decisions.
            </p>

            <div className="flex justify-center gap-2 mb-8">
              {[...Array(overallRating)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => router.push('/bookings')}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
              >
                Back to Bookings
              </button>
              <button
                onClick={() => router.push(`/vendors/${booking.vendorId}`)}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                View Vendor
              </button>
            </div>
          </motion.div>
        </main>
        <Footer />
      </>
    );
  }

  /* ── Review form ────────────────────────────────────────────────── */
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white pt-20 pb-32">
        <div className="max-w-2xl mx-auto px-4">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">{booking.vendorCategory}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Review {booking.vendorName}
            </h1>
            <p className="text-gray-500 text-sm">
              {booking.eventCity} · {new Date(booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Overall Rating */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <label className="block text-sm font-semibold text-gray-800 mb-4">
                Overall Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <StarRating value={overallRating} onChange={setOverallRating} size={36} />
                <AnimatePresence mode="wait">
                  {overallRating > 0 && (
                    <motion.span
                      key={overallRating}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium text-amber-600"
                    >
                      {ratingLabels[overallRating]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Sub-ratings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <label className="block text-sm font-semibold text-gray-800 mb-4">
                Rate Specific Areas
              </label>
              <div className="space-y-4">
                {subRatings.map((sub) => (
                  <div key={sub.key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span>{sub.emoji}</span> {sub.label}
                    </span>
                    <StarRating
                      value={sub.value}
                      onChange={(v) => updateSubRating(sub.key, v)}
                      size={22}
                    />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <label htmlFor="title" className="block text-sm font-semibold text-gray-800 mb-2">
                Review Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience in a few words"
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-800 placeholder-gray-400"
              />
            </motion.div>

            {/* Body */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <label htmlFor="body" className="block text-sm font-semibold text-gray-800 mb-2">
                Your Review <span className="text-red-500">*</span>
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share your experience — what went well? What could be improved? Would you recommend this vendor?"
                rows={5}
                maxLength={2000}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-800 placeholder-gray-400 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {body.length}/2000
              </p>
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                type="submit"
                disabled={submitting || overallRating === 0}
                className="w-full py-4 bg-purple-600 text-white rounded-xl font-semibold text-base hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Review
                  </>
                )}
              </button>
            </motion.div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
