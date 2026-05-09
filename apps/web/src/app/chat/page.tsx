'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Phone,
  Video,
  Check,
  CheckCheck,
  MessageSquare,
  Image as ImageIcon,
  Menu,
  X,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Message {
  id: string;
  senderId: 'user' | 'vendor';
  text: string;
  sentAt: string;
  status: 'sending' | 'sent' | 'read';
}

interface Vendor {
  id: string;
  name: string;
  avatar: string;
  category: string;
  online: boolean;
}

interface Conversation {
  vendorId: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const VENDORS: Record<string, Vendor> = {
  v1: { id: 'v1', name: 'Royal Grand Palace', avatar: 'RG', category: 'Venue', online: true },
  v2: { id: 'v2', name: 'Srikanth Photography', avatar: 'SP', category: 'Photography', online: true },
  v3: { id: 'v3', name: 'Flavours Catering', avatar: 'FC', category: 'Catering', online: false },
  v4: { id: 'v4', name: 'Blooms & Petals Décor', avatar: 'BP', category: 'Décor', online: false },
  'vendor-1': { id: 'vendor-1', name: 'Royal Grand Palace', avatar: 'RG', category: 'Venue', online: true },
  'vendor-2': { id: 'vendor-2', name: 'Srikanth Photography', avatar: 'SP', category: 'Photography', online: true },
  'vendor-3': { id: 'vendor-3', name: 'Flavours Catering', avatar: 'FC', category: 'Catering', online: false },
};

const CONVERSATIONS: Conversation[] = [
  { vendorId: 'v1', lastMessage: 'March is mostly available. Share the exact date?', lastMessageAt: new Date(Date.now() - 600_000).toISOString(), unread: 1 },
  { vendorId: 'v2', lastMessage: 'I\'ll send the pre-wedding shoot package details.', lastMessageAt: new Date(Date.now() - 3_600_000).toISOString(), unread: 0 },
  { vendorId: 'v3', lastMessage: 'Menu tasting is scheduled for Saturday!', lastMessageAt: new Date(Date.now() - 86_400_000).toISOString(), unread: 3 },
  { vendorId: 'v4', lastMessage: 'Floral arch options are attached.', lastMessageAt: new Date(Date.now() - 172_800_000).toISOString(), unread: 0 },
];

function buildDemoMessages(vendorId: string): Message[] {
  const vendor = VENDORS[vendorId];
  const name = vendor?.name ?? 'Vendor';
  const now = Date.now();
  const yesterday = now - 86_400_000;

  return [
    { id: '1', senderId: 'vendor', text: `Hi! This is ${name}. Thank you for your interest. How can I help you with your wedding plans?`, sentAt: new Date(yesterday - 7_200_000).toISOString(), status: 'read' },
    { id: '2', senderId: 'user', text: 'Hi! We\'re planning our wedding in March 2025. Could you share availability and pricing?', sentAt: new Date(yesterday - 6_000_000).toISOString(), status: 'read' },
    { id: '3', senderId: 'vendor', text: 'Of course! March is a wonderful month. We have a few dates open. Could you share the exact date and approximate guest count?', sentAt: new Date(yesterday - 5_400_000).toISOString(), status: 'read' },
    { id: '4', senderId: 'user', text: 'We\'re looking at March 15th, around 350 guests.', sentAt: new Date(now - 3_600_000).toISOString(), status: 'read' },
    { id: '5', senderId: 'vendor', text: 'Great news — March 15th is available! I\'ll put together a custom quote for 350 guests and send it over shortly. 🎉', sentAt: new Date(now - 2_400_000).toISOString(), status: 'read' },
    { id: '6', senderId: 'user', text: 'That sounds perfect, thank you!', sentAt: new Date(now - 1_800_000).toISOString(), status: 'read' },
  ];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0 && date.getDate() === now.getDate()) return 'Today';
  if (diffDays <= 1 && date.getDate() === now.getDate() - 1) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDateKey(iso: string) {
  return new Date(iso).toDateString();
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-2 h-2 rounded-full bg-gray-400"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

function ReadReceipt({ status, light }: { status: Message['status']; light?: boolean }) {
  const base = light ? 'text-white/60' : 'text-gray-400';
  const readColor = 'text-blue-400';

  if (status === 'sending') return <span className={clsx('text-[10px]', base)}>●</span>;
  if (status === 'read') return <CheckCheck className={clsx('w-3.5 h-3.5 inline-block', readColor)} />;
  return <Check className={clsx('w-3.5 h-3.5 inline-block', base)} />;
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[11px] font-medium text-gray-400 bg-white px-2 select-none">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function ComingSoonBadge() {
  return (
    <span className="absolute -top-1 -right-1 bg-amber-400 text-[8px] font-bold text-amber-900 px-1 rounded-full leading-tight select-none">
      SOON
    </span>
  );
}

function ConversationItem({
  conversation,
  active,
  onClick,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const vendor = VENDORS[conversation.vendorId];
  if (!vendor) return null;

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        active ? 'bg-brand-50 border-l-2 border-brand-600' : 'hover:bg-gray-50 border-l-2 border-transparent',
      )}
    >
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs">
          {vendor.avatar}
        </div>
        {vendor.online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm text-gray-900 truncate">{vendor.name}</p>
          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{formatTime(conversation.lastMessageAt)}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-gray-500 truncate">{conversation.lastMessage}</p>
          {conversation.unread > 0 && (
            <span className="flex-shrink-0 ml-2 bg-brand-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {conversation.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();

  const vendorId = searchParams.get('vendorId');
  const vendor = vendorId ? VENDORS[vendorId] ?? null : null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages when vendor changes
  useEffect(() => {
    if (vendorId) {
      setMessages(buildDemoMessages(vendorId));
    } else {
      setMessages([]);
    }
  }, [vendorId]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; label: string; messages: Message[] }[] = [];
    let currentKey = '';
    for (const msg of messages) {
      const key = getDateKey(msg.sentAt);
      if (key !== currentKey) {
        currentKey = key;
        groups.push({ date: key, label: formatRelativeDate(msg.sentAt), messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = newMessage.trim();
    if (!text) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      senderId: 'user',
      text,
      sentAt: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMsg]);
    setNewMessage('');
    inputRef.current?.focus();

    // Simulate send → delivered
    await new Promise((r) => setTimeout(r, 400));
    setMessages((prev) =>
      prev.map((m) => (m.id === userMsg.id ? { ...m, status: 'sent' } : m)),
    );

    // Simulate vendor typing + auto-reply
    setIsTyping(true);
    const delay = 1200 + Math.random() * 1000;
    await new Promise((r) => setTimeout(r, delay));
    setIsTyping(false);

    const replies = [
      'Sounds great! Let me check on that for you.',
      'Sure, I\'ll get back to you with the details shortly!',
      'Thank you for the information. Let me prepare a quote.',
      'Wonderful choice! I\'ll confirm availability right away.',
      'Got it! I\'ll share the options with you today. 😊',
    ];

    const vendorReply: Message = {
      id: `v-${Date.now()}`,
      senderId: 'vendor',
      text: replies[Math.floor(Math.random() * replies.length)],
      sentAt: new Date().toISOString(),
      status: 'read',
    };

    setMessages((prev) => [
      ...prev.map((m) => (m.id === userMsg.id ? { ...m, status: 'read' as const } : m)),
      vendorReply,
    ]);
  }, [newMessage]);

  const selectConversation = useCallback(
    (vid: string) => {
      router.push(`/chat?vendorId=${vid}`);
      setSidebarOpen(false);
    },
    [router],
  );

  /* ---------- Loading ---------- */
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  /* ---------- Render ---------- */
  return (
    <>
      <Navbar />
      <main className="h-[calc(100dvh-64px)] bg-gray-100 flex overflow-hidden">
        {/* -------- Sidebar (desktop: always, mobile: overlay) -------- */}
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-80 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="px-4 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {CONVERSATIONS.map((c) => (
              <ConversationItem
                key={c.vendorId}
                conversation={c}
                active={vendorId === c.vendorId}
                onClick={() => selectConversation(c.vendorId)}
              />
            ))}
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 flex flex-col md:hidden shadow-xl"
              >
                <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Messages</h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-100"
                    aria-label="Close conversations panel"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {CONVERSATIONS.map((c) => (
                    <ConversationItem
                      key={c.vendorId}
                      conversation={c}
                      active={vendorId === c.vendorId}
                      onClick={() => selectConversation(c.vendorId)}
                    />
                  ))}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* -------- Chat area -------- */}
        <section className="flex-1 flex flex-col min-w-0 bg-white">
          {!vendor ? (
            /* ---- Empty state ---- */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-brand-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your messages</h3>
              <p className="text-sm text-gray-500 max-w-xs mb-6">
                Select a conversation from the sidebar or start chatting with a vendor from their profile page.
              </p>
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-full hover:bg-brand-700 transition"
              >
                View conversations
              </button>
            </div>
          ) : (
            <>
              {/* ---- Chat header ---- */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition md:hidden"
                  aria-label="Open conversations"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => router.back()}
                  className="p-1 rounded-lg hover:bg-gray-100 transition hidden md:inline-flex"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>

                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm select-none">
                    {vendor.avatar}
                  </div>
                  {vendor.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{vendor.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {isTyping ? (
                      <span className="text-green-500 font-medium">typing…</span>
                    ) : vendor.online ? (
                      <span className="text-green-500">Online</span>
                    ) : (
                      'Last seen recently'
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <div className="relative">
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 cursor-default"
                      aria-label="Voice call — coming soon"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <ComingSoonBadge />
                  </div>
                  <div className="relative">
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 cursor-default"
                      aria-label="Video call — coming soon"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                    <ComingSoonBadge />
                  </div>
                </div>
              </div>

              {/* ---- Messages ---- */}
              <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#f0f2f5]">
                <AnimatePresence initial={false}>
                  {groupedMessages.map((group) => (
                    <div key={group.date}>
                      <DateSeparator label={group.label} />
                      {group.messages.map((msg) => {
                        const isUser = msg.senderId === 'user';
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.25 }}
                            className={clsx('flex mb-2', isUser ? 'justify-end' : 'justify-start')}
                          >
                            <div
                              className={clsx(
                                'max-w-[75%] px-3.5 py-2 rounded-2xl text-sm shadow-sm',
                                isUser
                                  ? 'bg-brand-600 text-white rounded-br-md'
                                  : 'bg-white text-gray-800 rounded-bl-md',
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                              <div
                                className={clsx(
                                  'flex items-center justify-end gap-1 mt-1',
                                  isUser ? 'text-white/60' : 'text-gray-400',
                                )}
                              >
                                <span className="text-[10px] leading-none">{formatTime(msg.sentAt)}</span>
                                {isUser && <ReadReceipt status={msg.status} light />}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </AnimatePresence>

                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* ---- Compose bar ---- */}
              <div className="bg-white border-t border-gray-200 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="relative group">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-500 transition cursor-default"
                      aria-label="Attach image — coming soon"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Coming soon
                    </span>
                  </div>
                  <div className="relative group">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-500 transition cursor-default"
                      aria-label="Attach file — coming soon"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Coming soon
                    </span>
                  </div>

                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message…"
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                    aria-label="Message input"
                  />

                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}
