import { useState } from 'react';
import { Table, Tag, Button, Space, Card, Select, Modal, Input, InputNumber, Row, Col, Statistic } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, FileSearchOutlined } from '@ant-design/icons';
import { format } from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Dispute {
  id: string;
  bookingNumber: string;
  customerName: string;
  vendorName: string;
  reason: string;
  status: string;
  amountPaise: number;
  description: string;
  evidenceImages: string[];
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_DISPUTES: Dispute[] = [
  {
    id: 'dsp-001-abc', bookingNumber: 'BK-2024-0821', customerName: 'Priya Sharma',
    vendorName: 'Royal Photography', reason: 'poor_quality', status: 'open',
    amountPaise: 7500000, description: 'Photos were blurry and poorly edited. Many important moments were missed during the ceremony.',
    evidenceImages: ['evidence1.jpg', 'evidence2.jpg'], createdAt: '2024-12-01T10:30:00Z',
  },
  {
    id: 'dsp-002-def', bookingNumber: 'BK-2024-0835', customerName: 'Rahul Verma',
    vendorName: 'Spice Kitchen Catering', reason: 'no_show', status: 'under_review',
    amountPaise: 12000000, description: 'Vendor did not show up on the event day. Had to arrange alternate catering last minute.',
    evidenceImages: ['chat_screenshot.jpg'], createdAt: '2024-11-28T14:15:00Z',
  },
  {
    id: 'dsp-003-ghi', bookingNumber: 'BK-2024-0798', customerName: 'Anita Reddy',
    vendorName: 'Melody Band', reason: 'late_arrival', status: 'resolved_customer',
    amountPaise: 3500000, description: 'Band arrived 2 hours late, missed the baraat procession entirely.',
    evidenceImages: [], createdAt: '2024-11-20T09:00:00Z',
  },
  {
    id: 'dsp-004-jkl', bookingNumber: 'BK-2024-0812', customerName: 'Vikram Patel',
    vendorName: 'Bloom Decorators', reason: 'wrong_items', status: 'resolved_vendor',
    amountPaise: 5000000, description: 'Decorations did not match what was agreed. Different flowers were used.',
    evidenceImages: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'], createdAt: '2024-11-15T16:45:00Z',
  },
  {
    id: 'dsp-005-mno', bookingNumber: 'BK-2024-0850', customerName: 'Meera Joshi',
    vendorName: 'DJ Beats', reason: 'overcharging', status: 'open',
    amountPaise: 2000000, description: 'Vendor charged extra ₹20,000 on the event day for equipment that was supposed to be included.',
    evidenceImages: ['invoice.jpg'], createdAt: '2024-12-03T11:20:00Z',
  },
  {
    id: 'dsp-006-pqr', bookingNumber: 'BK-2024-0860', customerName: 'Suresh Kumar',
    vendorName: 'Elegant Venues', reason: 'cancellation', status: 'under_review',
    amountPaise: 25000000, description: 'Venue cancelled 3 days before the event citing maintenance issues. No prior notice given.',
    evidenceImages: ['cancellation_email.jpg'], createdAt: '2024-12-05T08:00:00Z',
  },
  {
    id: 'dsp-007-stu', bookingNumber: 'BK-2024-0744', customerName: 'Deepa Nair',
    vendorName: 'Bridal Boutique', reason: 'poor_quality', status: 'closed',
    amountPaise: 4500000, description: 'Lehenga stitching was poor and did not match the design shown during trial.',
    evidenceImages: ['trial_photo.jpg', 'actual_photo.jpg'], createdAt: '2024-10-28T13:30:00Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  open: 'red',
  under_review: 'orange',
  resolved_customer: 'green',
  resolved_vendor: 'blue',
  closed: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  under_review: 'Under Review',
  resolved_customer: 'Resolved (Customer)',
  resolved_vendor: 'Resolved (Vendor)',
  closed: 'Closed',
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reviewModal, setReviewModal] = useState<Dispute | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolutionType, setResolutionType] = useState<string>('refund_customer');
  const [refundAmount, setRefundAmount] = useState<number>(0);

  const filteredDisputes = statusFilter === 'all'
    ? MOCK_DISPUTES
    : MOCK_DISPUTES.filter((d) => d.status === statusFilter);

  const openCount = MOCK_DISPUTES.filter((d) => d.status === 'open').length;
  const reviewCount = MOCK_DISPUTES.filter((d) => d.status === 'under_review').length;
  const resolvedThisMonth = MOCK_DISPUTES.filter((d) =>
    (d.status === 'resolved_customer' || d.status === 'resolved_vendor') &&
    new Date(d.createdAt).getMonth() === new Date().getMonth()
  ).length;

  function openReview(dispute: Dispute) {
    setReviewModal(dispute);
    setAdminNotes('');
    setResolutionType('refund_customer');
    setRefundAmount(dispute.amountPaise / 100);
  }

  function handleResolve() {
    Modal.success({ title: 'Dispute Resolved', content: `Dispute ${reviewModal?.id} has been resolved.` });
    setReviewModal(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Disputes</h1>
        <Select
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          style={{ width: 180 }}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'open', label: 'Open' },
            { value: 'under_review', label: 'Under Review' },
            { value: 'resolved_customer', label: 'Resolved (Customer)' },
            { value: 'resolved_vendor', label: 'Resolved (Vendor)' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
      </div>

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
            <Statistic title="Total Disputes" value={MOCK_DISPUTES.length} valueStyle={{ color: '#6b7280' }} prefix={<FileSearchOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table<Dispute>
          dataSource={filteredDisputes}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showTotal: (t) => `${t} disputes` }}
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
              title: 'Amount', dataIndex: 'amountPaise', key: 'amount',
              render: (a: number) => <strong>₹{(a / 100).toLocaleString('en-IN')}</strong>,
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
                    type={row.status === 'open' || row.status === 'under_review' ? 'primary' : 'default'}
                    onClick={() => openReview(row)}
                  >
                    Review
                  </Button>
                </Space>
              ),
            },
          ]}
        />
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
              <div style={{ marginBottom: 8 }}>
                <strong>Amount:</strong> ₹{(reviewModal.amountPaise / 100).toLocaleString('en-IN')}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Description:</strong>
                <p style={{ marginTop: 4, color: '#374151', background: '#f9fafb', padding: 12, borderRadius: 6 }}>
                  {reviewModal.description}
                </p>
              </div>
              {reviewModal.evidenceImages.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Evidence ({reviewModal.evidenceImages.length} file{reviewModal.evidenceImages.length > 1 ? 's' : ''}):</strong>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {reviewModal.evidenceImages.map((img, i) => (
                      <div key={i} style={{ width: 80, height: 80, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#6b7280' }}>
                        {img}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                    max={reviewModal.amountPaise / 100}
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
    </div>
  );
}
