import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 1, name: 'Priya & Rahul', city: 'Hyderabad', date: 'March 2026',
    rating: 5, avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    text: 'Wedding OS transformed our chaotic wedding planning into a smooth, enjoyable experience. Found all our vendors through the platform — photography, catering, venue — all under one roof. The escrow payment feature gave us so much peace of mind.',
    vendors: ['Royal Grand Palace', 'Srikanth Photography', 'Flavours Catering'],
  },
  {
    id: 2, name: 'Ananya & Vikram', city: 'Bangalore', date: 'January 2026',
    rating: 5, avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    text: 'The real-time coordination dashboard on our wedding day was incredible. We could see every vendor checking in, tasks being completed. When one vendor was late, the platform alerted us immediately and we resolved it in minutes.',
    vendors: ['Decor by Blooms', 'DJ Beats', 'Shika Makeup'],
  },
  {
    id: 3, name: 'Meera & Aditya', city: 'Mumbai', date: 'February 2026',
    rating: 5, avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    text: 'Booked 12 vendors through Wedding OS for our 3-day wedding. Every single vendor was professional, arrived on time, and delivered exactly what was promised. The milestone payment system kept everyone accountable.',
    vendors: ['5 Photographers', '3 Venues', '4 Service Vendors'],
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="badge bg-pink-100 text-pink-700 mb-3">Testimonials</span>
          <h2 className="section-heading mb-4">Couples Love Wedding OS</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Real stories from real couples who planned their dream wedding with us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.id} className="card p-6 hover:shadow-md transition-shadow relative">
              <Quote size={32} className="text-brand-100 absolute top-4 right-4" />
              <div className="flex items-center gap-3 mb-4">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.city} · {t.date}</div>
                </div>
              </div>

              <div className="flex mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} className="fill-gold-400 text-gold-400" />
                ))}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>

              <div className="border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-400">Vendors booked: </span>
                <span className="text-xs text-brand-600 font-medium">{t.vendors.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
