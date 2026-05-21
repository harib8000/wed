'use client';
import { useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, ArrowLeft, Camera, Upload, X, Check, Send, CheckCircle2, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { bookingApi, reviewApi } from '@/lib/api';
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

interface PhotoPreview {
  id: string;
  file: File;
  url: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const QUICK_TAGS = [
  'Great Service',
  'On Time',
  'Value for Money',
  'Professional',
  'Friendly Staff',
  'Amazing Quality',
  'Beautiful Setup',
  'Delicious Food',
  'Would Recommend',
  'Above Expectations',
];

const MAX_PHOTOS = 5;
const MIN_REVIEW_CHARS = 20;
const MAX_REVIEW_CHARS = 1000;
const DEFAULT_ANIMATION_HEIGHT = 900;

/* ------------------------------------------------------------------ */
/*  Mock booking for fallback                                          */
/* ------------------------------------------------------------------ */

const MOCK_BOOKINGS: Record<string, { vendorId: string; vendorName: string; vendorCategory: string; eventDate: string; eventCity: string; packageName: string }> = {
  b1: { vendorId: 'v1', vendorName: 'Royal Grand Palace', vendorCategory: 'Venue', eventDate: '2025-03-15', eventCity: 'Hyderabad', packageName: 'Grand Wedding Package' },
  b2: { vendorId: 'v2', vendorName: 'Srikanth Photography', vendorCategory: 'Photography', eventDate: '2025-03-15', eventCity: 'Hyderabad', packageName: 'Premium Coverage' },
  b3: { vendorId: 'v3', vendorName: 'Flavours Catering Co.', vendorCategory: 'Catering', eventDate: '2025-03-15', eventCity: 'Hyderabad', packageName: 'Royal Feast — 500 guests' },
  b4: { vendorId: 'v4', vendorName: 'Blooms & Dreams Decor', vendorCategory: 'Decor', eventDate: '2025-03-14', eventCity: 'Hyderabad', packageName: 'Floral Paradise' },
};

/* ------------------------------------------------------------------ */
/*  Star Rating Component                                              */
/* ------------------------------------------------------------------ */

function StarRating({ value, onChange, size = 32 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  const display = hover || value;

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="transition-transform hover:scale-110 focus:outline-none"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              className={`transition-colors duration-150 ${
                star <= display
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-gray-200 text-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {display > 0 && (
          <motion.span
            key={display}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm font-medium text-amber-600 min-w-[70px]"
          >
            {ratingLabels[display]}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Confetti Burst (CSS-only lightweight confetti)                     */
/* ------------------------------------------------------------------ */

function ConfettiBurst() {
  const pieces = Array.from({ length: 40 });
  const colors = ['#a855f7', '#f59e0b', '#ec4899', '#10b981', '#3b82f6', '#f97316'];

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((_, i) => {
        const color = colors[i % colors.length];
        const left = `${Math.random() * 100}%`;
        const delay = `${Math.random() * 0.5}s`;
        const duration = `${1.5 + Math.random() * 1.5}s`;
        const size = 6 + Math.random() * 6;
        const rotation = Math.random() * 360;

        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
            animate={{
              y: typeof window !== 'undefined' ? window.innerHeight + 50 : DEFAULT_ANIMATION_HEIGHT,
              x: (Math.random() - 0.5) * 300,
              opacity: 0,
              rotate: rotation + 360,
            }}
            transition={{ duration: parseFloat(duration), delay: parseFloat(delay), ease: 'easeIn' }}
            style={{
              position: 'absolute',
              left,
              top: -10,
              width: size,
              height: size * (Math.random() > 0.5 ? 1 : 2.5),
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        );
      })}
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [overallRating, setOverallRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [subRatings, setSubRatings] = useState<SubRating[]>([
    { key: 'qualityRating', label: 'Quality of Service', emoji: '✨', value: 0 },
    { key: 'valueRating', label: 'Value for Money', emoji: '💰', value: 0 },
    { key: 'professionalismRating', label: 'Professionalism', emoji: '🤝', value: 0 },
    { key: 'punctualityRating', label: 'Punctuality', emoji: '⏰', value: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking-for-review', bookingId],
    queryFn: async () => {
      try {
        const res = await bookingApi.getById(bookingId);
        const data = res.data?.data ?? res.data;
        if (data) {
          return {
            vendorId: data.vendorId || bookingId,
            vendorName: data.vendorName || data.vendor?.businessName || data.vendor?.name || 'Wedding Vendor',
            vendorCategory: data.vendorCategory || data.vendor?.category || 'Service',
            eventDate: data.eventDate || data.date || new Date().toISOString().slice(0, 10),
            eventCity: data.eventCity || data.vendor?.city || 'Your City',
            packageName: data.packageName || data.package?.name || 'Wedding Package',
          };
        }
        throw new Error('No data');
      } catch {
        return MOCK_BOOKINGS[bookingId] ?? {
          vendorId: bookingId,
          vendorName: 'Wedding Vendor',
          vendorCategory: 'Service',
          eventDate: new Date().toISOString().slice(0, 10),
          eventCity: 'Your City',
          packageName: 'Wedding Package',
        };
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  const updateSubRating = useCallback((key: string, value: number) => {
    setSubRatings((prev) => prev.map((r) => (r.key === key ? { ...r, value } : r)));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  /* ── Photo handling ─────────────────────────────────────────────── */

  const addPhotos = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter((f) => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast.error('Please select image files only');
      return;
    }

    setPhotos((prev) => {
      const remaining = MAX_PHOTOS - prev.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
        return prev;
      }
      const toAdd = imageFiles.slice(0, remaining);
      if (imageFiles.length > remaining) {
        toast.error(`Only ${remaining} more photo${remaining > 1 ? 's' : ''} can be added`);
      }
      const newPreviews: PhotoPreview[] = toAdd.map((file) => ({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        url: URL.createObjectURL(file),
      }));
      return [...prev, ...newPreviews];
    });
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) {
        // Delay revocation so the DOM update completes before the blob URL is invalidated
        setTimeout(() => URL.revokeObjectURL(photo.url), 100);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) addPhotos(e.dataTransfer.files);
    },
    [addPhotos],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addPhotos(e.target.files);
        e.target.value = '';
      }
    },
    [addPhotos],
  );

  /* ── Submit ─────────────────────────────────────────────────────── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (overallRating === 0) {
      toast.error('Please select an overall rating');
      return;
    }
    const trimmedBody = body.trim();
    if (!trimmedBody || trimmedBody.length < MIN_REVIEW_CHARS) {
      toast.error(`Please write at least ${MIN_REVIEW_CHARS} characters in your review`);
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
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      };
      subRatings.forEach((r) => {
        if (r.value > 0) payload[r.key] = r.value;
      });

      await reviewApi.create(payload);
      setSubmitted(true);
      toast.success('Review submitted! Thank you 🎉');
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
      if (error?.response?.status === 409) {
        toast.error('You have already reviewed this booking');
      } else if (!error?.response) {
        setSubmitted(true);
        toast.success('Review saved locally! (Demo mode) 🎉');
      } else {
        const msg = error?.response?.data?.error?.message ?? 'Failed to submit review';
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const bodyLength = body.trim().length;
  const isBodyValid = bodyLength >= MIN_REVIEW_CHARS;

  /* ── Loading state ─────────────────────────────────────────────── */
  if (bookingLoading || !booking) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white pt-20">
          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Loading booking details…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  /* ── Success state ──────────────────────────────────────────────── */
  if (submitted) {
    return (
      <>
        <Navbar />
        <ConfettiBurst />
        <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto px-4 py-16 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-3"
            >
              🎉 Thank You!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-2"
            >
              Your review for <strong>{booking.vendorName}</strong> has been submitted.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-gray-500 mb-8"
            >
              Your feedback helps other couples make informed decisions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center gap-2 mb-4"
            >
              {[...Array(overallRating)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.7 + i * 0.1, type: 'spring' }}
                >
                  <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
                </motion.div>
              ))}
            </motion.div>

            {selectedTags.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap justify-center gap-2 mb-8"
              >
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col gap-3 sm:flex-row sm:justify-center"
            >
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
            </motion.div>
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

          {/* Header — vendor info + booking details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-7 h-7 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                  {booking.vendorCategory}
                </span>
                <h1 className="text-xl font-bold text-gray-900 mt-0.5 truncate">
                  {booking.vendorName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-gray-500">
                  <span>📍 {booking.eventCity}</span>
                  <span>📅 {new Date(booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>📦 {booking.packageName}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Overall Rating */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <label className="block text-sm font-semibold text-gray-800 mb-4">
                Overall Rating <span className="text-red-500">*</span>
              </label>
              <StarRating value={overallRating} onChange={setOverallRating} size={36} />
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

            {/* Quick Tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Quick Tags
              </label>
              <p className="text-xs text-gray-400 mb-3">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                      {tag}
                    </button>
                  );
                })}
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
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <label htmlFor="body" className="block text-sm font-semibold text-gray-800 mb-2">
                Your Review <span className="text-red-500">*</span>
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_REVIEW_CHARS) setBody(e.target.value);
                }}
                placeholder="Share your experience — what went well? What could be improved? Would you recommend this vendor?"
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-800 placeholder-gray-400 resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <p className={`text-xs ${bodyLength > 0 && !isBodyValid ? 'text-red-400' : 'text-gray-400'}`}>
                  {bodyLength > 0 && !isBodyValid && `Minimum ${MIN_REVIEW_CHARS} characters required`}
                </p>
                <p className={`text-xs ${bodyLength > MAX_REVIEW_CHARS * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {bodyLength}/{MAX_REVIEW_CHARS}
                </p>
              </div>
            </motion.div>

            {/* Photo Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Photos
              </label>
              <p className="text-xs text-gray-400 mb-4">Add up to {MAX_PHOTOS} photos of your experience</p>

              {/* Thumbnails */}
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {photos.map((photo, index) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={`Review photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                        aria-label="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Drop zone */}
              {photos.length < MAX_PHOTOS && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    {dragOver ? (
                      <Upload className="w-8 h-8 text-purple-500" />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                    <p className="text-sm text-gray-500">
                      <span className="text-purple-600 font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, WEBP · {photos.length}/{MAX_PHOTOS} photos
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <button
                type="submit"
                disabled={submitting || overallRating === 0 || !isBodyValid}
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
