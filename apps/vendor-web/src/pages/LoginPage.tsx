import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Phone, ArrowLeft, Shield, Loader2 } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await axios.post('/api/auth/send-otp', { phone: `+91${phone}` });
      toast.success('OTP sent!');
      setStep('otp');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-otp', { phone: `+91${phone}`, otp });
      const { accessToken, refreshToken, user } = res.data.data;
      if (user.role !== 'vendor') { toast.error('This portal is for vendors only. Use the customer app.'); return; }
      setTokens(accessToken, refreshToken);
      setUser(user);
      toast.success('Welcome to Vendor OS! 🎉');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-2xl">W</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor OS</h1>
          <p className="text-gray-500 text-sm">Manage your wedding business</p>
        </div>

        <div className="card p-8 shadow-xl">
          {step === 'phone' ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <h2 className="text-xl font-bold text-center mb-1">Vendor Sign In</h2>
              <p className="text-gray-500 text-sm text-center mb-4">Enter your registered vendor mobile number</p>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <span className="absolute left-9 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+91</span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="9876543210" className="input-field pl-20" maxLength={10} required autoFocus />
              </div>
              <button type="submit" disabled={loading || phone.length < 10} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                Get OTP
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <button type="button" onClick={() => setStep('phone')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
                <ArrowLeft size={16} /> Back
              </button>
              <h2 className="text-xl font-bold">Enter OTP</h2>
              <p className="text-gray-500 text-sm">Sent to +91 {phone}</p>
              <input type="text" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="• • • • • •" className="input-field text-center text-xl tracking-[0.5em] font-bold" maxLength={6} required autoFocus />
              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                Verify & Enter
              </button>
            </form>
          )}
          <div className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-400">
            <Shield size={12} className="text-green-500" /> Secured · Wedding OS Vendor Portal
          </div>
        </div>
      </div>
    </div>
  );
}
