import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: May 2026</p>

          <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using the Wedding OS platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2. Description of Service</h2>
              <p>Wedding OS is a wedding planning and vendor booking platform that connects couples with verified wedding vendors. The Service includes vendor discovery, booking management, escrow-protected payments, and communication tools.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3. User Accounts</h2>
              <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4. Booking &amp; Payments</h2>
              <p>All payments are processed through our escrow system. A 30% advance is required to confirm a booking. The remaining balance is released to the vendor after successful completion of the event. Platform fees of 10% + applicable GST apply to all transactions.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5. Cancellation &amp; Refunds</h2>
              <p>Cancellations made more than 30 days before the event date are eligible for a full refund. Cancellations within 30 days are subject to the vendor&apos;s cancellation policy. Platform fees are non-refundable.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">6. Vendor Responsibilities</h2>
              <p>Vendors must provide accurate information about their services, pricing, and availability. Vendors are responsible for delivering services as described in the booking agreement.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">7. Limitation of Liability</h2>
              <p>Wedding OS acts as a platform connecting couples and vendors. We are not responsible for the quality of services provided by vendors. Our liability is limited to the platform fees collected.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8. Contact</h2>
              <p>For questions about these Terms, contact us at <span className="text-brand-600">legal@weddingos.in</span></p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
