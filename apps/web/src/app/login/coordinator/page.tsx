'use client';
import { Users } from 'lucide-react';
import RoleLoginPage from '@/components/auth/RoleLoginPage';

export default function CoordinatorLoginPage() {
  return (
    <RoleLoginPage
      config={{
        role: 'coordinator',
        label: 'Coordinator',
        title: 'Coordinator Sign In',
        subtitle: 'Manage event timelines, tasks & vendor coordination',
        icon: Users,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        badgeBg: 'bg-indigo-100',
        badgeText: 'text-indigo-700',
        buttonGradient: 'from-indigo-500 to-blue-500',
        demoPhone: '9876543212',
        demoOtp: '123456',
        otherRoles: [
          { label: 'Couple Login', href: '/login/couple' },
          { label: 'Vendor Login', href: '/login/vendor' },
          { label: 'Admin Login', href: '/login/admin' },
        ],
      }}
    />
  );
}
