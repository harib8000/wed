'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'wedding_os_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) setVisible(true);
    } catch {
      // localStorage unavailable (SSR / private browsing)
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
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
          <div className="max-w-lg mx-auto flex items-center gap-4 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg">
            <p className="text-sm flex-1">
              We use cookies to improve your experience.{' '}
              <Link href="/privacy" className="underline text-brand-300 hover:text-brand-200">
                Learn More
              </Link>
            </p>
            <button
              onClick={handleAccept}
              className="shrink-0 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Accept
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
