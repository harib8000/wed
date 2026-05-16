'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, MapPin, CheckCircle, Shield, MessageCircle, Calendar, ArrowLeft, Heart, Share2, SearchX, Clock } from 'lucide-react';
import AvailabilityCalendar from '@/components/vendors/AvailabilityCalendar';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };
const stagger = { animate: { transition: { staggerChildren: 0.1 } } };

// Mock vendor detail
const MOCK_VENDOR = {
  id: '1', businessName: 'Royal Grand Palace', category: 'Venue', city: 'Hyderabad',
  rating: 4.9, totalReviews: 247, totalBookings: 312,
  verificationStatus: 'verified',
  description: 'Royal Grand Palace is Hyderabad\'s premier wedding venue, nestled in the heart of the city. With 3 grand halls accommodating 200-2000 guests, we offer world-class facilities including a rooftop garden, poolside area, and dedicated bridal suites.',
  yearsExperience: 12, teamSize: 50,
  basePrice: 500000, currency: 'INR',
  citiesServed: ['Hyderabad', 'Secunderabad'],
  packages: [
    { id: 'p1', name: 'Grand Silver', price: 500000, priceType: 'fixed', description: 'Perfect for intimate gatherings', inclusions: ['Hall for 200 guests', 'Basic decor', 'Parking for 100 cars', '8-hour access'], minGuests: 100, maxGuests: 200 },
    { id: 'p2', name: 'Grand Gold', price: 900000, priceType: 'fixed', description: 'Most popular choice', inclusions: ['Hall for 500 guests', 'Premium floral decor', 'Valet parking', 'Bridal suite', '12-hour access', 'DJ console'], minGuests: 200, maxGuests: 500 },
    { id: 'p3', name: 'Grand Platinum', price: 1500000, priceType: 'fixed', description: 'The ultimate luxury experience', inclusions: ['All 3 halls', '2000 guests', 'Luxury decor', 'Dedicated coordinator', 'Catering kitchen', 'Multi-day booking', 'Celebrity DJ'], minGuests: 500, maxGuests: 2000 },
  ],
  portfolio: Array.from({ length: 8 }, (_, i) => ({ id: i, url: `https://images.unsplash.com/photo-${['1519225421980-715cb0215aed', '1519741497674-611481863552', '1478146059778-26028b07395a', '1464366400600-7168b8af9bc3', '1531058020387-4de47d62d946', '1491604612772-6853927639ef', '1519167758481-83f550bb49b3', '1463863148025-20c37369acec'][i]}?w=400&q=80` })),
  tags: ['Garden', 'Banquet', 'Rooftop', 'Pool', '5-Star', 'AC Halls'],
};

const MOCK_REVIEWS = [
  { id: 1, customerName: 'Priya S.', rating: 5, date: 'March 2026', body: 'Absolutely stunning venue! The staff was professional and the ambiance was magical. Our 500-guest wedding went off without a hitch.', tags: ['Great Service', 'Punctual', 'Clean'] },
  { id: 2, customerName: 'Rahul K.', rating: 5, date: 'February 2026', body: 'Best venue in Hyderabad hands down. The food was excellent, the decor was perfect. Highly recommend the Gold package.', tags: ['Great Value', 'Beautiful'] },
  { id: 3, customerName: 'Meera A.', rating: 4, date: 'January 2026', body: 'Great experience overall. Parking could be better but everything else was perfect. The bridal suite was gorgeous!', tags: ['Bridal Suite', 'Professional'] },
];

const VENDOR_MAP: Record<string, typeof MOCK_VENDOR> = {
  'vendor-1': { ...MOCK_VENDOR },
  'vendor-2': { ...MOCK_VENDOR, id: '2', businessName: 'Srikanth Photography', category: 'Photography', rating: 4.8, totalReviews: 189, totalBookings: 156, basePrice: 80000, description: 'Award-winning wedding photography studio specializing in candid, traditional, and cinematic styles. Capturing your most precious moments with a team of 8 professional photographers across Hyderabad.', yearsExperience: 8, teamSize: 8, packages: [{ id: 'p1', name: 'Essential', price: 40000, priceType: 'fixed', description: '1 photographer, 200 edited photos', inclusions: ['1 Photographer', '200 Edited Photos', '8-hour coverage', 'Online Gallery'], minGuests: 0, maxGuests: 500 }, { id: 'p2', name: 'Premium', price: 80000, priceType: 'fixed', description: '2 photographers + pre-wedding shoot', inclusions: ['2 Photographers', '500 Edited Photos', 'Pre-wedding Shoot', 'Photo Album', '12-hour coverage'], minGuests: 0, maxGuests: 1000 }, { id: 'p3', name: 'Cinematic', price: 150000, priceType: 'fixed', description: 'Full team with drone + film', inclusions: ['3 Photographers', 'Drone Coverage', 'Cinematic Film', '1000+ Photos', 'Premium Album', 'Multi-day coverage'], minGuests: 0, maxGuests: 2000 }], tags: ['Candid', 'Traditional', 'Cinematic', 'Drone', 'Pre-wedding'] },
  'vendor-3': { ...MOCK_VENDOR, id: '3', businessName: 'Flavours Catering Co.', category: 'Catering', rating: 4.7, totalReviews: 312, totalBookings: 420, basePrice: 800, description: 'Hyderabad\'s finest multi-cuisine catering service with live counters, traditional Hyderabadi Biryani, and 200+ menu options. Serving weddings from 100 to 5000 guests.', yearsExperience: 15, teamSize: 120, packages: [{ id: 'p1', name: 'Classic', price: 800, priceType: 'per_plate', description: 'Standard buffet menu', inclusions: ['15 Items Buffet', 'Welcome Drinks', 'Basic Setup', 'Service Staff'], minGuests: 100, maxGuests: 500 }, { id: 'p2', name: 'Royal', price: 1200, priceType: 'per_plate', description: 'Premium multi-cuisine', inclusions: ['25 Items Buffet', 'Live Counters', 'Premium Beverages', 'Themed Setup', 'Dedicated Manager'], minGuests: 200, maxGuests: 2000 }, { id: 'p3', name: 'Grand Feast', price: 2000, priceType: 'per_plate', description: 'Ultimate luxury dining', inclusions: ['40+ Items', 'Live Counters', 'Biryani Counter', 'Dessert Bar', 'Ice Cream Station', 'Luxury Crockery'], minGuests: 300, maxGuests: 5000 }], tags: ['Multi-cuisine', 'Live Counters', 'Biryani', 'Vegetarian', 'Non-veg'] },
};

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const v = VENDOR_MAP[params.id];
  const isNotFound = !v;

  if (isLoading) return <LoadingSkeleton />;
  if (isNotFound) return <VendorNotFound />;

  const similarVendors = Object.entries(VENDOR_MAP)
    .filter(([key]) => key !== params.id)
    .slice(0, 3)
    .map(([key, vendor]) => ({ key, ...vendor }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        {/* Back */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/vendors" className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition-colors" aria-label="Back to vendors list">
            <ArrowLeft size={16} /> Back to Vendors
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-8" {...stagger} initial="initial" animate="animate">
            {/* Left - Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero Image + Portfolio */}
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

              {/* Details */}
              <motion.div className="card p-6" {...fadeIn}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold font-heading">{v.businessName}</h1>
                      {v.verificationStatus === 'verified' && (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle size={12} /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="badge bg-brand-100 text-brand-700 capitalize">{v.category}</span>
                      <div className="flex items-center gap-1"><MapPin size={14} />{v.city}</div>
                      <div className="flex items-center gap-1"><Star size={14} className="fill-gold-400 text-gold-400" /><strong>{v.rating}</strong> ({v.totalReviews} reviews)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors" aria-label="Save to wishlist"><Heart size={18} className="text-gray-400" /></button>
                    <button className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors" aria-label="Share vendor"><Share2 size={18} className="text-gray-400" /></button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{v.description}</p>
                <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                  <div className="text-center"><div className="font-bold text-lg">{v.yearsExperience}+</div><div className="text-xs text-gray-500">Years Experience</div></div>
                  <div className="text-center"><div className="font-bold text-lg">{v.totalBookings}+</div><div className="text-xs text-gray-500">Events Done</div></div>
                  <div className="text-center"><div className="font-bold text-lg">{v.teamSize}+</div><div className="text-xs text-gray-500">Team Size</div></div>
                </div>
              </motion.div>

              {/* Packages */}
              <motion.div className="card p-6" {...fadeIn}>
                <h2 className="text-xl font-bold font-heading mb-4">Packages & Pricing</h2>
                <div className="space-y-4">
                  {v.packages.map((pkg, i) => (
                    <div key={pkg.id} className={`border-2 rounded-xl p-4 transition-colors ${i === 1 ? 'border-brand-500 bg-brand-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                      {i === 1 && <span className="badge bg-brand-600 text-white text-xs mb-2">Most Popular</span>}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                          <p className="text-sm text-gray-500">{pkg.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{pkg.minGuests}–{pkg.maxGuests} guests</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-brand-700">₹{(pkg.price / 100000).toFixed(1)}L</p>
                          <p className="text-xs text-gray-400">onwards</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {pkg.inclusions.map((inc) => (
                          <div key={inc} className="flex items-center gap-1 text-xs text-gray-600">
                            <CheckCircle size={11} className="text-green-500 shrink-0" /> {inc}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Availability Calendar */}
              <motion.div className="card p-6" id="availability" {...fadeIn}>
                <h2 className="text-xl font-bold font-heading mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-brand-600" /> Check Availability
                </h2>
                <p className="text-sm text-gray-500 mb-4">Select a date and time slot to check availability. Booked slots are marked in red.</p>
                <AvailabilityCalendar
                  vendorId={params.id}
                  vendorCategory={v.category.toLowerCase()}
                  onSlotSelect={(date: string, slot: string) => {
                    const searchParams = new URLSearchParams({ date, slot, package: v.packages[1]?.id || v.packages[0]?.id });
                    window.location.href = `/checkout/${v.id}?${searchParams.toString()}`;
                  }}
                />
              </motion.div>

              {/* Reviews */}
              <motion.div className="card p-6" {...fadeIn}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold font-heading">Reviews</h2>
                  <div className="flex items-center gap-2">
                    <Star size={18} className="fill-gold-400 text-gold-400" />
                    <span className="text-2xl font-bold">{v.rating}</span>
                    <span className="text-gray-500">({v.totalReviews})</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {MOCK_REVIEWS.map((r) => (
                    <div key={r.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold">{r.customerName[0]}</div>
                          <div>
                            <div className="font-medium text-sm">{r.customerName}</div>
                            <div className="text-xs text-gray-400">{r.date}</div>
                          </div>
                        </div>
                        <div className="flex">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={13} className="fill-gold-400 text-gold-400" />)}</div>
                      </div>
                      <p className="text-sm text-gray-600">{r.body}</p>
                      <div className="flex gap-1 mt-2">{r.tags.map((t) => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>)}</div>
                    </div>
                  ))}
                </div>

                {/* Write Review CTA */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-sm text-gray-500">Had a great experience? Share your feedback!</p>
                  <Link href={`/reviews/write/new?vendorId=${params.id}&vendorName=${encodeURIComponent(v.businessName)}`} className="btn-primary text-sm py-2 px-5 flex items-center gap-2">
                    <Star size={14} /> Write a Review
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Right - CTA Sidebar */}
            <motion.div className="lg:col-span-1" {...fadeIn}>
              <div className="card p-6 sticky top-24">
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-brand-700">₹{(v.basePrice / 100000).toFixed(1)}L</p>
                  <p className="text-sm text-gray-500">Starting price · Customizable</p>
                </div>

                <div className="space-y-3 mb-6">
                  <Link href={`/checkout/${v.id}`} className="btn-primary w-full text-center block">
                    📩 Send Enquiry
                  </Link>
                  <Link href={`/chat?vendor=${v.id}`} className="btn-secondary w-full flex items-center justify-center gap-2">
                    <MessageCircle size={16} /> Chat with Vendor
                  </Link>
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
                  <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" />Cancel up to 30 days before</div>
                  <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" />24/7 platform support</div>
                  <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" />Verified KYC vendor</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Similar Vendors */}
          {similarVendors.length > 0 && (
            <motion.div className="mt-12" {...fadeIn}>
              <h2 className="text-xl font-bold font-heading mb-6">Similar Vendors You May Like</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm">
                          <Star size={14} className="fill-gold-400 text-gold-400" />
                          <strong>{sv.rating}</strong>
                          <span className="text-gray-400">({sv.totalReviews})</span>
                        </div>
                        <p className="text-sm font-semibold text-brand-700">₹{(sv.basePrice / 100000).toFixed(1)}L</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
