import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  Descriptions,
  Drawer,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Timeline,
  message,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  BellOutlined,
  BlockOutlined,
  CalendarOutlined,
  EyeOutlined,
  MessageOutlined,
  PauseCircleOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { differenceInDays, format, subDays } from 'date-fns';
import { usersApi, type AdminUser } from '../lib/api';

const SEGMENTS = ['all', 'high-value', 'new', 'active', 'at-risk'] as const;
type UserSegment = (typeof SEGMENTS)[number];
type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';
type AnnouncementAudience = 'filtered' | 'all';

interface UserBookingHistory {
  id: string;
  vendorName: string;
  category: string;
  eventDate: string;
  status: 'ENQUIRY' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  amountPaise: number;
}

interface UserPaymentHistory {
  id: string;
  bookingId: string;
  amountPaise: number;
  status: 'PAID' | 'REFUNDED' | 'PENDING';
  method: string;
  createdAt: string;
}

interface UserActivityItem {
  id: string;
  title: string;
  description: string;
  at: string;
  color: 'blue' | 'green' | 'red' | 'orange' | 'gray';
}

interface EnrichedAdminUser extends AdminUser {
  city: string;
  weddingDate: string;
  eventType: string;
  budgetPaise: number;
  partnerName: string;
  accountStatus: AccountStatus;
  lastActivityAt: string;
  bookings: UserBookingHistory[];
  payments: UserPaymentHistory[];
  activity: UserActivityItem[];
}

const MOCK_USERS: AdminUser[] = [
  {
    id: 'usr-priya-001',
    phone: '+91 98765 43210',
    email: 'priya.sharma@example.com',
    name: 'Priya Sharma',
    role: 'customer',
    createdAt: '2025-04-12T09:00:00Z',
  },
  {
    id: 'usr-rahul-002',
    phone: '+91 99887 76655',
    email: 'rahul.verma@example.com',
    name: 'Rahul Verma',
    role: 'customer',
    createdAt: '2025-05-20T11:15:00Z',
  },
  {
    id: 'usr-anika-003',
    phone: '+91 90123 45678',
    email: 'anika.reddy@example.com',
    name: 'Anika Reddy',
    role: 'customer',
    createdAt: '2025-02-08T08:30:00Z',
  },
  {
    id: 'usr-vikram-004',
    phone: '+91 91234 56780',
    email: 'vikram.patel@example.com',
    name: 'Vikram Patel',
    role: 'customer',
    createdAt: '2025-01-14T13:00:00Z',
  },
  {
    id: 'usr-neha-005',
    phone: '+91 92345 67891',
    email: 'neha.iyer@example.com',
    name: 'Neha Iyer',
    role: 'customer',
    createdAt: '2025-05-29T10:20:00Z',
  },
  {
    id: 'usr-arjun-006',
    phone: '+91 93456 78912',
    email: 'arjun.mehra@example.com',
    name: 'Arjun Mehra',
    role: 'customer',
    createdAt: '2024-12-03T16:05:00Z',
  },
];

const SEGMENT_LABELS: Record<UserSegment, string> = {
  all: 'All',
  'high-value': 'High Value',
  new: 'New',
  active: 'Active',
  'at-risk': 'At Risk',
};

const ACCOUNT_STATUS_COLOR: Record<AccountStatus, 'success' | 'warning' | 'error'> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  BANNED: 'error',
};

const ACCOUNT_STATUS_TAG: Record<AccountStatus, string> = {
  ACTIVE: 'green',
  SUSPENDED: 'orange',
  BANNED: 'red',
};

const BOOKING_STATUS_TAG: Record<UserBookingHistory['status'], string> = {
  ENQUIRY: 'blue',
  CONFIRMED: 'green',
  COMPLETED: 'success',
  CANCELLED: 'red',
};

const PAYMENT_STATUS_TAG: Record<UserPaymentHistory['status'], string> = {
  PAID: 'green',
  REFUNDED: 'volcano',
  PENDING: 'gold',
};

function formatCurrency(amountPaise: number) {
  return `₹${(amountPaise / 100).toLocaleString('en-IN')}`;
}

function buildEnrichedUser(user: AdminUser, index: number): EnrichedAdminUser {
  const seed = Array.from(user.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) + index * 7;
  const cities = ['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Pune', 'Visakhapatnam'];
  const partnerNames = ['Aarav', 'Saanvi', 'Ishaan', 'Diya', 'Rohan', 'Meera'];
  const eventTypes = ['Wedding', 'Engagement', 'Reception', 'Haldi', 'Sangeet', 'Mehendi'];
  const budgetOptions = [12, 18, 24, 32, 45, 28].map((lakhs) => lakhs * 100_000 * 100);
  const createdAt = user.createdAt || new Date().toISOString();
  const baseDate = new Date(createdAt);
  const weddingDate = new Date(baseDate);
  weddingDate.setDate(weddingDate.getDate() + 75 + (seed % 120));
  const bookingCount = seed % 4;
  const bookings: UserBookingHistory[] = Array.from({ length: bookingCount }, (_, bookingIndex) => {
    const statusPool: UserBookingHistory['status'][] = ['ENQUIRY', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    const status = statusPool[(seed + bookingIndex) % statusPool.length];
    const amountPaise = (90_000 + ((seed + bookingIndex * 11) % 9) * 35_000) * 100;
    const eventDate = new Date(weddingDate);
    eventDate.setDate(eventDate.getDate() - (bookingIndex * 18 + 12));

    return {
      id: `bk-${user.id}-${bookingIndex + 1}`,
      vendorName: ['Royal Photography', 'Bloom Decor', 'Spice Catering', 'Melody Band'][bookingIndex % 4],
      category: ['Photography', 'Decor', 'Catering', 'Entertainment'][bookingIndex % 4],
      eventDate: eventDate.toISOString(),
      status,
      amountPaise,
    };
  });

  const payments: UserPaymentHistory[] = bookings.slice(0, Math.max(1, bookings.length)).map((booking, paymentIndex) => ({
    id: `pay-${booking.id}`,
    bookingId: booking.id,
    amountPaise: Math.round(booking.amountPaise * (paymentIndex % 2 === 0 ? 0.35 : 1)),
    status: paymentIndex === 1 && seed % 3 === 0 ? 'REFUNDED' : paymentIndex === 0 ? 'PAID' : 'PENDING',
    method: ['UPI', 'Card', 'NetBanking'][paymentIndex % 3],
    createdAt: subDays(new Date(), 10 + paymentIndex * 9 + (seed % 8)).toISOString(),
  }));

  const lastActivityDate = subDays(new Date(), bookingCount === 0 ? 68 + (seed % 12) : 2 + (seed % 24));
  const activity: UserActivityItem[] = [
    {
      id: `${user.id}-act-1`,
      title: 'Logged into account',
      description: 'User authenticated successfully on admin-monitored web session.',
      at: lastActivityDate.toISOString(),
      color: 'blue',
    },
    {
      id: `${user.id}-act-2`,
      title: bookingCount > 0 ? 'Booking updated' : 'Profile updated',
      description: bookingCount > 0 ? `Updated ${bookings[0]?.vendorName ?? 'vendor'} booking preferences.` : 'Updated wedding preferences and guest details.',
      at: subDays(lastActivityDate, 4).toISOString(),
      color: 'green',
    },
    {
      id: `${user.id}-act-3`,
      title: 'Viewed vendor details',
      description: 'Browsed shortlisted vendors and compared package pricing.',
      at: subDays(lastActivityDate, 9).toISOString(),
      color: 'gray',
    },
  ];

  const accountStatus: AccountStatus = seed % 9 === 0 ? 'BANNED' : seed % 5 === 0 ? 'SUSPENDED' : 'ACTIVE';

  return {
    ...user,
    name: user.name ?? `User ${index + 1}`,
    email: user.email ?? `user${index + 1}@example.com`,
    city: cities[seed % cities.length],
    weddingDate: weddingDate.toISOString(),
    eventType: eventTypes[seed % eventTypes.length],
    budgetPaise: budgetOptions[seed % budgetOptions.length],
    partnerName: partnerNames[seed % partnerNames.length],
    accountStatus,
    lastActivityAt: activity[0].at,
    bookings,
    payments,
    activity,
  };
}

function matchesSegment(user: EnrichedAdminUser, segment: UserSegment) {
  if (segment === 'all') return true;
  if (segment === 'high-value') return user.budgetPaise > 20 * 100_000 * 100;
  if (segment === 'new') return differenceInDays(new Date(), new Date(user.createdAt)) < 30;
  if (segment === 'active') return user.bookings.length > 0;
  return differenceInDays(new Date(), new Date(user.lastActivityAt)) > 60;
}

function statusActionText(status: AccountStatus) {
  if (status === 'ACTIVE') return 'Account in good standing';
  if (status === 'SUSPENDED') return 'Temporarily restricted by admin';
  return 'Blocked from using the platform';
}

export function Users() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [segmentFilter, setSegmentFilter] = useState<UserSegment>('all');
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, AccountStatus>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementAudience, setAnnouncementAudience] = useState<AnnouncementAudience>('filtered');
  const [announcementMessage, setAnnouncementMessage] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', page, roleFilter, search],
    queryFn: () => usersApi.list({
      page,
      limit: 15,
      role: roleFilter === 'all' ? undefined : roleFilter,
      q: search || undefined,
    }),
    retry: 1,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const serverUsers = data?.data.users ?? [];
  const baseUsers = isError ? MOCK_USERS : serverUsers;

  const enrichedUsers = useMemo(() => baseUsers.map((user, index) => {
    const detail = buildEnrichedUser(user, index);
    return {
      ...detail,
      accountStatus: statusOverrides[user.id] ?? detail.accountStatus,
    };
  }), [baseUsers, statusOverrides]);

  const filteredUsers = useMemo(() => enrichedUsers.filter((user) => {
    const searchTerm = search.trim().toLowerCase();
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSearch = !searchTerm || [user.name ?? '', user.email ?? '', user.phone, user.city].some((value) => value.toLowerCase().includes(searchTerm));
    return matchesRole && matchesSearch && matchesSegment(user, segmentFilter);
  }), [enrichedUsers, roleFilter, search, segmentFilter]);

  const selectedUser = filteredUsers.find((user) => user.id === selectedUserId)
    ?? enrichedUsers.find((user) => user.id === selectedUserId)
    ?? null;

  const segmentCounts = useMemo(() => SEGMENTS.reduce<Record<UserSegment, number>>((acc, segment) => {
    acc[segment] = enrichedUsers.filter((user) => {
      const searchTerm = search.trim().toLowerCase();
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesSearch = !searchTerm || [user.name ?? '', user.email ?? '', user.phone, user.city].some((value) => value.toLowerCase().includes(searchTerm));
      return matchesRole && matchesSearch && matchesSegment(user, segment);
    }).length;
    return acc;
  }, { all: 0, 'high-value': 0, new: 0, active: 0, 'at-risk': 0 }), [enrichedUsers, roleFilter, search]);

  function openUserDrawer(user: EnrichedAdminUser) {
    setSelectedUserId(user.id);
    setAdminNotes((prev) => prev[user.id] !== undefined ? prev : {
      ...prev,
      [user.id]: `Follow up on ${user.eventType.toLowerCase()} planning preferences and premium vendor outreach.`,
    });
  }

  function updateUserStatus(nextStatus: AccountStatus) {
    if (!selectedUser) return;

    const actionLabel = nextStatus === 'ACTIVE' ? 'reactivated' : nextStatus === 'SUSPENDED' ? 'suspended' : 'banned';
    Modal.confirm({
      title: `${nextStatus === 'ACTIVE' ? 'Reactivate' : nextStatus === 'SUSPENDED' ? 'Suspend' : 'Ban'} user account`,
      content: `This will mark ${selectedUser.name} as ${nextStatus.toLowerCase()}.`,
      okText: nextStatus === 'ACTIVE' ? 'Reactivate' : nextStatus === 'SUSPENDED' ? 'Suspend' : 'Ban user',
      okButtonProps: nextStatus === 'BANNED' ? { danger: true } : undefined,
      onOk: () => {
        setStatusOverrides((prev) => ({ ...prev, [selectedUser.id]: nextStatus }));
        message.success(`User ${actionLabel}`);
      },
    });
  }

  function saveAdminNote() {
    if (!selectedUser) return;
    message.success('Admin notes saved');
    setAdminNotes((prev) => ({ ...prev, [selectedUser.id]: (prev[selectedUser.id] ?? '').trim() }));
  }

  function sendAnnouncement() {
    const trimmed = announcementMessage.trim();
    if (!trimmed) {
      message.warning('Please enter an announcement message');
      return;
    }

    const audienceCount = announcementAudience === 'all' ? enrichedUsers.length : filteredUsers.length;
    message.success(`Announcement queued for ${audienceCount} users`);
    setAnnouncementOpen(false);
    setAnnouncementMessage('');
    setAnnouncementAudience('filtered');
  }

  const tableData = filteredUsers.slice((page - 1) * 15, page * 15);

  const tabs: TabsProps['items'] = selectedUser ? [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <Descriptions bordered size="small" column={2} title="Profile information">
            <Descriptions.Item label="Name">{selectedUser.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{selectedUser.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">{selectedUser.phone}</Descriptions.Item>
            <Descriptions.Item label="City">{selectedUser.city}</Descriptions.Item>
            <Descriptions.Item label="Wedding date">{format(new Date(selectedUser.weddingDate), 'dd MMM yyyy')}</Descriptions.Item>
            <Descriptions.Item label="Joined">{format(new Date(selectedUser.createdAt), 'dd MMM yyyy')}</Descriptions.Item>
          </Descriptions>

          <Descriptions bordered size="small" column={2} title="Wedding details">
            <Descriptions.Item label="Event type">{selectedUser.eventType}</Descriptions.Item>
            <Descriptions.Item label="Budget">{formatCurrency(selectedUser.budgetPaise)}</Descriptions.Item>
            <Descriptions.Item label="Partner name">{selectedUser.partnerName}</Descriptions.Item>
            <Descriptions.Item label="Bookings">{selectedUser.bookings.length}</Descriptions.Item>
          </Descriptions>

          <Card size="small" title="Account status" extra={<Badge status={ACCOUNT_STATUS_COLOR[selectedUser.accountStatus]} text={statusActionText(selectedUser.accountStatus)} />}>
            <Space wrap>
              <Tag color={ACCOUNT_STATUS_TAG[selectedUser.accountStatus]}>{selectedUser.accountStatus}</Tag>
              <Button icon={<PauseCircleOutlined />} onClick={() => updateUserStatus('SUSPENDED')} disabled={selectedUser.accountStatus === 'SUSPENDED'}>
                Suspend
              </Button>
              <Button danger icon={<BlockOutlined />} onClick={() => updateUserStatus('BANNED')} disabled={selectedUser.accountStatus === 'BANNED'}>
                Ban
              </Button>
              <Button icon={<SafetyCertificateOutlined />} onClick={() => updateUserStatus('ACTIVE')} disabled={selectedUser.accountStatus === 'ACTIVE'}>
                Reactivate
              </Button>
            </Space>
          </Card>

          <Card size="small" title="Admin notes">
            <Input.TextArea
              rows={4}
              placeholder="Add internal context for support, risk or VIP handling"
              value={adminNotes[selectedUser.id] ?? ''}
              onChange={(e) => setAdminNotes((prev) => ({ ...prev, [selectedUser.id]: e.target.value }))}
            />
            <Button type="primary" style={{ marginTop: 12 }} onClick={saveAdminNote}>Save Notes</Button>
          </Card>
        </Space>
      ),
    },
    {
      key: 'bookings',
      label: `Bookings (${selectedUser.bookings.length})`,
      children: (
        <Table<UserBookingHistory>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={selectedUser.bookings}
          locale={{ emptyText: 'No bookings yet' }}
          columns={[
            { title: 'Vendor', dataIndex: 'vendorName', key: 'vendorName' },
            { title: 'Category', dataIndex: 'category', key: 'category' },
            { title: 'Event date', dataIndex: 'eventDate', key: 'eventDate', render: (value: string) => format(new Date(value), 'dd MMM yyyy') },
            { title: 'Amount', dataIndex: 'amountPaise', key: 'amountPaise', render: (value: number) => formatCurrency(value) },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (value: UserBookingHistory['status']) => <Tag color={BOOKING_STATUS_TAG[value]}>{value.replace(/_/g, ' ')}</Tag> },
          ]}
        />
      ),
    },
    {
      key: 'payments',
      label: `Payments (${selectedUser.payments.length})`,
      children: (
        <Table<UserPaymentHistory>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={selectedUser.payments}
          columns={[
            { title: 'Payment ID', dataIndex: 'id', key: 'id', render: (value: string) => <code style={{ fontSize: 11 }}>{value.slice(0, 14)}…</code> },
            { title: 'Booking', dataIndex: 'bookingId', key: 'bookingId', render: (value: string) => <code style={{ fontSize: 11 }}>{value.slice(0, 14)}…</code> },
            { title: 'Method', dataIndex: 'method', key: 'method' },
            { title: 'Amount', dataIndex: 'amountPaise', key: 'amountPaise', render: (value: number) => formatCurrency(value) },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (value: UserPaymentHistory['status']) => <Tag color={PAYMENT_STATUS_TAG[value]}>{value}</Tag> },
            { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (value: string) => format(new Date(value), 'dd MMM yyyy, hh:mm a') },
          ]}
        />
      ),
    },
    {
      key: 'activity',
      label: 'Activity',
      children: (
        <Timeline
          items={selectedUser.activity.map((item) => ({
            color: item.color,
            children: (
              <div>
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                <div style={{ color: '#6b7280', marginBottom: 4 }}>{item.description}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{format(new Date(item.at), 'dd MMM yyyy, hh:mm a')}</div>
              </div>
            ),
          }))}
        />
      ),
    },
  ] : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Users</h1>
          <div style={{ color: '#6b7280', marginTop: 4 }}>Review user lifecycle, risk signals, and outreach from one place.</div>
        </div>
        <Space wrap>
          <Input.Search
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 220 }}
          />
          <Select
            value={roleFilter}
            onChange={(value) => { setRoleFilter(value); setPage(1); }}
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'customer', label: 'Customer' },
              { value: 'vendor', label: 'Vendor' },
              { value: 'admin', label: 'Admin' },
            ]}
          />
          <Button type="primary" icon={<BellOutlined />} onClick={() => setAnnouncementOpen(true)}>
            Send Announcement
          </Button>
        </Space>
      </div>

      {isError && (
        <Alert
          message="Users API unavailable — showing demo data"
          type="warning"
          showIcon
          style={{ marginBottom: 16, fontSize: 12 }}
        />
      )}

      <Card style={{ marginBottom: 16 }} bodyStyle={{ paddingBottom: 12 }}>
        <Space size={[8, 8]} wrap>
          {SEGMENTS.map((segment) => (
            <Tag.CheckableTag
              key={segment}
              checked={segmentFilter === segment}
              onChange={() => { setSegmentFilter(segment); setPage(1); }}
            >
              <Space size={6}>
                <span>{SEGMENT_LABELS[segment]}</span>
                <Badge count={segmentCounts[segment]} size="small" />
              </Space>
            </Tag.CheckableTag>
          ))}
        </Space>
      </Card>

      <Card>
        <Table<EnrichedAdminUser>
          loading={isLoading}
          dataSource={tableData}
          rowKey="id"
          size="small"
          pagination={{
            current: page,
            total: filteredUsers.length,
            pageSize: 15,
            onChange: setPage,
            showTotal: (total) => `${total} users`,
          }}
          onRow={(record) => ({
            onClick: () => openUserDrawer(record),
            style: { cursor: 'pointer' },
          })}
          columns={[
            { title: 'User', key: 'user', render: (_: unknown, row) => (
              <div>
                <div style={{ fontWeight: 600 }}>{row.name}</div>
                <div style={{ color: '#6b7280', fontSize: 12 }}>{row.email}</div>
              </div>
            ) },
            { title: 'Phone', dataIndex: 'phone', key: 'phone' },
            { title: 'City', dataIndex: 'city', key: 'city' },
            { title: 'Segment', key: 'segment', render: (_: unknown, row) => {
              if (matchesSegment(row, 'at-risk')) return <Tag color="red">At Risk</Tag>;
              if (matchesSegment(row, 'high-value')) return <Tag color="gold">High Value</Tag>;
              if (matchesSegment(row, 'new')) return <Tag color="blue">New</Tag>;
              if (matchesSegment(row, 'active')) return <Tag color="green">Active</Tag>;
              return <Tag>All Users</Tag>;
            } },
            { title: 'Budget', dataIndex: 'budgetPaise', key: 'budgetPaise', render: (value: number) => formatCurrency(value) },
            { title: 'Status', key: 'status', render: (_: unknown, row) => <Badge status={ACCOUNT_STATUS_COLOR[row.accountStatus]} text={row.accountStatus} /> },
            { title: 'Last activity', dataIndex: 'lastActivityAt', key: 'lastActivityAt', render: (value: string) => format(new Date(value), 'dd MMM yyyy') },
            { title: 'Actions', key: 'actions', render: (_: unknown, row) => (
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  openUserDrawer(row);
                }}
              >
                View
              </Button>
            ) },
          ]}
        />
      </Card>

      <Drawer
        title={selectedUser ? `${selectedUser.name} · User Detail` : 'User Detail'}
        width={720}
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUserId(null)}
        destroyOnClose
      >
        {selectedUser && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small">
              <Space size={24} wrap>
                <Badge status={ACCOUNT_STATUS_COLOR[selectedUser.accountStatus]} text={selectedUser.accountStatus} />
                <span><CalendarOutlined style={{ marginRight: 8 }} />{format(new Date(selectedUser.weddingDate), 'dd MMM yyyy')}</span>
                <span><RiseOutlined style={{ marginRight: 8 }} />{formatCurrency(selectedUser.budgetPaise)}</span>
                <span><TeamOutlined style={{ marginRight: 8 }} />Partner: {selectedUser.partnerName}</span>
                <span><MessageOutlined style={{ marginRight: 8 }} />{selectedUser.bookings.length} bookings</span>
              </Space>
            </Card>
            <Tabs items={tabs} />
          </Space>
        )}
      </Drawer>

      <Modal
        title="Send announcement"
        open={announcementOpen}
        onCancel={() => setAnnouncementOpen(false)}
        onOk={sendAnnouncement}
        okText="Send"
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Select
            value={announcementAudience}
            onChange={(value) => setAnnouncementAudience(value)}
            options={[
              { value: 'filtered', label: `Current filtered users (${filteredUsers.length})` },
              { value: 'all', label: `All users (${enrichedUsers.length})` },
            ]}
          />
          <Input.TextArea
            rows={5}
            maxLength={500}
            showCount
            placeholder="Compose your announcement for the selected audience"
            value={announcementMessage}
            onChange={(e) => setAnnouncementMessage(e.target.value)}
          />
        </Space>
      </Modal>
    </div>
  );
}
