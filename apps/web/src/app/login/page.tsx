'use client';
import Link from 'next/link';
import { Heart, Store, Users, Crown, Shield, Zap, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore, UserRole } from '@/store/authStore';

// ─── Role cards for the selection page ──────────────────────────────────────────

interface RoleOption {
  role: UserRole;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'customer',
    label: 'Couple / Customer',
    description: 'Planning your dream wedding? Browse vendors, compare packages, book services with escrow protection.',
    href: '/login/couple',
    icon: Heart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200 hover:border-pink-400 hover:shadow-pink-100',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    role: 'vendor',
    label: 'Vendor / Service Provider',
    description: 'Grow your wedding business. Manage bookings, packages, payouts & connect with couples.',
    href: '/login/vendor',
    icon: Store,
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
    borderColor: 'border-brand-200 hover:border-brand-400 hover:shadow-brand-100',
    gradient: 'from-brand-500 to-purple-500',
  },
  {
    role: 'coordinator',
    label: 'Wedding Coordinator',
    description: 'Manage event timelines, coordinate vendors, track tasks & ensure flawless execution.',
    href: '/login/coordinator',
    icon: Users,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-100',
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    role: 'admin',
    label: 'Platform Admin',
    description: 'Internal operations — vendor verification, dispute resolution, platform analytics.',
    href: '/login/admin',
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200 hover:border-amber-400 hover:shadow-amber-100',
    gradient: 'from-amber-500 to-orange-500',
  },
];

// ─── Demo accounts ──────────────────────────────────────────────────────────────

interface DemoAccount {
  label: string;
  phone: string;
  otp: string;
  role: UserRole;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: 'Couple', phone: '9876543210', otp: '123456', role: 'customer', icon: Heart, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200 hover:border-pink-400' },
  { label: 'Vendor', phone: '9876543211', otp: '123456', role: 'vendor', icon: Store, color: 'text-brand-600', bgColor: 'bg-brand-50', borderColor: 'border-brand-200 hover:border-brand-400' },
  { label: 'Coordinator', phone: '9876543212', otp: '123456', role: 'coordinator', icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200 hover:border-indigo-400' },
  { label: 'Admin', phone: '9876543213', otp: '123456', role: 'admin', icon: Crown, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200 hover:border-amber-400' },
];

function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'vendor': return '/dashboard';
    case 'coordinator': return '/dashboard';
    case 'admin':
    case 'super_admin': return '/dashboard';
    case 'customer':
    default: return '/dashboard';
  }
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'customer': return '💑 Couple';
    case 'vendor': return '🏪 Vendor';
    case 'coordinator': return '📋 Coordinator';
    case 'admin': return '👑 Admin';
    case 'super_admin': return '⚡ Super Admin';
    default: return role;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  async function handleDemoLogin(account: DemoAccount) {
    setDemoLoading(account.role);
    try {
      const formattedPhone = `+91${account.phone}`;
      await authApi.sendOtp(formattedPhone);
      const res = await authApi.verifyOtp(formattedPhone, account.otp);
      const { accessToken, refreshToken, user } = res.data.data;
      setTokens(accessToken, refreshToken);
      setUser(user);
      toast.success(`Demo login as ${getRoleLabel(user.role)} successful! 🎉`);
      router.push(getRedirectPath(user.role));
    } catch {
      const demoUser = {
        id: `demo-${account.role}`,
        phone: `+91${account.phone}`,
        role: account.role,
        status: 'active',
        phoneVerified: true,
      };
      setUser(demoUser);
      const mockToken = `demo_${account.role}_${Date.now()}`;
      setTokens(mockToken, `refresh_${mockToken}`);
      toast(`Demo login as ${getRoleLabel(account.role)}! ⚠️ Backend offline — demo mode`, { icon: '🔧', duration: 5000 });
      router.push(getRedirectPath(account.role));
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <span className="text-white font-bold">W</span>
            </div>
            <span className="font-heading font-bold text-2xl text-gray-900">Wedding OS</span>
          </Link>
          <p className="text-gray-500 mt-1 text-sm">India&apos;s Wedding Operating System</p>
        </div>

        {/* Role Selection Card */}
        <div className="card p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold font-heading">Welcome!</h1>
            <p className="text-gray-500 text-sm mt-1">Choose how you&apos;d like to sign in</p>
          </div>

          {/* ─── Role Cards ─── */}
          <div className="space-y-3">
            {ROLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <Link
                  key={option.role}
                  href={option.href}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md active:scale-[0.98] ${option.borderColor} ${option.bgColor}`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm ${option.color}`}>{option.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{option.description}</p>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    <span className="text-gray-400 text-sm">→</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ─── Demo Divider ─── */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400 font-medium">Quick Demo Access</span>
            </div>
          </div>

          {/* ─── Demo Login Buttons ─── */}
          <div className="grid grid-cols-4 gap-2">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon;
              const isLoading = demoLoading === account.role;
              return (
                <button
                  key={account.role}
                  onClick={() => handleDemoLogin(account)}
                  disabled={demoLoading !== null}
                  className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed ${account.borderColor} ${account.bgColor}`}
                >
                  {isLoading ? (
                    <Loader2 size={18} className={`animate-spin ${account.color}`} />
                  ) : (
                    <Icon size={18} className={account.color} />
                  )}
                  <span className={`text-[10px] font-semibold ${account.color}`}>{account.label}</span>
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                    <Zap size={7} className="text-white" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Shield size={12} className="text-green-500" />
          <span>Secured with 256-bit encryption</span>
        </div>
      </div>
    </div>
  );
}
