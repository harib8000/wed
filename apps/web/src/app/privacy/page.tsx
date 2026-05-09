import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: May 2026</p>

          <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">1. Information We Collect</h2>
              <p>We collect information you provide directly, including your name, phone number, email address, wedding date, city, and budget preferences. We also collect usage data, device information, and cookies.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2. How We Use Your Information</h2>
              <p>We use your information to provide and improve the Service, process bookings and payments, communicate with you about your account and bookings, send relevant vendor recommendations, and comply with legal obligations.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3. Information Sharing</h2>
              <p>We share your information with vendors you choose to contact or book, payment processors (Razorpay) for transaction processing, and service providers who assist in operating the platform. We do not sell your personal information to third parties.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4. Data Security</h2>
              <p>We implement industry-standard security measures including encryption, secure servers, and regular security audits. Payment information is processed securely through Razorpay and is never stored on our servers.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5. Your Rights</h2>
              <p>You have the right to access, update, or delete your personal information. You can manage your profile settings or contact us to exercise these rights. You may also opt out of marketing communications at any time.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">6. Cookies</h2>
              <p>We use cookies and similar technologies to maintain your session, remember preferences, and analyze usage patterns. You can manage cookie preferences through your browser settings.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">7. Contact</h2>
              <p>For privacy-related inquiries, contact our Data Protection Officer at <span className="text-brand-600">privacy@weddingos.in</span></p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
