'use client';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, Award, Clock, Users } from 'lucide-react';

type BadgeType = 'trending' | 'most-booked' | 'top-rated' | 'quick-responder' | 'popular';

interface SocialBadge {
  type: BadgeType;
  label: string;
  icon: React.ElementType;
  color: string;
}

const BADGE_CONFIG: Record<BadgeType, SocialBadge> = {
  trending: { type: 'trending', label: 'Trending', icon: TrendingUp, color: 'bg-orange-100 text-orange-700' },
  'most-booked': { type: 'most-booked', label: 'Most Booked', icon: Flame, color: 'bg-red-100 text-red-700' },
  'top-rated': { type: 'top-rated', label: 'Top Rated', icon: Award, color: 'bg-yellow-100 text-yellow-700' },
  'quick-responder': { type: 'quick-responder', label: 'Quick Reply', icon: Clock, color: 'bg-green-100 text-green-700' },
  popular: { type: 'popular', label: 'Popular', icon: Users, color: 'bg-blue-100 text-blue-700' },
};

function getVendorBadges(rating: string, reviews: number, featured: boolean): BadgeType[] {
  const badges: BadgeType[] = [];
  const ratingNum = parseFloat(rating);

  if (ratingNum >= 4.8 && reviews > 150) badges.push('top-rated');
  if (reviews > 200) badges.push('most-booked');
  if (featured) badges.push('trending');
  if (ratingNum >= 4.6 && reviews > 50 && reviews <= 200) badges.push('popular');
  if (reviews > 100) badges.push('quick-responder');

  return badges.slice(0, 2); // Max 2 badges
}

export function SocialProofBadges({ rating, reviews, featured }: { rating: string; reviews: number; featured: boolean }) {
  const badgeTypes = getVendorBadges(rating, reviews, featured);

  if (badgeTypes.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {badgeTypes.map((type) => {
        const badge = BADGE_CONFIG[type];
        const Icon = badge.icon;
        return (
          <span
            key={type}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.color}`}
          >
            <Icon size={10} />
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}

const REVIEWS_PER_BOOKING_ESTIMATE = 20;
const MAX_RECENT_BOOKINGS_DISPLAY = 15;

// Booking activity indicator for vendor cards
export function BookingActivityIndicator({ reviews }: { reviews: number }) {
  // Estimate recent booking activity based on review count
  const recentBookings = Math.min(Math.floor(reviews / REVIEWS_PER_BOOKING_ESTIMATE), MAX_RECENT_BOOKINGS_DISPLAY);

  if (recentBookings < 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-1.5 text-xs text-gray-500"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span>{recentBookings} booked this week</span>
    </motion.div>
  );
}

// Live activity toast for the homepage
export function LiveActivityFeed() {
  const activities = [
    { name: 'Priya & Rahul', action: 'booked', vendor: 'Royal Grand Palace', city: 'Hyderabad', time: '2 min ago' },
    { name: 'Ananya & Karthik', action: 'booked', vendor: 'Srikanth Photography', city: 'Hyderabad', time: '5 min ago' },
    { name: 'Divya & Arjun', action: 'enquired about', vendor: 'Flavours Catering', city: 'Mumbai', time: '8 min ago' },
    { name: 'Sneha & Vikram', action: 'reviewed', vendor: 'Blooms & Dreams', city: 'Bangalore', time: '12 min ago' },
    { name: 'Meera & Aditya', action: 'booked', vendor: 'Shika Makeup Studio', city: 'Chennai', time: '15 min ago' },
  ];

  return (
    <div className="overflow-hidden h-8 relative">
      <motion.div
        animate={{ y: ['0%', '-100%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="space-y-2"
      >
        {[...activities, ...activities].map((activity, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-gray-600 h-8">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span>
              <strong className="text-gray-800">{activity.name}</strong> {activity.action}{' '}
              <strong className="text-brand-600">{activity.vendor}</strong>
              <span className="text-gray-400"> · {activity.time}</span>
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
