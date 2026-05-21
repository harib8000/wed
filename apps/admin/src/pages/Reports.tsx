import { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Select, Space } from 'antd';
import { DollarOutlined, ShopOutlined, TeamOutlined, RiseOutlined } from '@ant-design/icons';
import { format } from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_SUMMARY = {
  totalRevenue: 47200000,
  platformFees: 4720000,
  activeVendors: 1840,
  activeCustomers: 12450,
};

const MOCK_MONTHLY_REVENUE = [
  { month: 'Jul', revenue: 3100000 },
  { month: 'Aug', revenue: 3600000 },
  { month: 'Sep', revenue: 4100000 },
  { month: 'Oct', revenue: 4800000 },
  { month: 'Nov', revenue: 5200000 },
  { month: 'Dec', revenue: 4700000 },
  { month: 'Jan', revenue: 3900000 },
  { month: 'Feb', revenue: 4300000 },
  { month: 'Mar', revenue: 5100000 },
  { month: 'Apr', revenue: 4500000 },
  { month: 'May', revenue: 5600000 },
  { month: 'Jun', revenue: 6200000 },
];

interface TopVendor {
  rank: number;
  name: string;
  category: string;
  bookings: number;
  revenue: number;
  rating: number;
}

const MOCK_TOP_VENDORS: TopVendor[] = [
  { rank: 1, name: 'Royal Photography', category: 'Photography', bookings: 142, revenue: 8520000, rating: 4.9 },
  { rank: 2, name: 'Spice Kitchen Catering', category: 'Catering', bookings: 98, revenue: 7350000, rating: 4.8 },
  { rank: 3, name: 'Elegant Venues', category: 'Venue', bookings: 76, revenue: 6800000, rating: 4.7 },
  { rank: 4, name: 'Bloom Decorators', category: 'Decoration', bookings: 89, revenue: 5340000, rating: 4.8 },
  { rank: 5, name: 'Melody Band', category: 'Music', bookings: 112, revenue: 4480000, rating: 4.6 },
  { rank: 6, name: 'Bridal Boutique', category: 'Clothing', bookings: 64, revenue: 3840000, rating: 4.5 },
  { rank: 7, name: 'Mehendi Arts', category: 'Mehendi', bookings: 156, revenue: 3120000, rating: 4.9 },
  { rank: 8, name: 'Sweet Moments Cake', category: 'Catering', bookings: 83, revenue: 2490000, rating: 4.7 },
];

const MOCK_CATEGORIES = [
  { name: 'Photography', bookings: 680, percentage: 22 },
  { name: 'Catering', bookings: 520, percentage: 17 },
  { name: 'Venue', bookings: 480, percentage: 15 },
  { name: 'Decoration', bookings: 450, percentage: 14 },
  { name: 'Music & DJ', bookings: 370, percentage: 12 },
  { name: 'Clothing', bookings: 280, percentage: 9 },
  { name: 'Mehendi', bookings: 210, percentage: 7 },
  { name: 'Makeup', bookings: 130, percentage: 4 },
];

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: 'a1', type: 'booking', description: 'New booking BK-2024-0872 created by Priya Sharma', timestamp: '2024-12-06T14:30:00Z' },
  { id: 'a2', type: 'payment', description: 'Payment ₹75,000 captured for BK-2024-0868', timestamp: '2024-12-06T13:45:00Z' },
  { id: 'a3', type: 'dispute', description: 'Dispute DSP-007 resolved in customer favor', timestamp: '2024-12-06T12:20:00Z' },
  { id: 'a4', type: 'vendor', description: 'Vendor "Dream Planners" KYC approved', timestamp: '2024-12-06T11:10:00Z' },
  { id: 'a5', type: 'booking', description: 'Booking BK-2024-0865 marked COMPLETED', timestamp: '2024-12-06T10:00:00Z' },
  { id: 'a6', type: 'payment', description: 'Escrow ₹1,20,000 released to Royal Photography', timestamp: '2024-12-05T17:30:00Z' },
  { id: 'a7', type: 'vendor', description: 'New vendor "Floral Dreams" registered', timestamp: '2024-12-05T16:00:00Z' },
  { id: 'a8', type: 'dispute', description: 'New dispute opened for BK-2024-0850', timestamp: '2024-12-05T14:20:00Z' },
  { id: 'a9', type: 'booking', description: 'Booking BK-2024-0870 confirmed by vendor', timestamp: '2024-12-05T12:45:00Z' },
  { id: 'a10', type: 'payment', description: 'Refund ₹35,000 processed for BK-2024-0798', timestamp: '2024-12-05T10:30:00Z' },
];

const ACTIVITY_TAG_COLOR: Record<string, string> = {
  booking: 'blue',
  payment: 'green',
  dispute: 'red',
  vendor: 'purple',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS PAGE
// ─────────────────────────────────────────────────────────────────────────────

export function Reports() {
  const [dateRange, setDateRange] = useState<string>('last_6_months');

  const maxRevenue = Math.max(...MOCK_MONTHLY_REVENUE.map((m) => m.revenue));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Reports & Analytics</h1>
          <p style={{ color: '#6b7280', marginTop: 4, marginBottom: 0 }}>Platform performance overview</p>
        </div>
        <Select
          value={dateRange}
          onChange={setDateRange}
          style={{ width: 180 }}
          options={[
            { value: 'last_30_days', label: 'Last 30 Days' },
            { value: 'last_3_months', label: 'Last 3 Months' },
            { value: 'last_6_months', label: 'Last 6 Months' },
            { value: 'last_year', label: 'Last Year' },
            { value: 'all_time', label: 'All Time' },
          ]}
        />
      </div>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={MOCK_SUMMARY.totalRevenue / 100}
              prefix={<DollarOutlined />}
              formatter={(v) => `₹${(Number(v) / 100_000).toFixed(1)}L`}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Platform Fees Earned"
              value={MOCK_SUMMARY.platformFees / 100}
              prefix={<RiseOutlined />}
              formatter={(v) => `₹${(Number(v) / 100_000).toFixed(1)}L`}
              valueStyle={{ color: '#c026d3' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Vendors"
              value={MOCK_SUMMARY.activeVendors}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#7c3aed' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Customers"
              value={MOCK_SUMMARY.activeCustomers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#0ea5e9' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Revenue Chart */}
      <Card title="Monthly Revenue" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180, padding: '0 8px' }}>
          {MOCK_MONTHLY_REVENUE.map((m) => (
            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>
                ₹{(m.revenue / 100_000).toFixed(0)}L
              </span>
              <div
                style={{
                  width: '100%',
                  maxWidth: 40,
                  height: `${(m.revenue / maxRevenue) * 140}px`,
                  background: 'linear-gradient(180deg, #c026d3, #7c3aed)',
                  borderRadius: '4px 4px 0 0',
                  minHeight: 8,
                }}
              />
              <span style={{ fontSize: 11, color: '#374151', marginTop: 6 }}>{m.month}</span>
            </div>
          ))}
        </div>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {/* Top Vendors */}
        <Col span={14}>
          <Card title="Top Vendors by Revenue">
            <Table<TopVendor>
              dataSource={MOCK_TOP_VENDORS}
              rowKey="rank"
              size="small"
              pagination={false}
              columns={[
                { title: '#', dataIndex: 'rank', width: 40 },
                { title: 'Vendor', dataIndex: 'name', render: (t: string) => <strong>{t}</strong> },
                {
                  title: 'Category', dataIndex: 'category',
                  render: (c: string) => <Tag>{c}</Tag>,
                },
                { title: 'Bookings', dataIndex: 'bookings', align: 'right' as const },
                {
                  title: 'Revenue', dataIndex: 'revenue',
                  render: (v: number) => `₹${(v / 100_000).toFixed(1)}L`,
                  align: 'right' as const,
                },
                {
                  title: 'Rating', dataIndex: 'rating',
                  render: (r: number) => <Tag color={r >= 4.8 ? 'green' : r >= 4.5 ? 'blue' : 'default'}>⭐ {r}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>

        {/* Category Breakdown */}
        <Col span={10}>
          <Card title="Bookings by Category" style={{ height: '100%' }}>
            {MOCK_CATEGORIES.map((cat) => (
              <div key={cat.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>{cat.name}</span>
                  <Space size={8}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{cat.bookings}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{cat.percentage}%</span>
                  </Space>
                </div>
                <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cat.percentage * 4.5}%`, background: '#c026d3', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Card title="Recent Activity">
        <div>
          {MOCK_ACTIVITY.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
              <Tag color={ACTIVITY_TAG_COLOR[item.type] ?? 'default'} style={{ width: 70, textAlign: 'center' }}>
                {item.type}
              </Tag>
              <span style={{ flex: 1, fontSize: 13, color: '#374151', marginLeft: 12 }}>{item.description}</span>
              <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                {format(new Date(item.timestamp), 'dd MMM HH:mm')}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
