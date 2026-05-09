'use client';
import { Store } from 'lucide-react';
import RoleLoginPage from '@/components/auth/RoleLoginPage';

export default function VendorLoginPage() {
  return (
    <RoleLoginPage
      config={{
        role: 'vendor',
        label: 'Vendor',
        title: 'Vendor Sign In',
        subtitle: 'Manage your wedding services & grow your business',
        icon: Store,
        color: 'text-brand-600',
        bgColor: 'bg-brand-50',
        badgeBg: 'bg-brand-100',
        badgeText: 'text-brand-700',
        buttonGradient: 'from-brand-500 to-purple-500',
        demoPhone: '9876543211',
        demoOtp: '123456',
        otherRoles: [
          { label: 'Couple Login', href: '/login/couple' },
          { label: 'Coordinator Login', href: '/login/coordinator' },
          { label: 'Admin Login', href: '/login/admin' },
        ],
      }}
    />
  );
}
