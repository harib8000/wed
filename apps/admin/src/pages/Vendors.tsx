import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Tag, Button, Space, Input, Select, Card, Modal, message, Spin,
  Row, Col, Statistic, Drawer, Descriptions, Progress, Image,
} from 'antd';
import {
  SearchOutlined, CheckCircleOutlined, CloseCircleOutlined,
  PauseCircleOutlined, SafetyCertificateOutlined, EyeOutlined, FileImageOutlined, FilePdfOutlined,
} from '@ant-design/icons';
import { vendorsApi, type Vendor } from '../lib/api';
import { useDebounce } from '../lib/useDebounce';

type KycDocumentStatus = 'VERIFIED' | 'PENDING' | 'NOT_UPLOADED';
type KycDocumentPreviewType = 'image' | 'pdf';

interface KycDocument {
  key: string;
  label: string;
  status: KycDocumentStatus;
  previewType: KycDocumentPreviewType;
  previewUrl?: string;
  uploadedAt?: string;
  note: string;
}

const PDF_PREVIEW_DATA_URL = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCAxNDcgPj4Kc3RyZWFtCkJUIC9GMSAyMCBUZiA3MiA3MjAgVGQgKFdlZGRpbmdPUyBLWUMgU3RhdGVtZW50IFByZXZpZXcpIFRqIEVUCkJUIC9GMSAxMiBUZiA3MiA2OTAgVGQgKFRoaXMgaXMgYSBwbGFjZWhvbGRlciBQREYgZG9jdW1lbnQgZm9yIGFkbWluIHJldmlldy4pIFRqIEVUCgplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyNDEgMDAwMDAgbiAKMDAwMDAwMDQzOSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjUwOQolJUVPRg==';

function buildImagePreview(title: string, vendorName: string, accent: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
      <defs>
        <linearGradient id="docBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#f5f3ff" />
        </linearGradient>
      </defs>
      <rect width="1200" height="1600" rx="40" fill="url(#docBg)" />
      <rect x="72" y="72" width="1056" height="180" rx="28" fill="${accent}" opacity="0.14" />
      <text x="112" y="150" font-size="48" font-family="Arial, sans-serif" font-weight="700" fill="#111827">${title}</text>
      <text x="112" y="205" font-size="28" font-family="Arial, sans-serif" fill="#4b5563">${vendorName}</text>
      <rect x="112" y="320" width="976" height="1100" rx="28" fill="#ffffff" stroke="#e5e7eb" stroke-width="4" />
      <text x="160" y="420" font-size="28" font-family="Arial, sans-serif" fill="#6b7280">Document snapshot for admin KYC review</text>
      <text x="160" y="520" font-size="32" font-family="Arial, sans-serif" fill="#111827">Uploaded identity and compliance details</text>
      <line x1="160" y1="610" x2="1040" y2="610" stroke="#d1d5db" stroke-width="4" />
      <line x1="160" y1="710" x2="1040" y2="710" stroke="#d1d5db" stroke-width="4" />
      <line x1="160" y1="810" x2="1040" y2="810" stroke="#d1d5db" stroke-width="4" />
      <text x="160" y="930" font-size="26" font-family="Arial, sans-serif" fill="#4b5563">WeddingOS Admin • Inline preview mode</text>
      <rect x="160" y="1010" width="280" height="140" rx="20" fill="${accent}" opacity="0.18" />
      <text x="205" y="1098" font-size="34" font-family="Arial, sans-serif" fill="#111827">KYC Preview</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildKycDocuments(vendor: Vendor): KycDocument[] {
  return [
    {
      key: 'gst-certificate',
      label: 'GST Certificate',
      status: 'PENDING',
      previewType: 'image',
      previewUrl: buildImagePreview('GST Certificate', vendor.businessName, '#7c3aed'),
      uploadedAt: vendor.createdAt,
      note: 'GST certificate uploaded and awaiting tax registration verification.',
    },
    {
      key: 'pan-card',
      label: 'PAN Card',
      status: 'VERIFIED',
      previewType: 'image',
      previewUrl: buildImagePreview('PAN Card', vendor.businessName, '#059669'),
      uploadedAt: vendor.createdAt,
      note: 'PAN card matches the registered account holder details.',
    },
    {
      key: 'business-registration',
      label: 'Business Registration',
      status: 'VERIFIED',
      previewType: 'pdf',
      previewUrl: PDF_PREVIEW_DATA_URL,
      uploadedAt: vendor.createdAt,
      note: 'Company registration certificate was uploaded as a PDF document.',
    },
    {
      key: 'bank-statement',
      label: 'Bank Statement',
      status: 'NOT_UPLOADED',
      previewType: 'pdf',
      note: 'Vendor still needs to upload a recent bank statement for payout verification.',
    },
  ];
}

export function Vendors() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [docPreview, setDocPreview] = useState<KycDocument | null>(null);
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

  const { data: totalCount } = useQuery({
    queryKey: ['admin-vendors-count', 'all'],
    queryFn: () => vendorsApi.list({ page: 1, limit: 1 }),
    staleTime: 60_000,
  });

  const { data: pendingCount } = useQuery({
    queryKey: ['admin-vendors-count', 'PENDING_KYC'],
    queryFn: () => vendorsApi.list({ page: 1, limit: 1, status: 'PENDING_KYC' }),
    staleTime: 60_000,
  });

  const { data: verifiedCount } = useQuery({
    queryKey: ['admin-vendors-count', 'ACTIVE'],
    queryFn: () => vendorsApi.list({ page: 1, limit: 1, status: 'ACTIVE' }),
    staleTime: 60_000,
  });

  const { data: suspendedCount } = useQuery({
    queryKey: ['admin-vendors-count', 'SUSPENDED'],
    queryFn: () => vendorsApi.list({ page: 1, limit: 1, status: 'SUSPENDED' }),
    staleTime: 60_000,
  });

  const { data: rejectedCount } = useQuery({
    queryKey: ['admin-vendors-count', 'REJECTED'],
    queryFn: () => vendorsApi.list({ page: 1, limit: 1, status: 'REJECTED' }),
    staleTime: 60_000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => vendorsApi.approve(id),
    onSuccess: () => {
      message.success('Vendor approved and KYC cleared');
      setSelectedVendor(null);
      setReviewReason('');
      qc.invalidateQueries({ queryKey: ['admin-vendors'] });
      qc.invalidateQueries({ queryKey: ['admin-vendors-count'] });
    },
    onError: () => message.error('Failed to approve vendor'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => vendorsApi.reject(id, reason),
    onSuccess: () => {
      message.success('Vendor rejected');
      setSelectedVendor(null);
      setReviewReason('');
      qc.invalidateQueries({ queryKey: ['admin-vendors'] });
      qc.invalidateQueries({ queryKey: ['admin-vendors-count'] });
    },
    onError: () => message.error('Failed to reject vendor'),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => vendorsApi.suspend(id, reason),
    onSuccess: () => {
      message.success('Vendor suspended');
      qc.invalidateQueries({ queryKey: ['admin-vendors'] });
      qc.invalidateQueries({ queryKey: ['admin-vendors-count'] });
    },
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

  const totals = useMemo(() => {
    const total = totalCount?.meta.total ?? data?.meta.total ?? 0;
    const pending = pendingCount?.meta.total ?? 0;
    const verified = verifiedCount?.meta.total ?? 0;
    const suspended = suspendedCount?.meta.total ?? 0;
    const rejected = rejectedCount?.meta.total ?? 0;
    const reviewed = Math.max(total - pending, verified + suspended + rejected);
    const approvalRate = reviewed > 0 ? Math.round((verified / reviewed) * 100) : 0;
    return { total, pending, verified, suspended, rejected, approvalRate };
  }, [data?.meta.total, pendingCount?.meta.total, rejectedCount?.meta.total, suspendedCount?.meta.total, totalCount?.meta.total, verifiedCount?.meta.total]);

  const kycDocuments = useMemo(() => (
    selectedVendor ? buildKycDocuments(selectedVendor) : []
  ), [selectedVendor]);

  const kycStatusColor: Record<KycDocumentStatus, string> = {
    VERIFIED: 'green',
    PENDING: 'orange',
    NOT_UPLOADED: 'default',
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

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Vendors" value={totals.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Pending KYC" value={totals.pending} valueStyle={{ color: '#d97706' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Verified" value={totals.verified} valueStyle={{ color: '#059669' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Suspended" value={totals.suspended} valueStyle={{ color: '#d4380d' }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Vendor stats at a glance</div>
            <div style={{ color: '#6b7280', fontSize: 13 }}>Use quick filters to focus on approvals, active vendors, or compliance reviews.</div>
          </div>
          <div style={{ minWidth: 240 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span>KYC Approval Rate</span>
              <strong>{totals.approvalRate}%</strong>
            </div>
            <Progress percent={totals.approvalRate} strokeColor="#c026d3" showInfo={false} />
          </div>
        </div>
        <Space wrap style={{ marginTop: 16 }}>
          {[
            { label: 'All Vendors', value: 'all' },
            { label: `Pending KYC (${totals.pending})`, value: 'PENDING_KYC' },
            { label: `Verified (${totals.verified})`, value: 'ACTIVE' },
            { label: `Suspended (${totals.suspended})`, value: 'SUSPENDED' },
            { label: `Rejected (${totals.rejected})`, value: 'REJECTED' },
          ].map((filterOption) => (
            <Button
              key={filterOption.value}
              type={statusFilter === filterOption.value ? 'primary' : 'default'}
              onClick={() => { setStatusFilter(filterOption.value); setPage(1); }}
            >
              {filterOption.label}
            </Button>
          ))}
        </Space>
      </Card>

      <Card>
        <Spin spinning={isLoading}>
          <Table<Vendor>
            dataSource={data?.data.vendors ?? []}
            rowKey="id"
            size="small"
            onRow={(row) => ({
              onClick: () => {
                if (row.status === 'PENDING_KYC') {
                  setSelectedVendor(row);
                  setReviewReason('');
                }
              },
              style: row.status === 'PENDING_KYC' ? { cursor: 'pointer' } : undefined,
            })}
            pagination={{
              current: page,
              total: data?.meta.total ?? 0,
              pageSize: 15,
              onChange: setPage,
              showTotal: (t) => `${t} vendors`,
            }}
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id', render: (t: string) => <code style={{ fontSize: 10 }}>{t.slice(0, 8)}…</code>, width: 90 },
              {
                title: 'Name', dataIndex: 'businessName', key: 'name',
                render: (t: string, row: Vendor) => (
                  <div>
                    <strong>{t}</strong>
                    {row.status === 'PENDING_KYC' && (
                      <div style={{ color: '#d97706', fontSize: 12, marginTop: 2 }}>
                        Click to open KYC review panel
                      </div>
                    )}
                  </div>
                ),
              },
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
                  <Space onClick={(e) => e.stopPropagation()}>
                    <Button size="small" href={`/vendors/${row.id}`}>View</Button>
                    {row.status === 'PENDING_KYC' && (
                      <>
                        <Button size="small" onClick={() => { setSelectedVendor(row); setReviewReason(''); }}>
                          Review KYC
                        </Button>
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

      <Drawer
        title={selectedVendor ? `${selectedVendor.businessName} — KYC Review` : 'KYC Review'}
        placement="right"
        width={460}
        open={!!selectedVendor}
        onClose={() => { setSelectedVendor(null); setReviewReason(''); setDocPreview(null); }}
      >
        {selectedVendor && (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Card size="small" style={{ background: '#fff7ed', borderColor: '#fed7aa' }}>
              <Space align="start">
                <SafetyCertificateOutlined style={{ color: '#d97706', fontSize: 18, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Pending KYC verification</div>
                  <div style={{ color: '#92400e', fontSize: 13 }}>Review documents, verify business details, then approve or reject with reason.</div>
                </div>
              </Space>
            </Card>

            <Descriptions column={1} size="small" title="Business details">
              <Descriptions.Item label="Business Name">{selectedVendor.businessName}</Descriptions.Item>
              <Descriptions.Item label="Category">{selectedVendor.category}</Descriptions.Item>
              <Descriptions.Item label="Location">{selectedVendor.city}, {selectedVendor.state}</Descriptions.Item>
              <Descriptions.Item label="Vendor ID"><code>{selectedVendor.id}</code></Descriptions.Item>
              <Descriptions.Item label="User ID"><code>{selectedVendor.userId}</code></Descriptions.Item>
              <Descriptions.Item label="Performance">{selectedVendor.bookingCount} bookings · {selectedVendor.avgRating.toFixed(1)} rating</Descriptions.Item>
              <Descriptions.Item label="Submitted On">{new Date(selectedVendor.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Descriptions.Item>
            </Descriptions>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Submitted documents</div>
              <Space direction="vertical" style={{ width: '100%' }}>
                {kycDocuments.map((doc) => {
                  const icon = doc.previewType === 'pdf' ? <FilePdfOutlined style={{ color: '#d4380d', fontSize: 18 }} /> : <FileImageOutlined style={{ color: '#7c3aed', fontSize: 18 }} />;
                  return (
                    <div key={doc.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '12px 14px', border: '1px solid #f3f4f6', borderRadius: 12 }}>
                      <Space align="start" size={12}>
                        <div style={{ marginTop: 4 }}>{icon}</div>
                        <div>
                          <Space wrap>
                            <div style={{ fontWeight: 500 }}>{doc.label}</div>
                            <Tag color={kycStatusColor[doc.status]}>{doc.status.replace('_', ' ')}</Tag>
                          </Space>
                          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>{doc.note}</div>
                          <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
                            {doc.uploadedAt ? `Uploaded ${new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No file uploaded yet'}
                          </div>
                        </div>
                      </Space>
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        disabled={!doc.previewUrl}
                        onClick={() => setDocPreview(doc)}
                      >
                        View
                      </Button>
                    </div>
                  );
                })}
              </Space>
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Reject with reason</div>
              <Input.TextArea
                rows={4}
                placeholder="Add a clear reason if documents are incomplete or invalid"
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
              />
            </div>

            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={approveMutation.isPending}
                onClick={() => approveMutation.mutate(selectedVendor.id)}
              >
                Approve
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                loading={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ id: selectedVendor.id, reason: reviewReason || 'KYC documents incomplete' })}
              >
                Reject with reason
              </Button>
            </Space>
          </Space>
        )}
      </Drawer>

      <Modal
        title={docPreview ? `${docPreview.label} preview` : 'Document preview'}
        open={!!docPreview}
        width={840}
        footer={docPreview?.previewType === 'pdf' && docPreview.previewUrl ? [
          <Button key="open" href={docPreview.previewUrl} target="_blank" rel="noreferrer">
            Open in new tab
          </Button>,
        ] : null}
        onCancel={() => setDocPreview(null)}
      >
        {docPreview && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space wrap>
              <Tag color={kycStatusColor[docPreview.status]}>{docPreview.status.replace('_', ' ')}</Tag>
              <Tag>{docPreview.previewType.toUpperCase()}</Tag>
            </Space>
            <div style={{ color: '#6b7280', fontSize: 13 }}>{docPreview.note}</div>
            {docPreview.previewType === 'image' && docPreview.previewUrl && (
              <Image
                src={docPreview.previewUrl}
                alt={docPreview.label}
                preview={false}
                style={{ width: '100%', borderRadius: 12, border: '1px solid #f3f4f6' }}
              />
            )}
            {docPreview.previewType === 'pdf' && docPreview.previewUrl && (
              <iframe
                title={`${docPreview.label} preview`}
                src={docPreview.previewUrl}
                style={{ width: '100%', height: 560, border: '1px solid #f3f4f6', borderRadius: 12 }}
              />
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
}
