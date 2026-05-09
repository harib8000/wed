'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'description', title: '2. Description of Service' },
  { id: 'user-accounts', title: '3. User Accounts' },
  { id: 'booking-payments', title: '4. Booking & Payments' },
  { id: 'cancellation-refunds', title: '5. Cancellation & Refunds' },
  { id: 'vendor-responsibilities', title: '6. Vendor Responsibilities' },
  { id: 'limitation-liability', title: '7. Limitation of Liability' },
  { id: 'contact', title: '8. Contact' },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
              <p className="text-sm font-medium text-brand-600 bg-brand-50 inline-block px-3 py-1 rounded-full">
                Last Updated: May 2026
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors print:hidden"
            >
              🖨️ Print this page
            </button>
          </div>

          <div className="flex gap-10">
            {/* Sticky sidebar TOC — desktop only */}
            <aside className="hidden lg:block w-56 shrink-0 print:hidden">
              <nav className="sticky top-24 space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">On this page</p>
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-sm text-gray-500 hover:text-brand-600 hover:bg-brand-50 px-2 py-1.5 rounded transition-colors"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 max-w-3xl prose prose-gray text-sm text-gray-600 leading-relaxed space-y-4">
              <details id="acceptance" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  1. Acceptance of Terms
                </summary>
                <p className="mt-3">By accessing or using the Wedding OS platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
              </details>

              <details id="description" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  2. Description of Service
                </summary>
                <p className="mt-3">Wedding OS is a wedding planning and vendor booking platform that connects couples with verified wedding vendors. The Service includes vendor discovery, booking management, escrow-protected payments, and communication tools.</p>
              </details>

              <details id="user-accounts" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  3. User Accounts
                </summary>
                <p className="mt-3">You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
              </details>

              <details id="booking-payments" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  4. Booking &amp; Payments
                </summary>
                <p className="mt-3">All payments are processed through our escrow system. A 30% advance is required to confirm a booking. The remaining balance is released to the vendor after successful completion of the event. Platform fees of 10% + applicable GST apply to all transactions.</p>
              </details>

              <details id="cancellation-refunds" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  5. Cancellation &amp; Refunds
                </summary>
                <p className="mt-3">Cancellations made more than 30 days before the event date are eligible for a full refund. Cancellations within 30 days are subject to the vendor&apos;s cancellation policy. Platform fees are non-refundable.</p>
              </details>

              <details id="vendor-responsibilities" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  6. Vendor Responsibilities
                </summary>
                <p className="mt-3">Vendors must provide accurate information about their services, pricing, and availability. Vendors are responsible for delivering services as described in the booking agreement.</p>
              </details>

              <details id="limitation-liability" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  7. Limitation of Liability
                </summary>
                <p className="mt-3">Wedding OS acts as a platform connecting couples and vendors. We are not responsible for the quality of services provided by vendors. Our liability is limited to the platform fees collected.</p>
              </details>

              <details id="contact" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  8. Contact
                </summary>
                <p className="mt-3">For questions about these Terms, contact us at <span className="text-brand-600">legal@weddingos.in</span></p>
              </details>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
