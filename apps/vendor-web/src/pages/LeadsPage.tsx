import { useState } from 'react';
import { Inbox, Send, CheckCircle, XCircle, Clock, ArrowUpDown, Eye } from 'lucide-react';

const LEADS = [
  { id: 'L-001', customer: 'Priya Sharma', phone: '+91 98765 43210', eventDate: '14 Feb 2027', eventType: 'Wedding', budget: '₹8,00,000', message: 'Looking for a grand venue for 500+ guests. Want both indoor and outdoor options.', receivedAt: '2 hours ago', status: 'new' },
  { id: 'L-002', customer: 'Ananya Reddy', phone: '+91 87654 32109', eventDate: '20 Mar 2027', eventType: 'Reception', budget: '₹3,50,000', message: 'Need a venue for a post-wedding reception, around 200 guests.', receivedAt: '5 hours ago', status: 'new' },
  { id: 'L-003', customer: 'Meera Kumar', phone: '+91 76543 21098', eventDate: '5 Apr 2027', eventType: 'Wedding', budget: '₹12,00,000', message: 'Interested in Platinum package. Can you share more details about the decor options?', receivedAt: '1 day ago', status: 'responded' },
  { id: 'L-004', customer: 'Divya Verma', phone: '+91 65432 10987', eventDate: '22 May 2027', eventType: 'Engagement', budget: '₹2,00,000', message: 'Small engagement ceremony for 100 guests. Looking for an intimate space.', receivedAt: '2 days ago', status: 'responded' },
  { id: 'L-005', customer: 'Kavitha Nair', phone: '+91 54321 09876', eventDate: '10 Jun 2027', eventType: 'Wedding', budget: '₹15,00,000', message: 'Destination wedding theme with traditional South Indian elements.', receivedAt: '3 days ago', status: 'converted' },
  { id: 'L-006', customer: 'Swetha Iyer', phone: '+91 43210 98765', eventDate: '8 Jan 2027', eventType: 'Saree Function', budget: '₹1,50,000', message: 'Need a small hall for a saree ceremony, 80 guests max.', receivedAt: '5 days ago', status: 'lost' },
  { id: 'L-007', customer: 'Ritu Agarwal', phone: '+91 32109 87654', eventDate: '18 Jul 2027', eventType: 'Wedding', budget: '₹10,00,000', message: 'Looking for venue + catering combo package for 400 guests.', receivedAt: '1 week ago', status: 'converted' },
  { id: 'L-008', customer: 'Pooja Desai', phone: '+91 21098 76543', eventDate: '25 Aug 2027', eventType: 'Haldi', budget: '₹75,000', message: 'Need an outdoor space for haldi ceremony, 60-80 guests.', receivedAt: '1 week ago', status: 'lost' },
];

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  new: { label: 'New', class: 'bg-yellow-100 text-yellow-700' },
  responded: { label: 'Responded', class: 'bg-blue-100 text-blue-700' },
  converted: { label: 'Converted', class: 'bg-green-100 text-green-700' },
  lost: { label: 'Lost', class: 'bg-gray-100 text-gray-600' },
};

type SortKey = 'newest' | 'budget_high' | 'event_date';

export function LeadsPage() {
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  const filtered = LEADS.filter((l) => filter === 'All' || l.status === filter.toLowerCase());

  const stats = {
    new: LEADS.filter((l) => l.status === 'new').length,
    responded: LEADS.filter((l) => l.status === 'responded').length,
    converted: LEADS.filter((l) => l.status === 'converted').length,
    lost: LEADS.filter((l) => l.status === 'lost').length,
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads & Enquiries</h1>
          <p className="text-gray-500 text-sm">Manage incoming enquiries and convert them to bookings</p>
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'New Leads', value: stats.new, icon: Inbox, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Responded', value: stats.responded, icon: Send, color: 'text-blue-600 bg-blue-50' },
          { label: 'Converted', value: stats.converted, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
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

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['All', 'New', 'Responded', 'Converted', 'Lost'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${f === filter ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Lead Cards */}
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
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                      <span className="text-brand-700 text-sm font-bold">{lead.customer[0]}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{lead.customer}</h3>
                      <p className="text-xs text-gray-400">{lead.phone} · Received {lead.receivedAt}</p>
                    </div>
                  </div>
                  <span className={`badge ${sc.class} text-xs`}>{sc.label}</span>
                </div>

                <p className="text-sm text-gray-600 mb-3">{lead.message}</p>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Clock size={12} /> {lead.eventDate}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{lead.eventType}</span>
                  <span className="font-semibold text-gray-700">Budget: {lead.budget}</span>
                </div>

                <div className="flex items-center gap-2">
                  {lead.status === 'new' && (
                    <>
                      <button className="btn-primary text-xs py-1.5 px-3">Send Quote</button>
                      <button className="btn-secondary text-xs py-1.5 px-3">Decline</button>
                    </>
                  )}
                  <button className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                    <Eye size={12} /> View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
