import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, Calendar, Star, DollarSign, Clock, CheckCircle, Circle,
  ArrowUpRight, ArrowDownRight, ArrowRight, AlertTriangle, MessageSquare, Lightbulb, Sparkles, Target,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  statsApi, bookingApi, profileApi,
  type VendorStats, type MonthlyData, type VendorBooking, type VendorProfile, type DashboardRange,
} from '../lib/api';

const DASHBOARD_RANGES: Array<{ value: DashboardRange; label: string; shortLabel: string }> = [
  { value: '7d', label: 'Last 7 days', shortLabel: '7D' },
  { value: '30d', label: 'Last 30 days', shortLabel: '30D' },
  { value: '90d', label: 'Last 90 days', shortLabel: '90D' },
];

const MOCK_STATS_BY_RANGE: Record<DashboardRange, VendorStats> = {
  '7d': {
    totalBookings: 9,
    revenueThisMonth: 6800000,
    avgRating: 4.8,
    responseRate: 94,
    pendingEnquiries: 2,
    completedBookings: 6,
  },
  '30d': {
    totalBookings: 47,
    revenueThisMonth: 24000000,
    avgRating: 4.8,
    responseRate: 96,
    pendingEnquiries: 3,
    completedBookings: 28,
  },
  '90d': {
    totalBookings: 126,
    revenueThisMonth: 71500000,
    avgRating: 3.9,
    responseRate: 88,
    pendingEnquiries: 8,
    completedBookings: 74,
  },
};

const MOCK_CHART_BY_RANGE: Record<DashboardRange, MonthlyData[]> = {
  '7d': [
    { month: 'Mon', bookings: 1, revenue: 900000 },
    { month: 'Tue', bookings: 2, revenue: 1800000 },
    { month: 'Wed', bookings: 0, revenue: 0 },
    { month: 'Thu', bookings: 1, revenue: 750000 },
    { month: 'Fri', bookings: 2, revenue: 1650000 },
    { month: 'Sat', bookings: 2, revenue: 1100000 },
    { month: 'Sun', bookings: 1, revenue: 600000 },
  ],
  '30d': [
    { month: 'Week 1', bookings: 9, revenue: 4200000 },
    { month: 'Week 2', bookings: 12, revenue: 5800000 },
    { month: 'Week 3', bookings: 11, revenue: 6100000 },
    { month: 'Week 4', bookings: 15, revenue: 7900000 },
  ],
  '90d': [
    { month: 'Mar', bookings: 34, revenue: 19800000 },
    { month: 'Apr', bookings: 41, revenue: 23400000 },
    { month: 'May', bookings: 51, revenue: 28300000 },
  ],
};

const MOCK_PENDING: VendorBooking[] = [
  { id: '1', bookingNumber: 'WB-001', customerId: '1', customerName: 'Priya & Rahul', customerPhone: '+919876543210', eventDate: '2027-02-14', eventType: 'Wedding', eventCity: 'Hyderabad', status: 'ENQUIRY', quotedAmountPaise: 9000000, platformFeePaise: null, packageName: 'Grand Gold', createdAt: new Date().toISOString() },
  { id: '2', bookingNumber: 'WB-002', customerId: '2', customerName: 'Ananya & Vikram', customerPhone: '+919876543211', eventDate: '2027-03-20', eventType: 'Wedding', eventCity: 'Mumbai', status: 'QUOTE_SENT', quotedAmountPaise: 5000000, platformFeePaise: null, packageName: 'Silver Basic', createdAt: new Date().toISOString() },
  { id: '3', bookingNumber: 'WB-003', customerId: '3', customerName: 'Meera & Arun', customerPhone: '+919876543212', eventDate: '2027-04-05', eventType: 'Wedding', eventCity: 'Delhi', status: 'CONFIRMED', quotedAmountPaise: 15000000, platformFeePaise: null, packageName: 'Platinum', createdAt: new Date().toISOString() },
];

const MOCK_PROFILE: VendorProfile & { portfolio?: Array<{ id: string }> } = {
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
  status: 'PENDING_KYC',
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
  portfolio: [],
};

const MONTHLY_REVENUE_TARGET_KEY = 'vendor-dashboard-monthly-revenue-target';

function formatINR(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(0)}K`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

function getStoredRevenueTarget(): number {
  if (typeof window === 'undefined') return 500000;
  const saved = Number(window.localStorage.getItem(MONTHLY_REVENUE_TARGET_KEY));
  return Number.isFinite(saved) && saved > 0 ? saved : 500000;
}

export function DashboardHome() {
  const [selectedRange, setSelectedRange] = useState<DashboardRange>('30d');
  const [monthlyRevenueTarget, setMonthlyRevenueTarget] = useState<number>(getStoredRevenueTarget);

  useEffect(() => {
    window.localStorage.setItem(MONTHLY_REVENUE_TARGET_KEY, String(monthlyRevenueTarget));
  }, [monthlyRevenueTarget]);

  const { data: stats, isError: statsError } = useQuery({
    queryKey: ['vendor-stats', selectedRange],
    queryFn: () => statsApi.getDashboard(selectedRange),
    retry: 1, staleTime: 60_000,
  });

  const { data: chartData, isError: chartError } = useQuery({
    queryKey: ['vendor-monthly', selectedRange],
    queryFn: () => statsApi.getMonthlyRevenue(selectedRange),
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

  const selectedRangeMeta = DASHBOARD_RANGES.find((range) => range.value === selectedRange) ?? DASHBOARD_RANGES[1];
  const s = stats ?? MOCK_STATS_BY_RANGE[selectedRange];
  const chart = chartData ?? MOCK_CHART_BY_RANGE[selectedRange];
  const pending = recentBookings?.data?.bookings ?? MOCK_PENDING;
  const profile = vendorProfile ?? MOCK_PROFILE;
  const isMock = statsError || chartError || !stats;

  const vendorWithExtras = profile as VendorProfile & {
    reviewCount?: number;
    availabilityConfigured?: boolean;
    portfolio?: Array<{ id: string }>;
  };

  const reviewCount = vendorWithExtras.reviewCount ?? 24;
  const avgResponseTime = '2.3 hrs';
  const conversionRate = s.totalBookings > 0
    ? `${Math.round((s.completedBookings / s.totalBookings) * 100)}%`
    : '34%';
  const quotePending = Math.max(pending.filter((b) => b.status === 'QUOTE_SENT').length, 1);
  const reviewsToReply = Math.max(Math.min(Math.round(reviewCount / 12), 4), 2);
  const availabilityConfigured = Boolean(vendorWithExtras.availabilityConfigured);
  const portfolioCount = vendorWithExtras.portfolio?.length ?? 0;
  const currentRevenue = s.revenueThisMonth;
  const monthlyRevenueTargetPaise = monthlyRevenueTarget * 100;
  const goalProgress = monthlyRevenueTargetPaise > 0
    ? Math.min(Math.round((currentRevenue / monthlyRevenueTargetPaise) * 100), 100)
    : 0;
  const remainingToGoal = Math.max(monthlyRevenueTargetPaise - currentRevenue, 0);

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
      done: portfolioCount > 0,
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
    { label: `Revenue (${selectedRangeMeta.shortLabel})`, value: formatINR(s.revenueThisMonth), icon: DollarSign, change: '▲ 8%', tone: 'text-emerald-600', color: 'text-green-600 bg-green-50', meta: `${selectedRangeMeta.label} performance` },
    { label: 'Avg. Rating', value: s.avgRating.toFixed(1), icon: Star, change: s.avgRating >= 4 ? '▲ 4%' : '▼ 6%', tone: s.avgRating >= 4 ? 'text-emerald-600' : 'text-red-600', color: 'text-yellow-600 bg-yellow-50', meta: `${reviewCount} reviews` },
    { label: 'Response Rate', value: `${s.responseRate}%`, icon: MessageSquare, change: s.responseRate >= 90 ? '▲ 6%' : '▼ 3%', tone: s.responseRate >= 90 ? 'text-emerald-600' : 'text-red-600', color: 'text-blue-600 bg-blue-50', meta: s.responseRate >= 90 ? 'Excellent' : 'Needs attention' },
    { label: 'Avg. Response Time', value: avgResponseTime, icon: Clock, change: '▼ 5%', tone: 'text-emerald-600', color: 'text-purple-600 bg-purple-50', meta: 'Faster replies this month' },
    { label: 'Enquiry → Booking', value: conversionRate, icon: TrendingUp, change: '▲ 12%', tone: 'text-emerald-600', color: 'text-emerald-600 bg-emerald-50', meta: 'Conversion rate' },
  ];

  const criticalAlerts = [
    s.responseRate < 90
      ? {
        title: 'Response rate is below 90%',
        description: 'Reply to new enquiries faster to protect your search ranking and lead quality.',
        href: '/leads',
        cta: 'Open leads',
      }
      : null,
    profile.status !== 'ACTIVE'
      ? {
        title: 'KYC verification is still pending',
        description: 'Finish verification to unlock trust badges and avoid visibility limits on your listing.',
        href: '/profile?tab=kyc',
        cta: 'Complete KYC',
      }
      : null,
    portfolioCount === 0
      ? {
        title: 'No portfolio photos uploaded',
        description: 'Customers shortlist vendors with fresh photos more often. Add at least 6 highlights.',
        href: '/profile?tab=portfolio',
        cta: 'Upload photos',
      }
      : null,
    s.avgRating < 4
      ? {
        title: 'Average rating needs attention',
        description: 'A rating below 4.0 can reduce trust. Review recent feedback and respond to negative reviews quickly.',
        href: '/reviews',
        cta: 'Review feedback',
      }
      : null,
  ].filter((alert): alert is { title: string; description: string; href: string; cta: string } => Boolean(alert));

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
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-500 text-sm">
            {isMock && <span className="text-amber-600"><AlertTriangle size={13} className="inline mr-1 -mt-0.5" />API unavailable — showing demo data. </span>}
            Welcome back! Here's your business overview.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
          <label htmlFor="dashboard-range" className="sr-only">Select dashboard time range</label>
          <select
            id="dashboard-range"
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value as DashboardRange)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:border-brand-500 sm:hidden"
          >
            {DASHBOARD_RANGES.map((range) => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
          <div className="hidden sm:flex items-center gap-1">
            {DASHBOARD_RANGES.map((range) => (
              <button
                key={range.value}
                type="button"
                onClick={() => setSelectedRange(range.value)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${selectedRange === range.value ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
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

      {criticalAlerts.length > 0 && (
        <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50/80 p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600" />
            <div>
              <h2 className="font-semibold text-amber-950">Critical alerts</h2>
              <p className="text-sm text-amber-800">Address these issues to protect visibility, trust, and conversions.</p>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {criticalAlerts.map((alert) => (
              <div key={alert.title} className="rounded-2xl border border-amber-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-amber-100 p-2 text-amber-700">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                    <p className="mt-1 text-xs text-gray-600">{alert.description}</p>
                  </div>
                  <a href={alert.href} className="btn-secondary whitespace-nowrap text-xs py-1.5 px-3">
                    {alert.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Bookings & Revenue ({selectedRangeMeta.label})</h3>
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
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

        <div className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Monthly revenue goal</h3>
              <p className="text-xs text-gray-500">Stored on this device for quick tracking.</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Target size={18} />
            </div>
          </div>

          <label htmlFor="monthly-target" className="text-xs font-medium text-gray-500">Target (₹)</label>
          <input
            id="monthly-target"
            type="number"
            min={0}
            step={1000}
            value={monthlyRevenueTarget}
            onChange={(e) => setMonthlyRevenueTarget(Math.max(0, Number(e.target.value) || 0))}
            className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-brand-500"
            placeholder="500000"
          />

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-xs text-gray-500">Current revenue</div>
              <div className="text-xl font-bold text-gray-900">{formatINR(currentRevenue)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Target</div>
              <div className="text-sm font-semibold text-gray-900">{formatINR(monthlyRevenueTargetPaise)}</div>
            </div>
          </div>

          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-2.5 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all" style={{ width: `${goalProgress}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="font-medium text-brand-700">{goalProgress}% achieved</span>
            <span className="text-gray-500">{remainingToGoal > 0 ? `${formatINR(remainingToGoal)} to go` : 'Target achieved 🎉'}</span>
          </div>
          <p className="mt-3 text-xs text-gray-500">Tracking {selectedRangeMeta.label.toLowerCase()} revenue against your saved monthly target.</p>
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
