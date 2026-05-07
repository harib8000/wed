import { useState } from 'react';
import { Camera, CheckCircle, Upload, MapPin, IndianRupee, Plus, Trash2 } from 'lucide-react';

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'packages' | 'portfolio' | 'kyc'>('profile');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Vendor Profile</h1>
      <p className="text-gray-500 text-sm mb-6">Manage your business information and offerings</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: 'profile', label: 'Business Info' },
          { key: 'packages', label: 'Packages' },
          { key: 'portfolio', label: 'Portfolio' },
          { key: 'kyc', label: 'KYC & Verification' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card p-6 max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center relative">
              <span className="text-brand-600 text-4xl">🏛️</span>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-sm">
                <Camera size={12} />
              </button>
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Royal Grand Palace</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={10} /> KYC Verified</span>
                <span className="badge bg-gold-100 text-gold-700">Premium</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label><input defaultValue="Royal Grand Palace" className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="input-field">
                <option>Venue</option><option>Photography</option><option>Catering</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input-field h-24 resize-none" defaultValue="Royal Grand Palace is Hyderabad's premier wedding venue..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹)</label><input type="number" defaultValue="500000" className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Years Experience</label><input type="number" defaultValue="12" className="input-field" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Cities Served</label><input defaultValue="Hyderabad, Secunderabad" className="input-field" /></div>
            <button className="btn-primary">Save Changes</button>
          </div>
        </div>
      )}

      {activeTab === 'packages' && (
        <div className="max-w-3xl">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Your Packages</h3>
            <button className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Package</button>
          </div>
          {[
            { name: 'Grand Silver', price: '₹5,00,000', guests: '100–200', inclusions: 3 },
            { name: 'Grand Gold', price: '₹9,00,000', guests: '200–500', inclusions: 6 },
            { name: 'Grand Platinum', price: '₹15,00,000', guests: '500–2000', inclusions: 8 },
          ].map((pkg) => (
            <div key={pkg.name} className="card p-5 mb-3 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                <p className="text-sm text-gray-500">{pkg.guests} guests · {pkg.inclusions} inclusions</p>
                <p className="text-brand-700 font-bold mt-1">{pkg.price}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary text-xs py-2 px-3">Edit</button>
                <button className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div className="max-w-3xl">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Portfolio ({8} photos)</h3>
            <button className="btn-primary flex items-center gap-2"><Upload size={16} /> Upload Photos</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden relative group">
                <img src={`https://images.unsplash.com/photo-${['1519225421980-715cb0215aed','1519741497674-611481863552','1478146059778-26028b07395a','1464366400600-7168b8af9bc3','1531058020387-4de47d62d946','1491604612772-6853927639ef','1519167758481-83f550bb49b3','1463863148025-20c37369acec'][i]}?w=300&q=80`} alt="" className="w-full h-full object-cover" />
                <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white items-center justify-center hidden group-hover:flex transition-all"><Trash2 size={12} /></button>
              </div>
            ))}
            <button className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-400 transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-brand-600">
              <Upload size={24} className="mb-2" />
              <span className="text-xs">Add Photo</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'kyc' && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
            ⚠️ Complete KYC to unlock premium features and increase booking trust.
          </div>
          {[
            { label: 'GST Certificate', status: 'verified' },
            { label: 'PAN Card', status: 'pending' },
            { label: 'Business Registration', status: 'not_submitted' },
            { label: 'Bank Account (for payouts)', status: 'verified' },
          ].map((doc) => (
            <div key={doc.label} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${doc.status === 'verified' ? 'bg-green-100' : doc.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                  <CheckCircle size={16} className={doc.status === 'verified' ? 'text-green-600' : 'text-gray-400'} />
                </div>
                <span className="font-medium text-sm text-gray-900">{doc.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge text-xs ${doc.status === 'verified' ? 'bg-green-100 text-green-700' : doc.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                  {doc.status === 'not_submitted' ? 'Not Submitted' : doc.status === 'verified' ? 'Verified ✓' : 'Under Review'}
                </span>
                {doc.status === 'not_submitted' && <button className="btn-primary text-xs py-1.5 px-3">Upload</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
