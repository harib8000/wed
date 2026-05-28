'use client';
import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ComparePageContent } from '@/components/compare/VendorCompare';

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-12 px-4 sm:px-6">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
          </div>
        }>
          <ComparePageContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
