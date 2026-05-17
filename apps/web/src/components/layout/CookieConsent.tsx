'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

const STORAGE_KEY = 'wedding_os_cookie_consent';

type ConsentValue = 'accepted' | 'essential_only';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) setVisible(true);
    } catch {
      // localStorage unavailable (SSR / private browsing)
    }
  }, []);

  const handleConsent = (value: ConsentValue) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 inset-x-0 z-50 p-4 print:hidden"
        >
          <div className="max-w-xl mx-auto bg-gray-900 text-white px-5 py-4 rounded-xl shadow-lg">
            <div className="flex items-start gap-3">
              <Shield size={18} className="text-brand-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm leading-relaxed">
                  We use cookies for essential functionality and to improve your experience. You can choose to accept all cookies or use essential cookies only.{' '}
                  <Link href="/privacy" className="underline text-brand-300 hover:text-brand-200">
                    Privacy Policy
                  </Link>
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleConsent('accepted')}
                    className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={() => handleConsent('essential_only')}
                    className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-lg transition-colors"
                  >
                    Essential Only
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
