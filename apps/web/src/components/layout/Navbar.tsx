'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Search, Bell, MapPin, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { clsx } from 'clsx';

const ALL_CITIES = [
  'Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Jaipur',
  'Lucknow', 'Ahmedabad', 'Visakhapatnam', 'Bhopal', 'Indore', 'Chandigarh', 'Coimbatore',
  'Kochi', 'Nagpur', 'Patna', 'Surat', 'Vadodara', 'Thiruvananthapuram', 'Guwahati',
  'Bhubaneswar', 'Mangalore', 'Mysore', 'Udaipur', 'Jodhpur', 'Dehradun', 'Ranchi', 'Amritsar',
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Hyderabad');
  const [citySearch, setCitySearch] = useState('');
  const { user, isAuthenticated, logout, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Load selected city
  useEffect(() => {
    const saved = localStorage.getItem('wedding_os_selected_city');
    if (saved) setSelectedCity(saved);
    const handler = () => {
      const c = localStorage.getItem('wedding_os_selected_city');
      if (c) setSelectedCity(c);
    };
    window.addEventListener('storage', handler);
    window.addEventListener('locationChanged', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('locationChanged', handler);
    };
  }, []);

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    localStorage.setItem('wedding_os_selected_city', city);
    setCityDropdownOpen(false);
    setCitySearch('');
    window.dispatchEvent(new Event('locationChanged'));
  };

  const filteredCities = citySearch
    ? ALL_CITIES.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()))
    : ALL_CITIES;

  useEffect(() => {
    // Hydrate user from token on mount
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      authApi.me().then((res) => {
        setUser(res.data.data);
      }).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <nav className={clsx(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
    )}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-brand-600 focus:font-medium">
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className={clsx('font-heading font-bold text-xl', scrolled ? 'text-gray-900' : 'text-white')}>
              Wedding OS
            </span>
          </Link>

          {/* City Selector */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className={clsx(
                'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full transition-all',
                scrolled
                  ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  : 'text-white/90 bg-white/10 hover:bg-white/20 backdrop-blur-sm'
              )}
            >
              <MapPin size={14} />
              <span>{selectedCity}</span>
              <ChevronDown size={12} />
            </button>

            {cityDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => { setCityDropdownOpen(false); setCitySearch(''); }} />
                <div className="absolute top-full mt-2 left-0 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-100">
                    <input
                      type="text"
                      placeholder="Search city..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2">
                    <button
                      onClick={() => handleCitySelect('All India')}
                      className={clsx(
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                        selectedCity === 'All India' ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      🇮🇳 All India
                    </button>
                    {filteredCities.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleCitySelect(c)}
                        className={clsx(
                          'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                          selectedCity === c ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {(isAuthenticated && user ? [
              { label: 'All Services', href: '/vendors' },
              { label: 'My Bookings', href: '/bookings' },
              { label: 'Guests', href: '/guests' },
              { label: 'Timeline', href: '/timeline' },
            ] : [
              { label: 'Find Vendors', href: '/vendors' },
              { label: 'How it Works', href: '/#how-it-works' },
              { label: 'Categories', href: '/#categories' },
            ]).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'text-sm font-medium transition-colors hover:text-brand-600',
                  scrolled ? 'text-gray-700' : 'text-white/90'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <Link href="/vendors" aria-label="Search vendors" className={clsx('p-2 rounded-lg transition-colors focus-ring', scrolled ? 'text-gray-600 hover:bg-gray-100' : 'text-white hover:bg-white/20')}>
                  <Search size={20} />
                </Link>
                <Link href="/notifications" aria-label="Notifications" className={clsx('p-2 rounded-lg transition-colors relative focus-ring', scrolled ? 'text-gray-600 hover:bg-gray-100' : 'text-white hover:bg-white/20')}>
                  <Bell size={20} />
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                </Link>
                <div className="flex items-center gap-2">
                  <Link href="/profile" aria-label="Your profile" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors focus-ring">
                    <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{user.phone.slice(-2)}</span>
                    </div>
                    <span className={clsx('text-sm font-medium', scrolled ? 'text-gray-700' : 'text-white')}>
                      Profile
                    </span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className={clsx('text-sm font-medium transition-colors', scrolled ? 'text-gray-700 hover:text-brand-600' : 'text-white/90 hover:text-white')}>
                  Sign In
                </Link>
                <Link href="/login" className="btn-primary text-sm py-2">
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className={clsx('md:hidden p-2 rounded-lg focus-ring', scrolled ? 'text-gray-700' : 'text-white')}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 space-y-3">
          <Link href="/vendors" className="block py-2 text-gray-700 font-medium">Find Vendors</Link>
          {isAuthenticated ? (
            <>
              <Link href="/bookings" className="block py-2 text-gray-700 font-medium">My Bookings</Link>
              <Link href="/wishlist" className="block py-2 text-gray-700 font-medium">Wishlist</Link>
              <Link href="/chat" className="block py-2 text-gray-700 font-medium">Messages</Link>
              <Link href="/profile" className="block py-2 text-gray-700 font-medium">Profile</Link>
            </>
          ) : (
            <>
              <Link href="/#how-it-works" className="block py-2 text-gray-700 font-medium">How it Works</Link>
              <Link href="/#categories" className="block py-2 text-gray-700 font-medium">Categories</Link>
            </>
          )}
          <div className="pt-2 border-t border-gray-100">
            {isAuthenticated ? (
              <Link href="/dashboard" className="btn-primary block text-center">Dashboard</Link>
            ) : (
              <Link href="/login" className="btn-primary block text-center">Sign In / Register</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
