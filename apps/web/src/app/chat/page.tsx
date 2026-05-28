'use client';
import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Search,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import { chatApi, ChatConversation, ChatMessage } from '@/lib/api';

interface Message {
  id: string;
  senderId: string;
  senderRole: string;
  text: string;
  sentAt: string;
  status: 'sending' | 'sent' | 'read';
  contentType: 'text' | 'image' | 'file';
}

interface Vendor {
  id: string;
  name: string;
  avatar: string;
  category: string;
  online: boolean;
}

interface Conversation {
  id: string;
  bookingId: string;
  vendorId: string;
  vendorName: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

const QUICK_ENQUIRY_TEMPLATES = [
  "I'm interested in your services for my wedding",
  'Can you share pricing for [date]?',
  'Are you available on [date]?',
  'Can I schedule a visit?',
] as const;

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
  { id: 'c1', bookingId: 'booking-v1', vendorId: 'v1', vendorName: 'Royal Grand Palace', lastMessage: 'March is mostly available. Share the exact date?', lastMessageAt: new Date(Date.now() - 600_000).toISOString(), unread: 1 },
  { id: 'c2', bookingId: 'booking-v2', vendorId: 'v2', vendorName: 'Srikanth Photography', lastMessage: 'I\'ll send the pre-wedding shoot package details.', lastMessageAt: new Date(Date.now() - 3_600_000).toISOString(), unread: 0 },
  { id: 'c3', bookingId: 'booking-v3', vendorId: 'v3', vendorName: 'Flavours Catering', lastMessage: 'Menu tasting is scheduled for Saturday!', lastMessageAt: new Date(Date.now() - 86_400_000).toISOString(), unread: 3 },
  { id: 'c4', bookingId: 'booking-v4', vendorId: 'v4', vendorName: 'Blooms & Petals Décor', lastMessage: 'Floral arch options are attached.', lastMessageAt: new Date(Date.now() - 172_800_000).toISOString(), unread: 0 },
];

function buildDemoMessages(vendorId: string): Message[] {
  const vendor = VENDORS[vendorId];
  const name = vendor?.name ?? 'Vendor';
  const now = Date.now();
  const yesterday = now - 86_400_000;
  const messages: Message[] = [
    { id: '1', senderId: vendorId, senderRole: 'vendor', text: `Hi! This is ${name}. Thank you for your interest. How can I help you with your wedding plans?`, sentAt: new Date(yesterday - 7_200_000).toISOString(), status: 'read', contentType: 'text' },
    { id: '2', senderId: 'user', senderRole: 'customer', text: 'Hi! We\'re planning our wedding in March 2025. Could you share availability and pricing?', sentAt: new Date(yesterday - 6_000_000).toISOString(), status: 'read', contentType: 'text' },
    { id: '3', senderId: vendorId, senderRole: 'vendor', text: 'Of course! March is a wonderful month. We have a few dates open. Could you share the exact date and approximate guest count?', sentAt: new Date(yesterday - 5_400_000).toISOString(), status: 'read', contentType: 'text' },
    { id: '4', senderId: 'user', senderRole: 'customer', text: 'We\'re looking at March 15th, around 350 guests.', sentAt: new Date(now - 3_600_000).toISOString(), status: 'read', contentType: 'text' },
    { id: '5', senderId: vendorId, senderRole: 'vendor', text: 'Great news — March 15th is available! I\'ll put together a custom quote for 350 guests and send it over shortly. 🎉', sentAt: new Date(now - 2_400_000).toISOString(), status: 'read', contentType: 'text' },
  ];

  if (vendorId === 'v4') {
    messages.push(
      { id: '6', senderId: vendorId, senderRole: 'vendor', text: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&q=80', sentAt: new Date(now - 2_100_000).toISOString(), status: 'read', contentType: 'image' },
      { id: '7', senderId: vendorId, senderRole: 'vendor', text: 'Décor moodboard.pdf', sentAt: new Date(now - 2_000_000).toISOString(), status: 'read', contentType: 'file' },
    );
  }

  messages.push({ id: '8', senderId: 'user', senderRole: 'customer', text: 'That sounds perfect, thank you!', sentAt: new Date(now - 1_800_000).toISOString(), status: 'read', contentType: 'text' });
  return messages;
}

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

function getAvatar(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function detectContentType(content: string): Message['contentType'] {
  const lower = content.toLowerCase();
  if (/^https?:\/\/.+\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/.test(lower)) return 'image';
  if (lower.endsWith('.pdf') || lower.endsWith('.doc') || lower.endsWith('.docx') || lower.includes('attachment')) return 'file';
  return 'text';
}

function buildVendor(conversation: Conversation | null, isOnline: boolean) {
  if (!conversation) return null;
  const existing = VENDORS[conversation.vendorId];
  return existing
    ? { ...existing, online: isOnline || existing.online }
    : {
        id: conversation.vendorId,
        name: conversation.vendorName,
        avatar: getAvatar(conversation.vendorName),
        category: 'Vendor',
        online: isOnline,
      };
}

function normalizeConversation(raw: ChatConversation | Record<string, unknown>, isVendorUser: boolean): Conversation {
  const record = raw as Record<string, unknown>;
  const vendorId = String(record.vendorId ?? '');
  const vendorName = String(record.vendorName ?? VENDORS[vendorId]?.name ?? 'Vendor');
  const unread = isVendorUser
    ? Number(record.vendorUnread ?? record.unreadCount ?? 0)
    : Number(record.customerUnread ?? record.unreadCount ?? 0);

  return {
    id: String(record.id ?? record._id ?? record.bookingId ?? vendorId),
    bookingId: String(record.bookingId ?? record.id ?? `booking-${vendorId}`),
    vendorId,
    vendorName,
    lastMessage: String(record.lastMessage ?? 'Start the conversation'),
    lastMessageAt: String(record.lastMessageAt ?? record.updatedAt ?? new Date().toISOString()),
    unread,
  };
}

function normalizeMessage(raw: ChatMessage | Record<string, unknown>, currentUserId?: string | null): Message {
  const record = raw as Record<string, unknown>;
  const senderId = String(record.senderId ?? '');
  const content = String(record.content ?? '');
  const senderRole = String(record.senderRole ?? (senderId === currentUserId ? 'customer' : 'vendor'));
  return {
    id: String(record.id ?? record._id ?? `${senderId}-${record.createdAt ?? Date.now()}`),
    senderId,
    senderRole,
    text: content,
    sentAt: String(record.createdAt ?? new Date().toISOString()),
    status: senderId === currentUserId ? 'sent' : 'read',
    contentType: record.contentType === 'image' ? 'image' : (record.contentType === 'document' || record.contentType === 'file' ? 'file' : detectContentType(content)),
  };
}

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
function MessageBubble({ msg, isUser }: { msg: Message; isUser: boolean }) {
  return (
    <div
      className={clsx(
        'max-w-[75%] px-3.5 py-2 rounded-2xl text-sm shadow-sm',
        isUser ? 'bg-brand-600 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md',
      )}
    >
      {msg.contentType === 'image' ? (
        <div className="space-y-2">
          <img src={msg.text} alt="Shared attachment" className="rounded-xl max-h-64 w-full object-cover" />
          <p className={clsx('text-xs', isUser ? 'text-white/80' : 'text-gray-500')}>Image attachment</p>
        </div>
      ) : msg.contentType === 'file' ? (
        <a
          href={msg.text.startsWith('http') ? msg.text : '#'}
          target="_blank"
          rel="noreferrer"
          className={clsx('flex items-center gap-3 rounded-xl px-3 py-2', isUser ? 'bg-white/10' : 'bg-gray-50')}
        >
          <Paperclip className="w-4 h-4" />
          <div className="min-w-0">
            <p className="truncate font-medium">{msg.text}</p>
            <p className={clsx('text-xs', isUser ? 'text-white/70' : 'text-gray-500')}>Attachment</p>
          </div>
        </a>
      ) : (
        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
      )}
      <div className={clsx('flex items-center justify-end gap-1 mt-1', isUser ? 'text-white/60' : 'text-gray-400')}>
        <span className="text-[10px] leading-none">{formatTime(msg.sentAt)}</span>
        {isUser && <ReadReceipt status={msg.status} light />}
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  active,
  onClick,
  isOnline,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
  isOnline: boolean;
}) {
  const vendor = buildVendor(conversation, isOnline);
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
        {isOnline && (
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

function ChatPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuthStore();

  const vendorId = searchParams.get('vendorId');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [messageSearch, setMessageSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const conversationsQuery = useQuery({
    queryKey: ['chat-conversations', user?.id, user?.role],
    enabled: !!user,
    queryFn: async () => {
      try {
        const res = await chatApi.listConversations();
        const raw = res.data?.data?.conversations ?? res.data?.data ?? res.data;
        const items = Array.isArray(raw)
          ? raw.map((item) => normalizeConversation(item as ChatConversation, user?.role === 'vendor'))
          : [];
        return { items, isMock: false };
      } catch {
        return { items: CONVERSATIONS, isMock: true };
      }
    },
    retry: 0,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (conversationsQuery.data?.items) {
      setConversations(conversationsQuery.data.items.length > 0 ? conversationsQuery.data.items : CONVERSATIONS);
    }
  }, [conversationsQuery.data]);

  const activeConversation = useMemo(() => {
    if (!vendorId) return null;
    const existing = conversations.find((conversation) => conversation.vendorId === vendorId);
    if (existing) return existing;
    const vendor = VENDORS[vendorId];
    if (!vendor) return null;
    return {
      id: `demo-${vendorId}`,
      bookingId: `demo-${vendorId}`,
      vendorId,
      vendorName: vendor.name,
      lastMessage: 'Start the conversation',
      lastMessageAt: new Date().toISOString(),
      unread: 0,
    };
  }, [conversations, vendorId]);

  const vendor = useMemo(() => buildVendor(activeConversation, socketConnected), [activeConversation, socketConnected]);

  const messagesQuery = useQuery({
    queryKey: ['chat-messages', activeConversation?.bookingId],
    enabled: !!activeConversation,
    queryFn: async () => {
      if (!activeConversation) return { items: [] as Message[], isMock: true };
      if (activeConversation.bookingId.startsWith('demo-')) {
        return { items: buildDemoMessages(activeConversation.vendorId), isMock: true };
      }
      try {
        const res = await chatApi.getMessages(activeConversation.bookingId);
        const raw = res.data?.data?.messages ?? res.data?.data ?? res.data;
        const items = Array.isArray(raw)
          ? raw.map((item) => normalizeMessage(item as ChatMessage, user?.id))
          : [];
        return { items: items.length > 0 ? items : buildDemoMessages(activeConversation.vendorId), isMock: items.length === 0 };
      } catch {
        return { items: buildDemoMessages(activeConversation.vendorId), isMock: true };
      }
    },
    retry: 0,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (messagesQuery.data?.items) {
      setMessages(messagesQuery.data.items);
    } else if (!activeConversation) {
      setMessages([]);
    }
  }, [messagesQuery.data, activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!user) return;
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    const socket = io(process.env.NEXT_PUBLIC_CHAT_URL || 'http://localhost:4010', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      autoConnect: true,
      auth: { token },
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      socketRef.current = socket;
      toast.success('Connected to chat service', { duration: 1500 });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('connect_error', () => {
      setSocketConnected(false);
      socket.disconnect();
    });

    socket.on('message:new', (incoming: ChatMessage) => {
      const normalized = normalizeMessage(incoming, user.id);
      if (normalized.senderId !== user.id && incoming.conversationId === activeConversation?.bookingId) {
        setIsTyping(false);
      }

      setMessages((prev) => {
        const pendingIndex = prev.findIndex((message) => message.status === 'sending' && message.senderId === user.id && message.text === normalized.text);
        if (pendingIndex >= 0) {
          const updated = [...prev];
          updated[pendingIndex] = { ...normalized, status: 'sent' };
          return updated;
        }
        if (prev.some((message) => message.id === normalized.id)) return prev;
        return [...prev, normalized];
      });

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.bookingId === incoming.conversationId
            ? {
                ...conversation,
                lastMessage: normalized.contentType === 'image' ? '📷 Image' : normalized.contentType === 'file' ? '📎 Attachment' : normalized.text,
                lastMessageAt: normalized.sentAt,
                unread: conversation.vendorId === vendorId || normalized.senderId === user.id ? 0 : conversation.unread + 1,
              }
            : conversation,
        ),
      );

      void queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    });

    socket.on('typing:start', () => setIsTyping(true));
    socket.on('typing:stop', () => setIsTyping(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [queryClient, user]);

  useEffect(() => {
    if (!socketConnected || !activeConversation || activeConversation.bookingId.startsWith('demo-')) return;
    socketRef.current?.emit('join:conversation', activeConversation.bookingId);
  }, [activeConversation, socketConnected]);

  useEffect(() => {
    if (!socketConnected || !activeConversation || activeConversation.bookingId.startsWith('demo-')) return;
    if (!newMessage.trim()) {
      socketRef.current?.emit('typing:stop', activeConversation.bookingId);
      return;
    }

    socketRef.current?.emit('typing:start', activeConversation.bookingId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', activeConversation.bookingId);
    }, 1200);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeConversation, newMessage, socketConnected]);

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

  const isDemoMode = conversationsQuery.data?.isMock || messagesQuery.data?.isMock || !socketConnected;
  const isActiveVendorOnline = Boolean(socketConnected || vendor?.online);

  const updateConversationPreview = useCallback((conversationId: string, preview: string, sentAt: string) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.bookingId === conversationId
          ? { ...conversation, lastMessage: preview, lastMessageAt: sentAt, unread: 0 }
          : conversation,
      ),
    );
  }, []);

  const handleSend = useCallback(async () => {
    const text = newMessage.trim();
    if (!text || !activeConversation || !user) return;

    const contentType = detectContentType(text);
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      senderRole: user.role,
      text,
      sentAt: new Date().toISOString(),
      status: 'sending',
      contentType,
    };

    setMessages((prev) => [...prev, userMsg]);
    setNewMessage('');
    inputRef.current?.focus();
    updateConversationPreview(
      activeConversation.bookingId,
      contentType === 'image' ? '📷 Image' : contentType === 'file' ? '📎 Attachment' : text,
      userMsg.sentAt,
    );

    if (socketConnected && !activeConversation.bookingId.startsWith('demo-')) {
      socketRef.current?.emit('message:send', {
        bookingId: activeConversation.bookingId,
        content: text,
        contentType: contentType === 'file' ? 'document' : contentType,
      });

      setTimeout(() => {
        setMessages((prev) => prev.map((message) => (message.id === userMsg.id ? { ...message, status: 'sent' } : message)));
      }, 400);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
    setMessages((prev) => prev.map((message) => (message.id === userMsg.id ? { ...message, status: 'sent' } : message)));

    setIsTyping(true);
    const delay = 1200 + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    setIsTyping(false);

    const replies = [
      'Sounds great! Let me check on that for you.',
      'Sure, I\'ll get back to you with the details shortly!',
      'Thank you for the information. Let me prepare a quote.',
      'Wonderful choice! I\'ll confirm availability right away.',
      'Got it! I\'ll share the options with you today. 😊',
    ];

    const vendorReply: Message = {
      id: `demo-${Date.now()}`,
      senderId: activeConversation.vendorId,
      senderRole: 'vendor',
      text: replies[Math.floor(Math.random() * replies.length)],
      sentAt: new Date().toISOString(),
      status: 'read',
      contentType: 'text',
    };

    setMessages((prev) => [
      ...prev.map((message) => (message.id === userMsg.id ? { ...message, status: 'read' as const } : message)),
      vendorReply,
    ]);
    updateConversationPreview(activeConversation.bookingId, vendorReply.text, vendorReply.sentAt);
  }, [activeConversation, newMessage, socketConnected, updateConversationPreview, user]);

  const handleFileAttach = useCallback((file: File, type: 'image' | 'file') => {
    if (!activeConversation || !user) return;

    const maxSize = type === 'image' ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Max ${type === 'image' ? '10MB' : '25MB'}.`);
      return;
    }

    const previewUrl = type === 'image' ? URL.createObjectURL(file) : file.name;
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      senderRole: user.role,
      text: previewUrl,
      sentAt: new Date().toISOString(),
      status: 'sending',
      contentType: type,
    };

    setMessages((prev) => [...prev, userMsg]);
    updateConversationPreview(
      activeConversation.bookingId,
      type === 'image' ? '📷 Image' : `📎 ${file.name}`,
      userMsg.sentAt,
    );

    if (socketConnected && !activeConversation.bookingId.startsWith('demo-')) {
      socketRef.current?.emit('message:send', {
        bookingId: activeConversation.bookingId,
        content: previewUrl,
        contentType: type === 'file' ? 'document' : 'image',
      });
    }

    setTimeout(() => {
      setMessages((prev) => prev.map((m) => (m.id === userMsg.id ? { ...m, status: 'sent' } : m)));
      toast.success(`${type === 'image' ? 'Image' : 'File'} sent!`);
    }, 600);
  }, [activeConversation, socketConnected, updateConversationPreview, user]);

  const selectConversation = useCallback((vid: string) => {
    router.push(`/chat?vendorId=${vid}`);
    setSidebarOpen(false);
    setConversations((prev) => prev.map((conversation) => (conversation.vendorId === vid ? { ...conversation, unread: 0 } : conversation)));
  }, [router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="h-[calc(100dvh-64px)] bg-gray-100 flex overflow-hidden">
        <aside className="hidden md:flex flex-col w-80 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Messages</h2>
              <p className="text-xs text-gray-400">{conversations.length} conversation{conversations.length === 1 ? '' : 's'}</p>
            </div>
            {isDemoMode && <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Demo mode</span>}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                active={vendorId === conversation.vendorId}
                onClick={() => selectConversation(conversation.vendorId)}
                isOnline={conversation.vendorId === vendorId ? isActiveVendorOnline : Boolean(VENDORS[conversation.vendorId]?.online)}
              />
            ))}
          </div>
        </aside>

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
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Messages</h2>
                    <p className="text-xs text-gray-400">{conversations.length} conversation{conversations.length === 1 ? '' : 's'}</p>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-100"
                    aria-label="Close conversations panel"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {conversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      active={vendorId === conversation.vendorId}
                      onClick={() => selectConversation(conversation.vendorId)}
                      isOnline={conversation.vendorId === vendorId ? isActiveVendorOnline : Boolean(VENDORS[conversation.vendorId]?.online)}
                    />
                  ))}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <section className="flex-1 flex flex-col min-w-0 bg-white">
          {!vendor ? (
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
                  <span className={clsx('absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full', isActiveVendorOnline ? 'bg-green-500' : 'bg-gray-300')} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{vendor.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {isTyping ? (
                      <span className="text-green-500 font-medium">typing…</span>
                    ) : isActiveVendorOnline ? (
                      <span className="text-green-500">Online now</span>
                    ) : (
                      'Offline'
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setShowSearch(!showSearch); setMessageSearch(''); }}
                    className={clsx('p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer', showSearch ? 'text-brand-600 bg-brand-50' : 'text-gray-500 hover:text-brand-600')}
                    aria-label="Search messages"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toast('Voice calls coming soon! Use chat for now.', { icon: '📞' })}
                    className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-brand-600 cursor-pointer"
                    aria-label="Voice call — coming soon"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toast('Video calls coming soon! Use chat for now.', { icon: '📹' })}
                    className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-brand-600 cursor-pointer"
                    aria-label="Video call — coming soon"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {showSearch && (
                <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    placeholder="Search in conversation…"
                    className="flex-1 text-sm bg-transparent focus:outline-none"
                    autoFocus
                  />
                  {messageSearch && (
                    <span className="text-xs text-gray-400">
                      {messages.filter((m) => m.contentType === 'text' && m.text.toLowerCase().includes(messageSearch.toLowerCase())).length} found
                    </span>
                  )}
                  <button onClick={() => { setShowSearch(false); setMessageSearch(''); }} className="p-1 rounded hover:bg-gray-100">
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              )

              {isDemoMode && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-xs text-amber-700">
                  <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  Demo mode — using fallback chat data while the live backend is unavailable
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#f0f2f5]">
                <AnimatePresence initial={false}>
                  {groupedMessages.map((group) => (
                    <div key={group.date}>
                      <DateSeparator label={group.label} />
                      {group.messages.map((msg) => {
                        const isUser = msg.senderId === user?.id;
                        const searchMatch = messageSearch && msg.contentType === 'text' && msg.text.toLowerCase().includes(messageSearch.toLowerCase());
                        const dimmed = messageSearch && !searchMatch;
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                            animate={{ opacity: dimmed ? 0.3 : 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.25 }}
                            className={clsx('flex mb-2', isUser ? 'justify-end' : 'justify-start', searchMatch && 'ring-2 ring-yellow-400 rounded-2xl')}
                          >
                            <MessageBubble msg={msg} isUser={Boolean(isUser)} />
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </AnimatePresence>

                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              <div className="bg-white border-t border-gray-200 px-3 py-2.5 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {QUICK_ENQUIRY_TEMPLATES.map((template) => (
                    <button
                      key={template}
                      onClick={() => {
                        setNewMessage(template);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition"
                    >
                      {template}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileAttach(file, 'image');
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-brand-600 transition cursor-pointer"
                    aria-label="Attach image"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileAttach(file, 'file');
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-brand-600 transition cursor-pointer"
                    aria-label="Attach file"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder="Type a message…"
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                    aria-label="Message input"
                  />

                  <button
                    onClick={() => void handleSend()}
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

export default function ChatPage() {
  return <Suspense><ChatPageInner /></Suspense>;
}
