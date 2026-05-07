import Link from 'next/link';
import { Heart, Instagram, Twitter, Facebook, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
              {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-600 transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* For Couples */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Couples</h4>
            <ul className="space-y-2 text-sm">
              {['Find Vendors', 'Wedding Planning', 'Budget Tracker', 'Checklist', 'Real Weddings'].map((item) => (
                <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Vendors</h4>
            <ul className="space-y-2 text-sm">
              {['Join as Vendor', 'Vendor Dashboard', 'Pricing Plans', 'Success Stories', 'Vendor Blog'].map((item) => (
                <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              {['About Us', 'Careers', 'Press', 'Privacy Policy', 'Terms of Service', 'Contact Us'].map((item) => (
                <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
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
