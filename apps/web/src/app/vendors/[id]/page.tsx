'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, MapPin, CheckCircle, Shield, MessageCircle, Calendar, ArrowLeft, Heart, SearchX, Clock, Info, Sparkles, BadgeCheck, Phone, Trophy, Scale, ChevronRight, ChevronDown } from 'lucide-react';
import AvailabilityCalendar from '@/components/vendors/AvailabilityCalendar';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { addToRecentlyViewed } from '@/components/vendors/RecentlyViewed';
import { ShareButton } from '@/components/vendors/ShareButton';
import { QuickEnquiry } from '@/components/vendors/QuickEnquiry';
import { vendorApi } from '@/lib/api';

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };
const stagger = { animate: { transition: { staggerChildren: 0.1 } } };
const PLATFORM_FEE_RATE = 0.05;
const GST_RATE = 0.18;

function getWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('wishlist') || '[]'); } catch { return []; }
}
function toggleWishlist(vendorId: string): boolean {
  const list = getWishlist();
  const idx = list.indexOf(vendorId);
  if (idx >= 0) { list.splice(idx, 1); } else { list.push(vendorId); }
  localStorage.setItem('wishlist', JSON.stringify(list));
  window.dispatchEvent(new Event('storage'));
  return idx < 0;
}

function DemoModeBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
      <Info size={12} />
      Demo mode — showing sample data
    </div>
  );
}

const DEFAULT_PORTFOLIO_IDS = ['1519225421980-715cb0215aed', '1519741497674-611481863552', '1478146059778-26028b07395a', '1464366400600-7168b8af9bc3', '1531058020387-4de47d62d946', '1491604612772-6853927639ef', '1519167758481-83f550bb49b3', '1463863148025-20c37369acec'];

function createPortfolio(ids: string[]) {
  return ids.map((id, index) => ({ id: index, url: `https://images.unsplash.com/photo-${id}?w=400&q=80` }));
}

const MOCK_VENDOR = {
  id: '1',
  businessName: 'Royal Grand Palace',
  category: 'Venue',
  city: 'Hyderabad',
  rating: 4.9,
  totalReviews: 247,
  totalBookings: 312,
  verificationStatus: 'verified',
  description: "Royal Grand Palace is Hyderabad's premier wedding venue, nestled in the heart of the city. With 3 grand halls accommodating 200-2000 guests, we offer world-class facilities including a rooftop garden, poolside area, and dedicated bridal suites.",
  yearsExperience: 12,
  teamSize: 50,
  basePrice: 500000,
  currency: 'INR',
  citiesServed: ['Hyderabad', 'Secunderabad'],
  featured: true,
  responseTimeHours: 2,
  cancellationRate: 1.6,
  phone: '+91 98765 43210',
  packages: [
    { id: 'p1', name: 'Grand Silver', price: 500000, priceType: 'fixed', description: 'Perfect for intimate gatherings', inclusions: ['Hall for 200 guests', 'Basic decor', 'Parking for 100 cars', '8-hour access'], minGuests: 100, maxGuests: 200 },
    { id: 'p2', name: 'Grand Gold', price: 900000, priceType: 'fixed', description: 'Most popular choice', inclusions: ['Hall for 500 guests', 'Premium floral decor', 'Valet parking', 'Bridal suite', '12-hour access', 'DJ console'], minGuests: 200, maxGuests: 500 },
    { id: 'p3', name: 'Grand Platinum', price: 1500000, priceType: 'fixed', description: 'The ultimate luxury experience', inclusions: ['All 3 halls', '2000 guests', 'Luxury decor', 'Dedicated coordinator', 'Catering kitchen', 'Multi-day booking', 'Celebrity DJ'], minGuests: 500, maxGuests: 2000 },
  ],
  portfolio: createPortfolio(DEFAULT_PORTFOLIO_IDS),
  tags: ['Garden', 'Banquet', 'Rooftop', 'Pool', '5-Star', 'AC Halls'],
};

const MOCK_REVIEWS = [
  { id: 1, customerName: 'Priya S.', rating: 5, date: 'March 2026', body: 'Absolutely stunning venue! The staff was professional and the ambiance was magical. Our 500-guest wedding went off without a hitch.', tags: ['Great Service', 'Punctual', 'Clean'], helpfulCount: 41 },
  { id: 2, customerName: 'Rahul K.', rating: 5, date: 'February 2026', body: 'Best venue in Hyderabad hands down. The food was excellent, the decor was perfect. Highly recommend the Gold package.', tags: ['Great Value', 'Beautiful'], helpfulCount: 36 },
  { id: 3, customerName: 'Meera A.', rating: 4, date: 'January 2026', body: 'Great experience overall. Parking could be better but everything else was perfect. The bridal suite was gorgeous!', tags: ['Bridal Suite', 'Professional'], helpfulCount: 18 },
];

type VendorDetail = typeof MOCK_VENDOR;
type Review = typeof MOCK_REVIEWS[0];
type Package = typeof MOCK_VENDOR['packages'][0];
type VendorFaq = { id: string; question: string; answer: string };

type ReviewSort = 'most_helpful' | 'highest' | 'lowest' | 'newest';

function createMockVendor(overrides: Partial<VendorDetail> & Pick<VendorDetail, 'id' | 'businessName' | 'category' | 'city'>): VendorDetail {
  return {
    ...MOCK_VENDOR,
    ...overrides,
    citiesServed: overrides.citiesServed ?? [overrides.city],
    packages: overrides.packages ?? MOCK_VENDOR.packages,
    portfolio: overrides.portfolio ?? MOCK_VENDOR.portfolio,
    tags: overrides.tags ?? MOCK_VENDOR.tags,
  };
}

const VENDOR_MAP: Record<string, VendorDetail> = {
  'vendor-1': createMockVendor({ ...MOCK_VENDOR, city: 'Hyderabad' }),
  'vendor-venue-2': createMockVendor({
    id: '5', businessName: 'The Pearl Convention', category: 'Venue', city: 'Hyderabad', rating: 4.8, totalReviews: 198, totalBookings: 241, basePrice: 420000,
    description: 'Modern convention venue with pillarless hall layouts, valet-friendly access, and warm ambient lighting for wedding and reception functions.', yearsExperience: 9, teamSize: 36, featured: true,
    responseTimeHours: 2, cancellationRate: 1.9, phone: '+91 98765 40105', tags: ['Convention Hall', 'Valet', 'Stage Setup', 'Indoor Venue'],
    portfolio: createPortfolio(['1522673607200-164d1b6ce486', '1517457373958-b7bdd4587205', '1510070009289-b5bc34383727', '1511795409834-ef04bbd61622', '1505691938895-1758d7feb511', '1464366400600-7168b8af9bc3', '1478146059778-26028b07395a', '1491604612772-6853927639ef']),
    packages: [
      { id: 'p1', name: 'Classic Hall', price: 420000, priceType: 'fixed', description: 'Ideal for smaller receptions and engagement events', inclusions: ['Hall for 250 guests', 'Ambient lighting', 'Standard stage', '8-hour access'], minGuests: 120, maxGuests: 250 },
      { id: 'p2', name: 'Signature Hall', price: 760000, priceType: 'fixed', description: 'Balanced setup with decor and hospitality add-ons', inclusions: ['Hall for 600 guests', 'Premium decor', 'Valet parking', 'Bridal lounge'], minGuests: 250, maxGuests: 600 },
      { id: 'p3', name: 'Royal Celebration', price: 1180000, priceType: 'fixed', description: 'Large-format package for full wedding celebrations', inclusions: ['Hall + lawn combo', 'Luxury florals', 'Hospitality desk', '14-hour access'], minGuests: 500, maxGuests: 1200 },
    ],
  }),
  'vendor-venue-3': createMockVendor({
    id: '6', businessName: 'Palm Grove Gardens', category: 'Venue', city: 'Hyderabad', rating: 4.7, totalReviews: 173, totalBookings: 208, basePrice: 650000,
    description: 'A lush outdoor venue with dedicated mandap lawns, evening lighting concepts, and weather-ready event planning support.', yearsExperience: 11, teamSize: 42, featured: false,
    responseTimeHours: 3, cancellationRate: 1.4, phone: '+91 98765 40106', tags: ['Outdoor Venue', 'Garden', 'Mandap Lawn', 'Sunset Events'],
    portfolio: createPortfolio(['1511285560929-80b456fea0bc', '1519167758481-83f550bb49b3', '1519741497674-611481863552', '1519225421980-715cb0215aed', '1505691938895-1758d7feb511', '1491604612772-6853927639ef', '1463863148025-20c37369acec', '1531058020387-4de47d62d946']),
    packages: [
      { id: 'p1', name: 'Garden Day Event', price: 650000, priceType: 'fixed', description: 'Daytime garden booking for ceremonies', inclusions: ['Lawn for 300 guests', 'Mandap setup', 'Parking assistance', 'Generator backup'], minGuests: 150, maxGuests: 300 },
      { id: 'p2', name: 'Sunset Wedding', price: 980000, priceType: 'fixed', description: 'Evening wedding package with decor and lounge areas', inclusions: ['Lawn for 700 guests', 'Lighting decor', 'Family lounge', 'Hospitality crew'], minGuests: 250, maxGuests: 700 },
      { id: 'p3', name: 'Weekend Destination', price: 1450000, priceType: 'fixed', description: 'Multi-function outdoor wedding experience', inclusions: ['Two-day access', 'Luxury seating', 'Couple suite', 'Vendor coordination'], minGuests: 400, maxGuests: 1200 },
    ],
  }),
  'vendor-2': createMockVendor({
    id: '2', businessName: 'Srikanth Photography', category: 'Photography', city: 'Hyderabad', rating: 4.8, totalReviews: 189, totalBookings: 156, basePrice: 80000,
    description: 'Award-winning wedding photography studio specializing in candid, traditional, and cinematic styles. Capturing your most precious moments with a team of 8 professional photographers across Hyderabad.', yearsExperience: 8, teamSize: 8,
    featured: true, responseTimeHours: 3, cancellationRate: 1.8, phone: '+91 98765 40002', tags: ['Candid', 'Traditional', 'Cinematic', 'Drone', 'Pre-wedding'],
    portfolio: createPortfolio(['1511285560929-80b456fea0bc', '1519225421980-715cb0215aed', '1517457373958-b7bdd4587205', '1491604612772-6853927639ef', '1531058020387-4de47d62d946', '1478146059778-26028b07395a', '1519167758481-83f550bb49b3', '1463863148025-20c37369acec']),
    packages: [
      { id: 'p1', name: 'Essential', price: 40000, priceType: 'fixed', description: '1 photographer, 200 edited photos', inclusions: ['1 Photographer', '200 Edited Photos', '8-hour coverage', 'Online Gallery'], minGuests: 0, maxGuests: 500 },
      { id: 'p2', name: 'Premium', price: 80000, priceType: 'fixed', description: '2 photographers + pre-wedding shoot', inclusions: ['2 Photographers', '500 Edited Photos', 'Pre-wedding Shoot', 'Photo Album', '12-hour coverage'], minGuests: 0, maxGuests: 1000 },
      { id: 'p3', name: 'Cinematic', price: 150000, priceType: 'fixed', description: 'Full team with drone + film', inclusions: ['3 Photographers', 'Drone Coverage', 'Cinematic Film', '1000+ Photos', 'Premium Album', 'Multi-day coverage'], minGuests: 0, maxGuests: 2000 },
    ],
  }),
  'vendor-photo-2': createMockVendor({
    id: '7', businessName: 'Frame Story Studios', category: 'Photography', city: 'Hyderabad', rating: 4.7, totalReviews: 142, totalBookings: 164, basePrice: 65000,
    description: 'Creative wedding storytellers focusing on emotional candid moments, couple portraits, and same-day teaser edits.', yearsExperience: 7, teamSize: 6, featured: false,
    responseTimeHours: 4, cancellationRate: 1.7, phone: '+91 98765 40107', tags: ['Storytelling', 'Candid', 'Reels', 'Album Design'],
    portfolio: createPortfolio(['1522673607200-164d1b6ce486', '1517457373958-b7bdd4587205', '1519741497674-611481863552', '1511285560929-80b456fea0bc', '1491604612772-6853927639ef', '1531058020387-4de47d62d946', '1519167758481-83f550bb49b3', '1463863148025-20c37369acec']),
    packages: [
      { id: 'p1', name: 'Moments Lite', price: 65000, priceType: 'fixed', description: 'Candid-focused coverage for intimate events', inclusions: ['1 Photographer', '1 Videographer', '250 Edited Photos', 'Teaser Reel'], minGuests: 0, maxGuests: 400 },
      { id: 'p2', name: 'Story Premium', price: 95000, priceType: 'fixed', description: 'Balanced photo-video coverage for wedding day', inclusions: ['2 Photographers', 'Cinematic Video', 'Album Design', '12-hour coverage'], minGuests: 0, maxGuests: 800 },
      { id: 'p3', name: 'Legacy Film', price: 165000, priceType: 'fixed', description: 'Luxury storytelling with full production support', inclusions: ['Drone Shoot', 'Couple Film', 'Luxury Album', 'Same-day teaser'], minGuests: 0, maxGuests: 1500 },
    ],
  }),
  'vendor-photo-3': createMockVendor({
    id: '8', businessName: 'Pixel Perfect Weddings', category: 'Photography', city: 'Hyderabad', rating: 4.9, totalReviews: 214, totalBookings: 228, basePrice: 90000,
    description: 'Premium wedding photography team known for vibrant frames, efficient delivery, and polished wedding films.', yearsExperience: 10, teamSize: 10, featured: true,
    responseTimeHours: 2, cancellationRate: 1.2, phone: '+91 98765 40108', tags: ['Premium Albums', 'Drone', 'Luxury Weddings', 'Cinematic'],
    portfolio: createPortfolio(['1519225421980-715cb0215aed', '1511285560929-80b456fea0bc', '1519167758481-83f550bb49b3', '1522673607200-164d1b6ce486', '1519741497674-611481863552', '1478146059778-26028b07395a', '1491604612772-6853927639ef', '1463863148025-20c37369acec']),
    packages: [
      { id: 'p1', name: 'Photo Classic', price: 90000, priceType: 'fixed', description: 'Photo-first package with edited gallery delivery', inclusions: ['2 Photographers', '400 Edited Photos', 'Online Gallery', '10-hour coverage'], minGuests: 0, maxGuests: 700 },
      { id: 'p2', name: 'Film + Photo', price: 135000, priceType: 'fixed', description: 'Photo and video coverage with album', inclusions: ['2 Photographers', '2 Videographers', 'Wedding Film', 'Album'], minGuests: 0, maxGuests: 1200 },
      { id: 'p3', name: 'Signature Memories', price: 210000, priceType: 'fixed', description: 'High-end production for multi-event weddings', inclusions: ['Drone Team', 'Luxury Album', 'Instant previews', 'Multi-day coverage'], minGuests: 0, maxGuests: 2500 },
    ],
  }),
  'vendor-3': createMockVendor({
    id: '3', businessName: 'Flavours Catering Co.', category: 'Catering', city: 'Hyderabad', rating: 4.7, totalReviews: 312, totalBookings: 420, basePrice: 800,
    description: "Hyderabad's finest multi-cuisine catering service with live counters, traditional Hyderabadi Biryani, and 200+ menu options. Serving weddings from 100 to 5000 guests.", yearsExperience: 15, teamSize: 120,
    featured: false, responseTimeHours: 1, cancellationRate: 1.1, phone: '+91 98765 40003', tags: ['Multi-cuisine', 'Live Counters', 'Biryani', 'Vegetarian', 'Non-veg'],
    packages: [
      { id: 'p1', name: 'Classic', price: 800, priceType: 'per_plate', description: 'Standard buffet menu', inclusions: ['15 Items Buffet', 'Welcome Drinks', 'Basic Setup', 'Service Staff'], minGuests: 100, maxGuests: 500 },
      { id: 'p2', name: 'Royal', price: 1200, priceType: 'per_plate', description: 'Premium multi-cuisine', inclusions: ['25 Items Buffet', 'Live Counters', 'Premium Beverages', 'Themed Setup', 'Dedicated Manager'], minGuests: 200, maxGuests: 2000 },
      { id: 'p3', name: 'Grand Feast', price: 2000, priceType: 'per_plate', description: 'Ultimate luxury dining', inclusions: ['40+ Items', 'Live Counters', 'Biryani Counter', 'Dessert Bar', 'Ice Cream Station', 'Luxury Crockery'], minGuests: 300, maxGuests: 5000 },
    ],
  }),
  'vendor-catering-2': createMockVendor({
    id: '9', businessName: 'Saffron Feast Caterers', category: 'Catering', city: 'Hyderabad', rating: 4.8, totalReviews: 256, totalBookings: 301, basePrice: 950,
    description: 'Known for regional wedding menus, elegant buffet styling, and crowd-friendly live counters across Hyderabad and Secunderabad.', yearsExperience: 13, teamSize: 95, featured: true,
    responseTimeHours: 2, cancellationRate: 1.3, phone: '+91 98765 40109', tags: ['Regional Menus', 'Live Counters', 'Desserts', 'South Indian'],
    packages: [
      { id: 'p1', name: 'Celebration Buffet', price: 950, priceType: 'per_plate', description: 'Balanced menu for day events and receptions', inclusions: ['18 Items Buffet', 'Mocktails', 'Dessert Counter', 'Service Team'], minGuests: 150, maxGuests: 700 },
      { id: 'p2', name: 'Wedding Signature', price: 1450, priceType: 'per_plate', description: 'Popular premium wedding spread', inclusions: ['28 Items Buffet', '2 Live Counters', 'Premium Desserts', 'Guest management'], minGuests: 250, maxGuests: 1800 },
      { id: 'p3', name: 'Luxury Banquet Menu', price: 2200, priceType: 'per_plate', description: 'Upscale menu with extensive customization', inclusions: ['40 Items', '3 Live Counters', 'Luxury crockery', 'Chef-curated menu'], minGuests: 300, maxGuests: 3500 },
    ],
  }),
  'vendor-catering-3': createMockVendor({
    id: '10', businessName: 'Royal Leaf Kitchens', category: 'Catering', city: 'Hyderabad', rating: 4.6, totalReviews: 184, totalBookings: 219, basePrice: 700,
    description: 'Affordable premium catering for traditional and modern weddings with quick turnaround and consistent taste.', yearsExperience: 9, teamSize: 70, featured: false,
    responseTimeHours: 2, cancellationRate: 1.6, phone: '+91 98765 40110', tags: ['Budget Luxury', 'Traditional', 'Vegetarian', 'Live Dosa'],
    packages: [
      { id: 'p1', name: 'Homestyle Value', price: 700, priceType: 'per_plate', description: 'Simple menu with crowd favourites', inclusions: ['12 Items', 'Tea/coffee', 'Service staff', 'Dining setup'], minGuests: 100, maxGuests: 500 },
      { id: 'p2', name: 'Festive Plus', price: 1100, priceType: 'per_plate', description: 'Expanded menu with live snacks', inclusions: ['22 Items', 'Live dosa counter', 'Desserts', 'Banquet support'], minGuests: 180, maxGuests: 1200 },
      { id: 'p3', name: 'Grand Wedding Feast', price: 1700, priceType: 'per_plate', description: 'Premium menu for high-volume wedding events', inclusions: ['32 Items', 'Live chaat counter', 'Dessert bar', 'Coordinator'], minGuests: 250, maxGuests: 2500 },
    ],
  }),
  'vendor-4': createMockVendor({
    id: '4', businessName: 'Blooms & Dreams Decor', category: 'Decor', city: 'Hyderabad', rating: 4.9, totalReviews: 156, totalBookings: 198, basePrice: 150000,
    description: 'Luxury wedding decor studio known for immersive floral concepts, mandap styling and experiential reception setups.', yearsExperience: 10, teamSize: 24, featured: true,
    responseTimeHours: 2, cancellationRate: 1.5, phone: '+91 98765 40004', tags: ['Luxury Decor', 'Mandap', 'Floral'],
    packages: [
      { id: 'p1', name: 'Classic Decor', price: 150000, priceType: 'fixed', description: 'Elegant floral styling for intimate functions', inclusions: ['Mandap styling', 'Fresh flowers', 'Stage lighting', 'Setup crew'], minGuests: 100, maxGuests: 300 },
      { id: 'p2', name: 'Signature Decor', price: 275000, priceType: 'fixed', description: 'Designer styling with themed installations', inclusions: ['Entry decor', 'Floral ceiling', 'Photo booth', 'Mood lighting'], minGuests: 200, maxGuests: 600 },
      { id: 'p3', name: 'Luxury Experience', price: 450000, priceType: 'fixed', description: 'Premium wedding decor with immersive concepts', inclusions: ['Custom concept design', 'Luxury florals', 'LED tunnel', 'On-site designer'], minGuests: 300, maxGuests: 1200 },
    ],
  }),
  'vendor-decor-2': createMockVendor({
    id: '11', businessName: 'Petals & Lights Studio', category: 'Decor', city: 'Hyderabad', rating: 4.8, totalReviews: 133, totalBookings: 171, basePrice: 180000,
    description: 'Boutique decor house creating soft romantic floral palettes, entry walkthroughs, and premium stage styling.', yearsExperience: 8, teamSize: 18, featured: true,
    responseTimeHours: 3, cancellationRate: 1.4, phone: '+91 98765 40111', tags: ['Floral Styling', 'Entry Decor', 'Reception Stage', 'Pastel Themes'],
    packages: [
      { id: 'p1', name: 'Floral Essentials', price: 180000, priceType: 'fixed', description: 'Elegant floral decor for intimate celebrations', inclusions: ['Fresh florals', 'Backdrop styling', 'Signage', 'Crew'], minGuests: 100, maxGuests: 250 },
      { id: 'p2', name: 'Designer Entry', price: 295000, priceType: 'fixed', description: 'Add immersive walkthroughs and ambient lighting', inclusions: ['Entry tunnel', 'Stage decor', 'Mood lighting', 'Photo corner'], minGuests: 200, maxGuests: 500 },
      { id: 'p3', name: 'Grand Statement', price: 520000, priceType: 'fixed', description: 'Large-format decor for multi-event weddings', inclusions: ['Custom theme', 'Luxury florals', 'LED panels', 'On-site stylist'], minGuests: 300, maxGuests: 1200 },
    ],
  }),
  'vendor-decor-3': createMockVendor({
    id: '12', businessName: 'Aura Event Styling', category: 'Decor', city: 'Hyderabad', rating: 4.7, totalReviews: 121, totalBookings: 149, basePrice: 130000,
    description: 'Event styling specialists for haldi, mehendi, and reception setups with bold colours and immersive photo moments.', yearsExperience: 6, teamSize: 16, featured: false,
    responseTimeHours: 3, cancellationRate: 1.8, phone: '+91 98765 40112', tags: ['Haldi Decor', 'Mehendi Setup', 'Photo Booths', 'Colour Themes'],
    packages: [
      { id: 'p1', name: 'Fun Festive', price: 130000, priceType: 'fixed', description: 'Colourful decor for daytime pre-wedding functions', inclusions: ['Backdrop', 'Props', 'Entry decor', 'Crew'], minGuests: 80, maxGuests: 220 },
      { id: 'p2', name: 'Reception Chic', price: 240000, priceType: 'fixed', description: 'Stylish decor with lounge and stage accents', inclusions: ['Stage styling', 'Lounge seating', 'Lighting', 'Photo spot'], minGuests: 150, maxGuests: 450 },
      { id: 'p3', name: 'Immersive Theme', price: 390000, priceType: 'fixed', description: 'Custom-designed experiential decor package', inclusions: ['Theme design', 'Premium props', 'LED styling', 'Creative team'], minGuests: 250, maxGuests: 900 },
    ],
  }),
};

function normalizeVendor(raw: Record<string, unknown>): VendorDetail {
  return {
    id: String(raw.id || raw._id || ''),
    businessName: String(raw.businessName || raw.business_name || 'Unnamed Vendor'),
    category: String(raw.category || 'Venue'),
    city: String(raw.city || (raw.citiesServed as string[])?.[0] || 'Hyderabad'),
    rating: Number(raw.rating || raw.avgRating || 4.5),
    totalReviews: Number(raw.totalReviews || raw.total_reviews || 0),
    totalBookings: Number(raw.totalBookings || raw.total_bookings || 0),
    verificationStatus: String(raw.verificationStatus || raw.verification_status || 'pending'),
    description: String(raw.description || ''),
    yearsExperience: Number(raw.yearsExperience || raw.years_experience || 0),
    teamSize: Number(raw.teamSize || raw.team_size || 0),
    basePrice: Number(raw.basePrice || raw.base_price || raw.startingPrice || 0),
    currency: String(raw.currency || 'INR'),
    citiesServed: (raw.citiesServed || raw.cities_served || ['Hyderabad']) as string[],
    featured: Boolean(raw.featured),
    responseTimeHours: Number(raw.responseTimeHours || raw.response_time_hours || 3),
    cancellationRate: Number(raw.cancellationRate || raw.cancellation_rate || 2),
    phone: String(raw.phone || raw.phoneNumber || '+91 98765 43210'),
    packages: Array.isArray(raw.packages) ? raw.packages.map((p: Record<string, unknown>) => ({
      id: String(p.id || p._id || ''),
      name: String(p.name || ''),
      price: Number(p.price || 0),
      priceType: String(p.priceType || p.price_type || 'fixed'),
      description: String(p.description || ''),
      inclusions: (p.inclusions || []) as string[],
      minGuests: Number(p.minGuests || p.min_guests || 0),
      maxGuests: Number(p.maxGuests || p.max_guests || 0),
    })) : [],
    portfolio: Array.isArray(raw.portfolio) ? raw.portfolio.map((p: Record<string, unknown>, i: number) => ({
      id: Number(p.id ?? i),
      url: String(p.url || p.mediaUrl || p.media_url || ''),
    })) : MOCK_VENDOR.portfolio,
    tags: (raw.tags || []) as string[],
  };
}

function normalizeReviews(raw: unknown[]): Review[] {
  return raw.map((r: unknown, i: number) => {
    const rev = r as Record<string, unknown>;
    return {
      id: Number(rev.id || rev._id || i + 1),
      customerName: String(rev.customerName || rev.customer_name || 'Anonymous'),
      rating: Number(rev.rating || 5),
      date: String(rev.date || rev.createdAt || rev.created_at || 'Recently'),
      body: String(rev.body || rev.text || rev.comment || ''),
      tags: (rev.tags || []) as string[],
      helpfulCount: Number(rev.helpfulCount || rev.helpful_count || 0),
    };
  });
}

function formatPrice(price: number) {
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
  if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K`;
  return `₹${price}`;
}

function formatResponseTime(hours: number) {
  return `Usually responds within ${hours} hour${hours > 1 ? 's' : ''}`;
}

function calculatePricing(price: number) {
  const platformFee = price * PLATFORM_FEE_RATE;
  const taxableAmount = price + platformFee;
  const gst = taxableAmount * GST_RATE;
  return {
    base: price,
    platformFee,
    gst,
    total: taxableAmount + gst,
  };
}

function getReviewDistribution(rating: number) {
  if (rating >= 4.8) return [
    { stars: 5, percent: 80 },
    { stars: 4, percent: 15 },
    { stars: 3, percent: 5 },
    { stars: 2, percent: 0 },
    { stars: 1, percent: 0 },
  ];
  if (rating >= 4.6) return [
    { stars: 5, percent: 70 },
    { stars: 4, percent: 20 },
    { stars: 3, percent: 8 },
    { stars: 2, percent: 2 },
    { stars: 1, percent: 0 },
  ];
  return [
    { stars: 5, percent: 60 },
    { stars: 4, percent: 25 },
    { stars: 3, percent: 10 },
    { stars: 2, percent: 3 },
    { stars: 1, percent: 2 },
  ];
}

function getPackageTierLabel(index: number) {
  return ['Basic', 'Standard', 'Premium'][index] ?? `Package ${index + 1}`;
}

function getVendorFaqs(category?: string, businessName?: string): VendorFaq[] {
  const vendorName = businessName || 'this vendor';
  const faqsByCategory: Record<string, VendorFaq[]> = {
    venue: [
      { id: 'venue-cancel', question: 'What is your cancellation and rescheduling policy?', answer: `${vendorName} usually supports date changes based on hall availability, and cancellations are reviewed based on how close the event date is. Advance payments already committed to blocking dates or staffing may be adjusted in the final settlement.` },
      { id: 'venue-city', question: 'Do you support destination weddings or guests travelling from other cities?', answer: 'Yes, venue teams can coordinate valet, rooming support, and local hospitality partners for outstation guests. Share your expected arrival schedule early so logistics can be planned smoothly.' },
      { id: 'venue-package', question: 'What is included in the venue package?', answer: 'Packages typically include the event space, standard setup window, basic lighting, parking support, and venue operations staff. Decor, catering, and premium hospitality elements can be upgraded separately.' },
      { id: 'venue-timings', question: 'Can we book the venue for multiple functions?', answer: 'Multi-function bookings are available for couples planning mehendi, sangeet, wedding, and reception at the same property. Premium tiers usually offer longer access windows and better back-to-back coordination.' },
      { id: 'venue-backup', question: 'Do you provide rain or power backup support?', answer: 'Most large venues include generator backup and alternate indoor layouts or covered spaces for weather-sensitive events. Ask for the fallback plan while shortlisting the package.' },
    ],
    photography: [
      { id: 'photo-cancel', question: 'How do you handle cancellation or date changes?', answer: `${vendorName} blocks the team calendar after confirmation, so date changes depend on crew availability. If your wedding date shifts, the team usually tries to move the booking before treating it as a cancellation.` },
      { id: 'photo-travel', question: 'Do you travel outside Hyderabad for shoots?', answer: 'Yes, most photography teams travel for destination weddings and outstation pre-wedding shoots. Travel, stay, and local permissions are typically quoted separately from the coverage package.' },
      { id: 'photo-delivery', question: 'When will we receive our photos and films?', answer: 'Teasers are often shared within a few days, while fully edited galleries and wedding films usually take a few weeks depending on the scope of coverage and editing style.' },
      { id: 'photo-package', question: 'What is included in the package?', answer: 'Packages commonly cover the photography team, edited images, event-hour coverage, gallery delivery, and optional albums or reels. Higher tiers may include drones, multiple shooters, and same-day edits.' },
      { id: 'photo-style', question: 'Can we request a candid or cinematic style?', answer: 'Absolutely. Most teams are happy to align on candid, traditional, editorial, or cinematic preferences if you share references before the event.' },
    ],
    catering: [
      { id: 'catering-cancel', question: 'What happens if our guest count changes close to the event?', answer: `${vendorName} generally works with a final headcount cut-off before the event. Minor changes can often be absorbed, but significant increases or reductions may affect staffing, ingredient sourcing, and billing.` },
      { id: 'catering-travel', question: 'Do you cater in nearby cities or outdoor venues?', answer: 'Yes, many catering teams serve destination venues and outdoor weddings. Transport, live counter setup, and utility requirements are usually included as part of the custom quote.' },
      { id: 'catering-package', question: 'What is included in the package price?', answer: 'Packages generally cover menu curation, cooking staff, service staff, buffet setup, and standard serving equipment. Premium tiers add live stations, upgraded desserts, and guest-facing coordination.' },
      { id: 'catering-tasting', question: 'Do you offer a tasting before booking?', answer: 'Most premium caterers provide a tasting session or curated sample menu before final confirmation so families can align on flavour, presentation, and menu mix.' },
      { id: 'catering-custom', question: 'Can the menu be customised for vegetarian or regional preferences?', answer: 'Yes, menus are typically flexible across vegetarian, non-vegetarian, Jain, and region-specific wedding spreads. Custom requests are easier to accommodate when discussed early.' },
    ],
    decor: [
      { id: 'decor-cancel', question: 'Can decor concepts be changed after booking?', answer: `${vendorName} can usually refine colour palettes, floral choices, and stage styling until the final production deadline. Major concept changes close to the event may impact budgets and execution timelines.` },
      { id: 'decor-travel', question: 'Do you execute events outside your home city?', answer: 'Yes, decor teams often travel for destination weddings and venue takeovers. Travel logistics, fabrication transport, and setup timelines are usually planned in the final estimate.' },
      { id: 'decor-package', question: 'What is included in the decor package?', answer: 'Core decor packages typically include concept design, floral or prop elements, setup crew, and teardown. Premium packages may add entry experiences, lounges, photo moments, and custom installations.' },
      { id: 'decor-venue', question: 'Do you coordinate directly with the venue team?', answer: 'Yes, experienced decor partners work with venue operations, lighting vendors, and planners so setup windows, rigging needs, and teardown timelines stay on track.' },
      { id: 'decor-flowers', question: 'Can we mix fresh flowers with reusable decor?', answer: 'Definitely. Many couples choose a mix of fresh florals for focal zones and reusable structures for scale, which balances look, sustainability, and budget.' },
    ],
  };

  return faqsByCategory[category?.toLowerCase() || ''] ?? [
    { id: 'general-cancel', question: 'What is your cancellation policy?', answer: `${vendorName} reviews cancellations based on the event date, prep already completed, and vendor calendar blocks. The team usually explains any deductions clearly before closing the booking.` },
    { id: 'general-travel', question: 'Do you travel to other cities?', answer: 'Yes, destination weddings and nearby city events can usually be accommodated with advance notice. Travel and stay costs are shared transparently as part of the quote.' },
    { id: 'general-package', question: 'What is included in the package?', answer: 'Packages usually cover the core service, on-ground coordination, and the most common deliverables for the category. Custom upgrades can be added after discussing your event brief.' },
    { id: 'general-booking', question: 'How far in advance should we book?', answer: 'Popular dates fill quickly, so it is best to block the vendor as early as possible after finalising your shortlist. This is especially helpful for peak wedding season weekends.' },
  ];
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="card overflow-hidden">
                <div className="h-72 bg-gray-200 animate-pulse" />
                <div className="p-4 grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-gray-200 animate-pulse" />
                  ))}
                </div>
              </div>
              <div className="card p-6 space-y-4">
                <div className="h-7 w-64 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-4/6 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="card p-6 space-y-4">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="card p-6 space-y-4">
                <div className="h-8 w-32 mx-auto bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function VendorNotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 flex items-center justify-center min-h-[60vh]">
        <div className="text-center px-4">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <SearchX size={36} className="text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold font-heading mb-2">Vendor Not Found</h1>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            The vendor you&apos;re looking for doesn&apos;t exist or may have been removed. Browse our curated list of verified wedding vendors instead.
          </p>
          <Link href="/vendors" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Browse All Vendors
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function VendorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [reviewSort, setReviewSort] = useState<ReviewSort>('most_helpful');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  useEffect(() => {
    setWishlisted(getWishlist().includes(params.id));
  }, [params.id]);

  const handleToggleWishlist = useCallback(() => {
    const nowLiked = toggleWishlist(params.id);
    setWishlisted(nowLiked);
  }, [params.id]);

  const { data: vendorResult, isLoading: vendorLoading } = useQuery({
    queryKey: ['vendor', params.id],
    queryFn: async () => {
      try {
        const res = await vendorApi.getById(params.id);
        const raw = res.data.data || res.data;
        return { vendor: normalizeVendor(raw), isDemo: false };
      } catch {
        const mock = VENDOR_MAP[params.id];
        if (mock) return { vendor: mock, isDemo: true };
        return null;
      }
    },
    retry: 0,
    staleTime: 60_000,
  });

  const { data: packagesResult } = useQuery({
    queryKey: ['vendor-packages', params.id],
    queryFn: async () => {
      try {
        const res = await vendorApi.getPackages(params.id);
        const raw = res.data.data || res.data;
        if (Array.isArray(raw) && raw.length > 0) {
          return raw.map((p: Record<string, unknown>) => ({
            id: String(p.id || p._id || ''),
            name: String(p.name || ''),
            price: Number(p.price || 0),
            priceType: String(p.priceType || p.price_type || 'fixed'),
            description: String(p.description || ''),
            inclusions: (p.inclusions || []) as string[],
            minGuests: Number(p.minGuests || p.min_guests || 0),
            maxGuests: Number(p.maxGuests || p.max_guests || 0),
          }));
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled: !!vendorResult && !vendorResult.isDemo,
    retry: 0,
  });

  const { data: reviewsResult } = useQuery({
    queryKey: ['vendor-reviews', params.id],
    queryFn: async () => {
      try {
        const res = await vendorApi.getReviews(params.id, { limit: 10, sort: reviewSort === 'most_helpful' ? 'helpful' : reviewSort });
        const raw = res.data.data?.reviews || res.data.data || res.data;
        if (Array.isArray(raw) && raw.length > 0) {
          return { reviews: normalizeReviews(raw), isDemo: false };
        }
        return { reviews: MOCK_REVIEWS, isDemo: true };
      } catch {
        return { reviews: MOCK_REVIEWS, isDemo: true };
      }
    },
    retry: 0,
    staleTime: 60_000,
  });

  const isDemo = !vendorResult || vendorResult.isDemo;
  const v = vendorResult?.vendor ?? null;
  const reviews = reviewsResult?.reviews ?? MOCK_REVIEWS;
  const packages: Package[] = useMemo(() => {
    if (packagesResult && packagesResult.length > 0) return packagesResult;
    return v?.packages ?? [];
  }, [packagesResult, v]);

  useEffect(() => {
    if (v) {
      addToRecentlyViewed({
        id: params.id,
        businessName: v.businessName,
        category: v.category,
        city: v.city,
        rating: String(v.rating),
        coverImage: v.portfolio[0]?.url ?? '',
        basePrice: v.basePrice,
      });
    }
  }, [params.id, v]);

  const sortedReviews = useMemo(() => {
    const nextReviews = [...reviews];
    switch (reviewSort) {
      case 'highest':
        return nextReviews.sort((a, b) => b.rating - a.rating || b.helpfulCount - a.helpfulCount);
      case 'lowest':
        return nextReviews.sort((a, b) => a.rating - b.rating || b.helpfulCount - a.helpfulCount);
      case 'newest':
        return nextReviews.reverse();
      default:
        return nextReviews.sort((a, b) => b.helpfulCount - a.helpfulCount || b.rating - a.rating);
    }
  }, [reviewSort, reviews]);

  const reviewHighlights = useMemo(() => {
    const counts = new Map<string, number>();
    reviews.forEach((review) => {
      review.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [reviews]);

  const vendorFaqs = useMemo(() => getVendorFaqs(v?.category, v?.businessName), [v?.businessName, v?.category]);

  useEffect(() => {
    if (!vendorFaqs.length) {
      setOpenFaqId(null);
      return;
    }
    setOpenFaqId((current) => current && vendorFaqs.some((faq) => faq.id === current) ? current : vendorFaqs[0].id);
  }, [vendorFaqs]);

  const comparisonPackages = useMemo(() => packages.slice(0, 3), [packages]);

  const packageComparisonRows = useMemo(() => comparisonPackages.length > 0 ? [
    { label: 'Price', values: comparisonPackages.map((pkg) => `${formatPrice(pkg.price)}${pkg.priceType === 'per_plate' ? ' / plate' : ''}`) },
    { label: 'Best for', values: comparisonPackages.map((pkg) => pkg.description || 'Customisable package') },
    { label: 'Guest capacity', values: comparisonPackages.map((pkg) => pkg.maxGuests > 0 ? `${pkg.minGuests > 0 ? `${pkg.minGuests}-` : 'Up to '}${pkg.maxGuests} guests` : 'Flexible') },
    { label: 'Key inclusions', values: comparisonPackages.map((pkg) => pkg.inclusions.slice(0, 3).join(', ') || 'Shared on enquiry') },
    { label: 'Upgrades', values: comparisonPackages.map(() => 'Custom add-ons available') },
  ] : [], [comparisonPackages]);

  if (vendorLoading) return <LoadingSkeleton />;
  if (!v) return <VendorNotFound />;

  const similarVendorEntries = Object.entries(VENDOR_MAP).filter(([key]) => key !== params.id);
  const sameCategory = similarVendorEntries.filter(([, vendor]) => vendor.category === v.category);
  const sameCity = similarVendorEntries.filter(([, vendor]) => vendor.city === v.city);
  const similarVendors = (sameCategory.length > 0 ? sameCategory : sameCity.length > 0 ? sameCity : similarVendorEntries)
    .slice(0, 4)
    .map(([key, vendor]) => ({ key, ...vendor }));

  const reviewDistribution = getReviewDistribution(v.rating);
  const lowestPackagePrice = Math.min(...packages.map((pkg) => pkg.price), v.basePrice || 0);
  const isTopRated = v.rating >= 4.8;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-0">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/vendors" className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition-colors" aria-label="Back to vendors list">
            <ArrowLeft size={16} /> Back to Vendors
          </Link>
          {isDemo && <DemoModeBadge />}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-8" {...stagger} initial="initial" animate="animate">
            <div className="lg:col-span-2 space-y-6">
              <motion.div className="card overflow-hidden" {...fadeIn}>
                <div className="h-72 overflow-hidden">
                  <img src={v.portfolio[0].url} alt={v.businessName} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-2">
                    {v.portfolio.slice(1, 5).map((p) => (
                      <div key={p.id} className="aspect-square rounded-lg overflow-hidden">
                        <img src={p.url} alt="" className="w-full h-full object-cover hover:opacity-90 cursor-pointer transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div className="card p-6" {...fadeIn}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold font-heading">{v.businessName}</h1>
                      {v.verificationStatus === 'verified' && (
                        <div className="group relative">
                          <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full font-medium cursor-help">
                            <BadgeCheck size={13} /> KYC Verified <Info size={12} className="text-green-600/80" />
                          </span>
                          <div className="pointer-events-none absolute left-0 top-full z-10 mt-2 w-72 rounded-xl bg-gray-900 px-3 py-2 text-xs leading-5 text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                            This vendor has been verified by WeddingOS team with identity, portfolio, and service quality checks.
                          </div>
                        </div>
                      )}
                      {isTopRated && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">🔥 Top Rated</span>}
                      {v.featured && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">⭐ Featured</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                      <span className="badge bg-brand-100 text-brand-700 capitalize">{v.category}</span>
                      <div className="flex items-center gap-1"><MapPin size={14} />{v.city}</div>
                      <div className="flex items-center gap-1"><Star size={14} className="fill-gold-400 text-gold-400" /><strong>{v.rating}</strong> ({v.totalReviews} reviews)</div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"><Trophy size={12} className="text-brand-500" /> {v.totalBookings}+ weddings</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"><Sparkles size={12} className="text-brand-500" /> {v.yearsExperience}+ years experience</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"><Clock size={12} className="text-brand-500" /> {formatResponseTime(v.responseTimeHours)}</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"><Scale size={12} className="text-brand-500" /> Less than {v.cancellationRate}% cancellation rate</span>
                    </div>
                    <p className="text-sm font-semibold text-brand-700">Starting from {formatPrice(lowestPackagePrice || v.basePrice)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleWishlist}
                      className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                      aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                    >
                      <Heart size={18} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                    </button>
                    <ShareButton title={v.businessName} text={`Check out ${v.businessName} on WeddingOS — ${v.category} in ${v.city}`} />
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{v.description}</p>
                <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                  <div className="text-center"><div className="font-bold text-lg">{v.yearsExperience}+</div><div className="text-xs text-gray-500">Years Experience</div></div>
                  <div className="text-center"><div className="font-bold text-lg">{v.totalBookings}+</div><div className="text-xs text-gray-500">Events Done</div></div>
                  <div className="text-center"><div className="font-bold text-lg">{v.teamSize}+</div><div className="text-xs text-gray-500">Team Size</div></div>
                </div>
              </motion.div>

              <motion.div className="card p-6" {...fadeIn}>
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={20} className="text-brand-600" />
                  <h2 className="text-xl font-bold font-heading">WeddingOS Booking Protection</h2>
                </div>
                <div className="grid gap-3 text-sm text-gray-600">
                  <div className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3"><CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" /> Verified vendor with KYC documentation</div>
                  <div className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3"><CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" /> Secure escrow payment — money held until event completion</div>
                  <div className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3"><CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" /> 100% refund if vendor cancels</div>
                  <div className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3"><CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" /> Dedicated dispute resolution support</div>
                </div>
              </motion.div>

              <motion.div className="card p-6" {...fadeIn}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold font-heading">Packages & Pricing</h2>
                    <p className="text-sm text-gray-500">Transparent pricing with WeddingOS platform protection built in.</p>
                  </div>
                  <p className="text-sm font-semibold text-brand-700">Starting from {formatPrice(lowestPackagePrice || v.basePrice)}</p>
                </div>
                <div className="space-y-4">
                  {packages.map((pkg, i) => {
                    const pricing = calculatePricing(pkg.price);
                    return (
                      <div key={pkg.id} className={`border-2 rounded-xl p-4 transition-colors ${i === 1 ? 'border-brand-500 bg-brand-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                        {i === 1 && <span className="badge bg-brand-600 text-white text-xs mb-2">Most Popular</span>}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                            <p className="text-sm text-gray-500">{pkg.description}</p>
                            <p className="text-xs text-gray-400 mt-1">{pkg.minGuests}–{pkg.maxGuests} guests</p>
                          </div>
                          <div className="text-left lg:text-right">
                            <p className="text-lg font-bold text-brand-700">{formatPrice(pkg.price)}</p>
                            <p className="text-xs text-gray-400">{pkg.priceType === 'per_plate' ? '/plate' : 'Base price'}</p>
                          </div>
                        </div>
                        <div className="grid gap-2 rounded-xl bg-white p-3 border border-gray-100 text-sm text-gray-600 mb-3">
                          <div className="flex items-center justify-between"><span>Base price</span><span className="font-medium text-gray-900">{formatPrice(pricing.base)}</span></div>
                          <div className="flex items-center justify-between"><span>WeddingOS platform fee (5%)</span><span className="font-medium text-gray-900">{formatPrice(pricing.platformFee)}</span></div>
                          <div className="flex items-center justify-between"><span>GST (18%)</span><span className="font-medium text-gray-900">{formatPrice(pricing.gst)}</span></div>
                          <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2"><span className="font-semibold text-gray-900">Estimated total</span><span className="font-semibold text-brand-700">{formatPrice(pricing.total)}</span></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-4">
                          {pkg.inclusions.map((inc) => (
                            <div key={inc} className="flex items-center gap-1 text-xs text-gray-600">
                              <CheckCircle size={11} className="text-green-500 shrink-0" /> {inc}
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link href={`/checkout/${params.id}?package=${pkg.id}`} className="btn-primary text-sm px-4 py-2.5 text-center">
                            Send Enquiry
                          </Link>
                          <button
                            onClick={() => setShowEnquiry(true)}
                            className="btn-secondary text-sm px-4 py-2.5 flex items-center justify-center gap-2"
                          >
                            <MessageCircle size={15} /> Request Custom Quote
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {comparisonPackages.length > 0 && (
                <motion.div className="card p-6" {...fadeIn}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold font-heading">Compare Packages</h2>
                      <p className="text-sm text-gray-500">See what changes across each tier before sending your enquiry.</p>
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Mock package comparison</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl border border-gray-200 text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="min-w-[180px] border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Feature</th>
                          {comparisonPackages.map((pkg, index) => (
                            <th key={pkg.id} className="min-w-[220px] border-b border-l border-gray-200 px-4 py-3 text-left align-top">
                              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{getPackageTierLabel(index)}</p>
                              <p className="mt-1 font-semibold text-gray-900">{pkg.name}</p>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {packageComparisonRows.map((row, rowIndex) => (
                          <tr key={row.label} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                            <td className="border-b border-gray-100 px-4 py-3 font-medium text-gray-900">{row.label}</td>
                            {row.values.map((value, valueIndex) => (
                              <td key={`${row.label}-${valueIndex}`} className="border-b border-l border-gray-100 px-4 py-3 text-gray-600">{value}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              <motion.div className="card p-6" id="availability" {...fadeIn}>
                <h2 className="text-xl font-bold font-heading mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-brand-600" /> Check Availability
                </h2>
                <p className="text-sm text-gray-500 mb-4">Select a date and time slot to check availability. Booked slots are marked in red.</p>
                <AvailabilityCalendar
                  vendorId={params.id}
                  vendorCategory={v.category.toLowerCase()}
                  onSlotSelect={(date: string, slot: string) => {
                    const searchParams = new URLSearchParams({ date, slot, package: packages[1]?.id || packages[0]?.id });
                    router.push(`/checkout/${params.id}?${searchParams.toString()}`);
                  }}
                />
              </motion.div>

              <motion.div className="card p-6" {...fadeIn}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold font-heading">Reviews</h2>
                    <p className="text-sm text-gray-500">Trusted by {v.totalBookings}+ bookings with transparent feedback and highlights.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star size={18} className="fill-gold-400 text-gold-400" />
                    <span className="text-2xl font-bold">{v.rating}</span>
                    <span className="text-gray-500">({v.totalReviews})</span>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] mb-6">
                  <div className="space-y-3">
                    {reviewDistribution.map((row) => (
                      <div key={row.stars} className="flex items-center gap-3 text-sm">
                        <span className="w-8 text-gray-600">{row.stars}★</span>
                        <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gold-400" style={{ width: `${row.percent}%` }} />
                        </div>
                        <span className="w-10 text-right text-gray-500">{row.percent}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Review highlights</h3>
                      <select
                        value={reviewSort}
                        onChange={(e) => setReviewSort(e.target.value as ReviewSort)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600"
                        aria-label="Sort reviews"
                      >
                        <option value="most_helpful">Most helpful</option>
                        <option value="highest">Highest rated</option>
                        <option value="lowest">Lowest rated</option>
                        <option value="newest">Newest</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {reviewHighlights.map(([tag, count]) => (
                        <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 border border-gray-200">
                          {tag} · {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {sortedReviews.map((r) => (
                    <div key={r.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2 gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold">{r.customerName[0]}</div>
                          <div>
                            <div className="font-medium text-sm">{r.customerName}</div>
                            <div className="text-xs text-gray-400">{r.date}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex justify-end">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={13} className="fill-gold-400 text-gold-400" />)}</div>
                          <p className="text-[11px] text-gray-400 mt-1">{r.helpfulCount} found this helpful</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{r.body}</p>
                      <div className="flex flex-wrap gap-1 mt-2">{r.tags.map((t) => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-sm text-gray-500">Had a great experience? Share your feedback!</p>
                  <Link href={`/reviews/write/new?vendorId=${params.id}&vendorName=${encodeURIComponent(v.businessName)}`} className="btn-primary text-sm py-2 px-5 flex items-center gap-2">
                    <Star size={14} /> Write a Review
                  </Link>
                </div>
              </motion.div>

              <motion.div className="card p-6" {...fadeIn}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-bold font-heading">Frequently Asked Questions</h2>
                    <p className="text-sm text-gray-500">Quick answers couples often ask before booking {v.businessName}.</p>
                  </div>
                  <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
                    <Info size={18} />
                  </div>
                </div>
                <div className="space-y-3">
                  {vendorFaqs.map((faq) => {
                    const isOpen = openFaqId === faq.id;
                    return (
                      <div key={faq.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                        <button
                          type="button"
                          onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                        >
                          <span className="font-medium text-gray-900">{faq.question}</span>
                          <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && <div className="px-5 pb-5 text-sm leading-6 text-gray-600">{faq.answer}</div>}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            <motion.div className="lg:col-span-1" {...fadeIn}>
              <div className="card p-6 sticky top-24">
                <div className="text-center mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Starting from</p>
                  <p className="text-3xl font-bold text-brand-700">{formatPrice(lowestPackagePrice || v.basePrice)}</p>
                  <p className="text-sm text-gray-500">Transparent pricing · Customizable packages</p>
                </div>

                <div className="space-y-3 mb-6">
                  <Link href={`/checkout/${params.id}`} className="btn-primary w-full text-center block">
                    📩 Send Enquiry
                  </Link>
                  <button
                    onClick={() => setShowEnquiry(true)}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} /> Quick Enquiry
                  </button>
                  <button
                    onClick={() => setShowEnquiry(true)}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} /> Request Custom Quote
                  </button>
                  <a href="#availability" className="btn-secondary w-full flex items-center justify-center gap-2">
                    <Calendar size={16} /> Check Availability
                  </a>
                </div>

                <div className="bg-green-50 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-1">
                    <Shield size={14} /> Escrow Protected
                  </div>
                  <p className="text-xs text-green-600">Your advance payment is held safely and released only after service delivery.</p>
                </div>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" />Free quotes & proposals</div>
                  <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" />Less than {v.cancellationRate}% cancellation rate</div>
                  <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" />{formatResponseTime(v.responseTimeHours)}</div>
                  <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" />Verified KYC vendor</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {similarVendors.length > 0 && (
            <motion.div className="mt-12" {...fadeIn}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold font-heading">Couples Also Viewed</h2>
                  <p className="text-sm text-gray-500">More {v.category.toLowerCase()} specialists couples shortlisting in {v.city} also explored.</p>
                </div>
                <Link href={`/vendors?category=${encodeURIComponent(v.category.toLowerCase())}&city=${encodeURIComponent(v.city)}`} className="text-sm font-medium text-brand-600 inline-flex items-center gap-1 hover:underline">
                  View More <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {similarVendors.map((sv) => (
                  <Link key={sv.key} href={`/vendors/${sv.key}`} className="card overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="h-40 overflow-hidden">
                      <img src={sv.portfolio[0].url} alt={sv.businessName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{sv.businessName}</h3>
                        {sv.verificationStatus === 'verified' && <CheckCircle size={14} className="text-green-500" />}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <span className="badge bg-brand-100 text-brand-700 text-xs capitalize">{sv.category}</span>
                        <div className="flex items-center gap-1"><MapPin size={12} />{sv.city}</div>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Star size={14} className="fill-gold-400 text-gold-400" />
                          <strong>{sv.rating}</strong>
                          <span className="text-gray-400">({sv.totalReviews})</span>
                        </div>
                        <p className="text-sm font-semibold text-brand-700">{formatPrice(sv.basePrice)}</p>
                      </div>
                      <p className="text-xs text-gray-500">{sv.totalBookings}+ bookings · {formatResponseTime(sv.responseTimeHours)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />

      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 px-4 py-3">
          <button onClick={() => setShowEnquiry(true)} className="btn-primary flex-1 py-3 text-sm">Send Enquiry</button>
          <a href={`tel:${v.phone.replace(/\s+/g, '')}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700">
            <Phone size={16} /> Call
          </a>
          <Link href={`/chat?vendorId=${params.id}&vendorName=${encodeURIComponent(v.businessName)}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700">
            <MessageCircle size={16} /> Chat
          </Link>
        </div>
      </div>

      {showEnquiry && (
        <QuickEnquiry
          vendorName={v.businessName}
          vendorId={params.id}
          category={v.category}
          isOpen={showEnquiry}
          onClose={() => setShowEnquiry(false)}
        />
      )}
    </div>
  );
}
