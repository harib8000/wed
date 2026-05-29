import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Card, Select, Modal, Input, InputNumber, Row, Col, Statistic, Spin, Alert, message, Image, Timeline, Tooltip } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, FileSearchOutlined, EyeOutlined, FileImageOutlined, FilePdfOutlined, WarningOutlined } from '@ant-design/icons';
import { disputesApi, type Dispute } from '../lib/api';
import { format } from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK FALLBACK DATA
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_DISPUTES: Dispute[] = [
  {
    id: 'dsp-001-abc', bookingId: 'bk-001', bookingNumber: 'BK-2024-0821', customerName: 'Priya Sharma',
    vendorName: 'Royal Photography', reason: 'poor_quality', status: 'OPEN',
    refundAmountPaise: null, adminNotes: null, resolvedAt: null,
    description: 'Photos were blurry and poorly edited. Many important moments were missed during the ceremony.',
    evidenceUrls: ['evidence1.jpg', 'evidence2.jpg'], createdAt: '2024-12-01T10:30:00Z',
  },
  {
    id: 'dsp-002-def', bookingId: 'bk-002', bookingNumber: 'BK-2024-0835', customerName: 'Rahul Verma',
    vendorName: 'Spice Kitchen Catering', reason: 'no_show', status: 'UNDER_REVIEW',
    refundAmountPaise: null, adminNotes: null, resolvedAt: null,
    description: 'Vendor did not show up on the event day. Had to arrange alternate catering last minute.',
    evidenceUrls: ['chat_screenshot.jpg'], createdAt: '2024-11-28T14:15:00Z',
  },
  {
    id: 'dsp-003-ghi', bookingId: 'bk-003', bookingNumber: 'BK-2024-0798', customerName: 'Anita Reddy',
    vendorName: 'Melody Band', reason: 'late_arrival', status: 'RESOLVED_CUSTOMER',
    refundAmountPaise: 3500000, adminNotes: 'Full refund granted.', resolvedAt: '2024-11-22T10:00:00Z',
    description: 'Band arrived 2 hours late, missed the baraat procession entirely.',
    evidenceUrls: [], createdAt: '2024-11-20T09:00:00Z',
  },
  {
    id: 'dsp-004-jkl', bookingId: 'bk-004', bookingNumber: 'BK-2024-0812', customerName: 'Vikram Patel',
    vendorName: 'Bloom Decorators', reason: 'wrong_items', status: 'RESOLVED_VENDOR',
    refundAmountPaise: null, adminNotes: 'Vendor provided evidence of contract compliance.', resolvedAt: '2024-11-18T14:00:00Z',
    description: 'Decorations did not match what was agreed. Different flowers were used.',
    evidenceUrls: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'], createdAt: '2024-11-15T16:45:00Z',
  },
  {
    id: 'dsp-005-mno', bookingId: 'bk-005', bookingNumber: 'BK-2024-0850', customerName: 'Meera Joshi',
    vendorName: 'DJ Beats', reason: 'overcharging', status: 'OPEN',
    refundAmountPaise: null, adminNotes: null, resolvedAt: null,
    description: 'Vendor charged extra ₹20,000 on the event day for equipment that was supposed to be included.',
    evidenceUrls: ['invoice.jpg'], createdAt: '2024-12-03T11:20:00Z',
  },
  {
    id: 'dsp-006-pqr', bookingId: 'bk-006', bookingNumber: 'BK-2024-0860', customerName: 'Suresh Kumar',
    vendorName: 'Elegant Venues', reason: 'cancellation', status: 'UNDER_REVIEW',
    refundAmountPaise: null, adminNotes: null, resolvedAt: null,
    description: 'Venue cancelled 3 days before the event citing maintenance issues. No prior notice given.',
    evidenceUrls: ['cancellation_email.jpg'], createdAt: '2024-12-05T08:00:00Z',
  },
  {
    id: 'dsp-007-stu', bookingId: 'bk-007', bookingNumber: 'BK-2024-0744', customerName: 'Deepa Nair',
    vendorName: 'Bridal Boutique', reason: 'poor_quality', status: 'CLOSED',
    refundAmountPaise: 4500000, adminNotes: 'Refund processed after vendor acknowledged issue.', resolvedAt: '2024-11-01T09:00:00Z',
    description: 'Lehenga stitching was poor and did not match the design shown during trial.',
    evidenceUrls: ['trial_photo.jpg', 'actual_photo.jpg'], createdAt: '2024-10-28T13:30:00Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'red',
  UNDER_REVIEW: 'orange',
  RESOLVED_CUSTOMER: 'green',
  RESOLVED_VENDOR: 'blue',
  CLOSED: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open',
  UNDER_REVIEW: 'Under Review',
  RESOLVED_CUSTOMER: 'Resolved (Customer)',
  RESOLVED_VENDOR: 'Resolved (Vendor)',
  CLOSED: 'Closed',
};

const REASON_LABEL: Record<string, string> = {
  no_show: 'No Show',
  poor_quality: 'Poor Quality',
  late_arrival: 'Late Arrival',
  wrong_items: 'Wrong Items Delivered',
  overcharging: 'Overcharging',
  cancellation: 'Last-Minute Cancellation',
  rude_behaviour: 'Rude Behaviour',
  incomplete_service: 'Incomplete Service',
};

// ─────────────────────────────────────────────────────────────────────────────
// DISPUTES PAGE
// ─────────────────────────────────────────────────────────────────────────────

export function Disputes() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [reviewModal, setReviewModal] = useState<Dispute | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolutionType, setResolutionType] = useState<string>('refund_customer');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [previewEvidence, setPreviewEvidence] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-disputes', page, statusFilter],
    queryFn: () =>
      disputesApi.list({
        page,
        limit: 15,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    retry: 1,
    staleTime: 30_000,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ disputeId, body }: { disputeId: string; body: { status: string; refundAmountPaise?: number; adminNotes: string } }) =>
      disputesApi.resolve(disputeId, body),
    onSuccess: () => {
      message.success('Dispute resolved successfully');
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      setReviewModal(null);
    },
    onError: () => message.error('Failed to resolve dispute'),
  });

  const isMock = isError;
  const allDisputes = data?.data.disputes ?? (isMock ? MOCK_DISPUTES : []);

  const filteredDisputes = isMock && statusFilter !== 'all'
    ? allDisputes.filter((d) => d.status === statusFilter)
    : allDisputes;

  const openCount = allDisputes.filter((d) => d.status === 'OPEN').length;
  const reviewCount = allDisputes.filter((d) => d.status === 'UNDER_REVIEW').length;
  const resolvedThisMonth = allDisputes.filter((d) =>
    (d.status === 'RESOLVED_CUSTOMER' || d.status === 'RESOLVED_VENDOR') &&
    new Date(d.createdAt).getMonth() === new Date().getMonth()
  ).length;

  function openReview(dispute: Dispute) {
    setReviewModal(dispute);
    setAdminNotes('');
    setResolutionType('refund_customer');
    setRefundAmount((dispute.refundAmountPaise ?? 0) / 100);
  }

  function handleResolve() {
    if (!reviewModal) return;
    const resolvedStatus = resolutionType === 'refund_customer' ? 'RESOLVED_CUSTOMER' : 'RESOLVED_VENDOR';
    resolveMutation.mutate({
      disputeId: reviewModal.id,
      body: {
        status: resolvedStatus,
        refundAmountPaise: resolutionType === 'refund_customer' ? refundAmount * 100 : undefined,
        adminNotes,
      },
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Disputes</h1>
        <Select
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          style={{ width: 180 }}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'OPEN', label: 'Open' },
            { value: 'UNDER_REVIEW', label: 'Under Review' },
            { value: 'RESOLVED_CUSTOMER', label: 'Resolved (Customer)' },
            { value: 'RESOLVED_VENDOR', label: 'Resolved (Vendor)' },
            { value: 'CLOSED', label: 'Closed' },
          ]}
        />
      </div>

      {isMock && (
        <Alert
          message="API unavailable — showing demo data"
          type="warning"
          showIcon
          style={{ marginBottom: 16, fontSize: 12 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Open Disputes" value={openCount} valueStyle={{ color: '#ef4444' }} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Under Review" value={reviewCount} valueStyle={{ color: '#f97316' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Resolved This Month" value={resolvedThisMonth} valueStyle={{ color: '#10b981' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Total Disputes" value={data?.meta.total ?? allDisputes.length} valueStyle={{ color: '#6b7280' }} prefix={<FileSearchOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Spin spinning={isLoading}>
          <Table<Dispute>
            dataSource={filteredDisputes}
            rowKey="id"
            size="small"
            pagination={{
              current: page,
              total: data?.meta.total ?? filteredDisputes.length,
              pageSize: 15,
              onChange: setPage,
              showTotal: (t) => `${t} disputes`,
            }}
            columns={[
              { title: 'ID', dataIndex: 'id', render: (t: string) => <code style={{ fontSize: 10 }}>{t.slice(0, 11)}</code>, width: 100 },
              { title: 'Booking#', dataIndex: 'bookingNumber', key: 'booking' },
              { title: 'Customer', dataIndex: 'customerName', key: 'customer' },
              { title: 'Vendor', dataIndex: 'vendorName', key: 'vendor' },
              {
                title: 'Reason', dataIndex: 'reason', key: 'reason',
                render: (r: string) => REASON_LABEL[r] ?? r,
              },
              {
                title: 'Status', dataIndex: 'status', key: 'status',
                render: (s: string) => <Tag color={STATUS_COLOR[s] ?? 'default'}>{STATUS_LABEL[s] ?? s}</Tag>,
              },
              {
                title: 'Amount', dataIndex: 'refundAmountPaise', key: 'amount',
                render: (_: unknown, row: Dispute) => {
                  const amt = row.refundAmountPaise;
                  return amt ? <strong>₹{(amt / 100).toLocaleString('en-IN')}</strong> : <span style={{ color: '#9ca3af' }}>—</span>;
                },
              },
              {
                title: 'Created', dataIndex: 'createdAt', key: 'created',
                render: (d: string) => format(new Date(d), 'dd MMM yyyy'),
              },
              {
                title: 'Actions', key: 'actions',
                render: (_: unknown, row: Dispute) => (
                  <Space>
                    <Button
                      size="small"
                      type={row.status === 'OPEN' || row.status === 'UNDER_REVIEW' ? 'primary' : 'default'}
                      onClick={() => openReview(row)}
                    >
                      Review
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </Spin>
      </Card>

      <Modal
        title={`Review Dispute — ${reviewModal?.bookingNumber ?? ''}`}
        open={!!reviewModal}
        onCancel={() => setReviewModal(null)}
        width={640}
        footer={[
          <Button key="cancel" onClick={() => setReviewModal(null)}>Cancel</Button>,
          <Button
            key="resolve"
            type="primary"
            onClick={handleResolve}
            loading={resolveMutation.isPending}
            disabled={!adminNotes.trim()}
          >
            Resolve
          </Button>,
        ]}
      >
        {reviewModal && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                <div><strong>Customer:</strong> {reviewModal.customerName}</div>
                <div><strong>Vendor:</strong> {reviewModal.vendorName}</div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Reason:</strong> <Tag color="orange">{REASON_LABEL[reviewModal.reason] ?? reviewModal.reason}</Tag>
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Description:</strong>
                <p style={{ marginTop: 4, color: '#374151', background: '#f9fafb', padding: 12, borderRadius: 6 }}>
                  {reviewModal.description}
                </p>
              </div>
              {reviewModal.evidenceUrls.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Evidence ({reviewModal.evidenceUrls.length} file{reviewModal.evidenceUrls.length > 1 ? 's' : ''}):</strong>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {reviewModal.evidenceUrls.map((file, i) => {
                      const isPdf = file.toLowerCase().endsWith('.pdf');
                      const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(file);
                      const mockImageUrl = `https://images.unsplash.com/photo-${['1519225421980-715cb0215aed', '1537907690979-13c0f6a4c7f4', '1555244162-803834f70033'][i % 3]}?w=200&q=60`;
                      return (
                        <div key={i} style={{ position: 'relative' }}>
                          {isImage || !isPdf ? (
                            <Image
                              src={mockImageUrl}
                              alt={file}
                              width={100}
                              height={100}
                              style={{ borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }}
                              preview={{
                                mask: <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><EyeOutlined /> View</div>,
                              }}
                              fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzliYTNhZiIgZm9udC1zaXplPSIxMiI+Tm8gaW1hZ2U8L3RleHQ+PC9zdmc+"
                            />
                          ) : (
                            <Tooltip title="Click to view PDF">
                              <div
                                onClick={() => setPreviewEvidence(file)}
                                style={{ width: 100, height: 100, background: '#fef3c7', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #fbbf24' }}
                              >
                                <FilePdfOutlined style={{ fontSize: 28, color: '#f59e0b' }} />
                                <span style={{ fontSize: 10, color: '#92400e', marginTop: 4 }}>PDF</span>
                              </div>
                            </Tooltip>
                          )}
                          <div style={{ fontSize: 10, color: '#6b7280', textAlign: 'center', marginTop: 4, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SLA Tracking */}
              <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#0369a1' }}>⏱️ SLA Tracking</span>
                  {(() => {
                    const createdDate = new Date(reviewModal.createdAt);
                    const now = new Date();
                    const hoursOpen = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
                    const daysOpen = Math.floor(hoursOpen / 24);
                    const isUrgent = hoursOpen > 72;
                    const isWarning = hoursOpen > 48;
                    return (
                      <Tag color={isUrgent ? 'red' : isWarning ? 'orange' : 'green'}>
                        {isUrgent ? <WarningOutlined /> : null} {daysOpen > 0 ? `${daysOpen}d ` : ''}{hoursOpen % 24}h open
                      </Tag>
                    );
                  })()}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Created: {format(new Date(reviewModal.createdAt), 'dd MMM yyyy, hh:mm a')}
                  {reviewModal.resolvedAt && <> · Resolved: {format(new Date(reviewModal.resolvedAt), 'dd MMM yyyy, hh:mm a')}</>}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              <h4 style={{ marginBottom: 12 }}>Resolution</h4>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Resolution Type</label>
                <Select
                  value={resolutionType}
                  onChange={setResolutionType}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'refund_customer', label: 'Refund Customer' },
                    { value: 'close_vendor_favor', label: 'Close in Vendor Favor' },
                  ]}
                />
              </div>
              {resolutionType === 'refund_customer' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Refund Amount (₹)</label>
                  <InputNumber
                    value={refundAmount}
                    onChange={(v) => setRefundAmount(v ?? 0)}
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
                </div>
              )}
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Admin Notes *</label>
                <Input.TextArea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter resolution notes..."
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Evidence Preview Modal for PDFs */}
      <Modal
        title="Evidence Preview"
        open={!!previewEvidence}
        onCancel={() => setPreviewEvidence(null)}
        footer={null}
        width={700}
      >
        {previewEvidence && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <FilePdfOutlined style={{ fontSize: 64, color: '#f59e0b' }} />
            <p style={{ marginTop: 16, fontSize: 16, fontWeight: 600 }}>{previewEvidence}</p>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>PDF documents will be available for inline preview when connected to the media service.</p>
            <Button type="primary" icon={<EyeOutlined />} onClick={() => message.info('PDF viewer will open when media service is connected.')}>
              Open Document
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
