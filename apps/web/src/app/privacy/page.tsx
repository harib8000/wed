'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const sections = [
  { id: 'information-we-collect', title: '1. Information We Collect' },
  { id: 'how-we-use', title: '2. How We Use Your Information' },
  { id: 'information-sharing', title: '3. Information Sharing' },
  { id: 'data-security', title: '4. Data Security' },
  { id: 'your-rights', title: '5. Your Rights' },
  { id: 'cookies', title: '6. Cookies' },
  { id: 'contact', title: '7. Contact' },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
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
              <details id="information-we-collect" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  1. Information We Collect
                </summary>
                <p className="mt-3">We collect information you provide directly, including your name, phone number, email address, wedding date, city, and budget preferences. We also collect usage data, device information, and cookies.</p>
              </details>

              <details id="how-we-use" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  2. How We Use Your Information
                </summary>
                <p className="mt-3">We use your information to provide and improve the Service, process bookings and payments, communicate with you about your account and bookings, send relevant vendor recommendations, and comply with legal obligations.</p>
              </details>

              <details id="information-sharing" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  3. Information Sharing
                </summary>
                <p className="mt-3">We share your information with vendors you choose to contact or book, payment processors (Razorpay) for transaction processing, and service providers who assist in operating the platform. We do not sell your personal information to third parties.</p>
              </details>

              <details id="data-security" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  4. Data Security
                </summary>
                <p className="mt-3">We implement industry-standard security measures including encryption, secure servers, and regular security audits. Payment information is processed securely through Razorpay and is never stored on our servers.</p>
              </details>

              <details id="your-rights" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  5. Your Rights
                </summary>
                <p className="mt-3">You have the right to access, update, or delete your personal information. You can manage your profile settings or contact us to exercise these rights. You may also opt out of marketing communications at any time.</p>
              </details>

              <details id="cookies" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  6. Cookies
                </summary>
                <p className="mt-3">We use cookies and similar technologies to maintain your session, remember preferences, and analyze usage patterns. You can manage cookie preferences through your browser settings.</p>
              </details>

              <details id="contact" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  7. Contact
                </summary>
                <p className="mt-3">For privacy-related inquiries, contact our Data Protection Officer at <span className="text-brand-600">privacy@weddingos.in</span></p>
              </details>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
