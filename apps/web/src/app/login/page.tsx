'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Phone, ArrowLeft, Loader2, Shield } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

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
      setResendTimer(60);
      const timer = setInterval(() => setResendTimer((t) => { if (t <= 1) { clearInterval(timer); return 0; } return t - 1; }), 1000);
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
      toast.success(`Welcome to Wedding OS! 🎉`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Incorrect OTP. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <span className="text-white font-bold">W</span>
            </div>
            <span className="font-heading font-bold text-2xl text-gray-900">Wedding OS</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">India&apos;s Wedding Operating System</p>
        </div>

        <div className="card p-8 shadow-xl">
          {step === 'phone' ? (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone size={24} className="text-brand-600" />
                </div>
                <h1 className="text-2xl font-bold font-heading">Sign In / Sign Up</h1>
                <p className="text-gray-500 text-sm mt-2">Enter your mobile number to get started</p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
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

              <p className="text-center text-xs text-gray-400 mt-4">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="text-brand-600">Terms of Service</Link> and{' '}
                <Link href="/privacy" className="text-brand-600">Privacy Policy</Link>
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center mb-6">
                <button onClick={() => setStep('phone')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-xl font-bold font-heading">Verify OTP</h1>
                  <p className="text-sm text-gray-500">Sent to +91 {phone}</p>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">6-Digit OTP</label>
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
                      onClick={() => { setStep('phone'); handleSendOtp({ preventDefault: () => {} } as any); }}
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
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield size={12} className="text-green-500" />
            <span>Secured with 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}
