'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, ArrowRight, Star, Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = ['Venue', 'Photography', 'Catering', 'Decor', 'Makeup', 'Music', 'Mehendi', 'Videography'];

export function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  // Parallax scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        if (rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (city) params.set('city', city);
    router.push(`/vendors?${params.toString()}`);
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with parallax */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-purple-900 to-brand-800" />
      <div
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80')] bg-cover bg-center opacity-20"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Floating decorative elements */}
      <div
        className="absolute top-20 left-10 w-20 h-20 rounded-full bg-gold-400/20 blur-xl animate-pulse-soft"
        style={{ transform: `translateY(${scrollY * 0.15}px)` }}
      />
      <div
        className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-brand-400/20 blur-xl animate-pulse-soft"
        style={{ transform: `translateY(${scrollY * -0.1}px)` }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center pt-20" style={{ transform: `translateY(${scrollY * -0.15}px)` }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6 text-white/90 text-sm"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>India&apos;s #1 Wedding Planning Platform</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="font-heading text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
        >
          Your Perfect Wedding
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-500">
            Starts Here
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Discover verified vendors, book with escrow protection, and coordinate your wedding day in real-time — all in one platform.
        </motion.p>

        {/* Search Box */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-2 mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-3 flex-1 px-4 py-3">
              <Search size={20} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search vendors, venues, photographers..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 outline-none text-gray-900 placeholder-gray-400 bg-transparent"
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-t sm:border-t-0 sm:border-l border-gray-100">
              <MapPin size={20} className="text-gray-400 shrink-0" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="Select city"
                className="outline-none text-gray-700 bg-transparent cursor-pointer"
              >
                {['Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Jaipur'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button type="submit" aria-label="Search vendors" className="btn-primary rounded-xl flex items-center gap-2 whitespace-nowrap">
              <Search size={18} />
              Search
            </button>
          </div>
        </motion.form>

        {/* Quick Category Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => router.push(`/vendors?category=${cat.toLowerCase()}`)}
              aria-label={`Browse ${cat} vendors`}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/90 text-sm hover:bg-white/20 transition-all"
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="flex flex-wrap justify-center gap-6 text-white/70 text-sm"
        >
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-green-400" />
            <span>Escrow Protected Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={16} className="text-gold-400" />
            <span>10,000+ Verified Vendors</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-400" />
            <span>Real-time Coordination</span>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50 animate-bounce">
        <div className="w-px h-8 bg-white/30" />
        <span className="text-xs">Scroll</span>
      </div>
    </section>
  );
}
