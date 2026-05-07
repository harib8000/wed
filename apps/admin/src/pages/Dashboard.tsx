import { Row, Col, Card, Statistic, Table, Tag, Progress } from 'antd';
import { TeamOutlined, ShopOutlined, BookOutlined, DollarOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const STATS = [
  { title: 'Total Users', value: 12450, icon: <TeamOutlined />, color: '#c026d3', change: 12 },
  { title: 'Active Vendors', value: 1840, icon: <ShopOutlined />, color: '#7c3aed', change: 8 },
  { title: 'Total Bookings', value: 3280, icon: <BookOutlined />, color: '#0ea5e9', change: 18 },
  { title: 'Revenue (₹)', value: '₹4.7Cr', icon: <DollarOutlined />, color: '#10b981', change: 22, prefix: '' },
];

const MONTHLY = [
  { m: 'Jan', rev: 2800000, books: 180 }, { m: 'Feb', rev: 3200000, books: 210 },
  { m: 'Mar', rev: 3800000, books: 250 }, { m: 'Apr', rev: 3500000, books: 230 },
  { m: 'May', rev: 4200000, books: 280 }, { m: 'Jun', rev: 4700000, books: 320 },
];

const RECENT_VENDORS = [
  { key: 1, name: 'Meera Photography', category: 'Photography', city: 'Hyderabad', status: 'pending_kyc', bookings: 12 },
  { key: 2, name: 'Sunrise Catering', category: 'Catering', city: 'Mumbai', status: 'verified', bookings: 34 },
  { key: 3, name: 'Dream Decor', category: 'Decor', city: 'Delhi', status: 'verified', bookings: 8 },
  { key: 4, name: 'Heritage Palace', category: 'Venue', city: 'Jaipur', status: 'pending_kyc', bookings: 0 },
];

export function Dashboard() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Operations Dashboard</h1>
        <p style={{ color: '#6b7280', marginTop: 4 }}>Real-time platform overview</p>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {STATS.map((s) => (
          <Col span={6} key={s.title}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: 18 }}>
                  {s.icon}
                </div>
                <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600 }}><ArrowUpOutlined /> {s.change}%</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{s.title}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={14}>
          <Card title="Monthly Revenue">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MONTHLY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="m" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: any) => `₹${(v/100000).toFixed(1)}L`} />
                <Bar dataKey="rev" fill="#c026d3" radius={[4,4,0,0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={10}>
          <Card title="Key Metrics" style={{ height: '100%' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>KYC Approval Rate</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>78%</span>
              </div>
              <Progress percent={78} strokeColor="#c026d3" showInfo={false} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Escrow Release Rate</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>94%</span>
              </div>
              <Progress percent={94} strokeColor="#10b981" showInfo={false} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Dispute Resolution</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>2.1%</span>
              </div>
              <Progress percent={2.1} strokeColor="#f59e0b" showInfo={false} />
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Platform Uptime</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>99.8%</span>
              </div>
              <Progress percent={99.8} strokeColor="#0ea5e9" showInfo={false} />
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Recent Vendor Registrations">
        <Table
          dataSource={RECENT_VENDORS}
          size="small"
          pagination={false}
          columns={[
            { title: 'Vendor Name', dataIndex: 'name', key: 'name', render: (t) => <strong>{t}</strong> },
            { title: 'Category', dataIndex: 'category', key: 'category' },
            { title: 'City', dataIndex: 'city', key: 'city' },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'verified' ? 'green' : 'orange'}>{s === 'verified' ? 'Verified' : 'Pending KYC'}</Tag> },
            { title: 'Bookings', dataIndex: 'bookings', key: 'bookings' },
            { title: 'Actions', key: 'actions', render: () => <><a style={{ marginRight: 8 }}>Review</a><a style={{ color: 'green' }}>Approve</a></> },
          ]}
        />
      </Card>
    </div>
  );
}
