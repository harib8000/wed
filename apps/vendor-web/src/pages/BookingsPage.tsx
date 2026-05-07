import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare } from 'lucide-react';

const BOOKINGS = [
  { id: 'WB-001', customer: 'Priya & Rahul Sharma', date: '14 Feb 2027', package: 'Grand Gold Hall', amount: '₹90,000', status: 'enquiry', phone: '+91 98765 43210' },
  { id: 'WB-002', customer: 'Ananya & Vikram Reddy', date: '20 Mar 2027', package: 'Silver Basic', amount: '₹50,000', status: 'quoted', phone: '+91 87654 32109' },
  { id: 'WB-003', customer: 'Meera & Arun Kumar', date: '5 Apr 2027', package: 'Platinum Package', amount: '₹1,50,000', status: 'confirmed', phone: '+91 76543 21098' },
  { id: 'WB-004', customer: 'Divya & Ravi Verma', date: '12 Dec 2026', package: 'Basic Silver', amount: '₹55,000', status: 'completed', phone: '+91 65432 10987' },
  { id: 'WB-005', customer: 'Swetha & Karthik', date: '8 Nov 2026', package: 'Gold Premium', amount: '₹95,000', status: 'cancelled', phone: '+91 54321 09876' },
];

const STATUS_CONFIG: Record<string, { icon: any; label: string; class: string }> = {
  enquiry: { icon: AlertCircle, label: 'New Enquiry', class: 'bg-yellow-100 text-yellow-700' },
  quoted: { icon: Clock, label: 'Quote Sent', class: 'bg-blue-100 text-blue-700' },
  confirmed: { icon: CheckCircle, label: 'Confirmed', class: 'bg-green-100 text-green-700' },
  completed: { icon: CheckCircle, label: 'Completed', class: 'bg-gray-100 text-gray-600' },
  cancelled: { icon: XCircle, label: 'Cancelled', class: 'bg-red-100 text-red-700' },
};

export function BookingsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 text-sm">Manage your booking requests and confirmed events</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Enquiry', 'Confirmed', 'Completed', 'Cancelled'].map((f) => (
            <button key={f} className={`px-3 py-1.5 rounded-full text-xs font-medium ${f === 'All' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f}</button>
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
            {BOOKINGS.map((b) => {
              const sc = STATUS_CONFIG[b.status];
              const Icon = sc.icon;
              return (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-mono text-gray-500">{b.id}</td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-gray-900">{b.customer}</div>
                    <div className="text-xs text-gray-400">{b.phone}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{b.date}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{b.package}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">{b.amount}</td>
                  <td className="px-5 py-4">
                    <span className={`badge ${sc.class} flex items-center gap-1 w-fit`}>
                      <Icon size={11} /> {sc.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button className="btn-secondary text-xs py-1 px-3">View</button>
                      {b.status === 'enquiry' && <button className="btn-primary text-xs py-1 px-3">Quote</button>}
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><MessageSquare size={14} /></button>
                    </div>
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
