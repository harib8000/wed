'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Search, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { clsx } from 'clsx';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {(isAuthenticated && user ? [
              { label: 'Venues', href: '/vendors?category=venue' },
              { label: 'Photography', href: '/vendors?category=photography' },
              { label: 'Catering', href: '/vendors?category=catering' },
              { label: 'All Vendors', href: '/vendors' },
            ] : [
              { label: 'Find Vendors', href: '/vendors' },
              { label: 'How it Works', href: '/#how-it-works' },
              { label: 'Pricing', href: '/pricing' },
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
                <Link href="/vendors" className={clsx('p-2 rounded-lg transition-colors', scrolled ? 'text-gray-600 hover:bg-gray-100' : 'text-white hover:bg-white/20')}>
                  <Search size={20} />
                </Link>
                <Link href="/bookings" className={clsx('p-2 rounded-lg transition-colors relative', scrolled ? 'text-gray-600 hover:bg-gray-100' : 'text-white hover:bg-white/20')}>
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Link>
                <div className="flex items-center gap-2">
                  <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
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
            className={clsx('md:hidden p-2 rounded-lg', scrolled ? 'text-gray-700' : 'text-white')}
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
              <Link href="/profile" className="block py-2 text-gray-700 font-medium">Profile</Link>
            </>
          ) : (
            <>
              <Link href="/#how-it-works" className="block py-2 text-gray-700 font-medium">How it Works</Link>
              <Link href="/vendors" className="block py-2 text-gray-700 font-medium">Pricing</Link>
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
