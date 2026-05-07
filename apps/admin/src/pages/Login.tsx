import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import axios from 'axios';

export function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');

  async function onPhone(values: { phone: string }) {
    setLoading(true);
    try {
      await axios.post('/api/auth/send-otp', { phone: `+91${values.phone}` });
      setPhone(values.phone);
      setStep('otp');
      message.success('OTP sent!');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  }

  async function onOtp(values: { otp: string }) {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-otp', { phone: `+91${phone}`, otp: values.otp });
      const { accessToken, user } = res.data.data;
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        message.error('Admin access required');
        return;
      }
      Cookies.set('admin_token', accessToken, { expires: 1, sameSite: 'lax' });
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fdf4ff, #ede9fe)' }}>
      <Card style={{ width: 380, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #c026d3, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>W</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>Wedding OS Admin</div>
          <div style={{ color: '#6b7280', fontSize: 13 }}>Internal Operations Panel</div>
        </div>

        {step === 'phone' ? (
          <Form onFinish={onPhone} layout="vertical">
            <Form.Item name="phone" label="Admin Phone" rules={[{ required: true, len: 10, message: 'Enter 10-digit number' }]}>
              <Input prefix={<><UserOutlined /><span style={{ marginLeft: 4, color: '#6b7280' }}>+91</span></>} placeholder="9876543210" maxLength={10} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>Get OTP</Button>
            </Form.Item>
          </Form>
        ) : (
          <Form onFinish={onOtp} layout="vertical">
            <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>OTP sent to +91 {phone}</div>
            <Form.Item name="otp" label="6-Digit OTP" rules={[{ required: true, len: 6, message: 'Enter 6-digit OTP' }]}>
              <Input prefix={<LockOutlined />} placeholder="• • • • • •" maxLength={6} style={{ textAlign: 'center', letterSpacing: '0.4em', fontSize: 18 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>Verify & Enter Admin</Button>
            </Form.Item>
            <Button type="link" block onClick={() => setStep('phone')}>← Change Number</Button>
          </Form>
        )}
      </Card>
    </div>
  );
}
