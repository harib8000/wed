'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Cookie, Settings2, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'weddingos_cookie_consent';

type ConsentMode = 'all' | 'essential_only' | 'custom';

type ConsentPreferences = {
  mode: ConsentMode;
  essential: true;
  analytics: boolean;
  personalization: boolean;
  marketing: boolean;
  updatedAt: string;
};

const DEFAULT_PREFERENCES: Omit<ConsentPreferences, 'mode' | 'updatedAt'> = {
  essential: true,
  analytics: false,
  personalization: false,
  marketing: false,
};

function buildConsent(mode: ConsentMode, overrides?: Partial<Omit<ConsentPreferences, 'mode' | 'updatedAt'>>) {
  return JSON.stringify({
    mode,
    ...DEFAULT_PREFERENCES,
    ...overrides,
    essential: true,
    updatedAt: new Date().toISOString(),
  } satisfies ConsentPreferences);
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [personalization, setPersonalization] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    try {
      const storedConsent = localStorage.getItem(STORAGE_KEY);
      if (!storedConsent) {
        setVisible(true);
        return;
      }

      const parsed = JSON.parse(storedConsent) as Partial<ConsentPreferences>;
      setAnalytics(Boolean(parsed.analytics));
      setPersonalization(Boolean(parsed.personalization));
      setMarketing(Boolean(parsed.marketing));
    } catch {
      setVisible(true);
    }
  }, []);

  const selectedCount = useMemo(
    () => [analytics, personalization, marketing].filter(Boolean).length,
    [analytics, personalization, marketing],
  );

  const persistConsent = (value: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      return;
    } finally {
      setVisible(false);
      setShowPreferences(false);
    }
  };

  const handleAcceptAll = () => {
    setAnalytics(true);
    setPersonalization(true);
    setMarketing(true);
    persistConsent(buildConsent('all', { analytics: true, personalization: true, marketing: true }));
  };

  const handleRejectNonEssential = () => {
    setAnalytics(false);
    setPersonalization(false);
    setMarketing(false);
    persistConsent(buildConsent('essential_only'));
  };

  const handleSavePreferences = () => {
    persistConsent(buildConsent('custom', { analytics, personalization, marketing }));
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-x-0 bottom-0 z-50 p-4 print:hidden"
        >
          <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-2xl shadow-brand-100/40">
            <div className="bg-gradient-to-r from-brand-50 via-white to-purple-50 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-2xl bg-brand-600 p-2.5 text-white shadow-sm">
                    <Cookie size={18} />
                  </div>
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-gray-900">Your privacy, your choice</h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
                        <ShieldCheck size={12} /> DPDP Act 2023 &amp; GDPR style controls
                      </span>
                    </div>
                    <p className="max-w-3xl text-sm leading-6 text-gray-600">
                      WeddingOS uses essential cookies to keep bookings secure and optional cookies to improve recommendations,
                      analytics, and personalised planning. Review your options any time in our{' '}
                      <Link href="/privacy" className="font-medium text-brand-600 underline-offset-2 hover:underline">
                        Privacy Policy
                      </Link>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                  <button onClick={handleAcceptAll} className="btn-primary px-5 py-2.5 text-sm">
                    Accept All
                  </button>
                  <button onClick={handleRejectNonEssential} className="btn-secondary px-5 py-2.5 text-sm">
                    Reject Non-essential
                  </button>
                  <button
                    onClick={() => setShowPreferences((current) => !current)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
                    aria-expanded={showPreferences}
                    aria-controls="cookie-preferences-panel"
                  >
                    <Settings2 size={15} />
                    Manage Preferences
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showPreferences && (
                <motion.div
                  id="cookie-preferences-panel"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="border-t border-gray-100"
                >
                  <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
                    <label className="card border-green-100 bg-green-50/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Essential</p>
                          <p className="mt-1 text-xs leading-5 text-gray-600">Required for sign-in, checkout, saved preferences, and fraud prevention.</p>
                        </div>
                        <input type="checkbox" checked disabled className="mt-1 h-4 w-4 accent-brand-600" aria-label="Essential cookies" />
                      </div>
                    </label>

                    <label className="card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Analytics</p>
                          <p className="mt-1 text-xs leading-5 text-gray-600">Helps us improve search, onboarding, and page performance.</p>
                        </div>
                        <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="mt-1 h-4 w-4 accent-brand-600" aria-label="Analytics cookies" />
                      </div>
                    </label>

                    <label className="card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Personalisation</p>
                          <p className="mt-1 text-xs leading-5 text-gray-600">Lets us remember cities, budget preferences, and relevant vendor suggestions.</p>
                        </div>
                        <input type="checkbox" checked={personalization} onChange={(event) => setPersonalization(event.target.checked)} className="mt-1 h-4 w-4 accent-brand-600" aria-label="Personalisation cookies" />
                      </div>
                    </label>

                    <label className="card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Marketing</p>
                          <p className="mt-1 text-xs leading-5 text-gray-600">Used to show relevant offers, reminders, and event planning campaigns.</p>
                        </div>
                        <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} className="mt-1 h-4 w-4 accent-brand-600" aria-label="Marketing cookies" />
                      </div>
                    </label>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-xs text-gray-500">
                      {selectedCount > 0
                        ? `${selectedCount} optional preference${selectedCount > 1 ? 's' : ''} selected.`
                        : 'Only essential cookies are enabled right now.'}
                    </p>
                    <button onClick={handleSavePreferences} className="btn-primary px-5 py-2.5 text-sm">
                      Save Preferences
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
