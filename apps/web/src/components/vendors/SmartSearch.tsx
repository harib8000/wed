'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TRENDING_SEARCHES = [
  'Wedding Venue in Hyderabad',
  'Bridal Makeup Artist',
  'Candid Photography',
  'Wedding Catering',
  'Mehendi Artist',
  'Wedding DJ',
  'Floral Decoration',
  'Wedding Planner',
];

const RECENT_STORAGE_KEY = 'wos_recent_searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  if (typeof window === 'undefined' || !query.trim()) return;
  try {
    const recent = getRecentSearches().filter((s) => s !== query);
    recent.unshift(query);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // ignore
  }
}

function clearRecentSearches() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface SmartSearchProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function SmartSearch({ className = '', placeholder = 'Search vendors, services...', onSearch }: SmartSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(getRecentSearches());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;
    addRecentSearch(q);
    setFocused(false);
    if (onSearch) {
      onSearch(q);
    } else {
      router.push(`/vendors?q=${encodeURIComponent(q)}`);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(query);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecent([]);
  };

  const showDropdown = focused && (recent.length > 0 || query.length === 0);
  const filteredTrending = TRENDING_SEARCHES.filter(
    (t) => !query || t.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleFormSubmit}>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={placeholder}
            className="w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm"
            aria-label="Search for vendors"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50"
          >
            {/* Recent searches */}
            {recent.length > 0 && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Clock size={12} /> Recent
                  </span>
                  <button
                    onClick={handleClearRecent}
                    className="text-[10px] text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                </div>
                {recent.map((term) => (
                  <button
                    key={term}
                    onClick={() => { setQuery(term); handleSubmit(term); }}
                    className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Clock size={12} className="text-gray-300" />
                    {term}
                  </button>
                ))}
              </div>
            )}

            {/* Trending searches */}
            {filteredTrending.length > 0 && (
              <div className={`p-3 ${recent.length > 0 ? 'border-t border-gray-100' : ''}`}>
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-2">
                  <TrendingUp size={12} /> Trending
                </span>
                {filteredTrending.map((term) => (
                  <button
                    key={term}
                    onClick={() => { setQuery(term); handleSubmit(term); }}
                    className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <TrendingUp size={12} className="text-brand-400" />
                    {term}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
