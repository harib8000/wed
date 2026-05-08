import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Card, Select, Spin, Modal, message, Input } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { bookingsApi, usersApi, paymentsApi, type Booking, type AdminUser, type Payment } from '../lib/api';
import { format } from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS PAGE
// ─────────────────────────────────────────────────────────────────────────────

export function Bookings() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', page, statusFilter],
    queryFn: () => bookingsApi.list({ page, limit: 15, status: statusFilter === 'all' ? undefined : statusFilter }),
    placeholderData: (prev) => prev,
  });

  const statusColor: Record<string, string> = {
    ENQUIRY: 'orange', QUOTE_SENT: 'blue', CONFIRMED: 'green',
    ADVANCE_PAID: 'cyan', ESCROWED: 'geekblue', COMPLETED: 'green',
    CANCELLED: 'red', DISPUTED: 'volcano',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Bookings</h1>
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
      </div>
      <Card>
        <Spin spinning={isLoading}>
          <Table<Booking>
            dataSource={data?.data.bookings ?? []}
            rowKey="id"
            size="small"
            pagination={{
              current: page,
              total: data?.meta.total ?? 0,
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
                render: (a: number) => a ? <strong>₹{(a / 100).toLocaleString('en-IN')}</strong> : '—',
              },
              {
                title: 'Status', dataIndex: 'status', key: 'status',
                render: (s: string) => <Tag color={statusColor[s] ?? 'default'}>{s.replace(/_/g, ' ')}</Tag>,
              },
              {
                title: 'Actions', key: 'actions',
                render: (_: unknown, row: Booking) => (
                  <Space>
                    <Button size="small" href={`/bookings/${row.id}`}>View</Button>
                    {row.status === 'DISPUTED' && <Button size="small" type="primary" danger>Resolve</Button>}
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
