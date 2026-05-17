'use client';

import { useState } from 'react';
import { X, Calendar, Send, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface QuickEnquiryProps {
  vendorName: string;
  vendorId: string;
  category: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickEnquiry({ vendorName, vendorId, category, isOpen, onClose }: QuickEnquiryProps) {
  const [eventDate, setEventDate] = useState('');
  const [guests, setGuests] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    // Simulate API call (will be connected to booking-service)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success(`Enquiry sent to ${vendorName}! They'll respond within 24 hours.`);
    setSending(false);
    onClose();
    setEventDate('');
    setGuests('');
    setMessage('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50"
          />
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-[15%] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-heading font-semibold text-gray-900">Quick Enquiry</h3>
                <p className="text-xs text-gray-500 mt-0.5">{vendorName} · {category}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label htmlFor="eq-date" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Event Date
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="eq-date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="eq-guests" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Expected Guests
                </label>
                <input
                  id="eq-guests"
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  placeholder="e.g. 300"
                  min={10}
                  max={10000}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label htmlFor="eq-message" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Message <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="eq-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Any specific requirements..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 disabled:opacity-60"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Enquiry
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Shield size={12} className="text-green-500" />
                Your details are secure. Vendor will respond within 24 hours.
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
