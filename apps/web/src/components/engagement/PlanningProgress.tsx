'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, PartyPopper, Target } from 'lucide-react';
import { getStoredPreferences } from '@/components/onboarding/WelcomeWizard';

interface MilestoneItem {
  id: string;
  label: string;
  category: string;
  completed: boolean;
}

const PLANNING_MILESTONES: MilestoneItem[] = [
  { id: 'profile', label: 'Complete your profile', category: 'setup', completed: false },
  { id: 'venue', label: 'Book a venue', category: 'venue', completed: false },
  { id: 'photography', label: 'Book photographer', category: 'photography', completed: false },
  { id: 'catering', label: 'Finalize catering', category: 'catering', completed: false },
  { id: 'decor', label: 'Book decoration', category: 'decor', completed: false },
  { id: 'makeup', label: 'Book makeup artist', category: 'makeup', completed: false },
  { id: 'music', label: 'Book music/DJ', category: 'music', completed: false },
  { id: 'invitations', label: 'Send invitations', category: 'invitation', completed: false },
];

const STORAGE_KEY = 'wedding_os_milestones';

function loadMilestones(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveMilestones(completed: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
}

export function PlanningProgress() {
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    setCompletedIds(loadMilestones());

    // Auto-check profile if onboarding was completed
    const prefs = getStoredPreferences();
    if (prefs && !loadMilestones().includes('profile')) {
      const updated = [...loadMilestones(), 'profile'];
      saveMilestones(updated);
      setCompletedIds(updated);
    }
  }, []);

  const toggleMilestone = (id: string) => {
    setCompletedIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveMilestones(updated);
      return updated;
    });
  };

  const progress = Math.round((completedIds.length / PLANNING_MILESTONES.length) * 100);
  const allDone = progress === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="card p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-brand-600" />
          <h2 className="font-semibold text-gray-900">Wedding Planning Progress</h2>
        </div>
        <span className="text-sm font-bold text-brand-600">{progress}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {allDone && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl mb-4 text-green-700 text-sm">
          <PartyPopper size={18} />
          <span className="font-medium">Amazing! You&apos;ve completed all planning milestones! 🎉</span>
        </div>
      )}

      {/* Milestone checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PLANNING_MILESTONES.map((item) => {
          const isDone = completedIds.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleMilestone(item.id)}
              className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                isDone ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {isDone ? (
                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              ) : (
                <Circle size={18} className="text-gray-300 shrink-0" />
              )}
              <span className={`text-sm font-medium ${isDone ? 'line-through opacity-60' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
