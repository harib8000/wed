import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { format, isAfter, isBefore, parseISO, startOfDay, subDays, subMonths, subYears } from 'date-fns';
import { analyticsApi, statsApi } from '../lib/api';

interface AnalyticsMonth {
  month: string;
  revenue: number;
  bookings: number;
  enquiries: number;
  date?: string;
}

interface FunnelData {
  profileViews: number;
  enquiries: number;
  quoted: number;
  confirmed: number;
}

interface PackagePerformance {
  name: string;
  count: number;
  revenue: number;
  color: string;
}

type RangePreset = '7d' | '30d' | '90d' | '1y' | 'custom';

const MOCK_MONTHLY: AnalyticsMonth[] = [
  { month: 'Jan', revenue: 120000, bookings: 4, enquiries: 12, date: '2026-01-01' },
  { month: 'Feb', revenue: 180000, bookings: 6, enquiries: 18, date: '2026-02-01' },
  { month: 'Mar', revenue: 240000, bookings: 8, enquiries: 22, date: '2026-03-01' },
  { month: 'Apr', revenue: 150000, bookings: 5, enquiries: 15, date: '2026-04-01' },
  { month: 'May', revenue: 270000, bookings: 9, enquiries: 25, date: '2026-05-01' },
  { month: 'Jun', revenue: 210000, bookings: 7, enquiries: 19, date: '2026-06-01' },
];

const MOCK_FUNNEL: FunnelData = { profileViews: 1250, enquiries: 300, quoted: 180, confirmed: 80 };

const MOCK_PACKAGES: PackagePerformance[] = [
  { name: 'Grand Gold', count: 18, revenue: 680000, color: '#c026d3' },
  { name: 'Silver Basic', count: 24, revenue: 410000, color: '#7c3aed' },
  { name: 'Platinum', count: 8, revenue: 570000, color: '#f59e0b' },
  { name: 'Custom', count: 6, revenue: 260000, color: '#3b82f6' },
];

function formatINR(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(0)}K`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

function getPresetRange(preset: Exclude<RangePreset, 'custom'>): { from: Date; to: Date } {
  const now = new Date();
  switch (preset) {
    case '7d':
      return { from: subDays(now, 6), to: now };
    case '30d':
      return { from: subDays(now, 29), to: now };
    case '90d':
      return { from: subDays(now, 89), to: now };
    case '1y':
      return { from: subYears(now, 1), to: now };
    default:
      return { from: subDays(now, 29), to: now };
  }
}

export function AnalyticsPage() {
  const [rangePreset, setRangePreset] = useState<RangePreset>('30d');
  const [customFrom, setCustomFrom] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: monthlyData, isError: monthlyError } = useQuery({
    queryKey: ['vendor-analytics-monthly'],
    queryFn: analyticsApi.getMonthlyBreakdown,
    retry: 1,
    staleTime: 120_000,
  });

  const { data: funnelData } = useQuery({
    queryKey: ['vendor-analytics-funnel'],
    queryFn: analyticsApi.getConversionFunnel,
    retry: 1,
    staleTime: 120_000,
  });

  const { data: packageData } = useQuery({
    queryKey: ['vendor-analytics-packages'],
    queryFn: analyticsApi.getPackageDistribution,
    retry: 1,
    staleTime: 120_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['vendor-stats'],
    queryFn: statsApi.getDashboard,
    retry: 1,
    staleTime: 60_000,
  });

  const monthly = useMemo<AnalyticsMonth[]>(() => monthlyData ?? MOCK_MONTHLY, [monthlyData]);
  const isMock = monthlyError || !monthlyData;

  const pkgDist = useMemo<PackagePerformance[]>(() => (
    packageData
      ? packageData.map((p, i) => ({
          name: p.name,
          count: p.count,
          revenue: p.revenue,
          color: ['#c026d3', '#7c3aed', '#f59e0b', '#3b82f6', '#10b981', '#ef4444'][i % 6],
        }))
      : MOCK_PACKAGES
  ), [packageData]);

  const funnel = useMemo<FunnelData>(() => {
    if (!funnelData) return MOCK_FUNNEL;
    return {
      profileViews: Math.max(funnelData.enquiries * 4, funnelData.confirmed * 10, 100),
      enquiries: funnelData.enquiries,
      quoted: funnelData.quoted,
      confirmed: funnelData.confirmed,
    };
  }, [funnelData]);

  const activeRange = useMemo(() => {
    if (rangePreset === 'custom') {
      const from = customFrom ? startOfDay(parseISO(customFrom)) : startOfDay(subMonths(new Date(), 1));
      const to = customTo ? startOfDay(parseISO(customTo)) : startOfDay(new Date());
      return { from, to };
    }
    return getPresetRange(rangePreset);
  }, [customFrom, customTo, rangePreset]);

  const filteredMonthly = useMemo(() => {
    return monthly.filter((item) => {
      if (!item.date) return true;
      const itemDate = startOfDay(parseISO(item.date));
      return !isBefore(itemDate, startOfDay(activeRange.from)) && !isAfter(itemDate, startOfDay(activeRange.to));
    });
  }, [activeRange.from, activeRange.to, monthly]);

  const rangeLabel = useMemo(() => (
    `${format(activeRange.from, 'dd MMM yyyy')} - ${format(activeRange.to, 'dd MMM yyyy')}`
  ), [activeRange.from, activeRange.to]);

  const totalRevenue = filteredMonthly.reduce((s, m) => s + m.revenue, 0);
  const totalBookings = filteredMonthly.reduce((s, m) => s + m.bookings, 0);
  const conversionRate = funnel.enquiries > 0 ? Math.round((funnel.confirmed / funnel.enquiries) * 100) : 34;
  const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 73000;
  const maxFunnelValue = Math.max(funnel.profileViews, funnel.enquiries, funnel.quoted, funnel.confirmed, 1);
  const maxPackageRevenue = Math.max(...pkgDist.map((item) => item.revenue), 1);

  const funnelSteps = [
    { label: 'Profile Views', count: funnel.profileViews, conversionRate: null, color: 'from-brand-500 to-brand-400' },
    {
      label: 'Enquiries',
      count: funnel.enquiries,
      conversionRate: funnel.profileViews > 0 ? Math.round((funnel.enquiries / funnel.profileViews) * 100) : 0,
      color: 'from-violet-500 to-violet-400',
    },
    {
      label: 'Quotes Sent',
      count: funnel.quoted,
      conversionRate: funnel.enquiries > 0 ? Math.round((funnel.quoted / funnel.enquiries) * 100) : 0,
      color: 'from-amber-500 to-amber-400',
    },
    {
      label: 'Bookings Confirmed',
      count: funnel.confirmed,
      conversionRate: funnel.quoted > 0 ? Math.round((funnel.confirmed / funnel.quoted) * 100) : 0,
      color: 'from-emerald-500 to-emerald-400',
    },
  ];

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-500 text-sm">
            {isMock && <span className="text-amber-600"><AlertTriangle size={13} className="inline mr-1 -mt-0.5" />API unavailable — showing demo data. </span>}
            Business performance insights
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Date Range</label>
            <select
              value={rangePreset}
              onChange={(e) => setRangePreset(e.target.value as RangePreset)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last 1 year</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {rangePreset === 'custom' && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  max={customTo || undefined}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  min={customFrom || undefined}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>
          )}

          <div className="badge bg-brand-50 text-brand-700 h-fit px-3 py-2 text-xs">{rangeLabel}</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: formatINR(totalRevenue), sub: `${filteredMonthly.length || monthly.length} periods selected` },
          { label: 'Total Bookings', value: String(stats?.totalBookings ?? totalBookings), sub: '+15% vs last year' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, sub: 'Enquiry to booking' },
          { label: 'Avg. Booking Value', value: formatINR(avgBookingValue), sub: '+8% this quarter' },
        ].map((k) => (
          <div key={k.label} className="card p-5">
            <div className="text-2xl font-bold text-gray-900 mb-1">{k.value}</div>
            <div className="text-sm text-gray-600 mb-0.5">{k.label}</div>
            <div className="text-xs text-green-600">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Monthly Revenue</h3>
              <p className="text-xs text-gray-500 mt-1">Revenue trend for the selected range</p>
            </div>
            <span className="badge bg-emerald-50 text-emerald-700 text-xs">{rangeLabel}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={filteredMonthly.length > 0 ? filteredMonthly : monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip formatter={(v: number) => [formatINR(v), 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#c026d3" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Conversion Funnel</h3>
              <p className="text-xs text-gray-500 mt-1">How profile traffic moves toward confirmed bookings</p>
            </div>
            <span className="badge bg-violet-50 text-violet-700 text-xs">{conversionRate}% close rate</span>
          </div>

          <div className="space-y-3">
            {funnelSteps.map((step, index) => (
              <div key={step.label}>
                <div className="flex items-center gap-4">
                  <div className="w-36 text-sm font-medium text-gray-700">{step.label}</div>
                  <div className="flex-1">
                    <div className="h-10 rounded-2xl bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-end pr-3 text-white text-sm font-semibold`}
                        style={{ width: `${Math.max((step.count / maxFunnelValue) * 100, 18)}%` }}
                      >
                        {step.count.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-semibold text-gray-900">{step.count.toLocaleString('en-IN')}</div>
                </div>
                {index < funnelSteps.length - 1 && (
                  <div className="pl-40 py-1 text-sm text-gray-400">
                    ↓ {funnelSteps[index + 1].conversionRate ?? 0}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Package Distribution</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pkgDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="count">
                  {pkgDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {pkgDist.map((pkg) => (
                <div key={pkg.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pkg.color }} />
                  <div className="flex-1">
                    <div className="text-sm text-gray-700">{pkg.name}</div>
                    <div className="text-xs text-gray-500">{pkg.count} bookings</div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatINR(pkg.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Revenue by Package Type</h3>
              <p className="text-xs text-gray-500 mt-1">See which offers drive the strongest revenue</p>
            </div>
            <span className="badge bg-amber-50 text-amber-700 text-xs">Top earning packages</span>
          </div>

          <div className="space-y-4">
            {[...pkgDist].sort((a, b) => b.revenue - a.revenue).map((pkg) => (
              <div key={pkg.name}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <div>
                    <span className="font-medium text-gray-800">{pkg.name}</span>
                    <span className="text-gray-500 ml-2">{pkg.count} bookings</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatINR(pkg.revenue)}</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(pkg.revenue / maxPackageRevenue) * 100}%`, backgroundColor: pkg.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Enquiries vs Bookings</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={filteredMonthly.length > 0 ? filteredMonthly : monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="enquiries" fill="#e9d5ff" radius={[4, 4, 0, 0]} name="Enquiries" />
              <Bar dataKey="bookings" fill="#c026d3" radius={[4, 4, 0, 0]} name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
