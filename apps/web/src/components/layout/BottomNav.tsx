'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Calendar, Heart, User } from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Explore', icon: Search, href: '/vendors' },
  { label: 'Bookings', icon: Calendar, href: '/bookings' },
  { label: 'Wishlist', icon: Heart, href: '/wishlist' },
  { label: 'Profile', icon: User, href: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? 'page' : undefined}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-lg transition-colors focus-ring',
                isActive
                  ? 'text-brand-600'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon
                size={22}
                className={clsx(
                  isActive && 'fill-brand-100'
                )}
              />
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
