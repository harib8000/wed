'use client';
import { Heart } from 'lucide-react';
import RoleLoginPage from '@/components/auth/RoleLoginPage';

export default function CoupleLoginPage() {
  return (
    <RoleLoginPage
      config={{
        role: 'customer',
        label: 'Couple',
        title: 'Couple Sign In',
        subtitle: 'Plan your dream wedding with verified vendors',
        icon: Heart,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        badgeBg: 'bg-pink-100',
        badgeText: 'text-pink-700',
        buttonGradient: 'from-pink-500 to-rose-500',
        demoPhone: '9876543210',
        demoOtp: '123456',
        otherRoles: [
          { label: 'Vendor Login', href: '/login/vendor' },
          { label: 'Coordinator Login', href: '/login/coordinator' },
          { label: 'Admin Login', href: '/login/admin' },
        ],
      }}
    />
  );
}
