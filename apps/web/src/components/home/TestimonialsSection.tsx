'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 1, name: 'Priya & Rahul', city: 'Hyderabad', date: 'March 2026',
    rating: 5, avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    text: 'Wedding OS transformed our chaotic wedding planning into a smooth, enjoyable experience. Found all our vendors through the platform — photography, catering, venue — all under one roof. The escrow payment feature gave us so much peace of mind.',
    vendors: ['Royal Grand Palace', 'Srikanth Photography', 'Flavours Catering'],
  },
  {
    id: 2, name: 'Ananya & Vikram', city: 'Bangalore', date: 'January 2026',
    rating: 5, avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    text: 'The real-time coordination dashboard on our wedding day was incredible. We could see every vendor checking in, tasks being completed. When one vendor was late, the platform alerted us immediately and we resolved it in minutes.',
    vendors: ['Decor by Blooms', 'DJ Beats', 'Shika Makeup'],
  },
  {
    id: 3, name: 'Meera & Aditya', city: 'Mumbai', date: 'February 2026',
    rating: 5, avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    text: 'Booked 12 vendors through Wedding OS for our 3-day wedding. Every single vendor was professional, arrived on time, and delivered exactly what was promised. The milestone payment system kept everyone accountable.',
    vendors: ['5 Photographers', '3 Venues', '4 Service Vendors'],
  },
  {
    id: 4, name: 'Kavitha & Arjun', city: 'Chennai', date: 'December 2025',
    rating: 5, avatar: 'https://randomuser.me/api/portraits/women/55.jpg',
    text: 'We were planning a traditional Tamil wedding with over 800 guests and honestly dreading the logistics. Wedding OS matched us with vendors who understood our customs perfectly. The budget tracker alone saved us nearly two lakhs by catching duplicate charges early.',
    vendors: ['Kalyana Mandapam', 'Chennai Caterers', 'Velu Nadaswaram'],
  },
  {
    id: 5, name: 'Sneha & Kunal', city: 'Delhi', date: 'November 2025',
    rating: 5, avatar: 'https://randomuser.me/api/portraits/women/21.jpg',
    text: 'Our destination wedding in Jaipur had vendors from three different cities. The coordination could have been a nightmare, but Wedding OS kept everyone on the same timeline. The chat feature let us resolve last-minute changes with all vendors at once.',
    vendors: ['Rajwada Palace', 'Lens Story Photography', 'Saffron Events'],
  },
  {
    id: 6, name: 'Deepika & Siddharth', city: 'Pune', date: 'April 2026',
    rating: 5, avatar: 'https://randomuser.me/api/portraits/women/75.jpg',
    text: 'As a couple who both work long hours, we barely had time to plan. Wedding OS made it feel effortless — from shortlisting vendors to comparing packages side-by-side. Our mehendi, sangeet, and reception were all flawless thanks to the milestone tracking.',
    vendors: ['Bloom Decorators', 'DJ Varun', 'Glamour Makeovers', 'Spice Route Catering'],
  },
];

const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD = 50;

function useCarousel(total: number, visibleCount: number) {
  const maxIndex = Math.max(0, total - visibleCount);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (n: number) => setIndex(Math.max(0, Math.min(n, maxIndex))),
    [maxIndex],
  );
  const next = useCallback(() => setIndex((i) => (i >= maxIndex ? 0 : i + 1)), [maxIndex]);
  const prev = useCallback(() => setIndex((i) => (i <= 0 ? maxIndex : i - 1)), [maxIndex]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, AUTOPLAY_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused]);

  return { index, goTo, next, prev, maxIndex, pause: () => setPaused(true), resume: () => setPaused(false) };
}

function useSwipe(onLeft: () => void, onRight: () => void) {
  const startX = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const delta = e.changedTouches[0].clientX - startX.current;
      if (Math.abs(delta) > SWIPE_THRESHOLD) {
        delta < 0 ? onLeft() : onRight();
      }
    },
    [onLeft, onRight],
  );

  return { onTouchStart, onTouchEnd };
}

function useVisibleCount() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const update = () => setCount(window.innerWidth >= 768 ? 3 : 1);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return count;
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: 'easeOut' },
  }),
};

function TestimonialCard({ t, custom }: { t: (typeof TESTIMONIALS)[number]; custom: number }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      custom={custom}
      className="flex-shrink-0 w-full md:w-[calc(33.333%-1rem)]"
    >
      <div className="card p-6 h-full flex flex-col relative rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300">
        <Quote size={32} className="text-brand-100 absolute top-4 right-4 opacity-40" />

        <div className="flex items-center gap-3 mb-4">
          <img
            src={t.avatar}
            alt={t.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-100"
          />
          <div>
            <div className="font-semibold text-gray-900">{t.name}</div>
            <div className="text-sm text-gray-500">{t.city} · {t.date}</div>
          </div>
        </div>

        <div className="flex gap-0.5 mb-3">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} size={14} className="fill-gold-400 text-gold-400" />
          ))}
        </div>

        <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
          &ldquo;{t.text}&rdquo;
        </p>

        <div className="border-t border-gray-100 pt-3 mt-auto">
          <span className="text-xs text-gray-400">Vendors booked: </span>
          <span className="text-xs text-brand-600 font-medium">{t.vendors.join(', ')}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function TestimonialsSection() {
  const visibleCount = useVisibleCount();
  const { index, goTo, next, prev, maxIndex, pause, resume } = useCarousel(
    TESTIMONIALS.length,
    visibleCount,
  );
  const swipeHandlers = useSwipe(next, prev);

  const dotCount = maxIndex + 1;

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="badge bg-pink-100 text-pink-700 mb-3 inline-block">Testimonials</span>
          <h2 className="section-heading mb-4">Couples Love Wedding OS</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Real stories from real couples who planned their dream wedding with us.
          </p>
        </motion.div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={pause}
          onMouseLeave={resume}
          {...swipeHandlers}
        >
          {/* Arrow buttons */}
          <button
            onClick={prev}
            aria-label="Previous testimonial"
            className="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-brand-600 hover:border-brand-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={next}
            aria-label="Next testimonial"
            className="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-brand-600 hover:border-brand-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <ChevronRight size={20} />
          </button>

          {/* Track */}
          <div className="overflow-hidden mx-6 md:mx-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index}
                className="flex gap-6"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                {TESTIMONIALS.slice(index, index + visibleCount).map((t, i) => (
                  <TestimonialCard key={t.id} t={t} custom={i} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center gap-2 mt-8" role="tablist" aria-label="Testimonial pages">
          {Array.from({ length: dotCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to testimonial page ${i + 1}`}
              className={`rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                i === index
                  ? 'w-8 h-2.5 bg-brand-600'
                  : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
