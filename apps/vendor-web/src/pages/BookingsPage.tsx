import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare, AlertTriangle, X, Phone, MapPin, Users, FileText, IndianRupee } from 'lucide-react';
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
  const [detailBooking, setDetailBooking] = useState<VendorBooking | null>(null);
  const [bookingNotes, setBookingNotes] = useState<Record<string, string>>({});
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
                      <button onClick={() => setDetailBooking(b)} className="btn-secondary text-xs py-1 px-3">View</button>
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

      {/* Booking Detail Modal */}
      {detailBooking && (() => {
        const b = detailBooking;
        const sc = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.ENQUIRY;
        const Icon = sc.icon;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDetailBooking(null)} />
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Booking Details</h2>
                  <p className="text-xs text-gray-400 font-mono">{b.bookingNumber}</p>
                </div>
                <button onClick={() => setDetailBooking(null)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className={`badge ${sc.class} flex items-center gap-1.5 text-sm px-3 py-1.5`}>
                    <Icon size={14} /> {sc.label}
                  </span>
                  <span className="text-sm text-gray-400">
                    Created {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="card p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Users size={14} /> Customer Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-400">Name</div>
                      <div className="text-sm font-medium text-gray-900">{b.customerName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Phone</div>
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <Phone size={12} /> {b.customerPhone}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="card p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar size={14} /> Event Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-400">Event Date</div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(b.eventDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Event Type</div>
                      <div className="text-sm font-medium text-gray-900">{b.eventType}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">City</div>
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <MapPin size={12} /> {b.eventCity}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Package</div>
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <FileText size={12} /> {b.packageName ?? 'Custom'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="card p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <IndianRupee size={14} /> Financial Summary
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Quoted Amount</span>
                      <span className="font-semibold text-gray-900">{b.quotedAmountPaise ? formatINR(b.quotedAmountPaise) : '—'}</span>
                    </div>
                    {b.platformFeePaise && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Platform Fee</span>
                        <span className="text-gray-600">{formatINR(b.platformFeePaise)}</span>
                      </div>
                    )}
                    {b.quotedAmountPaise && (
                      <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-2 mt-2">
                        <span className="text-gray-500">Advance (30%)</span>
                        <span className="font-medium text-brand-700">{formatINR(Math.round(b.quotedAmountPaise * 0.3))}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Internal Notes */}
                <div className="card p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Internal Notes</h4>
                  <textarea
                    value={bookingNotes[b.id] ?? ''}
                    onChange={(e) => setBookingNotes((prev) => ({ ...prev, [b.id]: e.target.value }))}
                    placeholder="Add internal notes about this booking..."
                    className="input-field h-20 resize-none text-sm"
                  />
                  <button
                    onClick={() => toast.success('Notes saved locally')}
                    className="btn-secondary text-xs py-1.5 px-3 mt-2"
                  >
                    Save Notes
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {b.status === 'ENQUIRY' && (
                    <button
                      onClick={() => {
                        setDetailBooking(null);
                        setQuoteBookingId(b.id);
                      }}
                      className="btn-primary flex-1"
                    >
                      Send Quote
                    </button>
                  )}
                  {b.status === 'QUOTE_SENT' && (
                    <>
                      <button
                        onClick={() => { acceptMutation.mutate(b.id); setDetailBooking(null); }}
                        className="btn-primary flex-1"
                      >
                        Accept Booking
                      </button>
                      <button
                        onClick={() => { rejectMutation.mutate(b.id); setDetailBooking(null); }}
                        className="btn-secondary flex-1 text-red-600"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  <button onClick={() => setDetailBooking(null)} className="btn-secondary flex-1">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
