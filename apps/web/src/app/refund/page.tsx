'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const sections = [
  { id: 'advance-payment', title: '1. Advance Payment Policy' },
  { id: 'full-refund', title: '2. Full Refund Conditions' },
  { id: 'partial-refund', title: '3. Partial Refund Policy' },
  { id: 'non-refundable', title: '4. Non-Refundable Situations' },
  { id: 'escrow', title: '5. Escrow Protection' },
  { id: 'dispute', title: '6. Dispute Resolution' },
  { id: 'processing', title: '7. Processing Time' },
  { id: 'contact', title: '8. Contact' },
];

export default function RefundPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund Policy</h1>
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
              <p className="text-base text-gray-700 mb-6">
                At WeddingOS, we understand that wedding plans can change. This Refund Policy outlines the conditions
                under which refunds are issued for bookings made through our platform. All bookings are protected by our
                escrow payment system, which ensures that funds are held securely until services are confirmed.
              </p>

              <details id="advance-payment" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  1. Advance Payment Policy
                </summary>
                <div className="mt-3 space-y-2">
                  <p>
                    When you confirm a booking on WeddingOS, an advance payment (typically 20–30% of the total quoted
                    amount) is collected and held in escrow. This amount is not transferred to the vendor until the
                    event is completed.
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Advance payments secure your booking date and vendor commitment.</li>
                    <li>The remaining balance is due as per the terms agreed with the vendor at the time of booking.</li>
                    <li>All payments are processed through Razorpay and are subject to payment gateway processing times.</li>
                  </ul>
                </div>
              </details>

              <details id="full-refund" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  2. Full Refund Conditions
                </summary>
                <div className="mt-3 space-y-2">
                  <p>You are eligible for a <strong>full refund</strong> of the advance payment if:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>You cancel the booking within <strong>48 hours</strong> of making the advance payment, provided the event date is more than 90 days away.</li>
                    <li>The vendor cancels the booking or fails to confirm services within the agreed timeframe.</li>
                    <li>The vendor fails to show up on the event day (no-show), subject to evidence submission.</li>
                    <li>The services provided are materially different from what was agreed (requires dispute resolution).</li>
                  </ul>
                </div>
              </details>

              <details id="partial-refund" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  3. Partial Refund Policy
                </summary>
                <div className="mt-3 space-y-2">
                  <p>
                    Partial refunds are determined based on how far in advance the cancellation is made and the vendor&apos;s
                    cancellation policy. Standard refund schedule:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse mt-2">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Cancellation Notice</th>
                          <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Refund Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td className="border border-gray-200 px-3 py-2">More than 90 days before event</td><td className="border border-gray-200 px-3 py-2 text-green-700 font-medium">100% of advance</td></tr>
                        <tr><td className="border border-gray-200 px-3 py-2">61–90 days before event</td><td className="border border-gray-200 px-3 py-2 text-green-700 font-medium">75% of advance</td></tr>
                        <tr><td className="border border-gray-200 px-3 py-2">31–60 days before event</td><td className="border border-gray-200 px-3 py-2 text-yellow-700 font-medium">50% of advance</td></tr>
                        <tr><td className="border border-gray-200 px-3 py-2">15–30 days before event</td><td className="border border-gray-200 px-3 py-2 text-orange-700 font-medium">25% of advance</td></tr>
                        <tr><td className="border border-gray-200 px-3 py-2">Less than 15 days before event</td><td className="border border-gray-200 px-3 py-2 text-red-700 font-medium">No refund</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * Individual vendor policies may vary. Always check the vendor&apos;s specific cancellation terms before booking.
                  </p>
                </div>
              </details>

              <details id="non-refundable" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  4. Non-Refundable Situations
                </summary>
                <div className="mt-3 space-y-2">
                  <p>The following are generally non-refundable:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Platform service fee (10% of total booking value + 18% GST) once a booking is confirmed.</li>
                    <li>Advance payments for cancellations made less than 15 days before the event.</li>
                    <li>Payments for services already partially or fully rendered.</li>
                    <li>Bookings cancelled due to violation of WeddingOS Terms of Service.</li>
                  </ul>
                </div>
              </details>

              <details id="escrow" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  5. Escrow Protection
                </summary>
                <div className="mt-3 space-y-2">
                  <p>
                    WeddingOS uses an escrow payment model to protect both couples and vendors. Here&apos;s how it works:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>You make an advance payment that is held securely by WeddingOS — not transferred to the vendor.</li>
                    <li>Funds are released to the vendor only after your wedding event is successfully completed.</li>
                    <li>If a dispute is raised within 72 hours of the event, the funds remain held until the dispute is resolved.</li>
                    <li>This protects you if a vendor doesn&apos;t deliver as promised.</li>
                  </ol>
                </div>
              </details>

              <details id="dispute" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  6. Dispute Resolution
                </summary>
                <div className="mt-3 space-y-2">
                  <p>
                    If you are dissatisfied with the services received or believe a vendor has not fulfilled their obligations:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Raise a dispute within <strong>72 hours</strong> of the event via your Booking Detail page.</li>
                    <li>Submit evidence (photos, videos, communications) to support your claim.</li>
                    <li>Our dispute resolution team will review the case within 5 business days.</li>
                    <li>Both parties will be given an opportunity to present their case.</li>
                    <li>WeddingOS&apos;s decision on refund allocation is final and binding.</li>
                  </ol>
                </div>
              </details>

              <details id="processing" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  7. Processing Time
                </summary>
                <div className="mt-3 space-y-2">
                  <p>Once a refund is approved:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Refunds are initiated within <strong>3 business days</strong> of approval.</li>
                    <li>Credit/Debit card refunds take <strong>5–7 business days</strong> to reflect in your account.</li>
                    <li>UPI refunds are processed within <strong>1–3 business days</strong>.</li>
                    <li>Net banking refunds take <strong>3–5 business days</strong>.</li>
                    <li>You will receive an email and SMS notification once the refund is initiated.</li>
                  </ul>
                </div>
              </details>

              <details id="contact" open>
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer select-none py-2 marker:text-brand-500">
                  8. Contact
                </summary>
                <div className="mt-3 space-y-2">
                  <p>For refund-related queries, please reach out to us:</p>
                  <ul className="list-none space-y-1">
                    <li>📧 Email: <span className="text-brand-600">refunds@weddingos.in</span></li>
                    <li>📞 Phone: <span className="text-brand-600">+91-1800-XXX-XXXX</span> (Mon–Sat, 10am–6pm IST)</li>
                    <li>💬 Live Chat: Available via the Help Center in your dashboard</li>
                  </ul>
                  <p className="mt-2">
                    Please have your <strong>Booking Number</strong> (format: WB-XXXXX) ready when contacting support.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
