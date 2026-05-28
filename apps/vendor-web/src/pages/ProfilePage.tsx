import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera, CheckCircle, Upload, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { profileApi, vendorApi, type VendorProfile, type VendorPackage } from '../lib/api';

type PackageType = VendorPackage['packageType'];
type ProfileTab = 'profile' | 'packages' | 'portfolio' | 'kyc';
type PortfolioItem = {
  id: string;
  s3Key: string;
  publicUrl: string;
  thumbUrl?: string | null;
  caption?: string | null;
  mediaType?: string;
};
type PresignedUploadResponse = {
  uploadUrl: string;
  publicUrl: string;
  s3Key?: string;
  key?: string;
};

type EditablePackage = {
  id: string;
  name: string;
  packageType: PackageType;
  priceFromPaise: number;
  inclusions: string[];
  description?: string | null;
  priceUpToPaise?: number | null;
  exclusions?: string[];
  deliverables?: string[];
  isActive?: boolean;
};

const PACKAGE_TYPES: PackageType[] = ['BASIC', 'STANDARD', 'PREMIUM', 'CUSTOM'];
const PROFILE_TABS: ProfileTab[] = ['profile', 'packages', 'portfolio', 'kyc'];
const getProfileTab = (value: string | null): ProfileTab => (
  value && PROFILE_TABS.includes(value as ProfileTab) ? value as ProfileTab : 'profile'
);
const MOCK_PORTFOLIO = [
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=300&q=80',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&q=80',
  'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=300&q=80',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300&q=80',
  'https://images.unsplash.com/photo-1531058020387-4de47d62d946?w=300&q=80',
  'https://images.unsplash.com/photo-1491604612772-6853927639ef?w=300&q=80',
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300&q=80',
  'https://images.unsplash.com/photo-1463863148025-20c37369acec?w=300&q=80',
];
const DEFAULT_DEMO_PACKAGES: EditablePackage[] = [
  { id: 'demo-silver', name: 'Grand Silver', packageType: 'BASIC', priceFromPaise: 50000000, inclusions: ['Venue rental', 'Décor', 'Bridal suite'] },
  { id: 'demo-gold', name: 'Grand Gold', packageType: 'STANDARD', priceFromPaise: 90000000, inclusions: ['Venue rental', 'Décor', 'Bridal suite', 'Catering', 'Lighting', 'Parking'] },
  { id: 'demo-platinum', name: 'Grand Platinum', packageType: 'PREMIUM', priceFromPaise: 150000000, inclusions: ['Venue rental', 'Décor', 'Bridal suite', 'Catering', 'Lighting', 'Parking', 'Valet', 'Coordinator'] },
];

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => getProfileTab(searchParams.get('tab')));
  const [showAddPkg, setShowAddPkg] = useState(false);
  const [newPkg, setNewPkg] = useState({ name: '', packageType: 'BASIC' as PackageType, priceFromPaise: 0, inclusions: '' });
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [editPkg, setEditPkg] = useState({ name: '', packageType: 'BASIC' as PackageType, priceFromPaise: 0, inclusions: '' });
  const [packages, setPackages] = useState<VendorProfile['packages']>(MOCK_PROFILE.packages);
  const [demoPackages, setDemoPackages] = useState<EditablePackage[]>(DEFAULT_DEMO_PACKAGES);
  const [uploading, setUploading] = useState(false);
  const [kycUploading, setKycUploading] = useState(false);
  const [selectedKycDoc, setSelectedKycDoc] = useState<string | null>(null);
  const [kycStatusOverrides, setKycStatusOverrides] = useState<Record<string, 'pending'>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kycFileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: profile, isError } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: profileApi.getProfile,
    retry: 1,
    staleTime: 60_000,
  });

  const vendor = profile ?? MOCK_PROFILE;
  const isMock = isError || !profile;
  const vendorWithPortfolio = vendor as VendorProfile & { portfolio?: PortfolioItem[] };
  const portfolioItems = vendorWithPortfolio.portfolio ?? [];
  const displayedPortfolio = portfolioItems.length > 0
    ? portfolioItems
    : MOCK_PORTFOLIO.map((publicUrl, index) => ({ id: `mock-photo-${index}`, publicUrl, s3Key: `mock-photo-${index}` }));
  const visiblePackages = packages.length > 0 ? packages : demoPackages;

  const [form, setForm] = useState({
    businessName: vendor.businessName,
    category: vendor.category,
    description: vendor.description ?? '',
    city: vendor.city,
    yearsExperience: vendor.yearsExperience ?? 0,
  });

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
      setEditingPkgId(null);
      return;
    }

    setPackages(MOCK_PROFILE.packages);
  }, [profile]);

  useEffect(() => {
    const nextTab = getProfileTab(searchParams.get('tab'));
    setActiveTab((current) => current === nextTab ? current : nextTab);
  }, [searchParams]);

  function handleTabChange(tab: ProfileTab) {
    setActiveTab(tab);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (tab === 'profile') next.delete('tab');
      else next.set('tab', tab);
      return next;
    }, { replace: true });
  }

  const updateMutation = useMutation({
    mutationFn: (body: Partial<VendorProfile>) => profileApi.updateProfile(body),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    },
    onError: () => toast.error('Failed to update profile.'),
  });

  const addPackageMutation = useMutation({
    mutationFn: (pkg: { name: string; packageType: PackageType; priceFromPaise: number; inclusions: string[] }) =>
      profileApi.upsertPackage(pkg),
    onSuccess: () => {
      setShowAddPkg(false);
      setNewPkg({ name: '', packageType: 'BASIC', priceFromPaise: 0, inclusions: '' });
      toast.success('Package added successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    },
    onError: () => toast.error('Failed to add package.'),
  });

  const editPackageMutation = useMutation({
    mutationFn: (pkg: { id: string; name: string; packageType: PackageType; priceFromPaise: number; inclusions: string[] }) =>
      profileApi.upsertPackage(pkg),
    onSuccess: () => {
      toast.success('Package updated!');
      setEditingPkgId(null);
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    },
    onError: () => toast.error('Failed to update package.'),
  });

  const deletePackageMutation = useMutation({
    mutationFn: (id: string) => profileApi.deletePackage(id),
    onSuccess: () => {
      toast.success('Package deleted!');
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    },
    onError: () => toast.error('Failed to delete package.'),
  });

  const packageMutationPending = addPackageMutation.isPending || editPackageMutation.isPending || deletePackageMutation.isPending;

  function resetPhotoInput() {
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function resetKycInput() {
    if (kycFileInputRef.current) kycFileInputRef.current.value = '';
  }

  function openPhotoPicker() {
    if (!uploading) fileInputRef.current?.click();
  }

  function openKycPicker(docLabel: string) {
    if (kycUploading) return;
    setSelectedKycDoc(docLabel);
    kycFileInputRef.current?.click();
  }

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image.');
      resetPhotoInput();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB.');
      resetPhotoInput();
      return;
    }

    const toastId = toast.loading(`Uploading ${file.name}…`);
    setUploading(true);

    try {
      const presignData = await profileApi.getPresignedUpload(file.type) as PresignedUploadResponse;
      const s3Key = presignData.s3Key ?? presignData.key;
      if (!s3Key) throw new Error('Upload key missing');

      const uploadResponse = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      toast.loading('Saving photo to your portfolio…', { id: toastId });
      await vendorApi.post('/vendors/me/portfolio/confirm', {
        s3Key,
        publicUrl: presignData.publicUrl,
        caption: file.name.replace(/\.[^.]+$/, ''),
        mediaType: 'image',
      });

      toast.success('Photo uploaded successfully!', { id: toastId });
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    } catch {
      toast.error('Failed to upload photo. Please try again.', { id: toastId });
    } finally {
      setUploading(false);
      resetPhotoInput();
    }
  }

  async function handleKycUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedKycDoc) return;

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or PDF document.');
      resetKycInput();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Document must be under 10MB.');
      resetKycInput();
      return;
    }

    const toastId = toast.loading(`Uploading ${selectedKycDoc}…`);
    setKycUploading(true);

    try {
      const { data } = await vendorApi.post<{ success: boolean; data: PresignedUploadResponse }>('/media/presign', {
        mediaType: 'kyc',
        mimeType: file.type,
        fileName: file.name,
      });

      const presignData = data.data;
      const uploadResponse = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      setKycStatusOverrides((current) => ({ ...current, [selectedKycDoc]: 'pending' }));
      toast.success(`${selectedKycDoc} uploaded and sent for review.`, { id: toastId });
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    } catch {
      toast.error('Failed to upload document. Please try again.', { id: toastId });
    } finally {
      setKycUploading(false);
      setSelectedKycDoc(null);
      resetKycInput();
    }
  }

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

    const payload = {
      name: newPkg.name.trim(),
      packageType: newPkg.packageType,
      priceFromPaise: newPkg.priceFromPaise,
      inclusions: newPkg.inclusions.split(',').map((s) => s.trim()).filter(Boolean),
    };

    if (isMock) {
      setPackages((current) => ([
        ...current,
        {
          id: `pkg-${Date.now()}`,
          name: payload.name,
          packageType: payload.packageType,
          priceFromPaise: payload.priceFromPaise,
          priceUpToPaise: null,
          description: null,
          inclusions: payload.inclusions,
          exclusions: [],
          deliverables: [],
          isActive: true,
        },
      ]));
      setShowAddPkg(false);
      setNewPkg({ name: '', packageType: 'BASIC', priceFromPaise: 0, inclusions: '' });
      toast.success('Package added (demo mode)!');
      return;
    }

    addPackageMutation.mutate(payload);
  }

  function handleEditPackage(pkg: EditablePackage) {
    setEditingPkgId(pkg.id);
    setEditPkg({
      name: pkg.name,
      packageType: pkg.packageType,
      priceFromPaise: pkg.priceFromPaise,
      inclusions: pkg.inclusions.join(', '),
    });
  }

  function handleSaveEditPackage() {
    if (!editingPkgId) return;
    if (!editPkg.name.trim()) {
      toast.error('Please enter a package name.');
      return;
    }

    const payload = {
      id: editingPkgId,
      name: editPkg.name.trim(),
      packageType: editPkg.packageType,
      priceFromPaise: editPkg.priceFromPaise,
      inclusions: editPkg.inclusions.split(',').map((s) => s.trim()).filter(Boolean),
    };

    if (isMock || editingPkgId.startsWith('demo-')) {
      const updateList = (list: EditablePackage[]) => list.map((pkg) => (
        pkg.id === editingPkgId
          ? { ...pkg, ...payload }
          : pkg
      ));

      if (packages.some((pkg) => pkg.id === editingPkgId)) {
        setPackages((current) => updateList(current as EditablePackage[]) as VendorProfile['packages']);
      } else {
        setDemoPackages((current) => updateList(current));
      }

      setEditingPkgId(null);
      toast.success('Package updated (demo mode)!');
      return;
    }

    editPackageMutation.mutate(payload);
  }

  function handleDeletePackage(id: string) {
    if (!window.confirm('Delete this package?')) return;

    if (isMock || id.startsWith('demo-')) {
      if (packages.some((pkg) => pkg.id === id)) {
        setPackages((current) => current.filter((pkg) => pkg.id !== id));
      } else {
        setDemoPackages((current) => current.filter((pkg) => pkg.id !== id));
      }
      toast.success('Package deleted (demo mode)!');
      return;
    }

    deletePackageMutation.mutate(id);
  }

  const kycDocuments = [
    { label: 'GST Certificate', status: vendor.gstVerified ? 'verified' : 'pending' },
    { label: 'PAN Card', status: vendor.panVerified ? 'verified' : 'pending' },
    { label: 'Business Registration', status: kycStatusOverrides['Business Registration'] ?? 'not_submitted' },
    { label: 'Bank Account (for payouts)', status: 'verified' },
  ] as const;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Vendor Profile</h1>
      <p className="text-gray-500 text-sm mb-6">
        {isMock && <span className="text-amber-600"><AlertTriangle size={13} className="inline mr-1 -mt-0.5" />API unavailable — showing demo data. </span>}
        Manage your business information and offerings
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handlePhotoUpload}
        className="hidden"
      />
      <input
        ref={kycFileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleKycUpload}
        className="hidden"
      />

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
            onClick={() => handleTabChange(tab.key)}
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
              <button
                onClick={openPhotoPicker}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-sm disabled:opacity-60"
              >
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
                    onChange={(e) => setNewPkg({ ...newPkg, packageType: e.target.value as PackageType })}
                    className="input-field"
                  >
                    {PACKAGE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
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
                  disabled={packageMutationPending}
                  className="btn-primary"
                >
                  {addPackageMutation.isPending ? 'Saving…' : 'Save Package'}
                </button>
                <button
                  onClick={() => {
                    setShowAddPkg(false);
                    setNewPkg({ name: '', packageType: 'BASIC', priceFromPaise: 0, inclusions: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {visiblePackages.map((pkg) => (
            editingPkgId === pkg.id ? (
              <div key={pkg.id} className="card p-5 mb-3 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                    <input
                      value={editPkg.name}
                      onChange={(e) => setEditPkg({ ...editPkg, name: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
                    <select
                      value={editPkg.packageType}
                      onChange={(e) => setEditPkg({ ...editPkg, packageType: e.target.value as PackageType })}
                      className="input-field"
                    >
                      {PACKAGE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={editPkg.priceFromPaise / 100}
                      onChange={(e) => setEditPkg({ ...editPkg, priceFromPaise: Number(e.target.value || 0) * 100 })}
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inclusions</label>
                    <textarea
                      value={editPkg.inclusions}
                      onChange={(e) => setEditPkg({ ...editPkg, inclusions: e.target.value })}
                      className="input-field h-24 resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSaveEditPackage} disabled={editPackageMutation.isPending} className="btn-primary">
                    {editPackageMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setEditingPkgId(null)} className="btn-secondary">Cancel</button>
                </div>
              </div>
            ) : (
              <div key={pkg.id} className="card p-5 mb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                  <p className="text-sm text-gray-500">{pkg.packageType} · {pkg.inclusions.length} inclusions</p>
                  <p className="text-brand-700 font-bold mt-1">₹{(pkg.priceFromPaise / 100).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditPackage(pkg as EditablePackage)} className="btn-secondary text-xs py-2 px-3">Edit</button>
                  <button
                    onClick={() => handleDeletePackage(pkg.id)}
                    disabled={deletePackageMutation.isPending}
                    className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-60"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div className="max-w-3xl">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Portfolio ({displayedPortfolio.length} photos)</h3>
            <button
              onClick={openPhotoPicker}
              disabled={uploading}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              <Upload size={16} /> {uploading ? 'Uploading…' : 'Upload Photos'}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {displayedPortfolio.map((item, i) => (
              <div key={item.id} className="aspect-square rounded-xl overflow-hidden relative group">
                <img src={item.thumbUrl || item.publicUrl} alt={item.caption || `Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                <button onClick={() => toast.success('Photo removal is not available yet.')} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white items-center justify-center hidden group-hover:flex transition-all"><Trash2 size={12} /></button>
              </div>
            ))}
            <button
              onClick={openPhotoPicker}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-400 transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-brand-600 disabled:opacity-60"
            >
              <Upload size={24} className="mb-2" />
              <span className="text-xs">{uploading ? 'Uploading…' : 'Add Photo'}</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'kyc' && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
            ⚠️ Complete KYC to unlock premium features and increase booking trust.
          </div>
          {kycDocuments.map((doc) => (
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
                {doc.status === 'not_submitted' && (
                  <button
                    onClick={() => openKycPicker(doc.label)}
                    disabled={kycUploading}
                    className="btn-primary text-xs py-1.5 px-3 disabled:opacity-60"
                  >
                    {kycUploading && selectedKycDoc === doc.label ? 'Uploading…' : 'Upload'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
