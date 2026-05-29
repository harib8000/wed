'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart, Trash2, MapPin, Star, Building2, Camera, Utensils,
  Sparkles, Music, ChevronRight, Share2, ArrowUpDown, Undo2, FolderOpen, FolderPlus, FileText,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { vendorApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface WishlistItem {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorCategory: string;
  vendorImage: string;
  vendorCity: string;
  vendorRating: number;
  vendorReviews: number;
  vendorPrice: string;
  addedAt: string;
}

const STORAGE_KEY = 'wedding_os_wishlist';
const NOTES_STORAGE_KEY = 'wedding_os_wishlist_notes';
const FOLDERS_STORAGE_KEY = 'wedding_os_wishlist_folders';
const FOLDER_ASSIGNMENTS_STORAGE_KEY = 'wedding_os_wishlist_folder_assignments';
const DEFAULT_FOLDER = 'All Saved';

const MOCK_WISHLIST: WishlistItem[] = [
  { id: 'w1', vendorId: 'v1', vendorName: 'Royal Grand Palace', vendorCategory: 'Venue', vendorImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80', vendorCity: 'Hyderabad', vendorRating: 4.9, vendorReviews: 247, vendorPrice: '₹5L onwards', addedAt: '2025-01-05' },
  { id: 'w2', vendorId: 'v2', vendorName: 'Srikanth Photography', vendorCategory: 'Photography', vendorImage: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=600&q=80', vendorCity: 'Hyderabad', vendorRating: 4.8, vendorReviews: 189, vendorPrice: '₹80K onwards', addedAt: '2025-01-06' },
  { id: 'w3', vendorId: 'v3', vendorName: 'Flavours Catering Co.', vendorCategory: 'Catering', vendorImage: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80', vendorCity: 'Hyderabad', vendorRating: 4.7, vendorReviews: 312, vendorPrice: '₹800/plate', addedAt: '2025-01-07' },
  { id: 'w4', vendorId: 'v4', vendorName: 'Blooms & Dreams Decor', vendorCategory: 'Decor', vendorImage: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&q=80', vendorCity: 'Hyderabad', vendorRating: 4.9, vendorReviews: 156, vendorPrice: '₹1.5L onwards', addedAt: '2025-01-08' },
  { id: 'w5', vendorId: 'v5', vendorName: 'Shika Bridal Studio', vendorCategory: 'Makeup', vendorImage: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=600&q=80', vendorCity: 'Hyderabad', vendorRating: 4.8, vendorReviews: 203, vendorPrice: '₹25K onwards', addedAt: '2025-01-09' },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Venue: Building2, Photography: Camera, Catering: Utensils, Decor: Sparkles, Music: Music,
};

type SortOption = 'recent' | 'rating' | 'price';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'price', label: 'Price (Low-High)' },
  { value: 'rating', label: 'Rating' },
];

function parsePriceNumber(price: string): number {
  const match = price.match(/[\d]+(?:\.[\d]+)?/);
  const num = match ? parseFloat(match[0]) : 0;
  if (/L/i.test(price)) return num * 100000;
  if (/K/i.test(price)) return num * 1000;
  return num;
}

function sortItems(items: WishlistItem[], sort: SortOption): WishlistItem[] {
  const copy = [...items];
  switch (sort) {
    case 'recent':
      return copy.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    case 'rating':
      return copy.sort((a, b) => b.vendorRating - a.vendorRating);
    case 'price':
      return copy.sort((a, b) => parsePriceNumber(a.vendorPrice) - parsePriceNumber(b.vendorPrice));
    default:
      return copy;
  }
}

function loadFromStorage(): WishlistItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveToStorage(items: WishlistItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* quota errors are non-critical */ }
}

function loadNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveNotes(notes: Record<string, string>) {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch { /* quota errors are non-critical */ }
}

function loadFolders(): string[] {
  try {
    const raw = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((folder) => typeof folder === 'string' ? folder.trim() : '')
      .filter((folder) => folder && folder !== DEFAULT_FOLDER);
  } catch {
    return [];
  }
}

function saveFolders(folders: string[]) {
  try {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  } catch { /* quota errors are non-critical */ }
}

function loadFolderAssignments(): Record<string, string> {
  try {
    const raw = localStorage.getItem(FOLDER_ASSIGNMENTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveFolderAssignments(assignments: Record<string, string>) {
  try {
    localStorage.setItem(FOLDER_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  } catch { /* quota errors are non-critical */ }
}

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.85, transition: { duration: 0.25, ease: 'easeIn' } },
};

export default function WishlistPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedFolder, setSelectedFolder] = useState(DEFAULT_FOLDER);
  const [sort, setSort] = useState<SortOption>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [folders, setFolders] = useState<string[]>([]);
  const [folderAssignments, setFolderAssignments] = useState<Record<string, string>>({});
  const [newFolderName, setNewFolderName] = useState('');
  const [editingNotes, setEditingNotes] = useState<Record<string, boolean>>({});
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const stored = loadFromStorage();
    if (stored) {
      setItems(stored);
    } else {
      setItems(MOCK_WISHLIST);
      saveToStorage(MOCK_WISHLIST);
    }
    setNotes(loadNotes());
    setFolders(loadFolders());
    setFolderAssignments(loadFolderAssignments());
    setIsLoading(false);
  }, [user]);

  const { data: enrichedItems } = useQuery({
    queryKey: ['wishlist-enrich', items.map((item) => item.vendorId)],
    queryFn: async () => {
      const results = await Promise.allSettled(
        items.map(async (item) => {
          try {
            const res = await vendorApi.getById(item.vendorId);
            const vendor = res.data?.data ?? res.data;
            if (!vendor) return item;
            return {
              ...item,
              vendorName: vendor.businessName || vendor.name || item.vendorName,
              vendorRating: vendor.rating ?? item.vendorRating,
              vendorReviews: vendor.reviewCount ?? vendor.reviews ?? item.vendorReviews,
              vendorCity: vendor.city || item.vendorCity,
              vendorPrice: vendor.basePrice ? `₹${Number(vendor.basePrice).toLocaleString('en-IN')} onwards` : item.vendorPrice,
            };
          } catch {
            return item;
          }
        }),
      );

      return results.map((result, index) => result.status === 'fulfilled' ? result.value : items[index]);
    },
    enabled: items.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const displayItems = enrichedItems ?? items;
  const folderOptions = [DEFAULT_FOLDER, ...folders];
  const categories = ['All', ...Array.from(new Set((displayItems.length > 0 ? displayItems : MOCK_WISHLIST).map((item) => item.vendorCategory)))];
  const folderFiltered = selectedFolder === DEFAULT_FOLDER
    ? displayItems
    : displayItems.filter((item) => (folderAssignments[item.vendorId] ?? DEFAULT_FOLDER) === selectedFolder);
  const categoryFiltered = filter === 'All' ? folderFiltered : folderFiltered.filter((item) => item.vendorCategory === filter);
  const sorted = sortItems(categoryFiltered, sort);

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (isLoading) return;
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }
    saveToStorage(items);
  }, [items, isLoading]);

  const removeItem = useCallback((id: string) => {
    const removedItem = items.find((item) => item.id === id);
    if (!removedItem) return;

    const removedNote = notes[removedItem.vendorId] || '';
    const removedFolder = folderAssignments[removedItem.vendorId];

    setItems((prev) => prev.filter((item) => item.id !== id));
    setNotes((prev) => {
      const next = { ...prev };
      delete next[removedItem.vendorId];
      saveNotes(next);
      return next;
    });
    setFolderAssignments((prev) => {
      const next = { ...prev };
      delete next[removedItem.vendorId];
      saveFolderAssignments(next);
      return next;
    });
    setEditingNotes((prev) => {
      const next = { ...prev };
      delete next[removedItem.vendorId];
      return next;
    });

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    const toastId = toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">Removed from wishlist</span>
          <button
            onClick={() => {
              setItems((prev) => {
                const exists = prev.some((item) => item.id === removedItem.id);
                if (exists) return prev;
                return [...prev, removedItem];
              });
              setNotes((prev) => {
                const next = removedNote ? { ...prev, [removedItem.vendorId]: removedNote } : prev;
                saveNotes(next);
                return next;
              });
              setFolderAssignments((prev) => {
                const next = { ...prev };
                if (removedFolder) {
                  next[removedItem.vendorId] = removedFolder;
                }
                saveFolderAssignments(next);
                return next;
              });
              toast.dismiss(t.id);
              if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
              toast.success('Vendor restored!', { duration: 2000 });
            }}
            className="flex items-center gap-1 text-sm font-semibold text-pink-600 hover:text-pink-700 whitespace-nowrap"
            aria-label="Undo remove"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </button>
        </div>
      ),
      { duration: 5000, position: 'bottom-center' },
    );

    undoTimerRef.current = setTimeout(() => {
      toast.dismiss(toastId);
      undoTimerRef.current = null;
    }, 5000);
  }, [folderAssignments, items, notes]);

  const handleNoteChange = useCallback((vendorId: string, value: string) => {
    setNotes((prev) => ({ ...prev, [vendorId]: value }));
  }, []);

  const handleNoteBlur = useCallback((vendorId: string) => {
    setNotes((prev) => {
      const next = { ...prev };
      if (!next[vendorId]?.trim()) {
        delete next[vendorId];
      } else {
        next[vendorId] = next[vendorId].trim();
      }
      saveNotes(next);
      return next;
    });
  }, []);

  const toggleNoteEditor = useCallback((vendorId: string) => {
    setEditingNotes((prev) => {
      const isOpen = Boolean(prev[vendorId]);
      if (isOpen) {
        handleNoteBlur(vendorId);
      }
      return { ...prev, [vendorId]: !isOpen };
    });
  }, [handleNoteBlur]);

  const createFolder = useCallback(() => {
    const name = newFolderName.trim();
    if (!name) {
      toast.error('Enter a folder name');
      return;
    }
    if (name.toLowerCase() === DEFAULT_FOLDER.toLowerCase() || folders.some((folder) => folder.toLowerCase() === name.toLowerCase())) {
      toast.error('Folder already exists');
      return;
    }

    const next = [...folders, name];
    setFolders(next);
    saveFolders(next);
    setNewFolderName('');
    setSelectedFolder(name);
    toast.success('Folder created');
  }, [folders, newFolderName]);

  const assignFolder = useCallback((vendorId: string, folder: string) => {
    setFolderAssignments((prev) => {
      const next = { ...prev };
      if (folder === DEFAULT_FOLDER) {
        delete next[vendorId];
      } else {
        next[vendorId] = folder;
      }
      saveFolderAssignments(next);
      return next;
    });
    toast.success(folder === DEFAULT_FOLDER ? 'Moved to All Saved' : `Saved to ${folder}`);
  }, []);

  const shareWishlist = useCallback(async () => {
    const summaryLines = sorted.map((item, index) => {
      const folder = folderAssignments[item.vendorId] ?? DEFAULT_FOLDER;
      const note = notes[item.vendorId]?.trim();
      const folderText = folder !== DEFAULT_FOLDER ? ` | Folder: ${folder}` : '';
      const noteText = note ? `\n   Note: ${note}` : '';
      return `${index + 1}. ${item.vendorName} — ${item.vendorCategory}, ${item.vendorCity}, ${item.vendorPrice}${folderText}${noteText}`;
    });

    const shareText = [
      `My WeddingOS wishlist${selectedFolder !== DEFAULT_FOLDER ? ` • ${selectedFolder}` : ''}`,
      summaryLines.length > 0 ? `${summaryLines.length} saved vendor${summaryLines.length !== 1 ? 's' : ''}` : 'No vendors saved yet',
      '',
      ...(summaryLines.length > 0 ? summaryLines : ['Browse vendors and start saving your favourites.']),
      '',
      `View: ${window.location.href}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Wishlist link copied!', { duration: 2000, position: 'bottom-center' });
    } catch {
      toast.error('Could not copy wishlist');
    }
  }, [folderAssignments, notes, selectedFolder, sorted]);

  const clearAll = useCallback(() => {
    setItems([]);
    setNotes({});
    setFolderAssignments({});
    setEditingNotes({});
    saveToStorage([]);
    saveNotes({});
    saveFolderAssignments({});
    setShowClearConfirm(false);
    toast.success('Wishlist cleared', { duration: 2000 });
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-4 pt-8 pb-16">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="w-6 h-6 fill-white" />
                  <h1 className="text-2xl font-bold">Wishlist</h1>
                </div>
                <p className="text-white/70 text-sm">{items.length} vendor{items.length !== 1 ? 's' : ''} saved • {folders.length} custom folder{folders.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={shareWishlist}
                  aria-label="Share this wishlist with family"
                  className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share this wishlist with family</span>
                </button>
                {items.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    aria-label="Clear all wishlist items"
                    className="flex items-center gap-2 bg-white/15 hover:bg-red-500/30 backdrop-blur-sm text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear All</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter by folder</label>
                <div className="relative mt-1.5">
                  <FolderOpen className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-10 py-2.5 text-sm text-gray-700 focus:border-brand-300 focus:outline-none"
                    aria-label="Filter wishlist by folder"
                  >
                    {folderOptions.map((folder) => (
                      <option key={folder} value={folder}>{folder}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Create folder</label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        createFolder();
                      }
                    }}
                    placeholder="Photographers, Venues..."
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none"
                    aria-label="Create wishlist folder"
                  />
                  <button
                    onClick={createFolder}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3.5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition"
                  >
                    <FolderPlus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {folders.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {folderOptions.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    className={clsx(
                      'rounded-full px-3 py-1.5 text-xs font-medium transition',
                      selectedFolder === folder
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    )}
                  >
                    {folder}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  aria-label={`Filter by ${cat}`}
                  aria-pressed={filter === cat}
                  className={clsx(
                    'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                    filter === cat
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative flex-shrink-0" ref={sortRef}>
              <button
                onClick={() => setSortOpen((open) => !open)}
                aria-label="Sort wishlist"
                aria-expanded={sortOpen}
                className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-brand-300 text-gray-600 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">Sort</span>
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30"
                    role="listbox"
                    aria-label="Sort options"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        role="option"
                        aria-selected={sort === opt.value}
                        onClick={() => { setSort(opt.value); setSortOpen(false); }}
                        className={clsx(
                          'w-full text-left px-4 py-2.5 text-sm transition-colors',
                          sort === opt.value
                            ? 'bg-brand-50 text-brand-600 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-36 animate-pulse" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-pink-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No saved vendors</h3>
              <p className="text-gray-500 text-sm mb-6">
                {selectedFolder !== DEFAULT_FOLDER
                  ? `No vendors saved in ${selectedFolder}`
                  : filter !== 'All'
                    ? `No ${filter} vendors in your wishlist`
                    : 'Browse vendors and tap the heart icon to save them here'}
              </p>
              <Link
                href="/vendors"
                aria-label="Explore vendors"
                className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium"
              >
                Explore Vendors <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {sorted.map((item) => {
                  const CategoryIcon = CATEGORY_ICONS[item.vendorCategory] ?? Building2;
                  const assignedFolder = folderAssignments[item.vendorId] ?? DEFAULT_FOLDER;
                  const savedNote = notes[item.vendorId]?.trim();
                  const isEditingNote = Boolean(editingNotes[item.vendorId]);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      variants={cardVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group"
                    >
                      <div className="flex">
                        <Link
                          href={`/vendors/${item.vendorId}`}
                          className="relative w-28 sm:w-36 flex-shrink-0 block"
                          aria-label={`View ${item.vendorName}`}
                        >
                          <Image
                            src={item.vendorImage}
                            alt={item.vendorName}
                            fill
                            className="object-cover"
                            sizes="144px"
                          />
                        </Link>
                        <div className="flex-1 p-4 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/vendors/${item.vendorId}`} className="min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-brand-600 transition-colors truncate">
                                {item.vendorName}
                              </h3>
                              <span className="inline-flex items-center gap-1 text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full mt-1">
                                <CategoryIcon className="w-3 h-3" />
                                {item.vendorCategory}
                              </span>
                            </Link>
                            <button
                              onClick={() => removeItem(item.id)}
                              aria-label={`Remove ${item.vendorName} from wishlist`}
                              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 flex items-center justify-center flex-shrink-0 transition-all active:scale-75"
                            >
                              <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 group-[.removing]:scale-0 transition-transform" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-2">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              {item.vendorRating} ({item.vendorReviews})
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.vendorCity}
                            </span>
                            {assignedFolder !== DEFAULT_FOLDER && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                <FolderOpen className="w-3 h-3" />
                                {assignedFolder}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-brand-600 font-bold text-sm">{item.vendorPrice}</span>
                            <Link
                              href={`/checkout/${item.vendorId}`}
                              aria-label={`Book ${item.vendorName}`}
                              className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg font-medium transition"
                            >
                              Book Now
                            </Link>
                          </div>

                          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                            <div>
                              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Folder</label>
                              <div className="relative mt-1">
                                <FolderOpen className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <select
                                  value={assignedFolder}
                                  onChange={(e) => assignFolder(item.vendorId, e.target.value)}
                                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-8 py-2 text-sm text-gray-700 focus:border-brand-300 focus:outline-none"
                                  aria-label={`Assign ${item.vendorName} to folder`}
                                >
                                  {folderOptions.map((folder) => (
                                    <option key={folder} value={folder}>{folder}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <button
                              onClick={() => toggleNoteEditor(item.vendorId)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-700 hover:border-brand-300 hover:text-brand-600 transition"
                              aria-label={savedNote ? `Edit note for ${item.vendorName}` : `Add note for ${item.vendorName}`}
                            >
                              <FileText className="w-4 h-4" />
                              {savedNote ? 'Edit Note' : 'Add Note'}
                            </button>
                          </div>

                          {savedNote && !isEditingNote && (
                            <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2.5">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Note</p>
                              <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">{savedNote}</p>
                            </div>
                          )}

                          <AnimatePresence initial={false}>
                            {isEditingNote && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 overflow-hidden"
                              >
                                <textarea
                                  value={notes[item.vendorId] || ''}
                                  onChange={(e) => handleNoteChange(item.vendorId, e.target.value)}
                                  onBlur={() => handleNoteBlur(item.vendorId)}
                                  placeholder="Add a short note for family discussions, pricing, or follow-up"
                                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none min-h-[88px]"
                                  aria-label={`Add note for ${item.vendorName}`}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
              onClick={() => setShowClearConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              >
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Clear Wishlist?</h3>
                <p className="text-sm text-gray-500 text-center mb-6">
                  This will remove all {items.length} vendor{items.length !== 1 ? 's' : ''} from your wishlist. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={clearAll}
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition"
                  >
                    Clear All
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </>
  );
}
