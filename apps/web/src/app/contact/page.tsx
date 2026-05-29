'use client';

import { useForm } from 'react-hook-form';
import { Building2, Clock3, Headphones, Mail, MapPin, MessageCircleMore, Phone } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import toast from 'react-hot-toast';

type ContactFormValues = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const CONTACT_CARDS = [
  {
    title: 'Email us',
    value: 'hello@weddingos.in',
    description: 'General questions, partnerships, and product feedback.',
    icon: Mail,
    accent: 'bg-brand-50 text-brand-700',
  },
  {
    title: 'Call support',
    value: '+91 40 4567 8900',
    description: 'Mon-Sat for bookings, vendor support, and payment help.',
    icon: Phone,
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    title: 'Visit our office',
    value: 'Madhapur, Hyderabad',
    description: '4th Floor, Jubilee Square, HITEC City, Telangana 500081.',
    icon: MapPin,
    accent: 'bg-purple-50 text-purple-700',
  },
];

const BUSINESS_HOURS = [
  { day: 'Monday - Friday', hours: '9:00 AM - 7:00 PM' },
  { day: 'Saturday', hours: '10:00 AM - 5:00 PM' },
  { day: 'Sunday', hours: 'Emergency support only' },
];

const FAQS = [
  {
    question: 'How quickly will the support team respond?',
    answer: 'Most email and form enquiries receive a response within 4 business hours. Urgent booking and payment issues are prioritised faster.',
  },
  {
    question: 'Can vendors request onboarding help?',
    answer: 'Yes. Our vendor success team can guide profile setup, plan upgrades, payout information, and best practices for lead conversion.',
  },
  {
    question: 'Do you offer phone support for active bookings?',
    answer: 'Absolutely. Active booking concerns can be escalated by phone during business hours, and critical event-day issues are triaged immediately.',
  },
  {
    question: 'Where can I report a payment or refund issue?',
    answer: 'Choose “Payments & Refunds” in the subject dropdown so your request reaches the right operations team faster.',
  },
];

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: 'General Inquiry',
      message: '',
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    toast.success(`Thanks ${values.name.split(' ')[0] || 'there'}! Our team will reach out shortly.`);
    reset();
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-16">
        <section className="bg-gradient-to-br from-brand-700 via-purple-700 to-gray-900 text-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="badge bg-white/15 text-white">Contact Wedding OS</span>
              <h1 className="mt-4 font-heading text-4xl font-bold sm:text-5xl">We&apos;re here to help with every step of the celebration.</h1>
              <p className="mt-4 text-lg text-white/85">
                Reach our support, operations, or partnerships team for help with bookings, vendors, payments, or anything else on your mind.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="card p-8">
              <div className="mb-6">
                <h2 className="font-heading text-2xl font-bold text-gray-900">Send us a message</h2>
                <p className="mt-2 text-sm text-gray-500">Tell us what you need and we&apos;ll route it to the right team.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                    <input
                      {...register('name', { required: 'Please enter your name.' })}
                      className="input-field"
                      placeholder="Your full name"
                    />
                    {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      {...register('email', {
                        required: 'Please enter your email address.',
                        pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address.' },
                      })}
                      className="input-field"
                      placeholder="you@example.com"
                    />
                    {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      {...register('phone', {
                        required: 'Please enter your phone number.',
                        minLength: { value: 10, message: 'Enter a valid phone number.' },
                      })}
                      className="input-field"
                      placeholder="+91 98765 43210"
                    />
                    {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                    <select {...register('subject', { required: true })} className="input-field">
                      <option>General Inquiry</option>
                      <option>Bookings & Coordination</option>
                      <option>Payments & Refunds</option>
                      <option>Vendor Partnerships</option>
                      <option>Technical Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    {...register('message', {
                      required: 'Please share a few details.',
                      minLength: { value: 20, message: 'Please provide at least 20 characters.' },
                    })}
                    className="input-field min-h-40 resize-none"
                    placeholder="Tell us about your event, booking, or question..."
                  />
                  {errors.message && <p className="mt-1 text-xs text-rose-600">{errors.message.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              {CONTACT_CARDS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="card p-6">
                    <div className={`inline-flex rounded-2xl p-3 ${item.accent}`}>
                      <Icon size={20} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-2 font-medium text-gray-800">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-500">{item.description}</p>
                  </div>
                );
              })}

              <div className="card p-6">
                <div className="flex items-center gap-3 text-gray-900">
                  <Clock3 size={18} className="text-brand-600" />
                  <h3 className="text-lg font-semibold">Business hours</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {BUSINESS_HOURS.map((item) => (
                    <div key={item.day} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-sm">
                      <span className="font-medium text-gray-700">{item.day}</span>
                      <span className="text-gray-500">{item.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
            <div className="card bg-gradient-to-br from-brand-600 to-purple-600 p-8 text-white">
              <div className="rounded-2xl bg-white/15 p-3 inline-flex">
                <Headphones size={22} />
              </div>
              <h2 className="mt-5 font-heading text-2xl font-bold">Need urgent support?</h2>
              <p className="mt-3 text-sm leading-6 text-white/85">
                For active events, payment escalations, or vendor-side emergencies, call us directly so our operations team can assist faster.
              </p>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-3"><Phone size={16} /> +91 40 4567 8900</div>
                <div className="flex items-center gap-3"><MessageCircleMore size={16} /> WhatsApp support available for active bookings</div>
                <div className="flex items-center gap-3"><Building2 size={16} /> Dedicated help for couples, planners, and vendors</div>
              </div>
            </div>

            <div className="card p-8">
              <h2 className="font-heading text-2xl font-bold text-gray-900">Frequently asked questions</h2>
              <div className="mt-6 space-y-4">
                {FAQS.map((faq) => (
                  <div key={faq.question} className="rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
