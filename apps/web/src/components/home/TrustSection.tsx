import { Shield, Star, Lock, Clock, HeadphonesIcon, Award } from 'lucide-react';

const TRUST_FEATURES = [
  { icon: Shield, title: 'Escrow Protection', desc: 'Your advance is held safely. Released to vendor only when you confirm service delivery.', color: 'text-green-600 bg-green-50' },
  { icon: Star, title: 'Verified Reviews', desc: 'All reviews are from real verified bookings. No fake reviews allowed.', color: 'text-gold-600 bg-gold-50' },
  { icon: Lock, title: 'Secure Payments', desc: 'Razorpay-powered payments with bank-grade 256-bit encryption.', color: 'text-blue-600 bg-blue-50' },
  { icon: Clock, title: 'Real-time Support', desc: '24/7 customer support via chat, call, or WhatsApp during your wedding.', color: 'text-purple-600 bg-purple-50' },
  { icon: Award, title: 'KYC Verified Vendors', desc: 'Every vendor is KYC verified with valid business registration and credentials.', color: 'text-brand-600 bg-brand-50' },
  { icon: HeadphonesIcon, title: 'Dispute Resolution', desc: 'Dedicated dispute team resolves any issues within 48 hours.', color: 'text-red-600 bg-red-50' },
];

export function TrustSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-brand-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="badge bg-green-100 text-green-700 mb-3">Why Trust Us</span>
          <h2 className="section-heading mb-4">Built on Trust & Safety</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Every feature in Wedding OS is designed to protect couples and ensure vendor accountability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRUST_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="card p-6 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '50,000+', label: 'Weddings Planned' },
            { value: '₹500 Cr+', label: 'Bookings Processed' },
            { value: '10,000+', label: 'Verified Vendors' },
            { value: '4.9/5', label: 'Average Rating' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold font-heading text-brand-600 mb-1">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
