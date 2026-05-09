'use client';
import { Crown } from 'lucide-react';
import RoleLoginPage from '@/components/auth/RoleLoginPage';

export default function AdminLoginPage() {
  return (
    <RoleLoginPage
      config={{
        role: 'admin',
        label: 'Admin',
        title: 'Admin Sign In',
        subtitle: 'Platform administration, vendor verification & disputes',
        icon: Crown,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-700',
        buttonGradient: 'from-amber-500 to-orange-500',
        demoPhone: '9876543213',
        demoOtp: '123456',
        otherRoles: [
          { label: 'Couple Login', href: '/login/couple' },
          { label: 'Vendor Login', href: '/login/vendor' },
          { label: 'Coordinator Login', href: '/login/coordinator' },
        ],
      }}
    />
  );
}
