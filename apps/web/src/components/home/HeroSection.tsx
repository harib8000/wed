'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, ArrowRight, Star, Shield, Clock, Navigation, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = ['Venue', 'Photography', 'Catering', 'Decor', 'Makeup', 'Music', 'Mehendi', 'Videography', 'Transport', 'Invitations'];
const EVENT_TYPES = ['Wedding', 'Engagement', 'Dhoti Ceremony', 'Saree Function', 'Birthday', 'Reception', 'Housewarming', 'Baby Shower', 'Anniversary', 'Corporate Event'];
const ALL_CITIES = [
  'Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Jaipur',
  'Lucknow', 'Ahmedabad', 'Visakhapatnam', 'Bhopal', 'Indore', 'Chandigarh', 'Coimbatore',
  'Kochi', 'Nagpur', 'Patna', 'Surat', 'Vadodara', 'Thiruvananthapuram', 'Guwahati',
  'Bhubaneswar', 'Mangalore', 'Mysore', 'Udaipur', 'Jodhpur', 'Dehradun', 'Ranchi', 'Amritsar',
];

const LIVE_STATS = [
  { label: 'Verified Vendors', value: '12,000+' },
  { label: 'Happy Events', value: '50,000+' },
  { label: 'Cities', value: '30+' },
];

export function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wedding_os_selected_city') || 'Hyderabad';
    }
    return 'Hyderabad';
  });
  const [eventType, setEventType] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [detectingLocation, setDetectingLocation] = useState(false);
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

  // Detect user location
  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Simple nearest-city logic based on major Indian cities coordinates
        const CITY_COORDS: Record<string, [number, number]> = {
          Hyderabad: [17.385, 78.4867], Mumbai: [19.076, 72.8777], Delhi: [28.6139, 77.209],
          Bangalore: [12.9716, 77.5946], Chennai: [13.0827, 80.2707], Kolkata: [22.5726, 88.3639],
          Pune: [18.5204, 73.8567], Jaipur: [26.9124, 75.7873], Lucknow: [26.8467, 80.9462],
          Ahmedabad: [23.0225, 72.5714], Visakhapatnam: [17.6868, 83.2185], Kochi: [9.9312, 76.2673],
          Chandigarh: [30.7333, 76.7794], Coimbatore: [11.0168, 76.9558], Nagpur: [21.1458, 79.0882],
          Bhopal: [23.2599, 77.4126], Indore: [22.7196, 75.8577], Surat: [21.1702, 72.8311],
          Patna: [25.6093, 85.1376], Vadodara: [22.3072, 73.1812],
        };
        let nearest = 'Hyderabad';
        let minDist = Infinity;
        for (const [c, [lat, lon]] of Object.entries(CITY_COORDS)) {
          const d = Math.sqrt(Math.pow(pos.coords.latitude - lat, 2) + Math.pow(pos.coords.longitude - lon, 2));
          if (d < minDist) { minDist = d; nearest = c; }
        }
        setCity(nearest);
        localStorage.setItem('wedding_os_selected_city', nearest);
        setDetectingLocation(false);
      },
      () => setDetectingLocation(false),
      { timeout: 5000 }
    );
  };

  // Auto-detect on mount if no city saved
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('wedding_os_selected_city')) {
      detectLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (city) params.set('city', city);
    if (eventType) params.set('eventType', eventType);
    localStorage.setItem('wedding_os_selected_city', city);
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
          <span>India&apos;s #1 Event Planning Platform</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="font-heading text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
        >
          Your Perfect Event
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-500">
            Plan it Effortlessly
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          From weddings and engagements to dhoti ceremonies, saree functions, birthdays, and more — discover verified vendors, book with escrow protection, and coordinate your special day in real-time.
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
                onChange={(e) => {
                  setCity(e.target.value);
                  localStorage.setItem('wedding_os_selected_city', e.target.value);
                }}
                aria-label="Select city"
                className="outline-none text-gray-700 bg-transparent cursor-pointer"
              >
                {ALL_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={detectLocation}
                disabled={detectingLocation}
                className="text-brand-600 hover:text-brand-700 transition-colors"
                aria-label="Detect my location"
                title="Detect my location"
              >
                <Navigation size={16} className={detectingLocation ? 'animate-spin' : ''} />
              </button>
            </div>
            <button type="submit" aria-label="Search vendors" className="btn-primary rounded-xl flex items-center gap-2 whitespace-nowrap">
              <Search size={18} />
              Search
            </button>
          </div>
        </motion.form>

        {/* Event Type Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-wrap justify-center gap-2 mb-6"
        >
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setEventType(eventType === type ? '' : type)}
              aria-label={`Select ${type} event type`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                eventType === type
                  ? 'bg-gold-400 text-gray-900 shadow-lg shadow-gold-400/30'
                  : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20'
              }`}
            >
              {type}
            </button>
          ))}
        </motion.div>

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
          className="flex flex-wrap justify-center gap-6 text-white/70 text-sm mb-8"
        >
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-green-400" />
            <span>Escrow Protected Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={16} className="text-gold-400" />
            <span>50,000+ Happy Events</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-400" />
            <span>Real-time Coordination</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-purple-400" />
            <span>12,000+ Verified Vendors</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            <span>No Last-Minute Hassle</span>
          </div>
        </motion.div>

        {/* Live Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="flex justify-center gap-8 md:gap-16"
        >
          {LIVE_STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/50 mt-1">{stat.label}</div>
            </div>
          ))}
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
