import { useMemo, useState } from 'react';
import {
  Tabs,
  Card,
  Form,
  InputNumber,
  Button,
  Switch,
  List,
  Table,
  Tag,
  Modal,
  Input,
  message,
  Space,
  Typography,
  Descriptions,
  DatePicker,
  Row,
  Col,
} from 'antd';
import {
  SettingOutlined,
  FlagOutlined,
  BellOutlined,
  AuditOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface PlatformConfig {
  commissionRate: number;
  escrowReleaseDays: number;
  minBookingAdvance: number;
  gstRate: number;
  maxRefundWithoutApproval: number;
}

type PlatformConfigKey = keyof PlatformConfig;
type FeatureFlagKey =
  | 'vendor_map_view'
  | 'ai_recommendations'
  | 'guest_qr_checkin'
  | 'digital_invitations'
  | 'emi_payments'
  | 'vendor_calendar_sync'
  | 'multi_language';

interface NotificationTemplate {
  key: string;
  name: string;
  channels: Array<'Email' | 'SMS' | 'Push' | 'WhatsApp'>;
  body: string;
}

interface AuditLogItem {
  key: string;
  timestamp: string;
  admin: string;
  action: string;
  target: string;
  details: string;
}

const PLATFORM_CONFIG_DEFINITIONS: Array<{
  key: PlatformConfigKey;
  label: string;
  description: string;
  min: number;
  max: number;
  step?: number;
  formatter: (value: number) => string;
  parser?: (value: string | undefined) => number;
}> = [
  {
    key: 'commissionRate',
    label: 'Commission Rate (%)',
    description: 'Platform fee charged on each successful vendor booking.',
    min: 0,
    max: 100,
    formatter: (value) => `${value}%`,
    parser: (value) => Number(String(value ?? '').replace('%', '')),
  },
  {
    key: 'escrowReleaseDays',
    label: 'Escrow Release Days',
    description: 'Days after the event before escrow is automatically released to the vendor.',
    min: 0,
    max: 30,
    formatter: (value) => `${value} day${value === 1 ? '' : 's'}`,
  },
  {
    key: 'minBookingAdvance',
    label: 'Min Booking Advance (%)',
    description: 'Minimum upfront amount customers must pay to confirm a booking.',
    min: 0,
    max: 100,
    formatter: (value) => `${value}%`,
    parser: (value) => Number(String(value ?? '').replace('%', '')),
  },
  {
    key: 'gstRate',
    label: 'GST Rate (%)',
    description: 'Applicable GST charged on platform services and invoices.',
    min: 0,
    max: 50,
    formatter: (value) => `${value}%`,
    parser: (value) => Number(String(value ?? '').replace('%', '')),
  },
  {
    key: 'maxRefundWithoutApproval',
    label: 'Max Refund Without Approval (₹)',
    description: 'Refunds above this amount require dual approval from finance and operations.',
    min: 0,
    max: 1_000_000,
    step: 1000,
    formatter: (value) => `₹${value.toLocaleString('en-IN')}`,
    parser: (value) => Number(String(value ?? '').replace(/[^\d.-]/g, '')),
  },
];

const FEATURE_FLAG_DEFINITIONS: Array<{ key: FeatureFlagKey; name: string; description: string }> = [
  {
    key: 'vendor_map_view',
    name: 'vendor_map_view',
    description: 'Enable geolocation-led map browsing on vendor listing and search pages.',
  },
  {
    key: 'ai_recommendations',
    name: 'ai_recommendations',
    description: 'Show AI-powered vendor and package recommendations across web and mobile.',
  },
  {
    key: 'guest_qr_checkin',
    name: 'guest_qr_checkin',
    description: 'Allow couples and venue staff to manage guest check-ins with QR scanning.',
  },
  {
    key: 'digital_invitations',
    name: 'digital_invitations',
    description: 'Enable sending branded digital invites with RSVP tracking.',
  },
  {
    key: 'emi_payments',
    name: 'emi_payments',
    description: 'Expose EMI and installment payment options in checkout and payment reminders.',
  },
  {
    key: 'vendor_calendar_sync',
    name: 'vendor_calendar_sync',
    description: 'Sync vendor bookings with Google Calendar to reduce double-booking risk.',
  },
  {
    key: 'multi_language',
    name: 'multi_language',
    description: 'Turn on multilingual strings across the platform for broader regional reach.',
  },
];

const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, boolean> = {
  vendor_map_view: true,
  ai_recommendations: true,
  guest_qr_checkin: false,
  digital_invitations: true,
  emi_payments: false,
  vendor_calendar_sync: true,
  multi_language: false,
};

const INITIAL_TEMPLATES: NotificationTemplate[] = [
  {
    key: 'booking_confirmed',
    name: 'booking_confirmed',
    channels: ['Email', 'SMS', 'Push', 'WhatsApp'],
    body: 'Hi {{customer_name}}, your booking with {{vendor_name}} for {{event_date}} is confirmed. Track status and payments from your WeddingOS dashboard.',
  },
  {
    key: 'booking_cancelled',
    name: 'booking_cancelled',
    channels: ['Email', 'SMS', 'Push'],
    body: 'Your booking {{booking_number}} has been cancelled. If you need support with refunds or rebooking, our team is ready to help.',
  },
  {
    key: 'payment_received',
    name: 'payment_received',
    channels: ['Email', 'Push', 'WhatsApp'],
    body: 'Payment of ₹{{amount}} has been received for booking {{booking_number}}. Escrow protection is now active for this event.',
  },
  {
    key: 'review_received',
    name: 'review_received',
    channels: ['Email', 'Push'],
    body: '{{customer_name}} left a new {{rating}}-star review for {{vendor_name}}. Open the dashboard to respond and improve conversion.',
  },
  {
    key: 'kyc_approved',
    name: 'kyc_approved',
    channels: ['Email', 'Push', 'WhatsApp'],
    body: 'Congratulations! Your vendor KYC has been approved. You can now accept bookings, sync availability, and receive payouts.',
  },
  {
    key: 'kyc_rejected',
    name: 'kyc_rejected',
    channels: ['Email', 'SMS'],
    body: 'Your KYC submission needs attention. Please review the rejection reason in your vendor dashboard and upload updated documents.',
  },
];

const MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    key: '1',
    timestamp: '2026-05-22T10:45:00Z',
    admin: 'Aparna Rao',
    action: 'Approved vendor KYC',
    target: 'Royal Frames Studio',
    details: 'Verified PAN and GST certificate, activated vendor listing.',
  },
  {
    key: '2',
    timestamp: '2026-05-22T09:12:00Z',
    admin: 'Rahul Mehta',
    action: 'Refunded payment',
    target: 'PAY-2026-0421',
    details: 'Approved ₹18,500 goodwill refund after customer complaint.',
  },
  {
    key: '3',
    timestamp: '2026-05-21T18:20:00Z',
    admin: 'Nisha Patel',
    action: 'Resolved dispute',
    target: 'DSP-204',
    details: 'Split payout 60/40 and documented service-level breach evidence.',
  },
  {
    key: '4',
    timestamp: '2026-05-21T15:05:00Z',
    admin: 'Aparna Rao',
    action: 'Updated commission rate',
    target: 'Platform configuration',
    details: 'Commission rate revised from 9% to 10% for new bookings.',
  },
  {
    key: '5',
    timestamp: '2026-05-21T11:40:00Z',
    admin: 'Rahul Mehta',
    action: 'Disabled feature flag',
    target: 'emi_payments',
    details: 'Paused EMI rollout after payment partner maintenance alert.',
  },
  {
    key: '6',
    timestamp: '2026-05-20T16:08:00Z',
    admin: 'Priya Nair',
    action: 'Edited notification template',
    target: 'booking_confirmed',
    details: 'Added WhatsApp-specific reminder copy for event preparation.',
  },
  {
    key: '7',
    timestamp: '2026-05-20T13:32:00Z',
    admin: 'Nisha Patel',
    action: 'Rejected vendor KYC',
    target: 'Saffron Caterers',
    details: 'Bank statement was outdated and GST certificate mismatched legal entity.',
  },
  {
    key: '8',
    timestamp: '2026-05-19T17:55:00Z',
    admin: 'Aparna Rao',
    action: 'Enabled feature flag',
    target: 'vendor_calendar_sync',
    details: 'Calendar sync rolled out to all verified vendors.',
  },
];

const CHANNEL_COLORS: Record<NotificationTemplate['channels'][number], string> = {
  Email: 'blue',
  SMS: 'green',
  Push: 'purple',
  WhatsApp: 'success',
};

export function Settings() {
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>({
    commissionRate: 10,
    escrowReleaseDays: 7,
    minBookingAdvance: 30,
    gstRate: 18,
    maxRefundWithoutApproval: 50_000,
  });
  const [featureFlags, setFeatureFlags] = useState<Record<FeatureFlagKey, boolean>>(DEFAULT_FEATURE_FLAGS);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(INITIAL_TEMPLATES);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [auditRange, setAuditRange] = useState<[string, string] | null>(null);

  const filteredAuditLogs = useMemo(() => {
    if (!auditRange) return MOCK_AUDIT_LOGS;
    const [start, end] = auditRange;
    const startTime = new Date(`${start}T00:00:00`).getTime();
    const endTime = new Date(`${end}T23:59:59`).getTime();
    return MOCK_AUDIT_LOGS.filter((item) => {
      const timestamp = new Date(item.timestamp).getTime();
      return timestamp >= startTime && timestamp <= endTime;
    });
  }, [auditRange]);

  function savePlatformValue(key: PlatformConfigKey, value: number) {
    setPlatformConfig((prev) => ({ ...prev, [key]: value }));
    const label = PLATFORM_CONFIG_DEFINITIONS.find((item) => item.key === key)?.label ?? 'Setting';
    message.success(`${label} updated successfully`);
  }

  function handleFeatureToggle(key: FeatureFlagKey, enabled: boolean) {
    setFeatureFlags((prev) => ({ ...prev, [key]: enabled }));
    message.success(`${key} ${enabled ? 'enabled' : 'disabled'}`);
  }

  function openEditModal(template: NotificationTemplate) {
    setEditingTemplate(template);
    setEditingBody(template.body);
  }

  function saveTemplate() {
    if (!editingTemplate) return;
    setTemplates((prev) => prev.map((template) => (
      template.key === editingTemplate.key ? { ...template, body: editingBody.trim() || template.body } : template
    )));
    message.success(`${editingTemplate.name} template updated`);
    setEditingTemplate(null);
    setEditingBody('');
  }

  function handleAuditRangeChange(dateStrings: [string, string]) {
    if (!dateStrings[0] || !dateStrings[1]) {
      setAuditRange(null);
      return;
    }
    setAuditRange(dateStrings);
  }

  const platformTab = (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={3} size="small" title="Current defaults">
          <Descriptions.Item label="Commission Rate">{platformConfig.commissionRate}%</Descriptions.Item>
          <Descriptions.Item label="Escrow Release">{platformConfig.escrowReleaseDays} days</Descriptions.Item>
          <Descriptions.Item label="Minimum Advance">{platformConfig.minBookingAdvance}%</Descriptions.Item>
          <Descriptions.Item label="GST">{platformConfig.gstRate}%</Descriptions.Item>
          <Descriptions.Item label="Auto-approve refund ceiling">₹{platformConfig.maxRefundWithoutApproval.toLocaleString('en-IN')}</Descriptions.Item>
          <Descriptions.Item label="Status"><Tag color="green">Live</Tag></Descriptions.Item>
        </Descriptions>
      </Card>
      <Row gutter={[16, 16]}>
        {PLATFORM_CONFIG_DEFINITIONS.map((setting) => (
          <Col xs={24} lg={12} key={setting.key}>
            <Card title={setting.label} style={{ height: '100%' }}>
              <Text type="secondary">{setting.description}</Text>
              <Descriptions size="small" column={1} style={{ marginTop: 16, marginBottom: 8 }}>
                <Descriptions.Item label="Current value">{setting.formatter(platformConfig[setting.key])}</Descriptions.Item>
              </Descriptions>
              <Form
                layout="vertical"
                initialValues={{ value: platformConfig[setting.key] }}
                onFinish={(values: { value: number }) => savePlatformValue(setting.key, values.value)}
              >
                <Form.Item
                  label="Updated value"
                  name="value"
                  rules={[{ required: true, message: 'Please enter a value' }]}
                >
                  <InputNumber
                    min={setting.min}
                    max={setting.max}
                    step={setting.step ?? 1}
                    style={{ width: '100%' }}
                    formatter={(value) => setting.formatter(Number(value ?? 0))}
                    parser={setting.parser}
                  />
                </Form.Item>
                <Button type="primary" htmlType="submit">Save setting</Button>
              </Form>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  const featureFlagsTab = (
    <Card>
      <List
        itemLayout="horizontal"
        dataSource={FEATURE_FLAG_DEFINITIONS}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Switch
                key={item.key}
                checked={featureFlags[item.key]}
                onChange={(checked) => handleFeatureToggle(item.key, checked)}
              />,
            ]}
          >
            <List.Item.Meta
              title={<Space><Text strong>{item.name}</Text>{featureFlags[item.key] ? <Tag color="green">Enabled</Tag> : <Tag>Disabled</Tag>}</Space>}
              description={item.description}
            />
          </List.Item>
        )}
      />
    </Card>
  );

  const notificationTemplatesTab = (
    <div>
      <Row gutter={[16, 16]}>
        {templates.map((template) => (
          <Col xs={24} xl={12} key={template.key}>
            <Card
              title={template.name}
              extra={<Tag color="purple">{template.channels.length} channels</Tag>}
              actions={[
                <Button key="preview" type="link" icon={<EyeOutlined />} onClick={() => setPreviewTemplate(template)}>
                  Preview
                </Button>,
                <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => openEditModal(template)}>
                  Edit
                </Button>,
              ]}
            >
              <Space wrap style={{ marginBottom: 12 }}>
                {template.channels.map((channel) => (
                  <Tag key={channel} color={CHANNEL_COLORS[channel]}>{channel}</Tag>
                ))}
              </Space>
              <Text type="secondary">{template.body}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={previewTemplate ? `${previewTemplate.name} preview` : 'Template preview'}
        open={!!previewTemplate}
        onCancel={() => setPreviewTemplate(null)}
        footer={null}
      >
        {previewTemplate && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Space wrap>
              {previewTemplate.channels.map((channel) => (
                <Tag key={channel} color={CHANNEL_COLORS[channel]}>{channel}</Tag>
              ))}
            </Space>
            <Card size="small" style={{ background: '#faf5ff', borderColor: '#e9d5ff' }}>
              <Text style={{ whiteSpace: 'pre-wrap' }}>{previewTemplate.body}</Text>
            </Card>
          </Space>
        )}
      </Modal>

      <Modal
        title={editingTemplate ? `Edit ${editingTemplate.name}` : 'Edit template'}
        open={!!editingTemplate}
        onCancel={() => {
          setEditingTemplate(null);
          setEditingBody('');
        }}
        onOk={saveTemplate}
        okText="Save changes"
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text type="secondary">Update the template copy. Variable tokens such as {'{{customer_name}}'} will be resolved at delivery time.</Text>
          <Input.TextArea rows={8} value={editingBody} onChange={(e) => setEditingBody(e.target.value)} />
        </Space>
      </Modal>
    </div>
  );

  const auditLogTab = (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
          <div>
            <Text strong>Recent admin actions</Text>
            <div><Text type="secondary">Track policy changes, financial approvals, and compliance decisions.</Text></div>
          </div>
          <Space>
            <RangePicker onChange={(_, dateStrings) => handleAuditRangeChange(dateStrings as [string, string])} />
            <Button onClick={() => setAuditRange(null)}>Clear filter</Button>
          </Space>
        </Space>
        <Table<AuditLogItem>
          rowKey="key"
          dataSource={filteredAuditLogs}
          pagination={{ pageSize: 5, showSizeChanger: false }}
          columns={[
            {
              title: 'Timestamp',
              dataIndex: 'timestamp',
              key: 'timestamp',
              render: (value: string) => new Date(value).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
            { title: 'Admin', dataIndex: 'admin', key: 'admin' },
            {
              title: 'Action',
              dataIndex: 'action',
              key: 'action',
              render: (value: string) => <Tag color="blue">{value}</Tag>,
            },
            { title: 'Target', dataIndex: 'target', key: 'target' },
            { title: 'Details', dataIndex: 'details', key: 'details' },
          ]}
        />
      </Space>
    </Card>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Settings</Title>
        <Text type="secondary">Manage platform policies, rollout controls, messaging templates, and admin activity logs.</Text>
      </div>

      <Tabs
        defaultActiveKey="platform"
        items={[
          {
            key: 'platform',
            label: <Space><SettingOutlined />Platform Configuration</Space>,
            children: platformTab,
          },
          {
            key: 'flags',
            label: <Space><FlagOutlined />Feature Flags</Space>,
            children: featureFlagsTab,
          },
          {
            key: 'notifications',
            label: <Space><BellOutlined />Notification Templates</Space>,
            children: notificationTemplatesTab,
          },
          {
            key: 'audit',
            label: <Space><AuditOutlined />Audit Log</Space>,
            children: auditLogTab,
          },
        ]}
      />
    </div>
  );
}
