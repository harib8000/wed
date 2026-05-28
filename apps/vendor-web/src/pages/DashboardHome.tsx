import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, Calendar, Star, DollarSign, Clock, CheckCircle, Circle,
  ArrowUpRight, ArrowDownRight, ArrowRight, AlertTriangle, MessageSquare, Lightbulb, Sparkles,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  statsApi, bookingApi, profileApi,
  type VendorStats, type MonthlyData, type VendorBooking, type VendorProfile,
} from '../lib/api';

const MOCK_STATS: VendorStats = {
  totalBookings: 47, revenueThisMonth: 240000, avgRating: 4.8,
  responseRate: 96, pendingEnquiries: 3, completedBookings: 28,
};

const MOCK_CHART: MonthlyData[] = [
  { month: 'Jan', bookings: 4, revenue: 120000 },
  { month: 'Feb', bookings: 6, revenue: 180000 },
  { month: 'Mar', bookings: 8, revenue: 240000 },
  { month: 'Apr', bookings: 5, revenue: 150000 },
  { month: 'May', bookings: 9, revenue: 270000 },
  { month: 'Jun', bookings: 7, revenue: 210000 },
];

const MOCK_PENDING: VendorBooking[] = [
  { id: '1', bookingNumber: 'WB-001', customerId: '1', customerName: 'Priya & Rahul', customerPhone: '+919876543210', eventDate: '2027-02-14', eventType: 'Wedding', eventCity: 'Hyderabad', status: 'ENQUIRY', quotedAmountPaise: 9000000, platformFeePaise: null, packageName: 'Grand Gold', createdAt: new Date().toISOString() },
  { id: '2', bookingNumber: 'WB-002', customerId: '2', customerName: 'Ananya & Vikram', customerPhone: '+919876543211', eventDate: '2027-03-20', eventType: 'Wedding', eventCity: 'Mumbai', status: 'QUOTE_SENT', quotedAmountPaise: 5000000, platformFeePaise: null, packageName: 'Silver Basic', createdAt: new Date().toISOString() },
  { id: '3', bookingNumber: 'WB-003', customerId: '3', customerName: 'Meera & Arun', customerPhone: '+919876543212', eventDate: '2027-04-05', eventType: 'Wedding', eventCity: 'Delhi', status: 'CONFIRMED', quotedAmountPaise: 15000000, platformFeePaise: null, packageName: 'Platinum', createdAt: new Date().toISOString() },
];

const MOCK_PROFILE: VendorProfile = {
  id: 'v1',
  userId: 'u1',
  businessName: 'Royal Grand Palace',
  slug: 'royal-grand-palace',
  category: 'Venue',
  city: 'Hyderabad',
  state: 'Telangana',
  tagline: 'Premier wedding venue',
  description: "Royal Grand Palace is Hyderabad's premier wedding venue with indoor and outdoor options for up to 2000 guests.",
  avgRating: 4.8,
  reviewCount: 47,
  bookingCount: 120,
  plusMember: true,
  status: 'ACTIVE',
  yearsExperience: 12,
  teamSize: 25,
  whatsappNumber: '+919876543210',
  websiteUrl: 'https://royalgrandpalace.in',
  instagramUrl: 'https://instagram.com/royalgrand',
  gstNumber: '36AAACR1234F1Z5',
  panNumber: 'AAACR1234F',
  gstVerified: true,
  panVerified: false,
  packages: [],
};

function formatINR(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(0)}K`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export function DashboardHome() {
  const { data: stats, isError: statsError } = useQuery({
    queryKey: ['vendor-stats'],
    queryFn: statsApi.getDashboard,
    retry: 1, staleTime: 60_000,
  });

  const { data: chartData } = useQuery({
    queryKey: ['vendor-monthly'],
    queryFn: statsApi.getMonthlyRevenue,
    retry: 1, staleTime: 60_000,
  });

  const { data: recentBookings } = useQuery({
    queryKey: ['vendor-recent-bookings'],
    queryFn: () => bookingApi.list({ limit: 5 }),
    retry: 1, staleTime: 30_000,
  });

  const { data: vendorProfile } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: profileApi.getProfile,
    retry: 1,
    staleTime: 60_000,
  });

  const s = stats ?? MOCK_STATS;
  const chart = chartData ?? MOCK_CHART;
  const pending = recentBookings?.data?.bookings ?? MOCK_PENDING;
  const profile = vendorProfile ?? MOCK_PROFILE;
  const isMock = statsError;

  const reviewCount = (s as VendorStats & { reviewCount?: number }).reviewCount ?? 24;
  const avgResponseTime = '2.3 hrs';
  const conversionRate = s.totalBookings > 0
    ? `${Math.round((s.completedBookings / s.totalBookings) * 100)}%`
    : '34%';
  const quotePending = Math.max(pending.filter((b) => b.status === 'QUOTE_SENT').length, 1);
  const reviewsToReply = Math.max(Math.min(Math.round(reviewCount / 12), 4), 2);
  const availabilityConfigured = Boolean((profile as VendorProfile & { availabilityConfigured?: boolean }).availabilityConfigured);
  const onboardingSteps = [
    {
      title: 'Complete Business Profile',
      description: 'Add your business name, description, and city so customers can discover you.',
      done: Boolean(profile.businessName && profile.description && profile.city),
      href: '/profile',
      cta: 'Complete profile',
    },
    {
      title: 'Upload Portfolio Photos',
      description: 'Showcase recent work to build trust and increase enquiries.',
      done: profile.packages.length > 0,
      href: '/profile?tab=portfolio',
      cta: 'Add portfolio',
    },
    {
      title: 'Create First Package',
      description: 'Publish at least one package so customers can request quotes faster.',
      done: profile.packages.length > 0,
      href: '/profile?tab=packages',
      cta: 'Create package',
    },
    {
      title: 'Set Availability',
      description: 'Keep your calendar updated so you do not miss qualified leads.',
      done: availabilityConfigured,
      href: '/calendar',
      cta: 'Set availability',
    },
    {
      title: 'Complete KYC',
      description: 'Verify your business to unlock trust badges and premium features.',
      done: profile.gstVerified || profile.panVerified,
      href: '/profile?tab=kyc',
      cta: 'Finish KYC',
    },
  ];
  const completedOnboardingSteps = onboardingSteps.filter((step) => step.done).length;
  const onboardingProgress = Math.round((completedOnboardingSteps / onboardingSteps.length) * 100);
  const onboardingComplete = completedOnboardingSteps === onboardingSteps.length;

  const STAT_CARDS = [
    { label: 'Total Bookings', value: String(s.totalBookings), icon: Calendar, change: '▲ 12%', tone: 'text-emerald-600', color: 'text-brand-600 bg-brand-50', meta: s.pendingEnquiries > 0 ? `${s.pendingEnquiries} pending` : 'Steady pipeline' },
    { label: 'Revenue This Month', value: formatINR(s.revenueThisMonth), icon: DollarSign, change: '▲ 8%', tone: 'text-emerald-600', color: 'text-green-600 bg-green-50', meta: 'Month-over-month growth' },
    { label: 'Avg. Rating', value: s.avgRating.toFixed(1), icon: Star, change: '▲ 4%', tone: 'text-emerald-600', color: 'text-yellow-600 bg-yellow-50', meta: `${reviewCount} reviews` },
    { label: 'Response Rate', value: `${s.responseRate}%`, icon: MessageSquare, change: s.responseRate >= 90 ? '▲ 6%' : '▼ 3%', tone: s.responseRate >= 90 ? 'text-emerald-600' : 'text-red-600', color: 'text-blue-600 bg-blue-50', meta: s.responseRate >= 90 ? 'Excellent' : 'Needs attention' },
    { label: 'Avg. Response Time', value: avgResponseTime, icon: Clock, change: '▼ 5%', tone: 'text-emerald-600', color: 'text-purple-600 bg-purple-50', meta: 'Faster replies this month' },
    { label: 'Enquiry → Booking', value: conversionRate, icon: TrendingUp, change: '▲ 12%', tone: 'text-emerald-600', color: 'text-emerald-600 bg-emerald-50', meta: 'Conversion rate' },
  ];

  const ACTION_ITEMS = [
    {
      title: `${s.pendingEnquiries} enquiries need response`,
      description: 'Reach out quickly to keep your profile ranking high.',
      href: '/leads',
      cta: 'Respond now',
      icon: MessageSquare,
      accent: 'bg-amber-50 text-amber-700',
    },
    {
      title: `${quotePending} quote pending`,
      description: 'Follow up on quotes before customers compare alternatives.',
      href: '/bookings',
      cta: 'Review quotes',
      icon: DollarSign,
      accent: 'bg-blue-50 text-blue-700',
    },
    {
      title: `${reviewsToReply} reviews to reply`,
      description: 'Thoughtful responses build trust with future customers.',
      href: '/reviews',
      cta: 'Reply to reviews',
      icon: Star,
      accent: 'bg-green-50 text-green-700',
    },
  ];

  const PERFORMANCE_TIPS = [
    {
      title: 'Respond to enquiries within 2 hours to improve your ranking',
      description: `Your current average is ${avgResponseTime}. Faster replies often convert more couples.`,
    },
    {
      title: 'Complete your profile to get 3x more enquiries',
      description: 'Finish KYC, bank account, and service details to unlock higher trust signals.',
    },
    {
      title: 'Add portfolio photos to attract more customers',
      description: 'Vendors with fresh photos usually see better click-through and stronger shortlists.',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
        <p className="text-gray-500 text-sm">
          {isMock && <span className="text-amber-600"><AlertTriangle size={13} className="inline mr-1 -mt-0.5" />API unavailable — showing demo data. </span>}
          Welcome back! Here's your business overview.
        </p>
      </div>

      <div className="mb-8">
        <div className="card p-5 border border-gray-100">
          {onboardingComplete ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-gray-900">🎉 Setup complete!</h2>
                    <span className="badge bg-green-100 text-green-700">Ready for enquiries</span>
                  </div>
                  <p className="text-sm text-gray-500">Your storefront is set up and ready to convert more leads.</p>
                </div>
              </div>
              <a href="/profile" className="btn-secondary text-sm py-2 px-3 inline-flex items-center gap-2 whitespace-nowrap">
                View profile <ArrowRight size={14} />
              </a>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-gray-900">Onboarding checklist</h2>
                      <span className="badge bg-brand-50 text-brand-700">New vendor setup</span>
                    </div>
                    <p className="text-sm text-gray-500">Finish these steps to improve trust signals and start converting more enquiries.</p>
                  </div>
                </div>
                <div className="min-w-[140px] rounded-2xl bg-gray-50 px-4 py-3 border border-gray-100">
                  <div className="text-xs text-gray-500">Progress</div>
                  <div className="text-lg font-semibold text-gray-900">{completedOnboardingSteps}/{onboardingSteps.length} steps completed</div>
                </div>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-5 overflow-hidden">
                <div className="bg-gradient-to-r from-brand-500 to-purple-500 h-2.5 rounded-full transition-all" style={{ width: `${onboardingProgress}%` }} />
              </div>

              <div className="space-y-3">
                {onboardingSteps.map((step) => (
                  <div key={step.title} className="rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`mt-0.5 ${step.done ? 'text-green-500' : 'text-gray-300'}`}>
                        {step.done ? <CheckCircle size={18} /> : <Circle size={18} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                          <span className={`badge text-xs ${step.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {step.done ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                      </div>
                    </div>
                    <a href={step.href} className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1 whitespace-nowrap self-start md:self-center">
                      {step.cta} <ArrowRight size={13} />
                    </a>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon;
          const ChangeIcon = stat.change.startsWith('▼') ? ArrowDownRight : ArrowUpRight;
          return (
            <div key={stat.label} className="stat-card">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <Icon size={18} />
                </div>
                <span className={`text-xs font-medium flex items-center gap-1 ${stat.tone}`}>
                  <ChangeIcon size={12} /> {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.meta}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Bookings & Revenue (6 months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar yAxisId="left" dataKey="bookings" fill="#c026d3" radius={[4, 4, 0, 0]} name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Booking Requests</h3>
            <a href="/bookings" className="text-xs text-brand-600 hover:underline">View all</a>
          </div>
          <div className="space-y-3">
            {pending.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <span className="text-brand-700 text-xs font-bold">{b.customerName[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{b.customerName}</p>
                  <p className="text-xs text-gray-400">{new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {b.packageName ?? b.eventType}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{b.quotedAmountPaise ? formatINR(b.quotedAmountPaise) : '—'}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : b.status === 'QUOTE_SENT' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {b.status.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Action Required</h3>
            <span className="text-xs text-gray-400">Prioritise these today</span>
          </div>
          <div className="space-y-3">
            {ACTION_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.accent}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    </div>
                    <a href={item.href} className="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap">
                      {item.cta}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Performance Tips</h3>
            <Lightbulb size={16} className="text-amber-500" />
          </div>
          <div className="space-y-3">
            {PERFORMANCE_TIPS.map((tip, idx) => (
              <div key={tip.title} className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{tip.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{tip.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Profile Completion</h3>
          <span className="text-brand-600 font-bold text-sm">75%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div className="bg-gradient-to-r from-brand-500 to-purple-500 h-2 rounded-full" style={{ width: '75%' }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Basic Info', done: true }, { label: 'Portfolio (8+)', done: true },
            { label: 'KYC Verification', done: false }, { label: 'Bank Account', done: false },
          ].map((item) => (
            <div key={item.label} className={`flex items-center gap-2 text-sm ${item.done ? 'text-green-700' : 'text-gray-500'}`}>
              <CheckCircle size={14} className={item.done ? 'text-green-500' : 'text-gray-300'} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
