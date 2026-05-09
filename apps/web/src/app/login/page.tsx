'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Phone, ArrowLeft, Loader2, Shield, Heart, Store, Users, Crown, Zap } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore, UserRole } from '@/store/authStore';

type Step = 'phone' | 'otp';
type LoginMode = 'couple' | 'vendor';

// ─── Demo accounts ────────────────────────────────────────────────────────────
// These are pre-seeded demo accounts for testing the platform.
// In dev mode the backend logs OTP to console; in production these would
// be real accounts with a fixed OTP (e.g. 123456) or a bypass flag.

interface DemoAccount {
  label: string;
  description: string;
  phone: string;
  otp: string;
  role: UserRole;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Couple / Customer',
    description: 'Browse vendors, book services, manage your wedding',
    phone: '9876543210',
    otp: '123456',
    role: 'customer',
    icon: Heart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200 hover:border-pink-400',
  },
  {
    label: 'Vendor',
    description: 'Manage your business, packages, bookings & payouts',
    phone: '9876543211',
    otp: '123456',
    role: 'vendor',
    icon: Store,
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
    borderColor: 'border-brand-200 hover:border-brand-400',
  },
  {
    label: 'Coordinator',
    description: 'Manage event timelines, tasks & vendor coordination',
    phone: '9876543212',
    otp: '123456',
    role: 'coordinator',
    icon: Users,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200 hover:border-indigo-400',
  },
  {
    label: 'Admin',
    description: 'Platform administration, vendor verification, disputes',
    phone: '9876543213',
    otp: '123456',
    role: 'admin',
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200 hover:border-amber-400',
  },
];

// ─── Role-based redirect mapping ──────────────────────────────────────────────

function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'vendor':
      return '/dashboard'; // vendor dashboard
    case 'coordinator':
      return '/dashboard'; // coordinator timeline
    case 'admin':
    case 'super_admin':
      return '/dashboard'; // admin panel
    case 'customer':
    default:
      return '/dashboard'; // couple/customer dashboard
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

// ─── Login mode config ────────────────────────────────────────────────────────

const LOGIN_MODES: { key: LoginMode; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'couple', label: 'Couple', icon: Heart, description: 'Planning your wedding?' },
  { key: 'vendor', label: 'Vendor', icon: Store, description: 'Wedding service provider?' },
];

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [loginMode, setLoginMode] = useState<LoginMode>('couple');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startResendTimer = () => {
    setResendTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length > 10) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    return val.startsWith('+') ? val : `+91${digits}`;
  };

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const formattedPhone = formatPhone(phone);
    if (!formattedPhone.match(/^\+91[6-9]\d{9}$/)) {
      toast.error('Please enter a valid Indian mobile number'); return;
    }
    setLoading(true);
    try {
      await authApi.sendOtp(formattedPhone);
      toast.success('OTP sent to your mobile number!');
      setStep('otp');
      startResendTimer();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (loading || otp.length !== 6) return;
    setLoading(true);
    try {
      const formattedPhone = formatPhone(phone);
      const res = await authApi.verifyOtp(formattedPhone, otp);
      const { accessToken, refreshToken, user } = res.data.data;
      setTokens(accessToken, refreshToken);
      setUser(user);
      const roleLabel = getRoleLabel(user.role);
      toast.success(`Welcome, ${roleLabel}! 🎉`);
      router.push(getRedirectPath(user.role));
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Incorrect OTP. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(account: DemoAccount) {
    setDemoLoading(account.role);
    try {
      // Step 1: Send OTP for demo account
      const formattedPhone = `+91${account.phone}`;
      await authApi.sendOtp(formattedPhone);

      // Step 2: Verify with the known demo OTP
      const res = await authApi.verifyOtp(formattedPhone, account.otp);
      const { accessToken, refreshToken, user } = res.data.data;
      setTokens(accessToken, refreshToken);
      setUser(user);
      const roleLabel = getRoleLabel(user.role);
      toast.success(`Demo login as ${roleLabel} successful! 🎉`);
      router.push(getRedirectPath(user.role));
    } catch {
      // If backend isn't running, simulate a demo login for UI development
      const demoUser = {
        id: `demo-${account.role}`,
        phone: `+91${account.phone}`,
        role: account.role,
        status: 'active',
        phoneVerified: true,
      };
      setUser(demoUser);
      // Generate mock tokens for demo mode
      const mockToken = `demo_${account.role}_${Date.now()}`;
      setTokens(mockToken, `refresh_${mockToken}`);
      const roleLabel = getRoleLabel(account.role);
      toast.success(`Demo login as ${roleLabel}! 🎉 (offline mode)`);
      router.push(getRedirectPath(account.role));
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <span className="text-white font-bold">W</span>
            </div>
            <span className="font-heading font-bold text-2xl text-gray-900">Wedding OS</span>
          </Link>
          <p className="text-gray-500 mt-1 text-sm">India&apos;s Wedding Operating System</p>
        </div>

        <div className="card p-6 sm:p-8 shadow-xl">
          {step === 'phone' ? (
            <>
              {/* ─── Login Mode Tabs ─── */}
              <div className="flex rounded-xl bg-gray-100 p-1 mb-6" role="tablist" aria-label="Login type">
                {LOGIN_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = loginMode === mode.key;
                  return (
                    <button
                      key={mode.key}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setLoginMode(mode.key)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-white shadow-sm text-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon size={16} className={isActive ? (mode.key === 'couple' ? 'text-pink-500' : 'text-brand-600') : ''} />
                      {mode.label}
                    </button>
                  );
                })}
              </div>

              {/* ─── Mode Description ─── */}
              <div className="text-center mb-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                  loginMode === 'couple' ? 'bg-pink-100' : 'bg-brand-100'
                }`}>
                  {loginMode === 'couple'
                    ? <Heart size={24} className="text-pink-600" />
                    : <Store size={24} className="text-brand-600" />
                  }
                </div>
                <h1 className="text-xl font-bold font-heading">
                  {loginMode === 'couple' ? 'Couple Sign In' : 'Vendor Sign In'}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {loginMode === 'couple'
                    ? 'Plan your dream wedding with verified vendors'
                    : 'Manage your wedding services & grow your business'
                  }
                </p>
              </div>

              {/* ─── Phone Form ─── */}
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="input-field pl-12"
                      maxLength={10}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading || phone.length < 10} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {loading ? 'Sending OTP...' : 'Get OTP →'}
                </button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-3">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="text-brand-600">Terms</Link> &{' '}
                <Link href="/privacy" className="text-brand-600">Privacy Policy</Link>
              </p>

              {/* ─── Divider ─── */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400 font-medium">Try Demo Accounts</span>
                </div>
              </div>

              {/* ─── Demo Login Buttons ─── */}
              <div className="grid grid-cols-2 gap-2.5">
                {DEMO_ACCOUNTS.map((account) => {
                  const Icon = account.icon;
                  const isLoading = demoLoading === account.role;
                  return (
                    <button
                      key={account.role}
                      onClick={() => handleDemoLogin(account)}
                      disabled={demoLoading !== null}
                      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed ${account.borderColor} ${account.bgColor}`}
                    >
                      {isLoading ? (
                        <Loader2 size={20} className={`animate-spin ${account.color}`} />
                      ) : (
                        <Icon size={20} className={account.color} />
                      )}
                      <span className={`text-xs font-semibold ${account.color}`}>
                        {account.label}
                      </span>
                      <span className="text-[10px] text-gray-400 leading-tight text-center line-clamp-2">
                        {account.description}
                      </span>
                      {/* Quick-access indicator */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                        <Zap size={8} className="text-white" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* ─── OTP Step ─── */}
              <div className="flex items-center mb-6">
                <button onClick={() => setStep('phone')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2" aria-label="Go back">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-xl font-bold font-heading">Verify OTP</h1>
                  <p className="text-sm text-gray-500">Sent to +91 {phone}</p>
                </div>
              </div>

              {/* Role badge */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                loginMode === 'couple' ? 'bg-pink-100 text-pink-700' : 'bg-brand-100 text-brand-700'
              }`}>
                {loginMode === 'couple' ? <Heart size={12} /> : <Store size={12} />}
                Logging in as {loginMode === 'couple' ? 'Couple' : 'Vendor'}
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">6-Digit OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1 text-center">OTP expires in 10 minutes</p>
                </div>

                <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {loading ? 'Verifying...' : 'Verify & Continue →'}
                </button>

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-400">Resend OTP in {resendTimer}s</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleSendOtp({ preventDefault: () => {} } as any);
                      }}
                      className="text-sm text-brand-600 hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>
            </>
          )}

          {/* Security note */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield size={12} className="text-green-500" />
            <span>Secured with 256-bit encryption</span>
          </div>
        </div>

        {/* ─── Footer context ─── */}
        <p className="text-center text-xs text-gray-400 mt-4">
          {loginMode === 'couple'
            ? 'Are you a vendor? '
            : 'Planning a wedding? '
          }
          <button
            onClick={() => setLoginMode(loginMode === 'couple' ? 'vendor' : 'couple')}
            className="text-brand-600 font-medium hover:underline"
          >
            {loginMode === 'couple' ? 'Sign in as Vendor' : 'Sign in as Couple'}
          </button>
        </p>
      </div>
    </div>
  );
}
