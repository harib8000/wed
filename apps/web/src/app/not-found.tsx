'use client';
import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Animated illustration */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-8xl sm:text-9xl"
            >
              💍
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -bottom-2 -right-4 text-4xl"
            >
              ❓
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="font-heading text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="font-heading text-2xl font-semibold text-gray-700 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Looks like this page went on its honeymoon! 🌴 Don&apos;t worry, let&apos;s get you back
            to planning your perfect event.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/"
            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Home size={18} />
            Go Home
          </Link>
          <Link
            href="/vendors"
            className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Search size={18} />
            Browse Vendors
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <button
            onClick={() => window.history.back()}
            className="text-sm text-gray-400 hover:text-brand-600 transition-colors flex items-center gap-1 mx-auto"
            aria-label="Go back to previous page"
          >
            <ArrowLeft size={14} />
            Go back
          </button>
        </motion.div>
      </div>
    </div>
  );
}
