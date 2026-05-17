'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Shield, Zap } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore, UserRole } from '@/store/authStore';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface RoleConfig {
  role: UserRole;
  label: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;         // text-pink-600
  bgColor: string;       // bg-pink-50
  badgeBg: string;       // bg-pink-100
  badgeText: string;     // text-pink-700
  buttonGradient: string; // from-pink-500 to-rose-500 (for gradient button)
  demoPhone: string;
  demoOtp: string;
  otherRoles: { label: string; href: string }[];
}

type Step = 'phone' | 'otp';

// ─── Helpers ────────────────────────────────────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────────────────────

export default function RoleLoginPage({ config }: { config: RoleConfig }) {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const Icon = config.icon;

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
      toast.error('Please enter a valid Indian mobile number');
      return;
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
      toast.success(`Welcome, ${getRoleLabel(user.role)}! 🎉`);
      router.push(getRedirectPath(user.role));
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Incorrect OTP. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setDemoLoading(true);
    try {
      const formattedPhone = `+91${config.demoPhone}`;
      await authApi.sendOtp(formattedPhone);
      const res = await authApi.verifyOtp(formattedPhone, config.demoOtp);
      const { accessToken, refreshToken, user } = res.data.data;
      setTokens(accessToken, refreshToken);
      setUser(user);
      toast.success(`Demo login as ${getRoleLabel(user.role)} successful! 🎉`);
      router.push(getRedirectPath(user.role));
    } catch {
      const demoUser = {
        id: `demo-${config.role}`,
        phone: `+91${config.demoPhone}`,
        role: config.role,
        status: 'active',
        phoneVerified: true,
      };
      setUser(demoUser);
      const mockToken = `demo_${config.role}_${Date.now()}`;
      setTokens(mockToken, `refresh_${mockToken}`);
      toast(`Demo login as ${getRoleLabel(config.role)}! ⚠️ Backend offline — demo mode`, { icon: '🔧', duration: 5000 });
      router.push(getRedirectPath(config.role));
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo + back to role selection */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
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
              {/* Back link */}
              <Link href="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
                <ArrowLeft size={14} />
                All login options
              </Link>

              {/* Role header */}
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ${config.bgColor}`}>
                  <Icon size={28} className={config.color} />
                </div>
                <h1 className="text-xl font-bold font-heading">{config.title}</h1>
                <p className="text-gray-500 text-sm mt-1">{config.subtitle}</p>
              </div>

              {/* Role badge */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-5 ${config.badgeBg} ${config.badgeText}`}>
                <Icon size={12} />
                {config.label} Login
              </div>

              {/* Phone Form */}
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

              {/* Demo Login */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400 font-medium">Quick Demo Access</span>
                </div>
              </div>

              <button
                onClick={handleDemoLogin}
                disabled={demoLoading}
                className={`relative w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed ${config.bgColor} border-transparent hover:border-current ${config.color}`}
              >
                {demoLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Icon size={18} />
                )}
                <span className="font-semibold text-sm">
                  {demoLoading ? 'Logging in...' : `Try Demo ${config.label} Account`}
                </span>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                  <Zap size={8} className="text-white" />
                </div>
              </button>
            </>
          ) : (
            <>
              {/* OTP Step */}
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
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4 ${config.badgeBg} ${config.badgeText}`}>
                <Icon size={12} />
                Logging in as {config.label}
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
                      onClick={() => handleSendOtp({ preventDefault: () => {} } as React.FormEvent)}
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

        {/* Other role links */}
        <div className="text-center mt-4 space-x-2 text-xs text-gray-400">
          {config.otherRoles.map((r, i) => (
            <span key={r.href}>
              {i > 0 && ' · '}
              <Link href={r.href} className="text-brand-600 font-medium hover:underline">{r.label}</Link>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
