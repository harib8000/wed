'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, MapPin, Users, Wallet, ArrowRight, ArrowLeft, Sparkles, Check, Heart, PartyPopper, LocateFixed } from 'lucide-react';
import { detectNearestCity, INDIAN_CITIES, setSelectedCity } from '@/components/location/LocationSelector';

const STORAGE_KEY = 'wedding_os_onboarding_complete';
const PREFS_KEY = 'wedding_os_user_prefs';

export interface UserPreferences {
  role: string;
  weddingDate: string;
  city: string;
  budget: string;
  guestCount: string;
  eventTypes: string[];
  vendorNeeds: string[];
  completedAt: string;
}

const CITIES = [...INDIAN_CITIES];

const ROLE_OPTIONS = [
  { label: 'Couple Getting Married', emoji: '💍', value: 'couple' },
  { label: 'Family/Parent', emoji: '👨‍👩‍👧‍👦', value: 'family' },
  { label: 'Wedding Planner', emoji: '📋', value: 'planner' },
  { label: 'Just Browsing', emoji: '👀', value: 'browsing' },
];

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
const VENDOR_NEEDS = [
  { label: 'Venue', icon: '🏛️', value: 'venue' },
  { label: 'Photographer', icon: '📸', value: 'photography' },
  { label: 'Caterer', icon: '🍽️', value: 'catering' },
  { label: 'Decorator', icon: '✨', value: 'decor' },
  { label: 'Makeup Artist', icon: '💄', value: 'makeup' },
  { label: 'DJ/Music', icon: '🎵', value: 'music' },
  { label: 'Videographer', icon: '🎥', value: 'videography' },
  { label: 'Mehendi Artist', icon: '🌿', value: 'mehendi' },
  { label: 'Wedding Car', icon: '🚘', value: 'transport' },
  { label: 'Invitations', icon: '💌', value: 'invitation' },
];

const STEPS = [
  { id: 'role', title: 'Your Role', icon: Users },
  { id: 'welcome', title: 'Welcome!', icon: Heart },
  { id: 'date', title: 'Event Date', icon: Calendar },
  { id: 'location', title: 'Location', icon: MapPin },
  { id: 'budget', title: 'Budget', icon: Wallet },
  { id: 'details', title: 'Details', icon: Users },
  { id: 'vendors', title: 'Vendor Needs', icon: Sparkles },
  { id: 'complete', title: 'All Set', icon: PartyPopper },
];

export function getStoredPreferences(): UserPreferences | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return {
      role: typeof parsed.role === 'string' ? parsed.role : '',
      weddingDate: typeof parsed.weddingDate === 'string' ? parsed.weddingDate : '',
      city: typeof parsed.city === 'string' ? parsed.city : '',
      budget: typeof parsed.budget === 'string' ? parsed.budget : '',
      guestCount: typeof parsed.guestCount === 'string' ? parsed.guestCount : '',
      eventTypes: Array.isArray(parsed.eventTypes) ? parsed.eventTypes : [],
      vendorNeeds: Array.isArray(parsed.vendorNeeds) ? parsed.vendorNeeds : [],
      completedAt: typeof parsed.completedAt === 'string' ? parsed.completedAt : '',
    };
  } catch {
    return null;
  }
}

export function WelcomeWizard() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [city, setCity] = useState('');
  const [budget, setBudget] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [vendorNeeds, setVendorNeeds] = useState<string[]>([]);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const toggleEventType = (type: string) => {
    setEventTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  const toggleVendorNeed = (vendor: string) => {
    setVendorNeeds((prev) =>
      prev.includes(vendor) ? prev.filter((item) => item !== vendor) : [...prev, vendor]
    );
  };

  const nextButtonLabel = useMemo(() => {
    if (step === 0) return 'Continue';
    if (step === 1) return "Let's Go";
    if (step === STEPS.length - 2) return 'See My Summary';
    return 'Next';
  }, [step]);

  const selectedBudget = BUDGETS.find((item) => item.value === budget)?.label || 'Not set';
  const selectedGuestCount = GUEST_COUNTS.find((item) => item.value === guestCount)?.label || 'Not set';
  const selectedRole = ROLE_OPTIONS.find((item) => item.value === role)?.label || 'Not set';
  const firstSelectedVendorCategory = VENDOR_NEEDS.find((item) => vendorNeeds.includes(item.label))?.value;

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    setLocationStatus('Detecting your location...');
    const detectedCity = await detectNearestCity();
    setDetectingLocation(false);

    if (!detectedCity) {
      setLocationStatus("We couldn't detect your location. Please choose a city manually.");
      return;
    }

    setCity(detectedCity);
    setLocationStatus(`Detected ${detectedCity}.`);
  };

  const handleComplete = () => {
    const prefs: UserPreferences = {
      role,
      weddingDate,
      city,
      budget,
      guestCount,
      eventTypes,
      vendorNeeds,
      completedAt: new Date().toISOString(),
    };

    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    localStorage.setItem(STORAGE_KEY, 'true');

    if (city) {
      setSelectedCity(city);
    }

    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (firstSelectedVendorCategory) params.set('category', firstSelectedVendorCategory);

    setShow(false);
    router.push(params.toString() ? `/vendors?${params.toString()}` : '/vendors');
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
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        >
          <div className="h-1.5 bg-gray-100">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-500 to-purple-500"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <div className="flex items-center gap-2">
              {STEPS.map((item, index) => (
                <div
                  key={item.id}
                  className={`h-2 w-2 rounded-full transition-colors ${index <= step ? 'bg-brand-600' : 'bg-gray-200'}`}
                />
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Skip onboarding"
            >
              Skip
            </button>
          </div>

          <div className="flex min-h-[460px] flex-col px-6 pb-6">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="role"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 py-6"
                >
                  <div className="mb-6 text-center">
                    <h2 className="font-heading text-2xl font-bold text-gray-900">What&apos;s your role?</h2>
                    <p className="mt-2 text-sm text-gray-500">We&apos;ll tailor your onboarding and recommendations around how you&apos;re planning.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ROLE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRole(option.value)}
                        className={`rounded-2xl border px-5 py-5 text-left transition-all ${
                          role === option.value
                            ? 'border-brand-600 bg-brand-50 shadow-sm'
                            : 'border-gray-200 hover:border-brand-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-3xl">{option.emoji}</div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="font-semibold text-gray-900">{option.label}</span>
                          {role === option.value && <Check size={18} className="text-brand-600" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-1 flex-col items-center justify-center py-6 text-center"
                >
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-purple-500 shadow-lg">
                    <Sparkles size={36} className="text-white" />
                  </div>
                  <h2 className="mb-2 font-heading text-2xl font-bold text-gray-900">Let&apos;s Plan Your Dream Wedding! 💍</h2>
                  <p className="max-w-sm text-gray-500">
                    Tell us a few things about your event so we can personalize your experience and find the best vendors for you.
                  </p>
                  <p className="mt-4 text-xs text-gray-400">Takes less than 1 minute</p>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="date"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 py-6"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
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
                    onChange={(event) => setWeddingDate(event.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="mt-2 text-xs text-gray-400">Not sure yet? You can always update this later.</p>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="city"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 py-6"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                      <MapPin size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Where is your wedding?</h3>
                      <p className="text-sm text-gray-500">We&apos;ll show you vendors available in your city</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    className="mb-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <LocateFixed size={16} />
                    {detectingLocation ? 'Detecting...' : 'Detect my location'}
                  </button>

                  {locationStatus && <p className="mb-4 text-sm text-brand-700">{locationStatus}</p>}

                  <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                    {CITIES.map((option) => (
                      <button
                        key={option}
                        onClick={() => setCity(option)}
                        className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                          city === option
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="budget"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 py-6"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                      <Wallet size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">What&apos;s your budget?</h3>
                      <p className="text-sm text-gray-500">We&apos;ll recommend vendors within your range</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {BUDGETS.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setBudget(item.value)}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
                          budget === item.value
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {item.label}
                        {budget === item.value && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 py-6"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                      <Users size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">A few more details</h3>
                      <p className="text-sm text-gray-500">Help us tailor recommendations for you</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">Guest count</label>
                    <div className="grid grid-cols-2 gap-2">
                      {GUEST_COUNTS.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setGuestCount(item.value)}
                          className={`rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                            guestCount === item.value
                              ? 'bg-brand-600 text-white shadow-sm'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">What events are you planning?</label>
                    <div className="flex flex-wrap gap-2">
                      {EVENT_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => toggleEventType(type)}
                          className={`rounded-full px-3 py-2 text-xs font-medium transition-all ${
                            eventTypes.includes(type)
                              ? 'bg-brand-600 text-white shadow-sm'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {eventTypes.includes(type) && <Check size={12} className="mr-1 inline" />}
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 6 && (
                <motion.div
                  key="vendors"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 py-6"
                >
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900">What vendors do you need?</h3>
                    <p className="mt-1 text-sm text-gray-500">Pick as many as you want and we&apos;ll surface the best matches first.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {VENDOR_NEEDS.map((item) => {
                      const selected = vendorNeeds.includes(item.label);
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => toggleVendorNeed(item.label)}
                          className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                            selected
                              ? 'border-brand-600 bg-brand-50 shadow-sm'
                              : 'border-gray-200 hover:border-brand-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-2xl">{item.icon}</div>
                              <div className="mt-2 font-semibold text-gray-900">{item.label}</div>
                            </div>
                            {selected && <Check size={18} className="text-brand-600" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {step === 7 && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="relative flex-1 overflow-hidden py-6"
                >
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {Array.from({ length: 18 }).map((_, index) => (
                      <span
                        key={index}
                        className="wizard-confetti"
                        style={{
                          left: `${(index * 11) % 100}%`,
                          animationDelay: `${(index % 6) * 0.25}s`,
                          animationDuration: `${3.2 + (index % 4) * 0.3}s`,
                          backgroundColor: ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'][index % 5],
                        }}
                      />
                    ))}
                  </div>

                  <div className="relative flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-white shadow-lg">
                      <PartyPopper size={38} />
                    </div>
                    <h2 className="font-heading text-3xl font-bold text-gray-900">🎉 You&apos;re all set!</h2>
                    <p className="mt-2 max-w-md text-gray-500">
                      Based on your preferences, we&apos;ve personalized your experience to help you discover the perfect vendors faster.
                    </p>

                    <div className="mt-6 grid w-full gap-3 rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-purple-50 p-5 text-left sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Role</p>
                        <p className="mt-1 text-sm font-medium text-gray-800">{selectedRole}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">City</p>
                        <p className="mt-1 text-sm font-medium text-gray-800">{city || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Budget</p>
                        <p className="mt-1 text-sm font-medium text-gray-800">{selectedBudget}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Guest Count</p>
                        <p className="mt-1 text-sm font-medium text-gray-800">{selectedGuestCount}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Event Types</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(eventTypes.length ? eventTypes : ['Still deciding']).map((type) => (
                            <span key={type} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Vendor Needs</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(vendorNeeds.length ? vendorNeeds : ['Browse all vendors']).map((item) => (
                            <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-auto flex items-center justify-between pt-4">
              {step > 0 ? (
                <button
                  onClick={() => setStep((value) => value - 1)}
                  className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              ) : (
                <div />
              )}

              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep((value) => value + 1)}
                  disabled={step === 0 && !role}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {nextButtonLabel} <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="btn-primary flex items-center gap-2 bg-gradient-to-r from-brand-600 to-purple-600 px-6 py-2.5 text-sm hover:from-brand-700 hover:to-purple-700"
                >
                  <Sparkles size={16} /> Explore Vendors
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
      <style jsx>{`
        .wizard-confetti {
          position: absolute;
          top: -10%;
          width: 10px;
          height: 18px;
          border-radius: 999px;
          opacity: 0.9;
          animation-name: confetti-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        @keyframes confetti-fall {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.95;
          }
          100% {
            transform: translate3d(0, 520px, 0) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </AnimatePresence>
  );
}
