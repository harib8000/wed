'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronRight, Target, Calendar, MapPin, ArrowRight, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { getStoredPreferences } from '@/components/onboarding/WelcomeWizard';

interface NextStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  priority: 'urgent' | 'important' | 'optional';
  completed: boolean;
}

function getSmartNextSteps(daysToGo: number, bookingCount: number): NextStep[] {
  const steps: NextStep[] = [];
  const prefs = getStoredPreferences();

  // Always start with venue if no bookings
  if (bookingCount === 0) {
    steps.push({
      id: 'book-venue',
      title: 'Book Your Venue First',
      description: 'The venue sets the tone for everything else. Start here!',
      icon: Target,
      href: '/vendors?category=venue',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      priority: 'urgent',
      completed: false,
    });
  }

  // Date-based recommendations
  if (daysToGo > 180) {
    steps.push({
      id: 'explore-vendors',
      title: 'Explore & Shortlist Vendors',
      description: 'You have time! Browse, compare, and save your favorites.',
      icon: Sparkles,
      href: '/vendors',
      color: 'bg-brand-50 text-brand-600 border-brand-200',
      priority: 'important',
      completed: false,
    });
  } else if (daysToGo > 90) {
    steps.push({
      id: 'book-photo',
      title: 'Book Photography & Catering',
      description: 'These get booked fast! Secure your top picks now.',
      icon: Calendar,
      href: '/vendors?category=photography',
      color: 'bg-pink-50 text-pink-600 border-pink-200',
      priority: 'urgent',
      completed: false,
    });
  } else if (daysToGo > 30) {
    steps.push({
      id: 'book-remaining',
      title: 'Finalize Remaining Vendors',
      description: 'Book decor, makeup, music and other services now.',
      icon: TrendingUp,
      href: '/vendors',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      priority: 'urgent',
      completed: false,
    });
  }

  // Checklist reminder
  steps.push({
    id: 'checklist',
    title: 'Review Your Checklist',
    description: 'Stay on track with your wedding planning tasks.',
    icon: CheckCircle2,
    href: '/dashboard/checklist',
    color: 'bg-green-50 text-green-600 border-green-200',
    priority: 'optional',
    completed: false,
  });

  // City-based if prefs exist
  if (prefs?.city) {
    steps.push({
      id: 'local-vendors',
      title: `Top Vendors in ${prefs.city}`,
      description: `See the highest-rated vendors available in ${prefs.city}.`,
      icon: MapPin,
      href: `/vendors?city=${encodeURIComponent(prefs.city)}`,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      priority: 'optional',
      completed: false,
    });
  }

  return steps.slice(0, 3);
}

export function SmartNextSteps({ daysToGo, bookingCount }: { daysToGo: number; bookingCount: number }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const steps = useMemo(() => getSmartNextSteps(daysToGo, bookingCount), [daysToGo, bookingCount]);

  const visibleSteps = steps.filter((s) => !dismissed.includes(s.id));

  if (visibleSteps.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={20} className="text-amber-500" />
        <h2 className="text-lg font-bold font-heading text-gray-900">Suggested Next Steps</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visibleSteps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={step.href}
                className={`block p-4 rounded-2xl border-2 ${step.color} hover:shadow-md transition-all hover:-translate-y-0.5 group`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-gray-900">{step.title}</h3>
                      {step.priority === 'urgent' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-bold uppercase">
                          Priority
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{step.description}</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
