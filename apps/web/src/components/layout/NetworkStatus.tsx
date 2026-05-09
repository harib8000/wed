'use client';

import { useEffect, useRef, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      // Clear any existing timer
      if (timerRef.current) clearTimeout(timerRef.current);
      // Hide reconnected banner after 3 seconds
      timerRef.current = setTimeout(() => setShowReconnected(false), 3000);
    };

    const goOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Set initial state
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="alert"
          aria-live="assertive"
          className="fixed top-0 inset-x-0 z-[100] bg-red-600 text-white text-sm text-center py-2 px-4 flex items-center justify-center gap-2 print:hidden"
        >
          <WifiOff size={16} />
          <span>You&apos;re offline. Some features may be unavailable.</span>
        </motion.div>
      )}
      {isOnline && showReconnected && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="status"
          aria-live="polite"
          className="fixed top-0 inset-x-0 z-[100] bg-green-600 text-white text-sm text-center py-2 px-4 flex items-center justify-center gap-2 print:hidden"
        >
          <Wifi size={16} />
          <span>Back online!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
