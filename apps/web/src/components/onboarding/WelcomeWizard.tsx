'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Wallet, ArrowRight, ArrowLeft, Sparkles, Check, Heart } from 'lucide-react';

const STORAGE_KEY = 'wedding_os_onboarding_complete';
const PREFS_KEY = 'wedding_os_user_prefs';

export interface UserPreferences {
  weddingDate: string;
  city: string;
  budget: string;
  guestCount: string;
  eventTypes: string[];
  completedAt: string;
}

const CITIES = ['Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Ahmedabad'];
const BUDGETS = [
  { label: 'Under ₹5L', value: 'under_5l' },
  { label: '₹5L – ₹10L', value: '5l_10l' },
  { label: '₹10L – ₹25L', value: '10l_25l' },
  { label: '₹25L – ₹50L', value: '25l_50l' },
  { label: '₹50L+', value: 'above_50l' },
];
const GUEST_COUNTS = [
  { label: 'Intimate (< 100)', value: 'under_100' },
  { label: 'Medium (100–300)', value: '100_300' },
  { label: 'Grand (300–500)', value: '300_500' },
  { label: 'Royal (500+)', value: 'above_500' },
];
const EVENT_TYPES = ['Wedding', 'Engagement', 'Haldi', 'Mehendi', 'Sangeet', 'Reception', 'Pre-Wedding Shoot'];

const STEPS = [
  { id: 'welcome', title: 'Welcome!', icon: Heart },
  { id: 'date', title: 'Event Date', icon: Calendar },
  { id: 'location', title: 'Location', icon: MapPin },
  { id: 'budget', title: 'Budget', icon: Wallet },
  { id: 'details', title: 'Details', icon: Users },
];

export function getStoredPreferences(): UserPreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function WelcomeWizard() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [weddingDate, setWeddingDate] = useState('');
  const [city, setCity] = useState('');
  const [budget, setBudget] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [eventTypes, setEventTypes] = useState<string[]>([]);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const toggleEventType = (type: string) => {
    setEventTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleComplete = () => {
    const prefs: UserPreferences = {
      weddingDate,
      city,
      budget,
      guestCount,
      eventTypes,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="h-1.5 bg-gray-100">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-500 to-purple-500"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div
                  key={s.id}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i <= step ? 'bg-brand-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Skip onboarding"
            >
              Skip
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 min-h-[340px] flex flex-col">
            <AnimatePresence mode="wait">
              {/* Step 0: Welcome */}
              {step === 0 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col items-center justify-center text-center py-6"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-purple-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                    <Sparkles size={36} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading">
                    Let&apos;s Plan Your Dream Wedding! 💍
                  </h2>
                  <p className="text-gray-500 max-w-sm">
                    Tell us a few things about your event so we can personalize your experience and find the best vendors for you.
                  </p>
                  <p className="text-xs text-gray-400 mt-4">Takes less than 1 minute</p>
                </motion.div>
              )}

              {/* Step 1: Date */}
              {step === 1 && (
                <motion.div
                  key="date"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 py-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                      <Calendar size={20} className="text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">When is your wedding?</h3>
                      <p className="text-sm text-gray-500">We&apos;ll create a timeline and remind you of key milestones</p>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-400 mt-2">Not sure yet? You can always update this later.</p>
                </motion.div>
              )}

              {/* Step 2: City */}
              {step === 2 && (
                <motion.div
                  key="city"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 py-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <MapPin size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Where is your wedding?</h3>
                      <p className="text-sm text-gray-500">We&apos;ll show you vendors available in your city</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {CITIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCity(c)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          city === c
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Budget */}
              {step === 3 && (
                <motion.div
                  key="budget"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 py-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                      <Wallet size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">What&apos;s your budget?</h3>
                      <p className="text-sm text-gray-500">We&apos;ll recommend vendors within your range</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {BUDGETS.map((b) => (
                      <button
                        key={b.value}
                        onClick={() => setBudget(b.value)}
                        className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-all flex items-center justify-between ${
                          budget === b.value
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {b.label}
                        {budget === b.value && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Guest count + Event types */}
              {step === 4 && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 py-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Users size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">A few more details</h3>
                      <p className="text-sm text-gray-500">Help us tailor recommendations for you</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Guest count</label>
                    <div className="grid grid-cols-2 gap-2">
                      {GUEST_COUNTS.map((g) => (
                        <button
                          key={g.value}
                          onClick={() => setGuestCount(g.value)}
                          className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                            guestCount === g.value
                              ? 'bg-brand-600 text-white shadow-sm'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">What events are you planning?</label>
                    <div className="flex flex-wrap gap-2">
                      {EVENT_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => toggleEventType(type)}
                          className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${
                            eventTypes.includes(type)
                              ? 'bg-brand-600 text-white shadow-sm'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {eventTypes.includes(type) && <Check size={12} className="inline mr-1" />}
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-auto pt-4">
              {step > 0 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              ) : (
                <div />
              )}

              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="btn-primary flex items-center gap-2 text-sm py-2.5 px-6"
                >
                  {step === 0 ? "Let's Go" : 'Next'} <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="btn-primary flex items-center gap-2 text-sm py-2.5 px-6 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700"
                >
                  <Sparkles size={16} /> Start Planning
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
