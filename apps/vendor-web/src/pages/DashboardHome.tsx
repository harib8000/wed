import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Calendar, Star, DollarSign, Clock, CheckCircle, ArrowUpRight, Users, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { statsApi, bookingApi, type VendorStats, type MonthlyData, type VendorBooking } from '../lib/api';

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

  const s = stats ?? MOCK_STATS;
  const chart = chartData ?? MOCK_CHART;
  const pending = recentBookings?.data.bookings ?? MOCK_PENDING;
  const isMock = statsError;

  const STAT_CARDS = [
    { label: 'Total Bookings', value: String(s.totalBookings), icon: Calendar, change: s.pendingEnquiries > 0 ? `${s.pendingEnquiries} pending` : '+12%', color: 'text-brand-600 bg-brand-50' },
    { label: 'Revenue This Month', value: formatINR(s.revenueThisMonth), icon: DollarSign, change: '+8%', color: 'text-green-600 bg-green-50' },
    { label: 'Avg. Rating', value: s.avgRating.toFixed(1), icon: Star, change: `${s.reviewCount ?? 0} reviews`, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Response Rate', value: `${s.responseRate}%`, icon: Clock, change: s.responseRate >= 90 ? 'Excellent' : 'Needs work', color: 'text-blue-600 bg-blue-50' },
  ];

export function DashboardHome() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
        <p className="text-gray-500 text-sm">
          {isMock && <span className="text-amber-600"><AlertTriangle size={13} className="inline mr-1 -mt-0.5" />API unavailable — showing demo data. </span>}
          Welcome back! Here's your business overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <Icon size={18} />
                </div>
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <ArrowUpRight size={12} /> {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Bookings & Revenue (6 months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar yAxisId="left" dataKey="bookings" fill="#c026d3" radius={[4,4,0,0]} name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent bookings */}
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

      {/* Profile completion */}
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
