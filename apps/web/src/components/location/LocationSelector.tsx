'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Search, LocateFixed, ChevronDown, X } from 'lucide-react';
import { clsx } from 'clsx';
import { haversineDistance } from '@/lib/geo';

const STORAGE_KEY = 'wedding_os_selected_city';

export const INDIAN_CITIES = [
  'Hyderabad',
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Chennai',
  'Kolkata',
  'Pune',
  'Jaipur',
  'Lucknow',
  'Ahmedabad',
  'Visakhapatnam',
  'Bhopal',
  'Indore',
  'Chandigarh',
  'Coimbatore',
  'Kochi',
  'Nagpur',
  'Patna',
  'Surat',
  'Vadodara',
  'Thiruvananthapuram',
  'Guwahati',
  'Bhubaneswar',
  'Mangalore',
  'Mysore',
  'Udaipur',
  'Jodhpur',
  'Dehradun',
  'Ranchi',
  'Amritsar',
] as const;

const POPULAR_CITIES = INDIAN_CITIES.slice(0, 10);

const CITY_COORDINATES: Record<(typeof INDIAN_CITIES)[number], { lat: number; lng: number }> = {
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  Bhopal: { lat: 23.2599, lng: 77.4126 },
  Indore: { lat: 22.7196, lng: 75.8577 },
  Chandigarh: { lat: 30.7333, lng: 76.7794 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Nagpur: { lat: 21.1458, lng: 79.0882 },
  Patna: { lat: 25.5941, lng: 85.1376 },
  Surat: { lat: 21.1702, lng: 72.8311 },
  Vadodara: { lat: 22.3072, lng: 73.1812 },
  Thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  Guwahati: { lat: 26.1445, lng: 91.7362 },
  Bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  Mangalore: { lat: 12.9141, lng: 74.856 },
  Mysore: { lat: 12.2958, lng: 76.6394 },
  Udaipur: { lat: 24.5854, lng: 73.7125 },
  Jodhpur: { lat: 26.2389, lng: 73.0243 },
  Dehradun: { lat: 30.3165, lng: 78.0322 },
  Ranchi: { lat: 23.3441, lng: 85.3096 },
  Amritsar: { lat: 31.634, lng: 74.8723 },
};

function distanceBetween(lat1: number, lng1: number, lat2: number, lng2: number) {
  return haversineDistance(lat1, lng1, lat2, lng2);
}

export function getSelectedCity() {
  if (typeof window === 'undefined') return 'All India';

  try {
    return localStorage.getItem(STORAGE_KEY) || 'All India';
  } catch {
    return 'All India';
  }
}

export function setSelectedCity(city: string) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, city);
    window.dispatchEvent(new CustomEvent('locationChanged', { detail: { city } }));
  } catch {
    // ignore storage failures
  }
}

export async function detectNearestCity() {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise<string | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        let nearestCity: (typeof INDIAN_CITIES)[number] | null = null;
        let nearestDistance = Number.POSITIVE_INFINITY;

        INDIAN_CITIES.forEach((city) => {
          const target = CITY_COORDINATES[city];
          const distance = distanceBetween(coords.latitude, coords.longitude, target.lat, target.lng);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestCity = city;
          }
        });

        resolve(nearestCity);
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
}

interface LocationSelectorProps {
  scrolled?: boolean;
}

export function LocationSelector({ scrolled = true }: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCityState] = useState('All India');
  const [detecting, setDetecting] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setSelectedCityState(getSelectedCity());

    const handleLocationChange = (event: Event) => {
      const nextCity = (event as CustomEvent<{ city?: string }>).detail?.city;
      if (nextCity) {
        setSelectedCityState(nextCity);
      }
    };

    window.addEventListener('locationChanged', handleLocationChange as EventListener);
    return () => window.removeEventListener('locationChanged', handleLocationChange as EventListener);
  }, []);

  const filteredCities = useMemo(
    () => [...INDIAN_CITIES]
      .filter((city) => city.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => a.localeCompare(b)),
    [query]
  );

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    setSelectedCityState(city);
    setStatus(city === 'All India' ? 'Showing vendors across India.' : `Showing vendors in ${city}.`);
    setOpen(false);
  };

  const handleDetectLocation = async () => {
    setDetecting(true);
    setStatus('Detecting your location...');
    const detectedCity = await detectNearestCity();
    setDetecting(false);

    if (!detectedCity) {
      setStatus('We could not detect your city. Please choose one manually.');
      return;
    }

    handleSelectCity(detectedCity);
    setStatus(`Detected ${detectedCity}.`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={clsx(
          'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500',
          scrolled
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
        )}
      >
        <MapPin size={16} className="shrink-0" />
        <span className="max-w-[120px] truncate">{selectedCity === 'All India' ? 'All India' : selectedCity}</span>
        <ChevronDown size={14} className="opacity-70" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', damping: 24, stiffness: 240 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 font-heading">Choose your city</h2>
                  <p className="mt-1 text-sm text-gray-500">We&apos;ll personalize vendors and recommendations around you.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close location selector"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6 px-6 py-6">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detecting}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <LocateFixed size={16} />
                    {detecting ? 'Detecting...' : 'Detect my location'}
                  </button>
                  <div className="relative flex-1">
                    <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search cities"
                      className="w-full rounded-2xl border border-gray-200 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                </div>

                {status && <p className="text-sm text-brand-700">{status}</p>}

                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Popular cities</h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <button
                      type="button"
                      onClick={() => handleSelectCity('All India')}
                      className={clsx(
                        'rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all',
                        selectedCity === 'All India'
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-gray-200 text-gray-700 hover:border-brand-200 hover:bg-gray-50'
                      )}
                    >
                      🇮🇳 All India
                    </button>
                    {POPULAR_CITIES.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className={clsx(
                          'rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all',
                          selectedCity === city
                            ? 'border-brand-600 bg-brand-50 text-brand-700'
                            : 'border-gray-200 text-gray-700 hover:border-brand-200 hover:bg-gray-50'
                        )}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">All cities</h3>
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {filteredCities.length > 0 ? (
                      filteredCities.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => handleSelectCity(city)}
                          className={clsx(
                            'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all',
                            selectedCity === city
                              ? 'border-brand-600 bg-brand-50 text-brand-700'
                              : 'border-gray-200 text-gray-700 hover:border-brand-200 hover:bg-gray-50'
                          )}
                        >
                          <span>{city}</span>
                          {selectedCity === city && <span className="text-xs font-semibold text-brand-600">Selected</span>}
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                        No cities found for “{query}”.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
