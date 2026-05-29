'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Phone, Mail, Users, UtensilsCrossed, StickyNote, Tag } from 'lucide-react';

type GuestSide = 'bride' | 'groom' | 'mutual';
type MealPreference = 'veg' | 'non_veg' | 'jain' | 'vegan' | 'no_preference';
type GuestGroup = 'family' | 'friends' | 'colleagues' | 'neighbours' | 'others';

interface GuestFormData {
  name: string;
  phone: string;
  email: string;
  side: GuestSide;
  group: GuestGroup;
  mealPreference: MealPreference;
  plusOnes: number;
  notes: string;
}

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (guest: GuestFormData) => void;
}

const SIDES: { value: GuestSide; label: string }[] = [
  { value: 'bride', label: 'Bride Side' },
  { value: 'groom', label: 'Groom Side' },
  { value: 'mutual', label: 'Mutual' },
];

const GROUP_OPTIONS: { value: GuestGroup; label: string }[] = [
  { value: 'family', label: 'Family' },
  { value: 'friends', label: 'Friends' },
  { value: 'colleagues', label: 'Colleagues' },
  { value: 'neighbours', label: 'Neighbours' },
  { value: 'others', label: 'Others' },
];

const MEAL_OPTIONS: { value: MealPreference; label: string }[] = [
  { value: 'no_preference', label: 'No Preference' },
  { value: 'veg', label: 'Vegetarian' },
  { value: 'non_veg', label: 'Non-Vegetarian' },
  { value: 'jain', label: 'Jain' },
  { value: 'vegan', label: 'Vegan' },
];

const initialFormData: GuestFormData = {
  name: '',
  phone: '',
  email: '',
  side: 'mutual',
  group: 'friends',
  mealPreference: 'no_preference',
  plusOnes: 0,
  notes: '',
};

export function AddGuestModal({ isOpen, onClose, onAdd }: AddGuestModalProps) {
  const [form, setForm] = useState<GuestFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof GuestFormData, string>>>({});

  function validate(): boolean {
    const next: Partial<Record<keyof GuestFormData, string>> = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) {
      next.phone = 'Enter a valid 10-digit Indian mobile number (starts with 6-9)';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email address';
    }
    if (form.plusOnes < 0 || form.plusOnes > 10) next.plusOnes = 'Plus-ones must be 0–10';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    onAdd(form);
    setForm(initialFormData);
    setErrors({});
    onClose();
  }

  function update<K extends keyof GuestFormData>(key: K, value: GuestFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-rose-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Add Guest</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                    placeholder="Guest name"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => update('phone', event.target.value)}
                    placeholder="10-digit mobile number"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => update('email', event.target.value)}
                    placeholder="guest@email.com"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Side</label>
                  <select
                    value={form.side}
                    onChange={(event) => update('side', event.target.value as GuestSide)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                  >
                    {SIDES.map((side) => (
                      <option key={side.value} value={side.value}>
                        {side.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Tag className="inline w-4 h-4 mr-1 text-gray-400" />
                    Group
                  </label>
                  <select
                    value={form.group}
                    onChange={(event) => update('group', event.target.value as GuestGroup)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                  >
                    {GROUP_OPTIONS.map((group) => (
                      <option key={group.value} value={group.value}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meal Preference</label>
                <select
                  value={form.mealPreference}
                  onChange={(event) => update('mealPreference', event.target.value as MealPreference)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                >
                  {MEAL_OPTIONS.map((meal) => (
                    <option key={meal.value} value={meal.value}>
                      {meal.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <UtensilsCrossed className="inline w-4 h-4 mr-1 text-gray-400" />
                  Plus-Ones
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={form.plusOnes}
                  onChange={(event) => update('plusOnes', parseInt(event.target.value) || 0)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors ${errors.plusOnes ? 'border-red-400' : 'border-gray-200'}`}
                />
                {errors.plusOnes && <p className="mt-1 text-xs text-red-500">{errors.plusOnes}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <StickyNote className="inline w-4 h-4 mr-1 text-gray-400" />
                  Notes <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={(event) => update('notes', event.target.value)}
                  rows={2}
                  placeholder="Dietary restrictions, accessibility needs, etc."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg shadow-rose-500/25 active:scale-[0.98]"
              >
                Add Guest
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
