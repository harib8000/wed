'use client';
import { Suspense } from 'react';
import { GitCompareArrows } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ComparePageContent } from '@/components/compare/VendorCompare';

export default function ComparePage() {
  return (
    <div className="compare-page-shell min-h-screen bg-gray-50">
      <Navbar />
      <div className="compare-page-content pt-20 pb-12 px-4 sm:px-6">
        <div className="compare-print-hide mx-auto mb-6 max-w-6xl rounded-3xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <GitCompareArrows size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-600">Smart vendor comparison</p>
              <p className="text-sm text-gray-500">Compare price, trust, distance and response speed before you book.</p>
            </div>
          </div>
        </div>
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
