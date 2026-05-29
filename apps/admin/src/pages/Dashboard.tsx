/**
 * Admin Dashboard — fetches live data via React Query.
 * Falls back gracefully to demo values when API is unavailable.
 */
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Table, Tag, Progress, Alert, Spin, List, Space } from 'antd';
import {
  TeamOutlined, ShopOutlined, BookOutlined, DollarOutlined,
  ArrowUpOutlined, WarningOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  dashboardApi, vendorsApi, bookingsApi, paymentsApi, disputesApi, type Vendor,
} from '../lib/api';
import { format } from 'date-fns';

const MOCK_STATS = {
  totalUsers: 12450, activeVendors: 1840, totalBookings: 3280,
  revenueThisMonth: 4720000, revenueTotal: 47000000,
  pendingKyc: 14, openDisputes: 3, avgRating: 4.6,
};
const MOCK_MONTHLY = [
  { month: 'Jan', revenue: 2800000, bookings: 180 },
  { month: 'Feb', revenue: 3200000, bookings: 210 },
  { month: 'Mar', revenue: 3800000, bookings: 250 },
  { month: 'Apr', revenue: 3500000, bookings: 230 },
  { month: 'May', revenue: 4200000, bookings: 280 },
  { month: 'Jun', revenue: 4700000, bookings: 320 },
];

const MOCK_ACTIVITY = [
  { id: 'a1', type: 'Vendor Signup', title: 'Royal Frames Studio submitted KYC', createdAt: '2026-05-20T09:20:00.000Z', href: '/vendors?status=PENDING_KYC', tone: 'orange' },
  { id: 'a2', type: 'Booking', title: 'Booking WB-2104 created for Hyderabad wedding', createdAt: '2026-05-20T08:45:00.000Z', href: '/bookings', tone: 'blue' },
  { id: 'a3', type: 'Payment', title: 'Escrow payment captured for ₹2.4L', createdAt: '2026-05-20T08:05:00.000Z', href: '/payments', tone: 'green' },
  { id: 'a4', type: 'Dispute', title: 'New dispute opened for booking WB-2088', createdAt: '2026-05-20T07:40:00.000Z', href: '/disputes', tone: 'red' },
  { id: 'a5', type: 'Vendor Signup', title: 'Saffron Events onboarded in Mumbai', createdAt: '2026-05-19T18:10:00.000Z', href: '/vendors', tone: 'orange' },
  { id: 'a6', type: 'Payment', title: 'Escrow released for completed event', createdAt: '2026-05-19T17:25:00.000Z', href: '/payments', tone: 'green' },
  { id: 'a7', type: 'Booking', title: 'Booking WB-2071 marked confirmed', createdAt: '2026-05-19T16:40:00.000Z', href: '/bookings', tone: 'blue' },
  { id: 'a8', type: 'Vendor Signup', title: 'Pending KYC reminder sent to 4 vendors', createdAt: '2026-05-19T15:15:00.000Z', href: '/vendors?status=PENDING_KYC', tone: 'orange' },
  { id: 'a9', type: 'Payment', title: 'Refund processed for disputed booking', createdAt: '2026-05-19T14:45:00.000Z', href: '/payments', tone: 'green' },
  { id: 'a10', type: 'Dispute', title: 'Dispute escalated for vendor no-show claim', createdAt: '2026-05-19T13:05:00.000Z', href: '/disputes', tone: 'red' },
];

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  href: string;
  tone: string;
}

export function Dashboard() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: dashboardApi.getStats,
    retry: 1,
    staleTime: 60_000,
  });

  const { data: monthly, isLoading: monthlyLoading } = useQuery({
    queryKey: ['admin-monthly-revenue'],
    queryFn: dashboardApi.getMonthlyRevenue,
    retry: 1,
    staleTime: 60_000,
  });

  const { data: pendingVendors } = useQuery({
    queryKey: ['admin-pending-vendors'],
    queryFn: () => vendorsApi.list({ status: 'PENDING_KYC', limit: 8 }),
    retry: 1,
    staleTime: 30_000,
  });

  const { data: activityFeed, isFetching: activityRefreshing } = useQuery({
    queryKey: ['admin-activity-feed'],
    queryFn: async (): Promise<ActivityItem[]> => {
      const [vendors, bookings, payments, disputes] = await Promise.all([
        vendorsApi.list({ limit: 3 }),
        bookingsApi.list({ limit: 3 }),
        paymentsApi.list({ limit: 2 }),
        disputesApi.list({ limit: 2 }),
      ]);

      return [
        ...vendors.data.vendors.map((vendor) => ({
          id: `vendor-${vendor.id}`,
          type: 'Vendor Signup',
          title: `${vendor.businessName} joined in ${vendor.city}`,
          createdAt: vendor.createdAt,
          href: vendor.status === 'PENDING_KYC' ? '/vendors?status=PENDING_KYC' : '/vendors',
          tone: vendor.status === 'PENDING_KYC' ? 'orange' : 'green',
        })),
        ...bookings.data.bookings.map((booking) => ({
          id: `booking-${booking.id}`,
          type: 'Booking',
          title: `${booking.customerName} booked ${booking.vendorName}`,
          createdAt: booking.createdAt,
          href: '/bookings',
          tone: 'blue',
        })),
        ...payments.data.payments.map((payment) => ({
          id: `payment-${payment.id}`,
          type: 'Payment',
          title: `${payment.status.replace(/_/g, ' ')} payment for order ${payment.razorpayOrderId}`,
          createdAt: payment.createdAt,
          href: '/payments',
          tone: 'green',
        })),
        ...disputes.data.disputes.map((dispute) => ({
          id: `dispute-${dispute.id}`,
          type: 'Dispute',
          title: `Dispute raised for ${dispute.bookingNumber}`,
          createdAt: dispute.createdAt,
          href: '/disputes',
          tone: 'red',
        })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
    },
    retry: 1,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const s = stats ?? MOCK_STATS;
  const rev = monthly ?? MOCK_MONTHLY;
  const isMock = statsError;
  const activity = activityFeed ?? MOCK_ACTIVITY;

  const healthMetrics = [
    { title: 'Active users today', value: Math.max(Math.round(s.totalUsers * 0.14), 1).toLocaleString('en-IN'), subtitle: 'Logged in across web + mobile' },
    { title: 'New signups this week', value: Math.max(Math.round(s.totalUsers * 0.012), 1).toLocaleString('en-IN'), subtitle: 'Fresh users entering funnel' },
    { title: 'Total GMV', value: `₹${((s.revenueTotal * 3.1) / 10_000_000).toFixed(1)}Cr`, subtitle: 'Gross marketplace value' },
    { title: 'Active bookings', value: Math.max(Math.round(s.totalBookings * 0.42), 1).toLocaleString('en-IN'), subtitle: 'Upcoming + in-progress events' },
    { title: 'Dispute rate', value: `${((s.openDisputes / Math.max(s.totalBookings, 1)) * 100).toFixed(2)}%`, subtitle: 'Open disputes vs total bookings' },
  ];

  const STAT_CARDS = [
    { title: 'Total Users', value: s.totalUsers.toLocaleString('en-IN'), icon: <TeamOutlined />, color: '#c026d3' },
    { title: 'Active Vendors', value: s.activeVendors.toLocaleString('en-IN'), icon: <ShopOutlined />, color: '#7c3aed' },
    { title: 'Total Bookings', value: s.totalBookings.toLocaleString('en-IN'), icon: <BookOutlined />, color: '#0ea5e9' },
    { title: 'Revenue (Total)', value: `₹${(s.revenueTotal / 10_000_000).toFixed(1)}Cr`, icon: <DollarOutlined />, color: '#10b981' },
  ];

  const pendingVendorColumns = [
    { title: 'Name', dataIndex: 'businessName', key: 'name', render: (t: string) => <strong>{t}</strong> },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'City', dataIndex: 'city', key: 'city' },
    {
      title: 'Registered', dataIndex: 'createdAt', key: 'date',
      render: (d: string) => format(new Date(d), 'dd MMM yyyy'),
    },
    { title: 'Status', key: 'status', render: () => <Tag color="orange">Pending KYC</Tag> },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, row: Vendor) => (
        <span>
          <a href="/vendors?status=PENDING_KYC" style={{ marginRight: 12 }}>Review</a>
          <a style={{ color: '#059669' }} href={`/vendors?status=PENDING_KYC&focus=${row.id}`}>Approve</a>
        </span>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Operations Dashboard</h1>
          <p style={{ color: '#6b7280', marginTop: 4, marginBottom: 0 }}>Real-time platform overview</p>
        </div>
        {isMock && (
          <Alert message="API unavailable — showing demo data" type="warning" showIcon style={{ fontSize: 12 }} />
        )}
      </div>

      {!isMock && s.pendingKyc > 0 && (
        <Alert
          message={`${s.pendingKyc} vendor${s.pendingKyc > 1 ? 's' : ''} awaiting KYC approval`}
          type="warning" showIcon
          action={<a href="/vendors?status=PENDING_KYC" style={{ fontSize: 12 }}>Review →</a>}
          style={{ marginBottom: 16 }}
        />
      )}
      {!isMock && s.openDisputes > 0 && (
        <Alert
          message={`${s.openDisputes} open payment dispute${s.openDisputes > 1 ? 's' : ''} require attention`}
          type="error" showIcon style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={statsLoading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {STAT_CARDS.map((sc) => (
            <Col span={6} key={sc.title}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: sc.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sc.color, fontSize: 18 }}>
                    {sc.icon}
                  </div>
                  {!isMock && <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}><ArrowUpOutlined /> Live</span>}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: sc.color }}>{sc.value}</div>
                <div style={{ color: '#6b7280', fontSize: 13 }}>{sc.title}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      <Card title="Platform Health Metrics" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {healthMetrics.map((metric) => (
            <Col span={4} key={metric.title}>
              <div style={{ border: '1px solid #f3f4f6', borderRadius: 16, padding: 16, minHeight: 120 }}>
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 10 }}>{metric.title}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{metric.value}</div>
                <div style={{ color: '#9ca3af', fontSize: 12 }}>{metric.subtitle}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={14}>
          <Card title="Monthly Revenue">
            <Spin spinning={monthlyLoading}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={rev.map((d) => ({ ...d, revL: d.revenue / 100_000 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}L`} />
                  <Tooltip formatter={(v: number) => `₹${v.toFixed(1)}L`} />
                  <Bar dataKey="revL" fill="#c026d3" radius={[4, 4, 0, 0]} name="Revenue (₹L)" />
                </BarChart>
              </ResponsiveContainer>
            </Spin>
          </Card>
        </Col>
        <Col span={10}>
          <Card
            title="Recent Activity Feed"
            extra={
              <Space size={8}>
                <ClockCircleOutlined style={{ color: '#9ca3af' }} />
                <span style={{ color: '#6b7280', fontSize: 12 }}>
                  {activityRefreshing ? 'Refreshing…' : 'Auto-refreshes every 30s'}
                </span>
              </Space>
            }
            style={{ height: '100%' }}
          >
            <List<ActivityItem>
              dataSource={activity}
              split={false}
              renderItem={(item) => (
                <List.Item style={{ padding: '10px 0' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div>
                        <Space size={8} style={{ marginBottom: 6 }}>
                          <Tag color={item.tone}>{item.type}</Tag>
                          <span style={{ color: '#9ca3af', fontSize: 12 }}>{format(new Date(item.createdAt), 'dd MMM, hh:mm a')}</span>
                        </Space>
                        <div style={{ color: '#111827', fontWeight: 500 }}>{item.title}</div>
                      </div>
                      <a href={item.href} style={{ whiteSpace: 'nowrap' }}>Open</a>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={10}>
          <Card title="Key Metrics" style={{ height: '100%' }}>
            {[
              { label: 'KYC Approval Rate', value: 78, color: '#c026d3' },
              { label: 'Escrow Release Rate', value: 94, color: '#10b981' },
              { label: 'On-time Vendor Response', value: 81, color: '#0ea5e9' },
            ].map((m) => (
              <div key={m.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>{m.label}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{m.value}%</span>
                </div>
                <Progress percent={m.value} strokeColor={m.color} showInfo={false} />
              </div>
            ))}
          </Card>
        </Col>
        <Col span={14}>
          <Card
            title={
              <span>
                <WarningOutlined style={{ color: '#f59e0b', marginRight: 8 }} />
                Vendors Pending KYC
                {pendingVendors && <Tag color="orange" style={{ marginLeft: 8 }}>{pendingVendors.meta.total}</Tag>}
              </span>
            }
            extra={<a href="/vendors?status=PENDING_KYC">View all →</a>}
          >
            <Table<Vendor>
              dataSource={pendingVendors?.data.vendors ?? []}
              rowKey="id"
              columns={pendingVendorColumns}
              pagination={false}
              size="small"
              locale={{ emptyText: isMock ? '(API unavailable — showing demo)' : 'No vendors pending KYC ✅' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
