'use client';

import Link from 'next/link';
import { ArrowRight, HeartHandshake, Lightbulb, MapPinned, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const VALUES = [
  {
    title: 'Trust',
    description: 'Verified vendors, escrow-protected payments, and clear communication at every stage of the celebration.',
    icon: ShieldCheck,
    accent: 'bg-brand-50 text-brand-700',
  },
  {
    title: 'Transparency',
    description: 'Real pricing, response times, ratings, and expectations so families can make confident decisions.',
    icon: HeartHandshake,
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    title: 'Innovation',
    description: 'Modern planning tools, smart vendor discovery, and automation that reduce wedding planning stress.',
    icon: Lightbulb,
    accent: 'bg-amber-50 text-amber-700',
  },
  {
    title: 'Community',
    description: 'A growing ecosystem of couples, planners, and service partners building memorable events together.',
    icon: Users,
    accent: 'bg-purple-50 text-purple-700',
  },
];

const STATS = [
  { label: 'Verified vendors', value: '4,500+' },
  { label: 'Bookings coordinated', value: '18,000+' },
  { label: 'Cities covered', value: '42+' },
  { label: 'Average response time', value: '< 2 hrs' },
];

const STEPS = [
  {
    title: 'Discover verified vendors',
    description: 'Search by city, category, budget, and event type to shortlist the best-fit partners.',
  },
  {
    title: 'Compare with confidence',
    description: 'Review packages, ratings, response times, and real customer feedback before deciding.',
  },
  {
    title: 'Book securely',
    description: 'Use Wedding OS escrow workflows and milestone tracking to keep every booking protected.',
  },
  {
    title: 'Execute beautifully',
    description: 'Stay aligned on timelines, guest needs, and event-day coordination with fewer follow-ups.',
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-16">
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-purple-700 to-gray-900 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_35%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <span className="badge bg-white/15 text-white">About Wedding OS</span>
              <h1 className="mt-4 font-heading text-4xl font-bold leading-tight sm:text-5xl">
                We&apos;re building a calmer, smarter way to plan once-in-a-lifetime celebrations.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-white/85">
                Wedding OS brings vendor discovery, trusted payments, planning workflows, and customer support into one elegant platform for couples and event professionals across India.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/vendors" className="btn-primary bg-white text-brand-700 hover:bg-white/90">
                  Explore vendors
                </Link>
                <Link href="/contact" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20">
                  Contact our team
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="card p-6 text-center">
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="mt-2 text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <span className="badge bg-brand-50 text-brand-700">Our values</span>
            <h2 className="mt-4 font-heading text-3xl font-bold text-gray-900">What guides every decision we make</h2>
            <p className="mt-3 text-gray-600">
              From product design to support conversations, we focus on reducing uncertainty and helping families celebrate with confidence.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="card p-6">
                  <div className={`inline-flex rounded-2xl p-3 ${value.accent}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">{value.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr,1.1fr] lg:px-8">
            <div>
              <span className="badge bg-purple-50 text-purple-700">Our mission</span>
              <h2 className="mt-4 font-heading text-3xl font-bold text-gray-900">To make planning joyful, accountable, and beautifully organized.</h2>
              <p className="mt-4 text-gray-600 leading-7">
                We believe celebrations deserve the same level of clarity and operational excellence as any modern business workflow. That&apos;s why Wedding OS blends hospitality, trust, and technology into one unified experience for couples and vendors alike.
              </p>
              <div className="mt-6 rounded-3xl border border-gray-100 bg-gray-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Built for modern Indian celebrations</p>
                    <p className="mt-2 text-sm text-gray-600">
                      Weddings, engagements, saree functions, receptions, housewarmings, and milestone events all need nuanced coordination. Wedding OS is designed to support that complexity with warmth.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card p-6 sm:col-span-2">
                <div className="flex items-center gap-3 text-brand-700">
                  <MapPinned size={20} />
                  <span className="font-semibold">Local expertise, national reach</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Our ecosystem spans metro cities and fast-growing regional markets, helping families find trusted vendors wherever their event takes place.
                </p>
              </div>
              <div className="card p-6">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 inline-flex">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">Safer transactions</h3>
                <p className="mt-2 text-sm text-gray-600">Escrow-protected flows help reduce payment anxiety and keep expectations aligned.</p>
              </div>
              <div className="card p-6">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-700 inline-flex">
                  <HeartHandshake size={20} />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">Human support</h3>
                <p className="mt-2 text-sm text-gray-600">Real support teams step in when couples or vendors need help resolving issues quickly.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <span className="badge bg-brand-50 text-brand-700">How Wedding OS works</span>
            <h2 className="mt-4 font-heading text-3xl font-bold text-gray-900">A clearer path from discovery to celebration</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-900 text-sm font-bold text-white">
                  0{index + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="card overflow-hidden bg-gradient-to-r from-brand-600 to-purple-600 p-8 text-white shadow-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="font-heading text-3xl font-bold">Ready to plan with more confidence?</h2>
                <p className="mt-3 text-white/85">Find the right vendors, compare clearly, and coordinate every milestone from one place.</p>
              </div>
              <Link href="/vendors" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-white/90">
                Start exploring <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
