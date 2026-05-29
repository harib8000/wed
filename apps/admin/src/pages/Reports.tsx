import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Col, DatePicker, message, Row, Space, Spin, Statistic, Table, Tag } from 'antd';
import { DollarOutlined, DownloadOutlined, FilePdfOutlined, RiseOutlined, ShopOutlined, TeamOutlined } from '@ant-design/icons';
import { reportsApi, type ReportSummary } from '../lib/api';
import { format } from 'date-fns';
import dayjs, { type Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

type DateRangeValue = [Dayjs, Dayjs] | null;

// ─────────────────────────────────────────────────────────────────────────────
// MOCK FALLBACK DATA
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_SUMMARY: ReportSummary = {
  totalRevenue: 47200000,
  platformFees: 4720000,
  activeVendors: 1840,
  activeCustomers: 12450,
  monthlyRevenue: [
    { month: 'Jul', revenue: 3100000, bookings: 200 },
    { month: 'Aug', revenue: 3600000, bookings: 230 },
    { month: 'Sep', revenue: 4100000, bookings: 260 },
    { month: 'Oct', revenue: 4800000, bookings: 310 },
    { month: 'Nov', revenue: 5200000, bookings: 340 },
    { month: 'Dec', revenue: 4700000, bookings: 300 },
    { month: 'Jan', revenue: 3900000, bookings: 250 },
    { month: 'Feb', revenue: 4300000, bookings: 280 },
    { month: 'Mar', revenue: 5100000, bookings: 330 },
    { month: 'Apr', revenue: 4500000, bookings: 290 },
    { month: 'May', revenue: 5600000, bookings: 360 },
    { month: 'Jun', revenue: 6200000, bookings: 400 },
  ],
  topVendors: [
    { id: 'v1', name: 'Royal Photography', category: 'Photography', bookings: 142, revenue: 8520000, rating: 4.9 },
    { id: 'v2', name: 'Spice Kitchen Catering', category: 'Catering', bookings: 98, revenue: 7350000, rating: 4.8 },
    { id: 'v3', name: 'Elegant Venues', category: 'Venue', bookings: 76, revenue: 6800000, rating: 4.7 },
    { id: 'v4', name: 'Bloom Decorators', category: 'Decoration', bookings: 89, revenue: 5340000, rating: 4.8 },
    { id: 'v5', name: 'Melody Band', category: 'Music', bookings: 112, revenue: 4480000, rating: 4.6 },
    { id: 'v6', name: 'Bridal Boutique', category: 'Clothing', bookings: 64, revenue: 3840000, rating: 4.5 },
    { id: 'v7', name: 'Mehendi Arts', category: 'Mehendi', bookings: 156, revenue: 3120000, rating: 4.9 },
    { id: 'v8', name: 'Sweet Moments Cake', category: 'Catering', bookings: 83, revenue: 2490000, rating: 4.7 },
  ],
  categoryBreakdown: [
    { category: 'Photography', bookings: 680, revenue: 20400000 },
    { category: 'Catering', bookings: 520, revenue: 15600000 },
    { category: 'Venue', bookings: 480, revenue: 14400000 },
    { category: 'Decoration', bookings: 450, revenue: 13500000 },
    { category: 'Music & DJ', bookings: 370, revenue: 11100000 },
    { category: 'Clothing', bookings: 280, revenue: 8400000 },
    { category: 'Mehendi', bookings: 210, revenue: 6300000 },
    { category: 'Makeup', bookings: 130, revenue: 3900000 },
  ],
};

const DEFAULT_RANGE: [Dayjs, Dayjs] = [dayjs().subtract(6, 'month'), dayjs()];

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
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getDateRange(range: DateRangeValue): { from?: string; to?: string } {
  if (!range) return {};
  return {
    from: range[0].format('YYYY-MM-DD'),
    to: range[1].format('YYYY-MM-DD'),
  };
}

function getRangeLabel(range: DateRangeValue): string {
  if (!range) return 'All Time';
  return `${range[0].format('DD MMM YYYY')} - ${range[1].format('DD MMM YYYY')}`;
}

function exportCSV(data: ReportSummary) {
  const rows = [
    ['Metric', 'Value'],
    ['Total Revenue', `₹${(data.totalRevenue / 100).toLocaleString('en-IN')}`],
    ['Platform Fees', `₹${(data.platformFees / 100).toLocaleString('en-IN')}`],
    ['Active Vendors', String(data.activeVendors)],
    ['Active Customers', String(data.activeCustomers)],
    [''],
    ['Month', 'Revenue', 'Bookings'],
    ...data.monthlyRevenue.map((m) => [m.month, `₹${(m.revenue / 100).toLocaleString('en-IN')}`, String(m.bookings)]),
    [''],
    ['Top Vendors'],
    ['Name', 'Category', 'Bookings', 'Revenue', 'Rating'],
    ...data.topVendors.map((v) => [v.name, v.category, String(v.bookings), `₹${(v.revenue / 100).toLocaleString('en-IN')}`, String(v.rating)]),
  ];
  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `weddingos-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  message.success('Report exported as CSV');
}

function exportPrintableReport(data: ReportSummary, range: DateRangeValue) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');

  if (!printWindow) {
    message.error('Please allow pop-ups to export the report as PDF');
    return;
  }

  const summaryCards = [
    { label: 'Total Revenue', value: `₹${(data.totalRevenue / 100).toLocaleString('en-IN')}` },
    { label: 'Platform Fees', value: `₹${(data.platformFees / 100).toLocaleString('en-IN')}` },
    { label: 'Active Vendors', value: data.activeVendors.toLocaleString('en-IN') },
    { label: 'Active Customers', value: data.activeCustomers.toLocaleString('en-IN') },
  ];

  const html = `
    <!doctype html>
    <html>
      <head>
        <title>WeddingOS Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
          h1, h2 { margin: 0; }
          p { margin: 6px 0 0; color: #6b7280; }
          .meta { margin-top: 8px; font-size: 13px; color: #6b7280; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 24px 0; }
          .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
          .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
          .value { font-size: 24px; font-weight: 700; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #e5e7eb; padding: 10px 12px; font-size: 13px; text-align: left; }
          th { background: #f9fafb; }
          .section { margin-top: 28px; }
          .category-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
          @media print {
            body { padding: 20px; }
            .summary { grid-template-columns: repeat(2, 1fr); }
          }
        </style>
      </head>
      <body>
        <h1>WeddingOS Reports & Analytics</h1>
        <p>Platform performance overview</p>
        <div class="meta">Range: ${getRangeLabel(range)} • Generated: ${new Date().toLocaleString('en-IN')}</div>

        <div class="summary">
          ${summaryCards.map((item) => `
            <div class="card">
              <div class="label">${item.label}</div>
              <div class="value">${item.value}</div>
            </div>
          `).join('')}
        </div>

        <div class="section">
          <h2>Monthly Revenue</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue</th>
                <th>Bookings</th>
              </tr>
            </thead>
            <tbody>
              ${data.monthlyRevenue.map((item) => `
                <tr>
                  <td>${item.month}</td>
                  <td>₹${(item.revenue / 100).toLocaleString('en-IN')}</td>
                  <td>${item.bookings.toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Top Vendors</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Bookings</th>
                <th>Revenue</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              ${data.topVendors.map((vendor) => `
                <tr>
                  <td>${vendor.name}</td>
                  <td>${vendor.category}</td>
                  <td>${vendor.bookings.toLocaleString('en-IN')}</td>
                  <td>₹${(vendor.revenue / 100).toLocaleString('en-IN')}</td>
                  <td>${vendor.rating}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Category Breakdown</h2>
          ${data.categoryBreakdown.map((item) => `
            <div class="category-row">
              <span>${item.category}</span>
              <span>${item.bookings.toLocaleString('en-IN')} bookings • ₹${(item.revenue / 100).toLocaleString('en-IN')}</span>
            </div>
          `).join('')}
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => printWindow.print();
  message.success('Printable report opened');
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS PAGE
// ─────────────────────────────────────────────────────────────────────────────

export function Reports() {
  const [dateRange, setDateRange] = useState<DateRangeValue>(DEFAULT_RANGE);

  const params = useMemo(() => getDateRange(dateRange), [dateRange]);

  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ['admin-reports', params.from ?? 'all', params.to ?? 'all'],
    queryFn: () => reportsApi.getSummary(params.from ? params : undefined),
    retry: 1,
    staleTime: 60_000,
  });

  const isMock = isError;
  const s = summary ?? MOCK_SUMMARY;
  const monthlyRevenue = s.monthlyRevenue;
  const topVendors = s.topVendors;
  const categoryBreakdown = s.categoryBreakdown;
  const totalCategoryBookings = categoryBreakdown.reduce((sum, c) => sum + c.bookings, 0);

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Reports & Analytics</h1>
          <p style={{ color: '#6b7280', marginTop: 4, marginBottom: 0 }}>Platform performance overview</p>
        </div>
        <Space wrap>
          <RangePicker
            allowClear
            value={dateRange}
            format="DD MMM YYYY"
            onChange={(value) => setDateRange(value && value[0] && value[1] ? [value[0], value[1]] : null)}
            presets={[
              { label: 'Last 30 Days', value: [dayjs().subtract(30, 'day'), dayjs()] },
              { label: 'Last 3 Months', value: [dayjs().subtract(3, 'month'), dayjs()] },
              { label: 'Last 6 Months', value: [dayjs().subtract(6, 'month'), dayjs()] },
              { label: 'Last Year', value: [dayjs().subtract(1, 'year'), dayjs()] },
            ]}
          />
          <Button icon={<DownloadOutlined />} onClick={() => exportCSV(s)}>
            Export CSV
          </Button>
          <Button type="primary" icon={<FilePdfOutlined />} onClick={() => exportPrintableReport(s, dateRange)}>
            Export PDF
          </Button>
        </Space>
      </div>

      {isMock && (
        <Alert
          message="API unavailable — showing demo data"
          type="warning"
          showIcon
          style={{ marginBottom: 16, fontSize: 12 }}
        />
      )}

      {/* Summary Cards */}
      <Spin spinning={isLoading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Revenue"
                value={s.totalRevenue / 100}
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
                value={s.platformFees / 100}
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
                value={s.activeVendors}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#7c3aed' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active Customers"
                value={s.activeCustomers}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#0ea5e9' }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* Revenue Chart */}
      <Card title="Monthly Revenue" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180, padding: '0 8px' }}>
          {monthlyRevenue.map((m) => (
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
            <Table
              dataSource={topVendors}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '#', key: 'rank', render: (_: unknown, __: unknown, i: number) => i + 1, width: 40 },
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
            {categoryBreakdown.map((cat) => {
              const percentage = totalCategoryBookings > 0 ? Math.round((cat.bookings / totalCategoryBookings) * 100) : 0;
              return (
                <div key={cat.category} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>{cat.category}</span>
                    <Space size={8}>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{cat.bookings}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{percentage}%</span>
                    </Space>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(percentage * 4.5, 100)}%`, background: '#c026d3', borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
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
