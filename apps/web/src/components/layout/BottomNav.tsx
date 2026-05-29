'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Calendar, Heart, User, Bell } from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { label: 'Home', icon: Home, href: '/', badgeKey: null },
  { label: 'Explore', icon: Search, href: '/vendors', badgeKey: null },
  { label: 'Bookings', icon: Calendar, href: '/bookings', badgeKey: 'wos_pending_bookings' },
  { label: 'Notifications', icon: Bell, href: '/notifications', badgeKey: 'wos_notifications' },
  { label: 'Profile', icon: User, href: '/profile', badgeKey: null },
] as const;

function useNavBadges() {
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      // Wishlist count from localStorage
      const wishlist = localStorage.getItem('wedding_os_wishlist');
      const wishlistCount = wishlist ? JSON.parse(wishlist).length : 0;

      setBadges({
        wos_wishlist_items: wishlistCount,
      });
    } catch {
      // ignore
    }

    // Listen for storage changes (when items are added/removed in other tabs)
    const handleStorage = () => {
      try {
        const wishlist = localStorage.getItem('wedding_os_wishlist');
        const wishlistCount = wishlist ? JSON.parse(wishlist).length : 0;
        setBadges((prev) => ({ ...prev, wos_wishlist_items: wishlistCount }));
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return badges;
}

export function BottomNav() {
  const pathname = usePathname();
  const badges = useNavBadges();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const badgeCount = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={`Navigate to ${item.label}${badgeCount > 0 ? ` (${badgeCount} items)` : ''}`}
              aria-current={isActive ? 'page' : undefined}
              className={clsx(
                'relative flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-lg transition-colors focus-ring',
                isActive
                  ? 'text-brand-600'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={clsx(
                    isActive && 'fill-brand-100'
                  )}
                />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span className={clsx(
                'text-[10px] font-medium',
                isActive ? 'text-brand-600' : 'text-gray-400'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
