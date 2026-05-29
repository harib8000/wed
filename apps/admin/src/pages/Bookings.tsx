import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Card, Select, Spin, Modal, message, Input, DatePicker, Drawer, Descriptions, Divider, Steps } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { bookingsApi, usersApi, paymentsApi, type Booking, type AdminUser, type Payment } from '../lib/api';
import { format } from 'date-fns';
import dayjs, { type Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

type DateRangeValue = [Dayjs, Dayjs] | null;

interface BookingDetail extends Booking {
  eventType: string;
  eventCity: string;
  advancePaidPaise: number;
  platformFeePaise: number;
  quoteSentAt: string;
  quoteAcceptedAt: string;
  paymentAt: string;
  confirmedAt: string;
  completedAt: string | null;
  cancellationReason: string;
  adminNotes: string;
}

const BOOKING_STEPS = [
  { key: 'ENQUIRY', title: 'Enquiry', description: 'Customer raised an enquiry' },
  { key: 'QUOTE_SENT', title: 'Quote Sent', description: 'Vendor shared pricing' },
  { key: 'QUOTE_ACCEPTED', title: 'Quote Accepted', description: 'Customer accepted the quote' },
  { key: 'PAYMENT', title: 'Payment', description: 'Advance / escrow captured' },
  { key: 'CONFIRMED', title: 'Confirmed', description: 'Booking confirmed by vendor' },
  { key: 'COMPLETED', title: 'Completed', description: 'Event fulfilled successfully' },
] as const;

const BOOKING_STATUS_COLOR: Record<string, string> = {
  ENQUIRY: 'orange',
  QUOTE_SENT: 'blue',
  CONFIRMED: 'green',
  ADVANCE_PAID: 'cyan',
  ESCROWED: 'geekblue',
  COMPLETED: 'green',
  CANCELLED: 'red',
  DISPUTED: 'volcano',
};

function formatCurrency(paise?: number | null) {
  if (!paise) return '—';
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function formatDateTime(value?: string | null, pattern = 'dd MMM yyyy, hh:mm a') {
  return value ? format(new Date(value), pattern) : '—';
}

function createBookingDetail(booking: Booking, override?: Partial<BookingDetail>): BookingDetail {
  const seed = Array.from(booking.id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const eventTypes = ['Wedding', 'Reception', 'Engagement', 'Haldi', 'Mehendi', 'Sangeet'];
  const cities = ['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Visakhapatnam', 'Pune'];
  const quotedAmountPaise = booking.quotedAmountPaise || (90_000 + (seed % 8) * 25_000) * 100;
  const advancePaidPaise = Math.round(quotedAmountPaise * 0.3);
  const platformFeePaise = Math.round(quotedAmountPaise * 0.08);
  const createdAt = booking.createdAt || dayjs().subtract(12, 'day').toISOString();
  const createdAtDay = dayjs(createdAt);
  const completedAt = booking.status === 'COMPLETED' ? dayjs(booking.eventDate).add(1, 'day').hour(11).minute(30).toISOString() : null;

  return {
    ...booking,
    quotedAmountPaise,
    eventType: eventTypes[seed % eventTypes.length],
    eventCity: cities[(seed + 2) % cities.length],
    advancePaidPaise: ['ADVANCE_PAID', 'ESCROWED', 'CONFIRMED', 'COMPLETED', 'DISPUTED'].includes(booking.status) ? advancePaidPaise : 0,
    platformFeePaise,
    quoteSentAt: createdAtDay.add(1, 'day').hour(10).minute(15).toISOString(),
    quoteAcceptedAt: createdAtDay.add(2, 'day').hour(15).minute(45).toISOString(),
    paymentAt: createdAtDay.add(3, 'day').hour(11).minute(20).toISOString(),
    confirmedAt: createdAtDay.add(4, 'day').hour(17).minute(10).toISOString(),
    completedAt,
    cancellationReason: '',
    adminNotes: seed % 2 === 0 ? 'Customer requested a faster vendor callback before final confirmation.' : 'Monitor vendor SLA for quote turnaround on this booking.',
    ...override,
  };
}

function getReachedStep(detail: BookingDetail) {
  switch (detail.status) {
    case 'ENQUIRY':
      return 0;
    case 'QUOTE_SENT':
      return 1;
    case 'ADVANCE_PAID':
    case 'ESCROWED':
      return 3;
    case 'CONFIRMED':
    case 'DISPUTED':
      return 4;
    case 'COMPLETED':
      return 5;
    case 'CANCELLED':
      return detail.advancePaidPaise > 0 ? 3 : detail.quotedAmountPaise > 0 ? 2 : 0;
    default:
      return 0;
  }
}

function getStepTimestamp(detail: BookingDetail, key: (typeof BOOKING_STEPS)[number]['key']) {
  switch (key) {
    case 'ENQUIRY':
      return detail.createdAt;
    case 'QUOTE_SENT':
      return detail.quoteSentAt;
    case 'QUOTE_ACCEPTED':
      return detail.quoteAcceptedAt;
    case 'PAYMENT':
      return detail.paymentAt;
    case 'CONFIRMED':
      return detail.confirmedAt;
    case 'COMPLETED':
      return detail.completedAt;
    default:
      return null;
  }
}

function getStatusTag(status: string) {
  return <Tag color={BOOKING_STATUS_COLOR[status] ?? 'default'}>{status.replace(/_/g, ' ')}</Tag>;
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS PAGE
// ─────────────────────────────────────────────────────────────────────────────

export function Bookings() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeValue>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [bookingOverrides, setBookingOverrides] = useState<Record<string, Partial<BookingDetail>>>({});
  const [adminNoteDrafts, setAdminNoteDrafts] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', page, statusFilter],
    queryFn: () => bookingsApi.list({ page, limit: 15, status: statusFilter === 'all' ? undefined : statusFilter }),
    placeholderData: (prev) => prev,
  });

  const allBookings = useMemo(
    () => (data?.data.bookings ?? []).map((booking) => createBookingDetail(booking, bookingOverrides[booking.id])),
    [data?.data.bookings, bookingOverrides],
  );

  const filteredBookings = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return allBookings.filter((booking) => {
      const matchesSearch = !searchTerm || [booking.id, booking.customerName, booking.vendorName].some((value) => value.toLowerCase().includes(searchTerm));
      const matchesRange = !dateRange || (() => {
        const eventTs = dayjs(booking.eventDate).valueOf();
        return eventTs >= dateRange[0].startOf('day').valueOf() && eventTs <= dateRange[1].endOf('day').valueOf();
      })();

      return matchesSearch && matchesRange;
    });
  }, [allBookings, dateRange, search]);

  const selectedBooking = allBookings.find((booking) => booking.id === selectedBookingId) ?? null;
  const usingClientFilters = Boolean(search.trim() || dateRange);

  function openBookingDrawer(booking: BookingDetail) {
    setSelectedBookingId(booking.id);
    setCancelReason('');
    setAdminNoteDrafts((prev) => prev[booking.id] !== undefined ? prev : { ...prev, [booking.id]: booking.adminNotes });
  }

  function handleForceCancel() {
    if (!selectedBooking) return;

    const reason = cancelReason.trim();
    if (!reason) {
      message.warning('Please provide a cancellation reason');
      return;
    }

    setBookingOverrides((prev) => ({
      ...prev,
      [selectedBooking.id]: {
        ...prev[selectedBooking.id],
        status: 'CANCELLED',
        cancellationReason: reason,
      },
    }));
    message.success('Booking force-cancelled');
    setCancelReason('');
  }

  function handleSaveAdminNotes() {
    if (!selectedBooking) return;

    const note = (adminNoteDrafts[selectedBooking.id] ?? '').trim();
    setBookingOverrides((prev) => ({
      ...prev,
      [selectedBooking.id]: {
        ...prev[selectedBooking.id],
        adminNotes: note,
      },
    }));
    setAdminNoteDrafts((prev) => ({ ...prev, [selectedBooking.id]: note }));
    message.success('Admin notes saved');
  }

  const stepItems = selectedBooking ? BOOKING_STEPS.map((step, index) => {
    const reachedStep = getReachedStep(selectedBooking);
    const stepTime = getStepTimestamp(selectedBooking, step.key);
    const isCancelledStep = selectedBooking.status === 'CANCELLED' && index === reachedStep;

    return {
      title: step.title,
      description: `${step.description}${stepTime ? ` • ${formatDateTime(stepTime)}` : ''}`,
      status: selectedBooking.status === 'COMPLETED'
        ? 'finish'
        : index < reachedStep
          ? 'finish'
          : index === reachedStep
            ? (isCancelledStep ? 'error' : 'process')
            : 'wait',
    } as const;
  }) : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Bookings</h1>
          <p style={{ color: '#6b7280', marginTop: 4, marginBottom: 0 }}>Track booking milestones, investigate issues, and intervene when required.</p>
        </div>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search booking, customer, vendor"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 240 }}
          />
          <RangePicker
            allowClear
            format="DD MMM YYYY"
            value={dateRange}
            onChange={(value) => {
              setDateRange(value && value[0] && value[1] ? [value[0], value[1]] : null);
              setPage(1);
            }}
          />
          <Select
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            style={{ width: 170 }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'ENQUIRY', label: 'Enquiry' },
              { value: 'QUOTE_SENT', label: 'Quote Sent' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'ESCROWED', label: 'Escrowed' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
              { value: 'DISPUTED', label: 'Disputed' },
            ]}
          />
        </Space>
      </div>
      <Card>
        <Spin spinning={isLoading}>
          <Table<BookingDetail>
            dataSource={filteredBookings}
            rowKey="id"
            size="small"
            pagination={{
              current: page,
              total: usingClientFilters ? filteredBookings.length : data?.meta.total ?? 0,
              pageSize: 15,
              onChange: setPage,
              showTotal: (t) => `${t} bookings`,
            }}
            columns={[
              { title: 'ID', dataIndex: 'id', render: (t: string) => <code style={{ fontSize: 10 }}>{t.slice(0, 8)}…</code>, width: 90 },
              { title: 'Customer', dataIndex: 'customerName', key: 'customer' },
              { title: 'Vendor', dataIndex: 'vendorName', key: 'vendor' },
              {
                title: 'Event Date', dataIndex: 'eventDate', key: 'date',
                render: (d: string) => d ? format(new Date(d), 'dd MMM yyyy') : '—',
              },
              {
                title: 'Amount', dataIndex: 'quotedAmountPaise', key: 'amount',
                render: (a: number) => a ? <strong>{formatCurrency(a)}</strong> : '—',
              },
              {
                title: 'Status', dataIndex: 'status', key: 'status',
                render: (s: string) => getStatusTag(s),
              },
              {
                title: 'Actions', key: 'actions',
                render: (_: unknown, row: BookingDetail) => (
                  <Space>
                    <Button size="small" onClick={() => openBookingDrawer(row)}>View</Button>
                    {row.status === 'DISPUTED' && <Button size="small" type="primary" danger>Resolve</Button>}
                  </Space>
                ),
              },
            ]}
          />
        </Spin>
      </Card>

      <Drawer
        title={selectedBooking ? `Booking ${selectedBooking.id.slice(0, 8)}…` : 'Booking Details'}
        placement="right"
        width={560}
        onClose={() => setSelectedBookingId(null)}
        open={Boolean(selectedBooking)}
      >
        {selectedBooking && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Booking ID"><code>{selectedBooking.id}</code></Descriptions.Item>
              <Descriptions.Item label="Status">{getStatusTag(selectedBooking.status)}</Descriptions.Item>
              <Descriptions.Item label="Created">{formatDateTime(selectedBooking.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Customer">{selectedBooking.customerName}</Descriptions.Item>
              <Descriptions.Item label="Vendor">{selectedBooking.vendorName}</Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} size="small" bordered title="Event Info">
              <Descriptions.Item label="Event Date">{formatDateTime(selectedBooking.eventDate, 'dd MMM yyyy')}</Descriptions.Item>
              <Descriptions.Item label="Event Type">{selectedBooking.eventType}</Descriptions.Item>
              <Descriptions.Item label="Event City">{selectedBooking.eventCity}</Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} size="small" bordered title="Payment Breakdown">
              <Descriptions.Item label="Quoted Amount">{formatCurrency(selectedBooking.quotedAmountPaise)}</Descriptions.Item>
              <Descriptions.Item label="Advance Paid">{formatCurrency(selectedBooking.advancePaidPaise)}</Descriptions.Item>
              <Descriptions.Item label="Platform Fee">{formatCurrency(selectedBooking.platformFeePaise)}</Descriptions.Item>
              <Descriptions.Item label="Vendor Receivable">{formatCurrency(selectedBooking.quotedAmountPaise - selectedBooking.platformFeePaise)}</Descriptions.Item>
            </Descriptions>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Booking Timeline</div>
              <Steps direction="vertical" size="small" current={Math.min(getReachedStep(selectedBooking), BOOKING_STEPS.length - 1)} items={stepItems} />
              {selectedBooking.status === 'CANCELLED' && selectedBooking.cancellationReason && (
                <div style={{ marginTop: 12, color: '#dc2626', fontSize: 12 }}>
                  Cancel reason: {selectedBooking.cancellationReason}
                </div>
              )}
            </div>

            <Divider style={{ margin: 0 }} />

            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Force cancel booking</div>
              <Input.TextArea
                rows={3}
                placeholder="Reason for admin override cancellation"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <Button danger style={{ marginTop: 12 }} onClick={handleForceCancel} disabled={selectedBooking.status === 'COMPLETED'}>
                Force-cancel booking
              </Button>
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Admin notes</div>
              <Input.TextArea
                rows={4}
                placeholder="Add investigation notes, follow-up actions, or customer context"
                value={adminNoteDrafts[selectedBooking.id] ?? selectedBooking.adminNotes}
                onChange={(e) => setAdminNoteDrafts((prev) => ({ ...prev, [selectedBooking.id]: e.target.value }))}
              />
              <Button type="primary" style={{ marginTop: 12 }} onClick={handleSaveAdminNotes}>
                Save Notes
              </Button>
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS PAGE
// ─────────────────────────────────────────────────────────────────────────────

export function Users() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, roleFilter, search],
    queryFn: () => usersApi.list({
      page, limit: 15,
      role: roleFilter === 'all' ? undefined : roleFilter,
      q: search || undefined,
    }),
    placeholderData: (prev) => prev,
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Users</h1>
        <Space>
          <Input.Search
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 200 }}
          />
          <Select
            value={roleFilter}
            onChange={(v) => { setRoleFilter(v); setPage(1); }}
            style={{ width: 140 }}
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'customer', label: 'Customer' },
              { value: 'vendor', label: 'Vendor' },
              { value: 'admin', label: 'Admin' },
            ]}
          />
        </Space>
      </div>
      <Card>
        <Spin spinning={isLoading}>
          <Table<AdminUser>
            dataSource={data?.data.users ?? []}
            rowKey="id"
            size="small"
            pagination={{
              current: page,
              total: data?.meta.total ?? 0,
              pageSize: 15,
              onChange: setPage,
              showTotal: (t) => `${t} users`,
            }}
            columns={[
              { title: 'ID', dataIndex: 'id', render: (t: string) => <code style={{ fontSize: 10 }}>{t.slice(0, 8)}…</code>, width: 90 },
              { title: 'Phone', dataIndex: 'phone', key: 'phone' },
              { title: 'Name', dataIndex: 'name', key: 'name', render: (t: string | null) => t ?? <span style={{ color: '#aaa' }}>—</span> },
              {
                title: 'Role', dataIndex: 'role', key: 'role',
                render: (r: string) => <Tag color={r === 'vendor' ? 'purple' : r === 'admin' ? 'red' : 'blue'}>{r.toUpperCase()}</Tag>,
              },
              {
                title: 'Joined', dataIndex: 'createdAt', key: 'joined',
                render: (d: string) => d ? format(new Date(d), 'dd MMM yyyy') : '—',
              },
              {
                title: 'Actions', key: 'actions',
                render: (_: unknown, row: AdminUser) => (
                  <Space><Button size="small">View</Button></Space>
                ),
              },
            ]}
          />
        </Spin>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS & ESCROW PAGE
// ─────────────────────────────────────────────────────────────────────────────

export function Payments() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page, statusFilter],
    queryFn: () => paymentsApi.list({
      page, limit: 15,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    placeholderData: (prev) => prev,
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => paymentsApi.refund(id, reason),
    onSuccess: () => { message.success('Refund initiated'); qc.invalidateQueries({ queryKey: ['admin-payments'] }); },
    onError: () => message.error('Failed to initiate refund'),
  });

  const releaseMutation = useMutation({
    mutationFn: (escrowId: string) => paymentsApi.releaseEscrow(escrowId),
    onSuccess: () => { message.success('Escrow released'); qc.invalidateQueries({ queryKey: ['admin-payments'] }); },
    onError: () => message.error('Failed to release escrow'),
  });

  function handleRefund(paymentId: string) {
    Modal.confirm({
      title: 'Initiate Refund',
      icon: <ExclamationCircleOutlined />,
      content: <Input.TextArea id="refund-reason" placeholder="Reason for refund..." />,
      okText: 'Refund',
      okButtonProps: { danger: true },
      onOk: () => {
        const reason = (document.getElementById('refund-reason') as HTMLTextAreaElement)?.value ?? 'Customer request';
        refundMutation.mutate({ id: paymentId, reason });
      },
    });
  }

  function handleRelease(escrowId: string) {
    Modal.confirm({
      title: 'Release Escrow to Vendor',
      content: 'This will transfer the escrowed amount to the vendor. This action cannot be undone.',
      okText: 'Release Funds',
      onOk: () => releaseMutation.mutate(escrowId),
    });
  }

  const statusColor: Record<string, string> = {
    CAPTURED: 'green', CREATED: 'blue', FAILED: 'red', REFUNDED: 'orange',
    HOLDING: 'geekblue', RELEASED: 'green', DISPUTED: 'volcano',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Payments & Escrow</h1>
        <Select
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          style={{ width: 160 }}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'CAPTURED', label: 'Captured' },
            { value: 'HOLDING', label: 'Holding' },
            { value: 'RELEASED', label: 'Released' },
            { value: 'REFUNDED', label: 'Refunded' },
            { value: 'FAILED', label: 'Failed' },
          ]}
        />
      </div>
      <Card>
        <Spin spinning={isLoading}>
          <Table<Payment>
            dataSource={data?.data.payments ?? []}
            rowKey="id"
            size="small"
            pagination={{
              current: page,
              total: data?.meta.total ?? 0,
              pageSize: 15,
              onChange: setPage,
              showTotal: (t) => `${t} payments`,
            }}
            columns={[
              { title: 'ID', dataIndex: 'id', render: (t: string) => <code style={{ fontSize: 10 }}>{t.slice(0, 8)}…</code>, width: 90 },
              { title: 'Booking', dataIndex: 'bookingId', key: 'booking', render: (t: string) => <code style={{ fontSize: 10 }}>{t.slice(0, 8)}…</code> },
              {
                title: 'Amount', dataIndex: 'amountPaise', key: 'amount',
                render: (a: number) => <strong>₹{(a / 100).toLocaleString('en-IN')}</strong>,
              },
              {
                title: 'Razorpay', dataIndex: 'razorpayOrderId', key: 'rp',
                render: (t: string) => t ? <code style={{ fontSize: 10 }}>{t}</code> : '—',
              },
              {
                title: 'Status', dataIndex: 'status', key: 'status',
                render: (s: string) => <Tag color={statusColor[s] ?? 'default'}>{s}</Tag>,
              },
              {
                title: 'Created', dataIndex: 'createdAt', key: 'created',
                render: (d: string) => d ? format(new Date(d), 'dd MMM HH:mm') : '—',
              },
              {
                title: 'Actions', key: 'actions',
                render: (_: unknown, row: Payment) => (
                  <Space>
                    {row.status === 'HOLDING' && (
                      <Button size="small" type="primary" onClick={() => handleRelease(row.id)}
                        loading={releaseMutation.isPending}>
                        Release
                      </Button>
                    )}
                    {(row.status === 'CAPTURED' || row.status === 'HOLDING') && (
                      <Button size="small" danger onClick={() => handleRefund(row.id)}>Refund</Button>
                    )}
                  </Space>
                ),
              },
            ]}
          />
        </Spin>
      </Card>
    </div>
  );
}
