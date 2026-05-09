'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, Star, Lock, Clock, HeadphonesIcon, Award } from 'lucide-react';

const TRUST_FEATURES = [
  { icon: Shield, title: 'Escrow Protection', desc: 'Your advance is held safely. Released to vendor only when you confirm service delivery.', color: 'text-green-600 bg-green-50' },
  { icon: Star, title: 'Verified Reviews', desc: 'All reviews are from real verified bookings. No fake reviews allowed.', color: 'text-gold-600 bg-gold-50' },
  { icon: Lock, title: 'Secure Payments', desc: 'Razorpay-powered payments with bank-grade 256-bit encryption.', color: 'text-blue-600 bg-blue-50' },
  { icon: Clock, title: 'Real-time Support', desc: '24/7 customer support via chat, call, or WhatsApp during your wedding.', color: 'text-purple-600 bg-purple-50' },
  { icon: Award, title: 'KYC Verified Vendors', desc: 'Every vendor is KYC verified with valid business registration and credentials.', color: 'text-brand-600 bg-brand-50' },
  { icon: HeadphonesIcon, title: 'Dispute Resolution', desc: 'Dedicated dispute team resolves any issues within 48 hours.', color: 'text-red-600 bg-red-50' },
];

const STATS = [
  { target: 50000, suffix: '+', prefix: '', label: 'Weddings Planned', format: true },
  { target: 500, suffix: ' Cr+', prefix: '₹', label: 'Bookings Processed', format: false },
  { target: 10000, suffix: '+', prefix: '', label: 'Verified Vendors', format: true },
  { target: 4.9, suffix: '/5', prefix: '', label: 'Average Rating', format: false },
];

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) animate(); },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  return { ref, count };
}

function formatNumber(n: number, shouldFormat: boolean) {
  if (shouldFormat) return Math.round(n).toLocaleString('en-IN');
  if (n % 1 !== 0) return n.toFixed(1);
  return Math.round(n).toString();
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

function StatItem({ stat }: { stat: typeof STATS[number] }) {
  const { ref, count } = useCountUp(stat.target);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl font-bold font-heading text-brand-600 mb-1">
        {stat.prefix}{formatNumber(count, stat.format)}{stat.suffix}
      </div>
      <div className="text-gray-500 text-sm">{stat.label}</div>
    </div>
  );
}

export function TrustSection() {
  const gridRef = useRef(null);
  const isInView = useInView(gridRef, { once: true, margin: '-50px' });

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-brand-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="badge bg-green-100 text-green-700 mb-3">Why Trust Us</span>
          <h2 className="section-heading mb-4">Built on Trust & Safety</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Every feature in Wedding OS is designed to protect couples and ensure vendor accountability.
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRUST_FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={cardVariants}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Stats with count-up animation */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <StatItem key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
