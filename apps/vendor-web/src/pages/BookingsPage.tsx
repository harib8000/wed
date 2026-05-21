import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare, AlertTriangle } from 'lucide-react';
import { bookingApi, type VendorBooking } from '../lib/api';

const MOCK_BOOKINGS: VendorBooking[] = [
  { id: 'WB-001', bookingNumber: 'WB-001', customerId: '1', customerName: 'Priya & Rahul Sharma', customerPhone: '+91 98765 43210', eventDate: '2027-02-14', eventType: 'Wedding', eventCity: 'Hyderabad', status: 'ENQUIRY', quotedAmountPaise: 9000000, platformFeePaise: null, packageName: 'Grand Gold Hall', createdAt: new Date().toISOString() },
  { id: 'WB-002', bookingNumber: 'WB-002', customerId: '2', customerName: 'Ananya & Vikram Reddy', customerPhone: '+91 87654 32109', eventDate: '2027-03-20', eventType: 'Wedding', eventCity: 'Mumbai', status: 'QUOTE_SENT', quotedAmountPaise: 5000000, platformFeePaise: null, packageName: 'Silver Basic', createdAt: new Date().toISOString() },
  { id: 'WB-003', bookingNumber: 'WB-003', customerId: '3', customerName: 'Meera & Arun Kumar', customerPhone: '+91 76543 21098', eventDate: '2027-04-05', eventType: 'Wedding', eventCity: 'Delhi', status: 'CONFIRMED', quotedAmountPaise: 15000000, platformFeePaise: null, packageName: 'Platinum Package', createdAt: new Date().toISOString() },
  { id: 'WB-004', bookingNumber: 'WB-004', customerId: '4', customerName: 'Divya & Ravi Verma', customerPhone: '+91 65432 10987', eventDate: '2026-12-12', eventType: 'Wedding', eventCity: 'Bangalore', status: 'COMPLETED', quotedAmountPaise: 5500000, platformFeePaise: null, packageName: 'Basic Silver', createdAt: new Date().toISOString() },
  { id: 'WB-005', bookingNumber: 'WB-005', customerId: '5', customerName: 'Swetha & Karthik', customerPhone: '+91 54321 09876', eventDate: '2026-11-08', eventType: 'Wedding', eventCity: 'Chennai', status: 'CANCELLED', quotedAmountPaise: 9500000, platformFeePaise: null, packageName: 'Gold Premium', createdAt: new Date().toISOString() },
];

const STATUS_MAP: Record<string, string> = {
  All: '',
  Enquiry: 'ENQUIRY',
  Confirmed: 'CONFIRMED',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
};

const STATUS_CONFIG: Record<string, { icon: typeof AlertCircle; label: string; class: string }> = {
  ENQUIRY: { icon: AlertCircle, label: 'New Enquiry', class: 'bg-yellow-100 text-yellow-700' },
  QUOTE_SENT: { icon: Clock, label: 'Quote Sent', class: 'bg-blue-100 text-blue-700' },
  CONFIRMED: { icon: CheckCircle, label: 'Confirmed', class: 'bg-green-100 text-green-700' },
  COMPLETED: { icon: CheckCircle, label: 'Completed', class: 'bg-gray-100 text-gray-600' },
  CANCELLED: { icon: XCircle, label: 'Cancelled', class: 'bg-red-100 text-red-700' },
};

function formatINR(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(0)}K`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export function BookingsPage() {
  const [filter, setFilter] = useState('All');
  const [quoteBookingId, setQuoteBookingId] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const queryClient = useQueryClient();

  const statusParam = STATUS_MAP[filter] || undefined;

  const { data, isError } = useQuery({
    queryKey: ['vendor-bookings', statusParam],
    queryFn: () => bookingApi.list({ status: statusParam }),
    retry: 1,
    staleTime: 30_000,
  });

  const bookings = data?.data?.bookings ?? MOCK_BOOKINGS;
  const filteredBookings = isError && statusParam
    ? MOCK_BOOKINGS.filter((b) => b.status === statusParam)
    : bookings;
  const isMock = isError;

  const sendQuoteMutation = useMutation({
    mutationFn: ({ bookingId, amount }: { bookingId: string; amount: number }) =>
      bookingApi.sendQuote(bookingId, { quotedAmountPaise: amount }),
    onSuccess: () => {
      toast.success('Quote sent successfully!');
      setQuoteBookingId(null);
      setQuoteAmount('');
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] });
    },
    onError: () => toast.error('Failed to send quote. Please try again.'),
  });

  const acceptMutation = useMutation({
    mutationFn: (bookingId: string) => bookingApi.accept(bookingId),
    onSuccess: () => {
      toast.success('Booking accepted!');
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] });
    },
    onError: () => toast.error('Failed to accept booking.'),
  });

  const rejectMutation = useMutation({
    mutationFn: (bookingId: string) => bookingApi.reject(bookingId, 'Vendor declined'),
    onSuccess: () => {
      toast.success('Booking declined.');
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] });
    },
    onError: () => toast.error('Failed to decline booking.'),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 text-sm">
            {isMock && <span className="text-amber-600"><AlertTriangle size={13} className="inline mr-1 -mt-0.5" />API unavailable — showing demo data. </span>}
            Manage your booking requests and confirmed events
          </p>
        </div>
        <div className="flex gap-2">
          {Object.keys(STATUS_MAP).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${f === filter ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Booking ID', 'Customer', 'Date', 'Package', 'Amount', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredBookings.map((b) => {
              const sc = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.ENQUIRY;
              const Icon = sc.icon;
              return (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-mono text-gray-500">{b.bookingNumber}</td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-gray-900">{b.customerName}</div>
                    <div className="text-xs text-gray-400">{b.customerPhone}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{b.packageName ?? b.eventType}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">{b.quotedAmountPaise ? formatINR(b.quotedAmountPaise) : '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`badge ${sc.class} flex items-center gap-1 w-fit`}>
                      <Icon size={11} /> {sc.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button className="btn-secondary text-xs py-1 px-3">View</button>
                      {b.status === 'ENQUIRY' && (
                        <button
                          onClick={() => setQuoteBookingId(quoteBookingId === b.id ? null : b.id)}
                          className="btn-primary text-xs py-1 px-3"
                        >
                          Quote
                        </button>
                      )}
                      {b.status === 'QUOTE_SENT' && (
                        <>
                          <button
                            onClick={() => acceptMutation.mutate(b.id)}
                            disabled={acceptMutation.isPending}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(b.id)}
                            disabled={rejectMutation.isPending}
                            className="btn-secondary text-xs py-1 px-3 text-red-600"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><MessageSquare size={14} /></button>
                    </div>
                    {quoteBookingId === b.id && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Amount (₹)"
                          value={quoteAmount}
                          onChange={(e) => setQuoteAmount(e.target.value)}
                          className="input-field text-xs py-1.5 w-32"
                        />
                        <button
                          onClick={() => {
                            const amt = Number(quoteAmount) * 100;
                            if (amt > 0) sendQuoteMutation.mutate({ bookingId: b.id, amount: amt });
                            else toast.error('Enter a valid amount');
                          }}
                          disabled={sendQuoteMutation.isPending}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          {sendQuoteMutation.isPending ? 'Sending…' : 'Send'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
