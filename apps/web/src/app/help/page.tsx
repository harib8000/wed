'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle, LifeBuoy, Mail, Phone, Search } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import toast from 'react-hot-toast';

const FAQS = {
  Booking: [
    {
      question: 'How do I place an enquiry with a vendor?',
      answer: 'Open the vendor profile, review packages, and send an enquiry or quick message with your event date, location, and guest count.',
    },
    {
      question: 'Can I book multiple vendors for the same event?',
      answer: 'Yes. Wedding OS is designed to help you shortlist and coordinate multiple vendors across venue, décor, photography, catering, and more.',
    },
    {
      question: 'What happens after a vendor confirms my booking?',
      answer: 'You will receive a booking confirmation, payment status updates, and a timeline of important next steps inside your account.',
    },
    {
      question: 'Can I change event details after booking?',
      answer: 'In many cases yes, but changes depend on the vendor’s availability and policy. Contact the vendor through the booking thread as early as possible.',
    },
    {
      question: 'How do I cancel a booking?',
      answer: 'Visit your booking details page and review the cancellation terms. Any refund eligibility will be shown before you submit the request.',
    },
  ],
  Payments: [
    {
      question: 'Is my payment secure on Wedding OS?',
      answer: 'Yes. Payments are processed through secure gateways, and escrow-style protections help keep milestones and releases transparent.',
    },
    {
      question: 'When is the vendor paid?',
      answer: 'Vendor payouts are scheduled according to the booking lifecycle, event completion, and any agreed payment milestones.',
    },
    {
      question: 'How do refunds work?',
      answer: 'Refund timelines depend on the vendor policy and payment status. If you are eligible, the refund request is initiated from your booking.',
    },
    {
      question: 'Can I pay the balance later?',
      answer: 'Yes, if the vendor package supports staged payments. Your booking page will show the remaining balance and due dates.',
    },
    {
      question: 'Why did my payment fail?',
      answer: 'This can happen because of bank interruptions, OTP issues, or card limits. You can retry safely or contact support for help.',
    },
  ],
  Vendors: [
    {
      question: 'How are vendors verified?',
      answer: 'We review identity, profile completeness, service details, and other trust signals before vendors receive verification status.',
    },
    {
      question: 'Can I compare vendors side by side?',
      answer: 'Yes. Use the compare experience on vendor listings to review pricing, ratings, response time, and package highlights.',
    },
    {
      question: 'What if a vendor does not respond?',
      answer: 'You can send a follow-up enquiry or contact support. We also surface response-rate indicators so you can shortlist faster responders.',
    },
    {
      question: 'Can I leave a review after my event?',
      answer: 'Absolutely. Once the booking is completed, you can share your rating, comments, and photos from the review flow.',
    },
    {
      question: 'Do vendors handle all event types?',
      answer: 'Many vendors support weddings, engagements, receptions, saree functions, housewarmings, and more. Filter by event type when browsing.',
    },
  ],
  Account: [
    {
      question: 'How do I update my profile information?',
      answer: 'Go to your profile page to edit contact details, event preferences, and planning information.',
    },
    {
      question: 'Can I reset my login phone number or email?',
      answer: 'For security reasons, account credential changes may require verification. Contact support for help updating primary login details.',
    },
    {
      question: 'How do notification preferences work?',
      answer: 'You can control booking, payment, and message alerts from your account settings depending on the channels enabled.',
    },
    {
      question: 'Can I delete my Wedding OS account?',
      answer: 'Yes. Reach out to support or use account settings to request deletion. We may ask you to resolve active bookings first.',
    },
    {
      question: 'Why am I seeing demo or fallback data?',
      answer: 'If some services are temporarily unavailable, parts of the experience may show placeholder information until the connection is restored.',
    },
  ],
} as const;

type Category = keyof typeof FAQS;

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('Booking');
  const [searchQuery, setSearchQuery] = useState('');
  const [openItem, setOpenItem] = useState<string>('Booking-0');

  const categories = Object.keys(FAQS) as Category[];

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const scoped = FAQS[selectedCategory].map((item, index) => ({ ...item, id: `${selectedCategory}-${index}` }));
    if (!query) return scoped;
    return scoped.filter((item) =>
      item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query)
    );
  }, [searchQuery, selectedCategory]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-16">
        <section className="bg-gradient-to-br from-gray-900 via-brand-800 to-purple-700 text-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="badge bg-white/15 text-white">Help Center</span>
              <h1 className="mt-4 font-heading text-4xl font-bold sm:text-5xl">How can we help you today?</h1>
              <p className="mt-4 text-lg text-white/85">
                Search frequently asked questions, explore support topics, and find the fastest way to get answers.
              </p>
            </div>
            <div className="mt-8 max-w-2xl rounded-3xl bg-white/10 p-3 backdrop-blur">
              <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-gray-700 shadow-lg">
                <Search size={18} className="text-brand-600" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search bookings, payments, reviews, account help..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setSelectedCategory(category);
                  setOpenItem(`${category}-0`);
                }}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${selectedCategory === category ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="card p-6">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-gray-900">{selectedCategory} FAQs</h2>
                  <p className="mt-1 text-sm text-gray-500">{filteredFaqs.length} answer{filteredFaqs.length === 1 ? '' : 's'} found</p>
                </div>
                <HelpCircle size={22} className="text-brand-600" />
              </div>

              <div className="mt-4 space-y-3">
                {filteredFaqs.length > 0 ? filteredFaqs.map((item) => {
                  const isOpen = openItem === item.id;
                  return (
                    <div key={item.id} className="rounded-2xl border border-gray-100 bg-white">
                      <button
                        type="button"
                        onClick={() => setOpenItem(isOpen ? '' : item.id)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      >
                        <span className="font-medium text-gray-900">{item.question}</span>
                        <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && <div className="px-5 pb-5 text-sm leading-6 text-gray-600">{item.answer}</div>}
                    </div>
                  );
                }) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                    No FAQs match your search. Try a different keyword or contact support below.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <div className="inline-flex rounded-2xl bg-brand-50 p-3 text-brand-700">
                  <LifeBuoy size={20} />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">Still need help?</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Our support team can guide you through bookings, payments, vendor questions, and account issues.
                </p>
                <div className="mt-5 space-y-3 text-sm text-gray-700">
                  <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3"><Mail size={16} className="text-brand-600" /> hello@weddingos.in</div>
                  <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3"><Phone size={16} className="text-brand-600" /> +91 40 4567 8900</div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/contact" className="btn-primary">Contact support</Link>
                  <button type="button" onClick={() => toast.success('A support callback request has been noted.')} className="btn-secondary">
                    Request callback
                  </button>
                </div>
              </div>

              <div className="card p-6 bg-gradient-to-br from-purple-600 to-brand-700 text-white">
                <p className="text-sm font-medium text-white/80">Pro tip</p>
                <h3 className="mt-2 text-xl font-semibold">Need faster answers?</h3>
                <p className="mt-3 text-sm leading-6 text-white/85">
                  Include your booking number, event date, and vendor name when contacting support so the team can assist you more quickly.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
