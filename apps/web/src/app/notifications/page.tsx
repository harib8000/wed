'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Calendar, MessageSquare, Star, Shield, CreditCard, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type NotificationType = 'booking' | 'message' | 'review' | 'payment' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  read: boolean;
  href?: string;
}

const NOTIFICATION_ICONS: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  booking: { icon: Calendar, color: 'bg-blue-100 text-blue-600' },
  message: { icon: MessageSquare, color: 'bg-purple-100 text-purple-600' },
  review: { icon: Star, color: 'bg-yellow-100 text-yellow-600' },
  payment: { icon: CreditCard, color: 'bg-green-100 text-green-600' },
  system: { icon: Shield, color: 'bg-gray-100 text-gray-600' },
};

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'booking', title: 'Booking Confirmed!', description: 'Royal Grand Palace has confirmed your venue booking for Dec 15, 2026.', time: '2 hours ago', read: false, href: '/bookings' },
  { id: '2', type: 'payment', title: 'Payment Received', description: 'Advance payment of ₹2,00,000 has been securely held in escrow.', time: '3 hours ago', read: false, href: '/bookings' },
  { id: '3', type: 'message', title: 'New Message', description: 'Srikanth Photography sent you a message about your pre-wedding shoot.', time: '5 hours ago', read: false, href: '/chat' },
  { id: '4', type: 'review', title: 'Leave a Review', description: 'Your event with Flavours Catering is complete. Share your experience!', time: '1 day ago', read: true, href: '/bookings' },
  { id: '5', type: 'booking', title: 'Quote Received', description: 'Blooms & Dreams has sent you a decoration quote of ₹1,50,000.', time: '1 day ago', read: true, href: '/bookings' },
  { id: '6', type: 'system', title: 'Profile Tip', description: 'Complete your wedding profile to get better vendor recommendations.', time: '2 days ago', read: true, href: '/profile' },
  { id: '7', type: 'message', title: 'New Message', description: 'Shika Makeup Studio sent you a package options list.', time: '2 days ago', read: true, href: '/chat' },
  { id: '8', type: 'payment', title: 'Escrow Released', description: '₹80,000 released to Srikanth Photography after event completion.', time: '3 days ago', read: true },
  { id: '9', type: 'booking', title: 'Booking Reminder', description: 'Your engagement ceremony is in 7 days. Confirm all vendor details.', time: '3 days ago', read: true },
  { id: '10', type: 'system', title: 'New Feature', description: 'You can now compare vendors side-by-side! Try it out.', time: '5 days ago', read: true, href: '/vendors' },
];

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'booking', label: 'Bookings' },
  { id: 'message', label: 'Messages' },
  { id: 'payment', label: 'Payments' },
  { id: 'review', label: 'Reviews' },
] as const;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter((n) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-12 max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
              <Bell size={20} className="text-brand-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === tab.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Bell size={48} className="text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No notifications</h3>
                <p className="text-sm text-gray-500">You&apos;re all caught up! Check back later.</p>
              </motion.div>
            ) : (
              filtered.map((notification, i) => {
                const config = NOTIFICATION_ICONS[notification.type];
                const Icon = config.icon;

                const content = (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: i * 0.03 }}
                    className={`group flex items-start gap-4 p-4 rounded-2xl transition-all ${
                      notification.read ? 'bg-white' : 'bg-brand-50 border-l-4 border-brand-500'
                    } hover:shadow-sm`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center shrink-0`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                          {!notification.read && (
                            <span className="inline-block w-2 h-2 bg-brand-500 rounded-full ml-2 align-middle" />
                          )}
                        </h3>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAsRead(notification.id); }}
                              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-green-500"
                              aria-label="Mark as read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNotification(notification.id); }}
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500"
                            aria-label="Delete notification"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notification.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                    </div>
                  </motion.div>
                );

                return notification.href ? (
                  <Link key={notification.id} href={notification.href} className="block" onClick={() => markAsRead(notification.id)}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </div>
  );
}
