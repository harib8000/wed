import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import { Providers } from './providers';
import { BottomNav } from '@/components/layout/BottomNav';
import { CookieConsent } from '@/components/layout/CookieConsent';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-heading' });

export const metadata: Metadata = {
  title: 'Wedding OS — India\'s Wedding Operating System',
  description: 'Plan, Book, and Execute your perfect wedding with verified vendors, escrow payments, and real-time coordination.',
  keywords: ['wedding planning', 'wedding vendors', 'India wedding', 'wedding booking'],
  openGraph: {
    title: 'Wedding OS',
    description: 'India\'s First End-to-End Wedding Operating System',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-white text-gray-900 antialiased pb-16 md:pb-0">
        <Providers>
          <div id="main-content">{children}</div>
          <BottomNav />
          <CookieConsent />
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </Providers>
      </body>
    </html>
  );
}
