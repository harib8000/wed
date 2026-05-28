import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera, CheckCircle, Upload, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { profileApi, type VendorProfile } from '../lib/api';

const MOCK_PROFILE: VendorProfile = {
  id: 'v1',
  userId: 'u1',
  businessName: 'Royal Grand Palace',
  slug: 'royal-grand-palace',
  category: 'Venue',
  city: 'Hyderabad',
  state: 'Telangana',
  tagline: 'Premier wedding venue',
  description: "Royal Grand Palace is Hyderabad's premier wedding venue with indoor and outdoor options for up to 2000 guests.",
  avgRating: 4.8,
  reviewCount: 47,
  bookingCount: 120,
  plusMember: true,
  status: 'ACTIVE',
  yearsExperience: 12,
  teamSize: 25,
  whatsappNumber: '+919876543210',
  websiteUrl: 'https://royalgrandpalace.in',
  instagramUrl: 'https://instagram.com/royalgrand',
  gstNumber: '36AAACR1234F1Z5',
  panNumber: 'AAACR1234F',
  gstVerified: true,
  panVerified: false,
  packages: [],
};

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'packages' | 'portfolio' | 'kyc'>('profile');
  const [showAddPkg, setShowAddPkg] = useState(false);
  const [newPkg, setNewPkg] = useState({ name: '', packageType: 'PER_EVENT', priceFromPaise: 0, inclusions: '' });
  const queryClient = useQueryClient();

  const { data: profile, isError } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: profileApi.getProfile,
    retry: 1,
    staleTime: 60_000,
  });

  const vendor = profile ?? MOCK_PROFILE;
  const isMock = isError || !profile;

  const [form, setForm] = useState({
    businessName: vendor.businessName,
    category: vendor.category,
    description: vendor.description ?? '',
    city: vendor.city,
    yearsExperience: vendor.yearsExperience ?? 0,
  });
  const [packages, setPackages] = useState(vendor.packages);

  useEffect(() => {
    if (profile) {
      setForm({
        businessName: profile.businessName,
        category: profile.category,
        description: profile.description ?? '',
        city: profile.city,
        yearsExperience: profile.yearsExperience ?? 0,
      });
      setPackages(profile.packages);
      return;
    }

    setPackages(MOCK_PROFILE.packages);
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (body: Partial<VendorProfile>) => profileApi.updateProfile(body),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    },
    onError: () => toast.error('Failed to update profile.'),
  });

  const addPackageMutation = useMutation({
    mutationFn: (updatedPackages: VendorProfile['packages']) => profileApi.updateProfile({ packages: updatedPackages }),
    onSuccess: (_, updatedPackages) => {
      setPackages(updatedPackages);
      setShowAddPkg(false);
      setNewPkg({ name: '', packageType: 'PER_EVENT', priceFromPaise: 0, inclusions: '' });
      toast.success('Package added successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    },
    onError: () => toast.error('Failed to add package.'),
  });

  function handleSave() {
    updateMutation.mutate({
      businessName: form.businessName,
      category: form.category,
      description: form.description,
      city: form.city,
      yearsExperience: form.yearsExperience,
    });
  }

  function handleAddPackage() {
    if (!newPkg.name.trim()) {
      toast.error('Please enter a package name.');
      return;
    }

    const nextPackages = [
      ...packages,
      {
        id: `pkg-${Date.now()}`,
        name: newPkg.name.trim(),
        packageType: newPkg.packageType as VendorProfile['packages'][number]['packageType'],
        priceFromPaise: newPkg.priceFromPaise,
        priceUpToPaise: null,
        description: null,
        inclusions: newPkg.inclusions.split(',').map((s) => s.trim()).filter(Boolean),
        exclusions: [],
        deliverables: [],
        isActive: true,
      },
    ];

    if (isMock) {
      setPackages(nextPackages);
      setShowAddPkg(false);
      setNewPkg({ name: '', packageType: 'PER_EVENT', priceFromPaise: 0, inclusions: '' });
      toast.success('Package added (demo mode)!');
      return;
    }

    addPackageMutation.mutate(nextPackages);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Vendor Profile</h1>
      <p className="text-gray-500 text-sm mb-6">
        {isMock && <span className="text-amber-600"><AlertTriangle size={13} className="inline mr-1 -mt-0.5" />API unavailable — showing demo data. </span>}
        Manage your business information and offerings
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {([
          { key: 'profile' as const, label: 'Business Info' },
          { key: 'packages' as const, label: 'Packages' },
          { key: 'portfolio' as const, label: 'Portfolio' },
          { key: 'kyc' as const, label: 'KYC & Verification' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
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
              <button onClick={() => toast('Photo upload coming soon!')} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-sm">
                <Camera size={12} />
              </button>
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{vendor.businessName}</h2>
              <div className="flex items-center gap-2 mt-1">
                {vendor.gstVerified && <span className="badge bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={10} /> KYC Verified</span>}
                {vendor.plusMember && <span className="badge bg-gold-100 text-gold-700">Premium</span>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-field"
              >
                <option>Venue</option><option>Photography</option><option>Catering</option>
                <option>Decoration</option><option>Music</option><option>Makeup</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field h-24 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years Experience</label>
                <input
                  type="number"
                  value={form.yearsExperience}
                  onChange={(e) => setForm({ ...form, yearsExperience: Number(e.target.value) })}
                  className="input-field"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="btn-primary"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'packages' && (
        <div className="max-w-3xl">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Your Packages</h3>
            <button onClick={() => setShowAddPkg(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Package</button>
          </div>
          {showAddPkg && (
            <div className="card p-5 mb-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                  <input
                    value={newPkg.name}
                    onChange={(e) => setNewPkg({ ...newPkg, name: e.target.value })}
                    className="input-field"
                    placeholder="Royal Signature Package"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
                  <select
                    value={newPkg.packageType}
                    onChange={(e) => setNewPkg({ ...newPkg, packageType: e.target.value as 'PER_EVENT' | 'PER_DAY' | 'PER_HOUR' })}
                    className="input-field"
                  >
                    <option value="PER_EVENT">PER_EVENT</option>
                    <option value="PER_DAY">PER_DAY</option>
                    <option value="PER_HOUR">PER_HOUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPkg.priceFromPaise / 100}
                    onChange={(e) => setNewPkg({ ...newPkg, priceFromPaise: Number(e.target.value || 0) * 100 })}
                    className="input-field"
                    placeholder="50000"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inclusions</label>
                  <textarea
                    value={newPkg.inclusions}
                    onChange={(e) => setNewPkg({ ...newPkg, inclusions: e.target.value })}
                    className="input-field h-24 resize-none"
                    placeholder="Venue rental, décor, bridal suite"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddPackage}
                  disabled={addPackageMutation.isPending}
                  className="btn-primary"
                >
                  {addPackageMutation.isPending ? 'Saving…' : 'Save Package'}
                </button>
                <button
                  onClick={() => {
                    setShowAddPkg(false);
                    setNewPkg({ name: '', packageType: 'PER_EVENT', priceFromPaise: 0, inclusions: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {(packages.length > 0
            ? packages.map((pkg) => (
                <div key={pkg.id} className="card p-5 mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                    <p className="text-sm text-gray-500">{pkg.packageType} · {pkg.inclusions.length} inclusions</p>
                    <p className="text-brand-700 font-bold mt-1">₹{(pkg.priceFromPaise / 100).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toast('Package editing coming soon!')} className="btn-secondary text-xs py-2 px-3">Edit</button>
                    <button onClick={() => { if (confirm('Delete this package?')) toast.success('Package removed (demo mode)'); }} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            : [
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
                    <button onClick={() => toast('Package editing coming soon!')} className="btn-secondary text-xs py-2 px-3">Edit</button>
                    <button onClick={() => { if (confirm('Delete this package?')) toast.success('Package removed (demo mode)'); }} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div className="max-w-3xl">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Portfolio ({8} photos)</h3>
            <button onClick={() => toast('Photo upload coming soon! Connect your portfolio via the web dashboard.')} className="btn-primary flex items-center gap-2"><Upload size={16} /> Upload Photos</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden relative group">
                <img src={`https://images.unsplash.com/photo-${['1519225421980-715cb0215aed','1519741497674-611481863552','1478146059778-26028b07395a','1464366400600-7168b8af9bc3','1531058020387-4de47d62d946','1491604612772-6853927639ef','1519167758481-83f550bb49b3','1463863148025-20c37369acec'][i]}?w=300&q=80`} alt="" className="w-full h-full object-cover" />
                <button onClick={() => toast.success('Photo removed (demo mode)')} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white items-center justify-center hidden group-hover:flex transition-all"><Trash2 size={12} /></button>
              </div>
            ))}
            <button onClick={() => toast('Photo upload coming soon! Connect your portfolio via the web dashboard.')} className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-400 transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-brand-600">
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
            { label: 'GST Certificate', status: vendor.gstVerified ? 'verified' : 'pending' },
            { label: 'PAN Card', status: vendor.panVerified ? 'verified' : 'pending' },
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
                {doc.status === 'not_submitted' && <button onClick={() => toast('Document upload available on web dashboard. Please visit weddingos.in/vendor to upload KYC documents.')} className="btn-primary text-xs py-1.5 px-3">Upload</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
