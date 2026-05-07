import Link from 'next/link';
import { ArrowRight, Smartphone, Globe } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-brand-600 to-purple-700 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1920&q=80')] bg-cover bg-center opacity-10" />
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/5 translate-y-24 -translate-x-24" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-heading text-3xl sm:text-5xl font-bold text-white mb-6">
          Start Planning Your
          <span className="block text-gold-300">Dream Wedding Today</span>
        </h2>
        <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
          Join 50,000+ couples who trusted Wedding OS for the most important day of their lives. It&apos;s free to get started.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/login" className="bg-white text-brand-700 font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 justify-center">
            <Globe size={20} />
            Start Planning — Free
            <ArrowRight size={18} />
          </Link>
          <Link href="/vendors" className="bg-white/10 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 justify-center">
            <Smartphone size={20} />
            Browse Vendors
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-white/60 text-sm">
          <span>✓ No credit card required</span>
          <span>✓ Free for couples</span>
          <span>✓ 10,000+ verified vendors</span>
          <span>✓ Escrow protection included</span>
        </div>

        {/* Vendor CTA */}
        <div className="mt-12 pt-10 border-t border-white/20">
          <p className="text-white/70 text-sm mb-3">Are you a wedding vendor?</p>
          <Link href="/vendor/register" className="text-white font-medium hover:text-gold-300 transition-colors">
            Join as a Vendor — Grow your business →
          </Link>
        </div>
      </div>
    </section>
  );
}
