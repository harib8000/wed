import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Input, Select, Card, Modal, message, Spin } from 'antd';
import {
  SearchOutlined, CheckCircleOutlined, CloseCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import { vendorsApi, type Vendor } from '../lib/api';
import { useDebounce } from '../lib/useDebounce';

export function Vendors() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vendors', page, debouncedSearch, statusFilter, categoryFilter],
    queryFn: () =>
      vendorsApi.list({
        page,
        limit: 15,
        q: debouncedSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
      }),
    placeholderData: (prev) => prev,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => vendorsApi.approve(id),
    onSuccess: () => { message.success('Vendor approved and KYC cleared'); qc.invalidateQueries({ queryKey: ['admin-vendors'] }); },
    onError: () => message.error('Failed to approve vendor'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => vendorsApi.reject(id, reason),
    onSuccess: () => { message.success('Vendor rejected'); qc.invalidateQueries({ queryKey: ['admin-vendors'] }); },
    onError: () => message.error('Failed to reject vendor'),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => vendorsApi.suspend(id, reason),
    onSuccess: () => { message.success('Vendor suspended'); qc.invalidateQueries({ queryKey: ['admin-vendors'] }); },
    onError: () => message.error('Failed to suspend vendor'),
  });

  function handleReject(id: string) {
    Modal.confirm({
      title: 'Reject Vendor KYC',
      content: <Input.TextArea placeholder="Enter rejection reason..." id="reject-reason" />,
      onOk: () => {
        const reason = (document.getElementById('reject-reason') as HTMLTextAreaElement)?.value ?? 'KYC documents incomplete';
        rejectMutation.mutate({ id, reason });
      },
    });
  }

  function handleSuspend(id: string) {
    Modal.confirm({
      title: 'Suspend Vendor',
      content: <Input.TextArea placeholder="Enter suspension reason..." id="suspend-reason" />,
      onOk: () => {
        const reason = (document.getElementById('suspend-reason') as HTMLTextAreaElement)?.value ?? 'Policy violation';
        suspendMutation.mutate({ id, reason });
      },
    });
  }

  const statusColor: Record<string, string> = {
    ACTIVE: 'green', PENDING_KYC: 'orange', REJECTED: 'red', SUSPENDED: 'volcano',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Vendors</h1>
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 220 }}
          />
          <Select
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'PENDING_KYC', label: 'Pending KYC' },
              { value: 'REJECTED', label: 'Rejected' },
              { value: 'SUSPENDED', label: 'Suspended' },
            ]}
          />
          <Select
            value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); setPage(1); }}
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'PHOTOGRAPHY', label: 'Photography' },
              { value: 'VENUE', label: 'Venue' },
              { value: 'CATERING', label: 'Catering' },
              { value: 'DECOR', label: 'Decor' },
              { value: 'MAKEUP', label: 'Makeup' },
              { value: 'MUSIC', label: 'Music' },
            ]}
          />
        </Space>
      </div>
      <Card>
        <Spin spinning={isLoading}>
          <Table<Vendor>
            dataSource={data?.data.vendors ?? []}
            rowKey="id"
            size="small"
            pagination={{
              current: page,
              total: data?.meta.total ?? 0,
              pageSize: 15,
              onChange: setPage,
              showTotal: (t) => `${t} vendors`,
            }}
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id', render: (t: string) => <code style={{ fontSize: 10 }}>{t.slice(0, 8)}…</code>, width: 90 },
              { title: 'Name', dataIndex: 'businessName', key: 'name', render: (t: string) => <strong>{t}</strong> },
              { title: 'Category', dataIndex: 'category', key: 'category', render: (t: string) => <Tag>{t}</Tag> },
              { title: 'City', dataIndex: 'city', key: 'city' },
              { title: 'Rating', dataIndex: 'avgRating', key: 'rating', render: (r: number) => <span style={{ color: '#d97706' }}>⭐ {r?.toFixed(1) ?? '—'}</span> },
              { title: 'Bookings', dataIndex: 'bookingCount', key: 'bookings' },
              {
                title: 'Status', dataIndex: 'status', key: 'status',
                render: (s: string) => <Tag color={statusColor[s] ?? 'default'}>{s.replace('_', ' ')}</Tag>,
              },
              {
                title: 'Actions', key: 'actions',
                render: (_: unknown, row: Vendor) => (
                  <Space>
                    <Button size="small" href={`/vendors/${row.id}`}>View</Button>
                    {row.status === 'PENDING_KYC' && (
                      <>
                        <Button
                          size="small" type="primary" icon={<CheckCircleOutlined />}
                          onClick={() => approveMutation.mutate(row.id)}
                          loading={approveMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small" danger icon={<CloseCircleOutlined />}
                          onClick={() => handleReject(row.id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {row.status === 'ACTIVE' && (
                      <Button
                        size="small" icon={<PauseCircleOutlined />}
                        onClick={() => handleSuspend(row.id)}
                      >
                        Suspend
                      </Button>
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
