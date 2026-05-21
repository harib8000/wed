import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { analyticsApi, statsApi } from '../lib/api';

const MOCK_MONTHLY = [
  { month: 'Jan', revenue: 120000, bookings: 4, enquiries: 12 },
  { month: 'Feb', revenue: 180000, bookings: 6, enquiries: 18 },
  { month: 'Mar', revenue: 240000, bookings: 8, enquiries: 22 },
  { month: 'Apr', revenue: 150000, bookings: 5, enquiries: 15 },
  { month: 'May', revenue: 270000, bookings: 9, enquiries: 25 },
  { month: 'Jun', revenue: 210000, bookings: 7, enquiries: 19 },
];

const MOCK_FUNNEL = { enquiries: 111, quoted: 67, confirmed: 39, completed: 28 };

const MOCK_PACKAGES = [
  { name: 'Grand Gold', value: 45, color: '#c026d3' },
  { name: 'Silver Basic', value: 30, color: '#7c3aed' },
  { name: 'Platinum', value: 15, color: '#f59e0b' },
  { name: 'Custom', value: 10, color: '#3b82f6' },
];

export function AnalyticsPage() {
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

  const monthly = monthlyData ?? MOCK_MONTHLY;
  const funnel = funnelData ?? MOCK_FUNNEL;
  const isMock = monthlyError || !monthlyData;

  const pkgDist = packageData
    ? packageData.map((p, i) => ({
        name: p.name,
        value: p.count,
        color: ['#c026d3', '#7c3aed', '#f59e0b', '#3b82f6', '#10b981', '#ef4444'][i % 6],
      }))
    : MOCK_PACKAGES;

  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalBookings = monthly.reduce((s, m) => s + m.bookings, 0);
  const conversionRate = funnel.enquiries > 0 ? Math.round((funnel.confirmed / funnel.enquiries) * 100) : 34;
  const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 73000;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
      <p className="text-gray-500 text-sm mb-6">
        {isMock && <span className="text-amber-600"><AlertTriangle size={13} className="inline mr-1 -mt-0.5" />API unavailable — showing demo data. </span>}
        Business performance insights
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue (YTD)', value: `₹${(totalRevenue / 100000).toFixed(1)}L`, sub: '+23% vs last year' },
          { label: 'Total Bookings (YTD)', value: String(stats?.totalBookings ?? totalBookings), sub: '+15% vs last year' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, sub: 'Enquiry to booking' },
          { label: 'Avg. Booking Value', value: `₹${Math.round(avgBookingValue / 1000)}K`, sub: '+8% this quarter' },
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
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v/1000}K`} />
              <Tooltip formatter={(v: number) => [`₹${(v/1000).toFixed(0)}K`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#c026d3" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Package Distribution</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pkgDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {pkgDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pkgDist.map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm text-gray-600">{c.name}</span>
                  <span className="text-sm font-semibold text-gray-900 ml-auto">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Enquiries vs Bookings</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="enquiries" fill="#e9d5ff" radius={[4,4,0,0]} name="Enquiries" />
              <Bar dataKey="bookings" fill="#c026d3" radius={[4,4,0,0]} name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
