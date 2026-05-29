import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Inbox, Send, CheckCircle, XCircle, Clock, ArrowUpDown,
  Eye, AlertTriangle, MessageSquareText, FileText, Trophy,
  X, Phone, Mail, MapPin, Calendar, Users, IndianRupee, Tag,
} from 'lucide-react';
import { bookingApi, type VendorBooking } from '../lib/api';

const RESPONSE_TEMPLATES = [
  "Thank you for your enquiry! I'd love to help make your celebration special. Can I share a few package options and availability details?",
  "Here's our pricing for your event. I can customise the package based on your guest count, venue style, and event flow.",
  "We're available on your date! Let me share the best package options, sample work, and next steps for your event.",
] as const;

type LeadStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost';
type SortKey = 'newest' | 'budget_high' | 'event_date';

interface Lead {
  id: string;
  customer: string;
  phone: string;
  eventDate: string;
  eventDateValue: string;
  eventType: string;
  budget: string;
  budgetValue: number | null;
  message: string;
  receivedAt: string;
  receivedAtValue: string;
  status: LeadStatus;
}

const MOCK_LEADS: Lead[] = [
  { id: 'L-001', customer: 'Priya Sharma', phone: '+91 98765 43210', eventDate: '14 Feb 2027', eventDateValue: '2027-02-14', eventType: 'Wedding', budget: '₹8,00,000', budgetValue: 800000, message: 'Looking for a grand venue for 500+ guests. Want both indoor and outdoor options.', receivedAt: '2 hours ago', receivedAtValue: '2026-05-20T08:00:00.000Z', status: 'new' },
  { id: 'L-002', customer: 'Ananya Reddy', phone: '+91 87654 32109', eventDate: '20 Mar 2027', eventDateValue: '2027-03-20', eventType: 'Reception', budget: '₹3,50,000', budgetValue: 350000, message: 'Need a venue for a post-wedding reception, around 200 guests.', receivedAt: '5 hours ago', receivedAtValue: '2026-05-20T05:00:00.000Z', status: 'new' },
  { id: 'L-003', customer: 'Meera Kumar', phone: '+91 76543 21098', eventDate: '5 Apr 2027', eventDateValue: '2027-04-05', eventType: 'Wedding', budget: '₹12,00,000', budgetValue: 1200000, message: 'Interested in Platinum package. Can you share more details about the decor options?', receivedAt: '1 day ago', receivedAtValue: '2026-05-19T11:00:00.000Z', status: 'contacted' },
  { id: 'L-004', customer: 'Divya Verma', phone: '+91 65432 10987', eventDate: '22 May 2027', eventDateValue: '2027-05-22', eventType: 'Engagement', budget: '₹2,00,000', budgetValue: 200000, message: 'Small engagement ceremony for 100 guests. Looking for an intimate space.', receivedAt: '2 days ago', receivedAtValue: '2026-05-18T09:00:00.000Z', status: 'quoted' },
  { id: 'L-005', customer: 'Kavitha Nair', phone: '+91 54321 09876', eventDate: '10 Jun 2027', eventDateValue: '2027-06-10', eventType: 'Wedding', budget: '₹15,00,000', budgetValue: 1500000, message: 'Destination wedding theme with traditional South Indian elements.', receivedAt: '3 days ago', receivedAtValue: '2026-05-17T13:30:00.000Z', status: 'won' },
  { id: 'L-006', customer: 'Swetha Iyer', phone: '+91 43210 98765', eventDate: '8 Jan 2027', eventDateValue: '2027-01-08', eventType: 'Saree Function', budget: '₹1,50,000', budgetValue: 150000, message: 'Need a small hall for a saree ceremony, 80 guests max.', receivedAt: '5 days ago', receivedAtValue: '2026-05-15T10:15:00.000Z', status: 'lost' },
  { id: 'L-007', customer: 'Ritu Agarwal', phone: '+91 32109 87654', eventDate: '18 Jul 2027', eventDateValue: '2027-07-18', eventType: 'Wedding', budget: '₹10,00,000', budgetValue: 1000000, message: 'Looking for venue + catering combo package for 400 guests.', receivedAt: '1 week ago', receivedAtValue: '2026-05-13T16:00:00.000Z', status: 'won' },
  { id: 'L-008', customer: 'Pooja Desai', phone: '+91 21098 76543', eventDate: '25 Aug 2027', eventDateValue: '2027-08-25', eventType: 'Haldi', budget: '₹75,000', budgetValue: 75000, message: 'Need an outdoor space for haldi ceremony, 60-80 guests.', receivedAt: '1 week ago', receivedAtValue: '2026-05-13T09:00:00.000Z', status: 'lost' },
];

function bookingsToLeads(bookings: VendorBooking[]): Lead[] {
  return bookings.map((b) => ({
    id: b.id,
    customer: b.customerName,
    phone: b.customerPhone,
    eventDate: new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    eventDateValue: b.eventDate,
    eventType: b.eventType,
    budget: b.quotedAmountPaise ? `₹${(b.quotedAmountPaise / 100).toLocaleString('en-IN')}` : '—',
    budgetValue: b.quotedAmountPaise ? b.quotedAmountPaise / 100 : null,
    message: `Enquiry for ${b.packageName ?? b.eventType} in ${b.eventCity}`,
    receivedAt: new Date(b.createdAt).toLocaleDateString('en-IN'),
    receivedAtValue: b.createdAt,
    status: b.status === 'ENQUIRY'
      ? 'new'
      : b.status === 'QUOTE_SENT'
        ? 'quoted'
        : b.status === 'CONFIRMED' || b.status === 'COMPLETED'
          ? 'won'
          : 'lost',
  }));
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; class: string; dot: string }> = {
  new: { label: 'New', class: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  contacted: { label: 'Contacted', class: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  quoted: { label: 'Quoted', class: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  won: { label: 'Won', class: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  lost: { label: 'Lost', class: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

const PIPELINE: Array<{ key: LeadStatus; label: string; icon: typeof Inbox }> = [
  { key: 'new', label: 'New', icon: Inbox },
  { key: 'contacted', label: 'Contacted', icon: Send },
  { key: 'quoted', label: 'Quoted', icon: FileText },
  { key: 'won', label: 'Won', icon: Trophy },
  { key: 'lost', label: 'Lost', icon: XCircle },
];

export function LeadsPage() {
  const [filter, setFilter] = useState<'All' | LeadStatus>('All');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [quoteLeadId, setQuoteLeadId] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [templateLeadId, setTemplateLeadId] = useState<string | null>(null);
  const [templateMessage, setTemplateMessage] = useState('');
  const [statusOverrides, setStatusOverrides] = useState<Record<string, LeadStatus>>({});
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isError } = useQuery({
    queryKey: ['vendor-leads'],
    queryFn: () => bookingApi.list({ status: 'ENQUIRY' }),
    retry: 1,
    staleTime: 30_000,
  });

  const apiLeads = data?.data?.bookings ? bookingsToLeads(data.data.bookings) : null;
  const baseLeads = apiLeads ?? MOCK_LEADS;
  const leads = baseLeads.map((lead) => ({ ...lead, status: statusOverrides[lead.id] ?? lead.status }));
  const isMock = isError || !apiLeads;

  const filtered = useMemo(() => {
    const next = leads.filter((lead) => filter === 'All' || lead.status === filter);
    return next.sort((a, b) => {
      if (sortBy === 'budget_high') return (b.budgetValue ?? 0) - (a.budgetValue ?? 0);
      if (sortBy === 'event_date') return new Date(a.eventDateValue).getTime() - new Date(b.eventDateValue).getTime();
      return new Date(b.receivedAtValue).getTime() - new Date(a.receivedAtValue).getTime();
    });
  }, [filter, leads, sortBy]);

  const stats = {
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    quoted: leads.filter((l) => l.status === 'quoted').length,
    won: leads.filter((l) => l.status === 'won').length,
    lost: leads.filter((l) => l.status === 'lost').length,
  };

  const sendQuoteMutation = useMutation({
    mutationFn: ({ bookingId, amount }: { bookingId: string; amount: number }) =>
      bookingApi.sendQuote(bookingId, { quotedAmountPaise: amount }),
    onSuccess: (_data, variables) => {
      toast.success('Quote sent successfully!');
      setStatusOverrides((prev) => ({ ...prev, [variables.bookingId]: 'quoted' }));
      setQuoteLeadId(null);
      setQuoteAmount('');
      queryClient.invalidateQueries({ queryKey: ['vendor-leads'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] });
    },
    onError: () => toast.error('Failed to send quote.'),
  });

  const declineMutation = useMutation({
    mutationFn: (bookingId: string) => bookingApi.reject(bookingId, 'Vendor declined enquiry'),
    onSuccess: (_data, bookingId) => {
      toast.success('Lead declined.');
      setStatusOverrides((prev) => ({ ...prev, [bookingId]: 'lost' }));
      queryClient.invalidateQueries({ queryKey: ['vendor-leads'] });
    },
    onError: () => toast.error('Failed to decline lead.'),
  });

  function openTemplate(leadId: string, template: string) {
    setTemplateLeadId(leadId);
    setTemplateMessage(template);
  }

  function updateLeadStatus(leadId: string, nextStatus: LeadStatus) {
    setStatusOverrides((prev) => ({ ...prev, [leadId]: nextStatus }));
    toast.success(`Lead moved to ${STATUS_CONFIG[nextStatus].label}.`);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads & Enquiries</h1>
          <p className="text-gray-500 text-sm">
            {isMock && <span className="text-amber-600"><AlertTriangle size={13} className="inline mr-1 -mt-0.5" />API unavailable — showing demo data. </span>}
            Manage incoming enquiries and convert them to bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="newest">Newest First</option>
            <option value="budget_high">Budget High→Low</option>
            <option value="event_date">Event Date</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'New Leads', value: stats.new, icon: Inbox, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Contacted', value: stats.contacted, icon: Send, color: 'text-sky-600 bg-sky-50' },
          { label: 'Quoted', value: stats.quoted, icon: FileText, color: 'text-blue-600 bg-blue-50' },
          { label: 'Won', value: stats.won, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Lost', value: stats.lost, icon: XCircle, color: 'text-gray-600 bg-gray-50' },
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

      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Lead Status Pipeline</h3>
          <span className="text-xs text-gray-400">Click stages on each card to move leads forward</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {PIPELINE.map((stage) => {
            const Icon = stage.icon;
            const config = STATUS_CONFIG[stage.key];
            return (
              <button
                key={stage.key}
                onClick={() => setFilter((prev) => (prev === stage.key ? 'All' : stage.key))}
                className={`rounded-2xl border px-4 py-3 text-left transition-all ${filter === stage.key ? 'border-brand-400 bg-brand-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.class}`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-lg font-bold text-gray-900">{stats[stage.key]}</span>
                </div>
                <div className="text-sm font-medium text-gray-900">{stage.label}</div>
                <div className="text-xs text-gray-500 mt-1">Tap to filter {stage.label.toLowerCase()} leads</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { label: 'All', value: 'All' },
          { label: 'New', value: 'new' },
          { label: 'Contacted', value: 'contacted' },
          { label: 'Quoted', value: 'quoted' },
          { label: 'Won', value: 'won' },
          { label: 'Lost', value: 'lost' },
        ].map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value as typeof filter)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${f.value === filter ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Inbox size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No leads found</h3>
          <p className="text-gray-500 text-sm">No enquiries match the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((lead) => {
            const sc = STATUS_CONFIG[lead.status];
            return (
              <div key={lead.id} className="card p-5">
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                      <span className="text-brand-700 text-sm font-bold">{lead.customer[0]}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{lead.customer}</h3>
                      <p className="text-xs text-gray-400">{lead.phone} · Received {lead.receivedAt}</p>
                    </div>
                  </div>
                  <span className={`badge ${sc.class} text-xs flex items-center gap-1.5`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3">{lead.message}</p>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 flex-wrap">
                  <span className="flex items-center gap-1"><Clock size={12} /> {lead.eventDate}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{lead.eventType}</span>
                  <span className="font-semibold text-gray-700">Budget: {lead.budget}</span>
                </div>

                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3 mb-4">
                  <div className="text-xs font-medium text-gray-500 mb-2">Pipeline</div>
                  <div className="flex flex-wrap gap-2">
                    {PIPELINE.map((stage) => {
                      const isActive = lead.status === stage.key;
                      const config = STATUS_CONFIG[stage.key];
                      return (
                        <button
                          key={stage.key}
                          onClick={() => updateLeadStatus(lead.id, stage.key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isActive ? `${config.class} border-transparent` : 'border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-700'}`}
                        >
                          {stage.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {(lead.status === 'new' || lead.status === 'contacted') && (
                    <>
                      <button
                        onClick={() => setQuoteLeadId(quoteLeadId === lead.id ? null : lead.id)}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        Send Quote
                      </button>
                      <button
                        onClick={() => updateLeadStatus(lead.id, 'contacted')}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        Mark Contacted
                      </button>
                      <button
                        onClick={() => declineMutation.mutate(lead.id)}
                        disabled={declineMutation.isPending}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        {declineMutation.isPending ? 'Declining…' : 'Decline'}
                      </button>
                    </>
                  )}
                  {lead.status === 'quoted' && (
                    <>
                      <button onClick={() => updateLeadStatus(lead.id, 'won')} className="btn-primary text-xs py-1.5 px-3">Mark Won</button>
                      <button onClick={() => updateLeadStatus(lead.id, 'lost')} className="btn-secondary text-xs py-1.5 px-3">Mark Lost</button>
                    </>
                  )}
                  <button onClick={() => setDetailLeadId(lead.id)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                    <Eye size={12} /> View Details
                  </button>
                </div>

                {quoteLeadId === lead.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      value={quoteAmount}
                      onChange={(e) => setQuoteAmount(e.target.value)}
                      className="input-field text-xs py-1.5 w-40"
                    />
                    <button
                      onClick={() => {
                        const amt = Number(quoteAmount) * 100;
                        if (amt > 0) sendQuoteMutation.mutate({ bookingId: lead.id, amount: amt });
                        else toast.error('Enter a valid amount');
                      }}
                      disabled={sendQuoteMutation.isPending}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      {sendQuoteMutation.isPending ? 'Sending…' : 'Send Quote'}
                    </button>
                    <button
                      onClick={() => { setQuoteLeadId(null); setQuoteAmount(''); }}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-500">
                    <MessageSquareText size={13} /> Quick response templates
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {RESPONSE_TEMPLATES.map((template) => (
                      <button
                        key={template}
                        onClick={() => openTemplate(lead.id, template)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-brand-300 hover:text-brand-700"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail Drawer */}
      {detailLeadId && (() => {
        const lead = leads.find((l) => l.id === detailLeadId);
        if (!lead) return null;
        const sc = STATUS_CONFIG[lead.status];
        return (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDetailLeadId(null)} />
            <div className="relative ml-auto w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-gray-900">Lead Details</h2>
                <button onClick={() => setDetailLeadId(null)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center">
                    <span className="text-brand-700 text-xl font-bold">{lead.customer[0]}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{lead.customer}</h3>
                    <span className={`badge ${sc.class} text-xs mt-1 inline-flex items-center gap-1.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="card p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Contact Information</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400" />
                    <span>{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-gray-400 italic">Email not provided</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Clock size={14} className="text-gray-400" />
                    <span>Received {lead.receivedAt}</span>
                  </div>
                </div>

                {/* Event Details */}
                <div className="card p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Event Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-gray-400" />
                      <div>
                        <div className="text-gray-400 text-xs">Event Date</div>
                        <div className="text-gray-900 font-medium">{lead.eventDate}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Tag size={14} className="text-gray-400" />
                      <div>
                        <div className="text-gray-400 text-xs">Event Type</div>
                        <div className="text-gray-900 font-medium">{lead.eventType}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <IndianRupee size={14} className="text-gray-400" />
                      <div>
                        <div className="text-gray-400 text-xs">Budget</div>
                        <div className="text-gray-900 font-medium">{lead.budget}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users size={14} className="text-gray-400" />
                      <div>
                        <div className="text-gray-400 text-xs">Lead ID</div>
                        <div className="text-gray-900 font-medium font-mono">{lead.id}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Message */}
                <div className="card p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Customer Message</h4>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3">{lead.message}</p>
                </div>

                {/* Lead Timeline */}
                <div className="card p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Activity Timeline</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5" />
                      <div>
                        <p className="text-sm text-gray-900">Enquiry received</p>
                        <p className="text-xs text-gray-400">{lead.receivedAt}</p>
                      </div>
                    </div>
                    {lead.status !== 'new' && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5" />
                        <div>
                          <p className="text-sm text-gray-900">Lead contacted</p>
                          <p className="text-xs text-gray-400">After initial review</p>
                        </div>
                      </div>
                    )}
                    {(lead.status === 'quoted' || lead.status === 'won') && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                        <div>
                          <p className="text-sm text-gray-900">Quote sent</p>
                          <p className="text-xs text-gray-400">{lead.budget}</p>
                        </div>
                      </div>
                    )}
                    {lead.status === 'won' && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                        <div>
                          <p className="text-sm text-gray-900 font-medium">Booking confirmed! 🎉</p>
                          <p className="text-xs text-gray-400">Lead converted to booking</p>
                        </div>
                      </div>
                    )}
                    {lead.status === 'lost' && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5" />
                        <div>
                          <p className="text-sm text-gray-900">Lead lost</p>
                          <p className="text-xs text-gray-400">Did not convert</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {(lead.status === 'new' || lead.status === 'contacted') && (
                    <button
                      onClick={() => {
                        setDetailLeadId(null);
                        setQuoteLeadId(lead.id);
                      }}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <Send size={16} /> Send Quote
                    </button>
                  )}
                  <button
                    onClick={() => setDetailLeadId(null)}
                    className="btn-secondary w-full"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {templateLeadId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Send quick response</h3>
                <p className="text-sm text-gray-500">Review or personalise the template before sending.</p>
              </div>
              <button onClick={() => setTemplateLeadId(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <textarea
              value={templateMessage}
              onChange={(e) => setTemplateMessage(e.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-400">This pre-fills your response so you can reply faster.</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTemplateLeadId(null)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!templateLeadId || !templateMessage.trim()) {
                      toast.error('Please enter a response');
                      return;
                    }
                    updateLeadStatus(templateLeadId, 'contacted');
                    toast.success('Response prepared and lead marked as contacted.');
                    setTemplateLeadId(null);
                    setTemplateMessage('');
                  }}
                  className="btn-primary text-xs py-2 px-4"
                >
                  Send response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
