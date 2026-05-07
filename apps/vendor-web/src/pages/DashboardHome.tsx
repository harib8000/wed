import { TrendingUp, Calendar, Star, DollarSign, Clock, CheckCircle, ArrowUpRight, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const STATS = [
  { label: 'Total Bookings', value: '47', icon: Calendar, change: '+12%', color: 'text-brand-600 bg-brand-50' },
  { label: 'Revenue This Month', value: '₹2.4L', icon: DollarSign, change: '+8%', color: 'text-green-600 bg-green-50' },
  { label: 'Avg. Rating', value: '4.8', icon: Star, change: '+0.2', color: 'text-gold-600 bg-gold-50' },
  { label: 'Response Rate', value: '96%', icon: Clock, change: '+3%', color: 'text-blue-600 bg-blue-50' },
];

const CHART_DATA = [
  { month: 'Jan', bookings: 4, revenue: 120000 },
  { month: 'Feb', bookings: 6, revenue: 180000 },
  { month: 'Mar', bookings: 8, revenue: 240000 },
  { month: 'Apr', bookings: 5, revenue: 150000 },
  { month: 'May', bookings: 9, revenue: 270000 },
  { month: 'Jun', bookings: 7, revenue: 210000 },
];

const PENDING_BOOKINGS = [
  { id: 'WB-001', customer: 'Priya & Rahul', date: '14 Feb 2027', package: 'Grand Gold', amount: '₹90,000', status: 'enquiry' },
  { id: 'WB-002', customer: 'Ananya & Vikram', date: '20 Mar 2027', package: 'Silver Basic', amount: '₹50,000', status: 'quoted' },
  { id: 'WB-003', customer: 'Meera & Arun', date: '5 Apr 2027', package: 'Platinum', amount: '₹1,50,000', status: 'confirmed' },
];

export function DashboardHome() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => {
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
            <BarChart data={CHART_DATA}>
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
            {PENDING_BOOKINGS.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <span className="text-brand-700 text-xs font-bold">{b.customer[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{b.customer}</p>
                  <p className="text-xs text-gray-400">{b.date} · {b.package}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{b.amount}</p>
                  <span className={`badge text-xs ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'quoted' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {b.status}
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
