import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import { Providers } from './providers';
import { BottomNav } from '@/components/layout/BottomNav';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { NetworkStatus } from '@/components/layout/NetworkStatus';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-heading' });

export const metadata: Metadata = {
  title: 'Wedding OS — India\'s Event Planning Platform',
  description: 'Plan, Book, and Execute your perfect wedding, engagement, dhoti ceremony, saree function & more with verified vendors, escrow payments, and real-time coordination.',
  keywords: ['wedding planning', 'event planning', 'wedding vendors', 'India wedding', 'dhoti ceremony', 'saree function', 'engagement', 'function hall booking'],
  openGraph: {
    title: 'Wedding OS',
    description: 'India\'s First End-to-End Event Planning Platform',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-white text-gray-900 antialiased pb-16 md:pb-0">
        <Providers>
          <NetworkStatus />
          <ErrorBoundary>
            <div id="main-content">{children}</div>
          </ErrorBoundary>
          <BottomNav />
          <CookieConsent />
          <Toaster
            position="top-right"
            toastOptions={{ duration: 4000 }}
            containerStyle={{ zIndex: 9999 }}
          />
          {/* Aria-live region for screen reader announcements */}
          <div aria-live="polite" aria-atomic="true" className="sr-only" id="a11y-announcements" />
        </Providers>
      </body>
    </html>
  );
}
