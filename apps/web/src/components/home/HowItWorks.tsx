'use client';

import { Search, Shield, Calendar, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

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

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.15, duration: 0.5, ease: 'easeOut' },
  }),
};

const headerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <span className="badge bg-brand-100 text-brand-700 mb-3">Simple Process</span>
          <h2 className="section-heading mb-4">How Wedding OS Works</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            From discovery to execution — your entire event journey in 4 simple steps. Works for weddings, dhoti ceremonies, saree functions &amp; all celebrations.
          </p>
        </motion.div>

        <div role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                role="listitem"
                className="relative"
                custom={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                <motion.div
                  className="card p-6 text-center h-full hover:shadow-md transition-shadow"
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <div className="flex items-center justify-center mb-4">
                    <motion.div
                      className={`w-16 h-16 ${step.bgColor} rounded-2xl flex items-center justify-center`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <Icon size={28} className={step.color} />
                    </motion.div>
                  </div>
                  <div className="text-3xl font-bold text-gray-200 mb-2 font-heading">{step.step}</div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                </motion.div>

                {/* Arrow between steps */}
                {index < STEPS.length - 1 && (
                  <motion.div
                    className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center"
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (index + 1) * 0.15 + 0.2 }}
                  >
                    <ArrowRight size={20} className="text-gray-300" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
