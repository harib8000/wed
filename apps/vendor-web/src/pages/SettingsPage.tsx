import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bell,
  Shield,
  CreditCard,
  Trash2,
  Download,
  Clock,
  Mail,
  MessageSquare,
  Smartphone,
  Check,
  Crown,
  Zap,
  Settings,
} from 'lucide-react';

type Channel = 'email' | 'sms' | 'push';

type NotificationPreference = {
  id: string;
  label: string;
  description: string;
  channels: Partial<Record<Channel, boolean>>;
};

const NOTIFICATION_CHANNELS: Array<{ key: Channel; label: string; icon: typeof Mail }> = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'sms', label: 'SMS', icon: MessageSquare },
  { key: 'push', label: 'Push', icon: Smartphone },
];

const PLAN_FEATURES = [
  { feature: 'Leads per month', free: '25', premium: 'Unlimited', enterprise: 'Unlimited + routing' },
  { feature: 'Verified badge', free: false, premium: true, enterprise: true },
  { feature: 'Priority search placement', free: false, premium: true, enterprise: true },
  { feature: 'Analytics dashboard', free: 'Basic', premium: 'Advanced', enterprise: 'Advanced + exports' },
  { feature: 'Dedicated account manager', free: false, premium: false, enterprise: true },
  { feature: 'Custom integrations', free: false, premium: false, enterprise: true },
];

const TIME_OPTIONS = [
  '06:00 AM',
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
];

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-brand-600' : 'bg-gray-300'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  );
}

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? <Check size={16} className="mx-auto text-green-600" /> : <span className="text-gray-300">—</span>;
  }

  return <span>{value}</span>;
}

export function SettingsPage() {
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>([
    {
      id: 'new-enquiry',
      label: 'New Enquiry Received',
      description: 'Stay on top of every new lead from couples browsing your profile.',
      channels: { email: true, sms: true, push: true },
    },
    {
      id: 'booking-confirmed',
      label: 'Booking Confirmed',
      description: 'Get instant confirmation when a couple locks in your services.',
      channels: { email: true, sms: true, push: true },
    },
    {
      id: 'new-review',
      label: 'New Review Posted',
      description: 'Know when customers leave fresh feedback on your profile.',
      channels: { email: true, push: true },
    },
    {
      id: 'payment-received',
      label: 'Payment Received',
      description: 'Track advances, balance settlements, and released payments.',
      channels: { email: true, push: true },
    },
    {
      id: 'payout-processed',
      label: 'Payout Processed',
      description: 'Receive an alert once your payout is scheduled or completed.',
      channels: { email: true },
    },
  ]);
  const [autoResponseEnabled, setAutoResponseEnabled] = useState(true);
  const [autoReplyOutsideHours, setAutoReplyOutsideHours] = useState(true);
  const [autoResponseMessage, setAutoResponseMessage] = useState(
    'Hi! Thank you for contacting us on Wedding OS. We have received your enquiry and will get back to you with availability, pricing, and next steps shortly.'
  );
  const [workingHours, setWorkingHours] = useState({ start: '09:00 AM', end: '07:00 PM' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const currentPlan = 'Premium';

  function toggleChannel(preferenceId: string, channel: Channel) {
    setNotificationPreferences((current) =>
      current.map((preference) =>
        preference.id === preferenceId
          ? {
              ...preference,
              channels: {
                ...preference.channels,
                [channel]: !preference.channels[channel],
              },
            }
          : preference
      )
    );
  }

  function handleSaveNotifications() {
    toast.success('Notification preferences updated.');
  }

  function handleSaveAutoResponse() {
    toast.success('Auto-response settings saved.');
  }

  function handleUpgrade(plan: 'Premium' | 'Enterprise') {
    toast.success(`${plan} plan upgrade flow coming soon.`);
  }

  function handleDeleteAccount() {
    setShowDeleteModal(false);
    toast.error('Account deletion request submitted for review.');
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-sm text-gray-500">Manage notifications, automation, billing, and privacy controls for your vendor account.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
          <Settings size={16} /> Vendor preferences
        </div>
      </div>

      <div className="space-y-6">
        <section className="card p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
              <p className="text-sm text-gray-500">Choose where you want to receive important updates from Wedding OS.</p>
            </div>
          </div>

          <div className="space-y-4">
            {notificationPreferences.map((preference) => (
              <div key={preference.id} className="rounded-2xl border border-gray-100 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{preference.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">{preference.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {NOTIFICATION_CHANNELS.filter((channel) => preference.channels[channel.key] !== undefined).map((channel) => {
                      const Icon = channel.icon;
                      const checked = Boolean(preference.channels[channel.key]);
                      return (
                        <div key={channel.key} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2">
                          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Icon size={15} /> {channel.label}
                          </span>
                          <ToggleSwitch checked={checked} onChange={() => toggleChannel(preference.id, channel.key)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button type="button" onClick={handleSaveNotifications} className="btn-primary">Save Preferences</button>
          </div>
        </section>

        <section className="card p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Auto-Response Settings</h2>
              <p className="text-sm text-gray-500">Set up instant replies so couples always hear back from your business.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-2xl border border-gray-100 p-4">
              <div>
                <h3 className="font-semibold text-gray-900">Enable auto-response</h3>
                <p className="text-sm text-gray-500 mt-1">Automatically send a first reply when a new enquiry arrives.</p>
              </div>
              <ToggleSwitch checked={autoResponseEnabled} onChange={() => setAutoResponseEnabled((value) => !value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auto-response message</label>
              <textarea
                value={autoResponseMessage}
                onChange={(event) => setAutoResponseMessage(event.target.value)}
                className="input-field min-h-32 resize-none"
                placeholder="Thanks for reaching out! We'll respond shortly."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Working hours start</label>
                <select
                  value={workingHours.start}
                  onChange={(event) => setWorkingHours((current) => ({ ...current, start: event.target.value }))}
                  className="input-field"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Working hours end</label>
                <select
                  value={workingHours.end}
                  onChange={(event) => setWorkingHours((current) => ({ ...current, end: event.target.value }))}
                  className="input-field"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={autoReplyOutsideHours}
                onChange={(event) => setAutoReplyOutsideHours(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Auto-reply outside working hours
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="button" onClick={handleSaveAutoResponse} className="btn-primary">Save Auto-Response</button>
          </div>
        </section>

        <section className="card p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-2xl bg-purple-50 p-3 text-purple-600">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Subscription Plan</h2>
              <p className="text-sm text-gray-500">Review your current plan and compare premium features designed for growing vendors.</p>
            </div>
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr,1fr]">
            <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/80">Current plan</p>
                  <h3 className="mt-1 text-2xl font-bold">{currentPlan}</h3>
                </div>
                <div className="rounded-2xl bg-white/15 p-3">
                  <Crown size={22} />
                </div>
              </div>
              <p className="mt-4 max-w-xl text-sm text-white/90">Priority placement, richer analytics, and faster lead response tools are active on your account.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="badge bg-white/15 text-white">Unlimited enquiries</span>
                <span className="badge bg-white/15 text-white">Verified badge</span>
                <span className="badge bg-white/15 text-white">Advanced reports</span>
              </div>
            </div>

            <div className="rounded-3xl border border-brand-100 bg-brand-50 p-6">
              <div className="flex items-center gap-3 text-brand-700">
                <Zap size={18} />
                <span className="font-semibold">Want more growth?</span>
              </div>
              <p className="mt-3 text-sm text-gray-600">Upgrade to Enterprise for account management, custom onboarding, and multi-location support.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => handleUpgrade('Premium')} className="btn-secondary">Revisit Premium</button>
                <button type="button" onClick={() => handleUpgrade('Enterprise')} className="btn-primary">Upgrade Plan</button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600">Feature</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Free</th>
                  <th className="px-4 py-3 text-center font-semibold text-brand-700">Premium</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {PLAN_FEATURES.map((row) => (
                  <tr key={row.feature}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.feature}</td>
                    <td className="px-4 py-3 text-center text-gray-600"><FeatureValue value={row.free} /></td>
                    <td className="px-4 py-3 text-center font-medium text-brand-700"><FeatureValue value={row.premium} /></td>
                    <td className="px-4 py-3 text-center text-gray-600"><FeatureValue value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Data & Privacy</h2>
              <p className="text-sm text-gray-500">Control your account data, exports, and privacy-sensitive actions.</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 text-gray-900">
                <Download size={18} className="text-brand-600" />
                <h3 className="font-semibold">Export My Data</h3>
              </div>
              <p className="mt-2 text-sm text-gray-500">Download your leads, payouts, profile information, and account activity in a portable format.</p>
              <button
                type="button"
                onClick={() => toast.success("Data export requested. You'll receive an email shortly.")}
                className="btn-secondary mt-4"
              >
                Request Export
              </button>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
              <div className="flex items-center gap-3 text-rose-700">
                <Trash2 size={18} />
                <h3 className="font-semibold">Delete Account</h3>
              </div>
              <p className="mt-2 text-sm text-rose-700/80">This action is permanent. Your profile, enquiries, bookings, and payout history may become inaccessible after review.</p>
              <button type="button" onClick={() => setShowDeleteModal(true)} className="mt-4 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700">
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4">
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-600">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete your vendor account?</h3>
                <p className="mt-2 text-sm text-gray-500">This will start an irreversible account deletion review. Active bookings, payout records, and profile visibility may be affected immediately.</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              Please make sure all active events, payouts, and customer conversations are resolved before continuing.
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={handleDeleteAccount} className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700">
                Yes, delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
