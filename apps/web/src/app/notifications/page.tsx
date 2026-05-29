'use client';
import { useState, useMemo, useEffect, useRef, useCallback, TouchEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Calendar, MessageSquare, Star, Shield, CreditCard, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { notificationApi, NotificationItem } from '@/lib/api';

type NotificationType = 'booking' | 'message' | 'review' | 'payment' | 'system';
type FilterTabId = 'all' | NotificationType;
type Notification = NotificationItem;

const NOTIFICATION_ICONS: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  booking: { icon: Calendar, color: 'bg-blue-100 text-blue-600' },
  message: { icon: MessageSquare, color: 'bg-purple-100 text-purple-600' },
  review: { icon: Star, color: 'bg-yellow-100 text-yellow-600' },
  payment: { icon: CreditCard, color: 'bg-green-100 text-green-600' },
  system: { icon: Shield, color: 'bg-gray-100 text-gray-600' },
};

const now = Date.now();
const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'booking', title: 'Booking Confirmed!', description: 'Royal Grand Palace has confirmed your venue booking for Dec 15, 2026.', createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(), read: false, href: '/bookings' },
  { id: '2', type: 'payment', title: 'Payment Received', description: 'Advance payment of ₹2,00,000 has been securely held in escrow.', createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(), read: false, href: '/bookings' },
  { id: '3', type: 'message', title: 'New Message', description: 'Srikanth Photography sent you a message about your pre-wedding shoot.', createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(), read: false, href: '/chat' },
  { id: '4', type: 'review', title: 'Leave a Review', description: 'Your event with Flavours Catering is complete. Share your experience!', createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(), read: true, href: '/bookings' },
  { id: '5', type: 'booking', title: 'Quote Received', description: 'Blooms & Dreams has sent you a decoration quote of ₹1,50,000.', createdAt: new Date(now - 28 * 60 * 60 * 1000).toISOString(), read: true, href: '/bookings' },
  { id: '6', type: 'system', title: 'Profile Tip', description: 'Complete your wedding profile to get better vendor recommendations.', createdAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(), read: true, href: '/profile' },
  { id: '7', type: 'message', title: 'New Message', description: 'Shika Makeup Studio sent you a package options list.', createdAt: new Date(now - 52 * 60 * 60 * 1000).toISOString(), read: true, href: '/chat' },
  { id: '8', type: 'payment', title: 'Escrow Released', description: '₹80,000 released to Srikanth Photography after event completion.', createdAt: new Date(now - 72 * 60 * 60 * 1000).toISOString(), read: true },
  { id: '9', type: 'booking', title: 'Booking Reminder', description: 'Your engagement ceremony is in 7 days. Confirm all vendor details.', createdAt: new Date(now - 74 * 60 * 60 * 1000).toISOString(), read: true },
  { id: '10', type: 'system', title: 'New Feature', description: 'You can now compare vendors side-by-side! Try it out.', createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), read: true, href: '/vendors' },
];

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'booking', label: 'Bookings' },
  { id: 'message', label: 'Messages' },
  { id: 'payment', label: 'Payments' },
  { id: 'review', label: 'Reviews' },
] as const;

function inferNotificationType(value: string): NotificationType {
  const lowered = value.toLowerCase();
  if (lowered.includes('message') || lowered.includes('chat')) return 'message';
  if (lowered.includes('review')) return 'review';
  if (lowered.includes('payment') || lowered.includes('refund') || lowered.includes('escrow')) return 'payment';
  if (lowered.includes('booking') || lowered.includes('quote')) return 'booking';
  return 'system';
}

function resolveHref(type: NotificationType, raw: Record<string, unknown>): string | undefined {
  const data = (raw.data && typeof raw.data === 'object' ? raw.data : null) as Record<string, unknown> | null;
  const bookingId = typeof data?.bookingId === 'string' ? data.bookingId : undefined;
  const vendorId = typeof data?.vendorId === 'string' ? data.vendorId : undefined;

  if (type === 'message') return '/chat';
  if ((type === 'booking' || type === 'payment') && bookingId) return `/bookings/${bookingId}`;
  if (type === 'review' && bookingId) return `/reviews/write/${bookingId}`;
  if (type === 'review' && vendorId) return `/vendors/${vendorId}`;
  if (type === 'system') return '/profile';
  return bookingId ? `/bookings/${bookingId}` : undefined;
}

function normalizeNotification(raw: Record<string, unknown>): Notification {
  const eventOrType = String(raw.type ?? raw.event ?? 'system');
  const type = inferNotificationType(eventOrType);
  return {
    id: String(raw.id ?? raw._id ?? `${eventOrType}-${raw.createdAt ?? Date.now()}`),
    type,
    title: String(raw.title ?? 'Notification'),
    description: String(raw.description ?? raw.body ?? ''),
    createdAt: String(raw.createdAt ?? raw.sentAt ?? new Date().toISOString()),
    read: Boolean(raw.read ?? raw.readAt),
    href: resolveHref(type, raw),
  };
}

function formatRelativeTime(iso: string) {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';
  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<FilterTabId>('all');
  const [showFallbackBanner, setShowFallbackBanner] = useState(true);
  const [pullDistance, setPullDistance] = useState(0);
  const pullStartY = useRef<number | null>(null);
  const touchStartX = useRef(0);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['notifications', activeFilter],
    queryFn: async () => {
      try {
        const res = await notificationApi.list({ limit: 50, ...(activeFilter !== 'all' ? { type: activeFilter } : {}) });
        const raw = res.data?.data?.notifications ?? res.data?.data ?? res.data;
        const items = Array.isArray(raw) ? raw.map((item) => normalizeNotification(item as Record<string, unknown>)) : [];
        return { items, isMock: false };
      } catch {
        return {
          items: activeFilter === 'all' ? MOCK_NOTIFICATIONS : MOCK_NOTIFICATIONS.filter((item) => item.type === activeFilter),
          isMock: true,
        };
      }
    },
    staleTime: 30_000,
    retry: 0,
  });

  useEffect(() => {
    if (data?.items) {
      setNotifications(data.items);
      if (!data.isMock) setShowFallbackBanner(true);
    }
  }, [data]);

  const isMockData = data?.isMock ?? true;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter((n) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const handleRefresh = useCallback(async () => {
    const result = await refetch();
    if (result.data?.isMock) {
      toast('Showing demo notifications while the API is unavailable.', { icon: 'ℹ️' });
    } else {
      toast.success('Notifications refreshed');
    }
  }, [refetch]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

    if (isMockData) {
      toast.success('Marked as read');
      return;
    }

    try {
      await markReadMutation.mutateAsync(id);
    } catch {
      setNotifications(previous);
      toast.error('Could not mark notification as read');
    }
  }, [isMockData, markReadMutation, notifications]);

  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    if (isMockData) {
      toast.success('All notifications marked as read');
      return;
    }

    try {
      await markAllReadMutation.mutateAsync();
      toast.success('All notifications marked as read');
    } catch {
      setNotifications(previous);
      toast.error('Could not update notifications');
    }
  }, [isMockData, markAllReadMutation, notifications, unreadCount]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success('Notification removed');
  }, []);

  const handlePullStart = (event: TouchEvent<HTMLDivElement>) => {
    if (window.scrollY > 0) return;
    pullStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handlePullMove = (event: TouchEvent<HTMLDivElement>) => {
    if (pullStartY.current === null) return;
    const currentY = event.touches[0]?.clientY ?? pullStartY.current;
    const distance = Math.max(0, currentY - pullStartY.current);
    setPullDistance(Math.min(distance, 90));
  };

  const handlePullEnd = async () => {
    if (pullDistance > 60) await handleRefresh();
    pullStartY.current = null;
    setPullDistance(0);
  };

  return (
    <div className="min-h-screen bg-gray-50" onTouchStart={handlePullStart} onTouchMove={handlePullMove} onTouchEnd={handlePullEnd}>
      <Navbar />
      <div className="pt-20 pb-12 max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          animate={{ height: pullDistance > 0 ? Math.max(28, pullDistance / 2) : 0, opacity: pullDistance > 0 ? 1 : 0 }}
          className="overflow-hidden flex items-center justify-center text-xs text-brand-600"
        >
          {pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
        </motion.div>

        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
              <Bell size={20} className="text-brand-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 bg-brand-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/profile" className="text-sm text-gray-500 hover:text-gray-700 font-medium">
              Preferences
            </Link>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 disabled:opacity-60"
              >
                <CheckCheck size={16} /> Mark all as read
              </button>
            )}
          </div>
        </div>

        {isMockData && showFallbackBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">Demo notifications</p>
              <p className="text-sm text-amber-700">Live notifications are unavailable right now, so we&apos;re showing sample updates instead.</p>
            </div>
            <button onClick={() => setShowFallbackBanner(false)} className="text-amber-700 hover:text-amber-900" aria-label="Dismiss banner">
              <X size={16} />
            </button>
          </motion.div>
        )}

        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
          <button
            onClick={handleRefresh}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                <Bell size={48} className="text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No notifications</h3>
                <p className="text-sm text-gray-500 mb-4">You&apos;re all caught up! Check back later for booking, payment, and chat updates.</p>
                <Link href="/profile" className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700">
                  Manage notification preferences
                </Link>
              </motion.div>
            ) : (
              filtered.map((notification, i) => {
                const config = NOTIFICATION_ICONS[notification.type];
                const Icon = config.icon;

                const card = (
                  <div className={`group flex items-start gap-4 p-4 rounded-2xl transition-all ${notification.read ? 'bg-white' : 'bg-brand-50 border-l-4 border-brand-500'} hover:shadow-sm`}>
                    <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center shrink-0`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                          {!notification.read && <span className="inline-block w-2 h-2 bg-brand-500 rounded-full ml-2 align-middle" />}
                        </h3>
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); void handleMarkAsRead(notification.id); }}
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
                      <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notification.createdAt)}</p>
                    </div>
                  </div>
                );

                const content = notification.href ? (
                  <Link href={notification.href} className="block" onClick={() => void handleMarkAsRead(notification.id)}>
                    {card}
                  </Link>
                ) : (
                  card
                );

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: i * 0.03 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -90) deleteNotification(notification.id);
                    }}
                    onTouchStart={(event) => {
                      touchStartX.current = event.touches[0]?.clientX ?? 0;
                    }}
                    onTouchEnd={(event) => {
                      const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
                      if (touchStartX.current - endX > 90) deleteNotification(notification.id);
                    }}
                  >
                    {content}
                  </motion.div>
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
