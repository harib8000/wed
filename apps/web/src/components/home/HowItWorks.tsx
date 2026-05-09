import { Search, Shield, Calendar, CheckCircle, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: Search,
    title: 'Discover & Browse',
    description: 'Search verified vendors by category, city, budget and ratings. View real portfolios and authentic reviews.',
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
  },
  {
    step: '02',
    icon: Calendar,
    title: 'Enquire & Book',
    description: 'Send enquiries, get custom quotes, negotiation is done through platform. Confirm booking in one click.',
    color: 'text-gold-600',
    bgColor: 'bg-gold-50',
  },
  {
    step: '03',
    icon: Shield,
    title: 'Pay with Escrow',
    description: 'Advance payment held safely in escrow. Released to vendor only after successful event completion.',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    step: '04',
    icon: CheckCircle,
    title: 'Wedding Day',
    description: 'Real-time coordination dashboard. All vendors check in, tasks tracked live, issues resolved instantly.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="badge bg-brand-100 text-brand-700 mb-3">Simple Process</span>
          <h2 className="section-heading mb-4">How Wedding OS Works</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            From discovery to execution — your entire wedding journey in 4 simple steps.
          </p>
        </div>

        <div role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.step} role="listitem" className="relative">
                <div className="card p-6 text-center h-full hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-center mb-4">
                    <div className={`w-16 h-16 ${step.bgColor} rounded-2xl flex items-center justify-center`}>
                      <Icon size={28} className={step.color} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-200 mb-2 font-heading">{step.step}</div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                </div>

                {/* Arrow between steps */}
                {index < STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center">
                    <ArrowRight size={20} className="text-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
