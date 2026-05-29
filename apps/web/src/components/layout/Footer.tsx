'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Instagram, Twitter, Facebook, Youtube } from 'lucide-react';
import toast from 'react-hot-toast';

const COUPLE_LINKS = [
  { label: 'Find Vendors', href: '/vendors' },
  { label: 'Wedding Planning', href: '/dashboard' },
  { label: 'Budget Tracker', href: '/dashboard' },
  { label: 'Checklist', href: '/dashboard' },
  { label: 'Real Weddings', href: '/vendors' },
];

const VENDOR_LINKS = [
  { label: 'Join as Vendor', href: '/login' },
  { label: 'Vendor Dashboard', href: '/login' },
  { label: 'Pricing Plans', href: '/vendors' },
  { label: 'Success Stories', href: '/vendors' },
  { label: 'Vendor Blog', href: '/vendors' },
];

const COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Careers', href: '/' },
  { label: 'Press', href: '/' },
  { label: 'Help Center', href: '/help' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/refund' },
  { label: 'Contact Us', href: '/contact' },
];

export function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success('Thanks for subscribing! 🎉');
    setEmail('');
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Newsletter */}
        <div className="mb-12 text-center">
          <h3 className="text-white font-heading font-bold text-lg mb-2">Stay in the loop 💌</h3>
          <p className="text-sm text-gray-400 mb-4">Get wedding planning tips, vendor deals & feature updates.</p>
          <form onSubmit={handleSubscribe} className="flex items-center justify-center gap-2 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition"
            >
              Subscribe
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="font-heading font-bold text-xl text-white">Wedding OS</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              India&apos;s first end-to-end wedding operating system. From first click to final applause.
            </p>
            <div className="flex items-center gap-3">
              {[
                { Icon: Instagram, label: 'Instagram' },
                { Icon: Twitter, label: 'Twitter' },
                { Icon: Facebook, label: 'Facebook' },
                { Icon: Youtube, label: 'YouTube' },
              ].map(({ Icon, label }) => (
                <span key={label} title={label} role="button" aria-label={label} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-600 transition-colors cursor-pointer">
                  <Icon size={16} />
                </span>
              ))}
            </div>
          </div>

          {/* For Couples */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Couples</h4>
            <ul className="space-y-2 text-sm">
              {COUPLE_LINKS.map(({ label, href }) => (
                <li key={label}><Link href={href} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Vendors</h4>
            <ul className="space-y-2 text-sm">
              {VENDOR_LINKS.map(({ label, href }) => (
                <li key={label}><Link href={href} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              {COMPANY_LINKS.map(({ label, href }) => (
                <li key={label}><Link href={href} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Download App */}
        <div className="text-center mb-8">
          <h4 className="text-sm font-semibold text-white mb-3">Download the App</h4>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">📱 Get on App Store</a>
            <a href="https://play.google.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">📱 Get on Play Store</a>
          </div>
        </div>

        {/* Payment Partners */}
        <div className="text-center mb-8">
          <p className="text-xs text-gray-500">Payment Partners</p>
          <p className="text-sm text-gray-400 mt-1">Razorpay · UPI · Visa · Mastercard · RuPay</p>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © 2026 Wedding OS. Made with <Heart size={14} className="inline text-red-500 mx-1" /> in Hyderabad, India.
          </p>
          <p className="text-sm text-gray-500">
            🔐 Escrow Protected · ✓ Verified Vendors · 📱 Available on iOS & Android
          </p>
        </div>
      </div>
    </footer>
  );
}
