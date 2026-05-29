import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, Clock, AlertCircle, Building2, IndianRupee, AlertTriangle } from 'lucide-react';
import { payoutsApi, type PayoutRecord, type EarningsSummary } from '../lib/api';

const MOCK_EARNINGS: EarningsSummary = {
  totalEarned: 1250000,
  pendingRelease: 285000,
  thisMonth: 180000,
  platformFees: 62500,
};

const MOCK_PAYOUTS: PayoutRecord[] = [
  { id: 'PO-001', paymentId: 'PO-001', date: '10 Jan 2027', bookingNumber: 'WB-045', customer: 'Kavitha & Sanjay', amount: 900000, platformFee: 45000, netPayout: 855000, status: 'released' },
  { id: 'PO-002', paymentId: 'PO-002', date: '5 Jan 2027', bookingNumber: 'WB-044', customer: 'Ritu & Abhishek', amount: 500000, platformFee: 25000, netPayout: 475000, status: 'released' },
  { id: 'PO-003', paymentId: 'PO-003', date: '28 Dec 2026', bookingNumber: 'WB-043', customer: 'Priya & Rahul', amount: 150000, platformFee: 7500, netPayout: 142500, status: 'pending' },
  { id: 'PO-004', paymentId: 'PO-004', date: '22 Dec 2026', bookingNumber: 'WB-042', customer: 'Ananya & Vikram', amount: 90000, platformFee: 4500, netPayout: 85500, status: 'processing' },
  { id: 'PO-005', paymentId: 'PO-005', date: '15 Dec 2026', bookingNumber: 'WB-041', customer: 'Meera & Arun', amount: 1500000, platformFee: 75000, netPayout: 1425000, status: 'released' },
  { id: 'PO-006', paymentId: 'PO-006', date: '8 Dec 2026', bookingNumber: 'WB-040', customer: 'Divya & Ravi', amount: 550000, platformFee: 27500, netPayout: 522500, status: 'on_hold' },
  { id: 'PO-007', paymentId: 'PO-007', date: '1 Dec 2026', bookingNumber: 'WB-039', customer: 'Swetha & Karthik', amount: 950000, platformFee: 47500, netPayout: 902500, status: 'released' },
  { id: 'PO-008', paymentId: 'PO-008', date: '25 Nov 2026', bookingNumber: 'WB-038', customer: 'Pooja & Amit', amount: 200000, platformFee: 10000, netPayout: 190000, status: 'released' },
];

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  released: { label: 'Released', class: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Processing', class: 'bg-blue-100 text-blue-700' },
  on_hold: { label: 'On Hold', class: 'bg-red-100 text-red-700' },
};

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const PAYMENT_INVOICE_URL = env?.VITE_API_URL ?? 'http://localhost:4005';

function formatINR(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(0)}K`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

function formatINRFull(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export function PayoutsPage() {
  const [statusFilter, setStatusFilter] = useState('All');

  const { data, isError } = useQuery({
    queryKey: ['vendor-payouts'],
    queryFn: payoutsApi.list,
    retry: 1,
    staleTime: 60_000,
  });

  const earnings = data?.summary ?? MOCK_EARNINGS;
  const payouts = data?.payouts ?? MOCK_PAYOUTS;
  const isMock = isError || !data;

  const filtered = payouts.filter(
    (p) => statusFilter === 'All' || p.status === statusFilter.toLowerCase().replace(' ', '_')
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payouts & Earnings</h1>
        <p className="text-gray-500 text-sm">
          {isMock && <span className="text-amber-600"><AlertTriangle size={13} className="inline mr-1 -mt-0.5" />API unavailable — showing demo data. </span>}
          Track your earnings and payout history
        </p>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Earned', value: formatINR(earnings.totalEarned), icon: IndianRupee, color: 'text-green-600 bg-green-50' },
          { label: 'Pending Release', value: formatINR(earnings.pendingRelease), icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'This Month', value: formatINR(earnings.thisMonth), icon: TrendingUp, color: 'text-brand-600 bg-brand-50' },
          { label: 'Platform Fees', value: formatINR(earnings.platformFees), icon: Wallet, color: 'text-gray-600 bg-gray-50' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <Icon size={18} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Payout History</h2>
        <div className="flex gap-2">
          {['All', 'Released', 'Pending', 'Processing', 'On Hold'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${f === statusFilter ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Payout Table */}
      <div className="card overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Date', 'Booking', 'Customer', 'Amount', 'Platform Fee', 'Net Payout', 'Status', 'Receipt'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p) => {
              const sc = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;
              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-sm text-gray-600">{p.date}</td>
                  <td className="px-5 py-4 text-sm font-mono text-gray-500">{p.bookingNumber}</td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">{p.customer}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{formatINRFull(p.amount)}</td>
                  <td className="px-5 py-4 text-sm text-red-500">-{formatINRFull(p.platformFee)}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">{formatINRFull(p.netPayout)}</td>
                  <td className="px-5 py-4">
                    <span className={`badge ${sc.class} text-xs`}>{sc.label}</span>
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={`${PAYMENT_INVOICE_URL}/payments/${p.paymentId ?? p.id}/invoice`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                    >
                      📄 Receipt
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bank Account Info */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Building2 size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Bank Account</h3>
            <p className="text-xs text-gray-500">Payouts are sent to this account</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Account Holder</p>
            <p className="text-sm font-medium text-gray-900">Royal Grand Palace Pvt Ltd</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Account Number</p>
            <p className="text-sm font-medium text-gray-900">••••••••4523</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">IFSC Code</p>
            <p className="text-sm font-medium text-gray-900">HDFC0001234</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-green-600">
          <AlertCircle size={12} />
          Verified & active. Payouts are processed within 2-3 business days after event completion.
        </div>
      </div>
    </div>
  );
}
