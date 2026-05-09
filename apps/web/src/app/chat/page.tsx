'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Paperclip, Phone, Video, MoreVertical } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  senderId: string;
  text: string;
  sentAt: string;
  isRead: boolean;
}

// Demo messages for development
const DEMO_MESSAGES: Message[] = [
  { id: '1', senderId: 'vendor', text: 'Hi! Thank you for your interest. How can I help you with your wedding plans?', sentAt: new Date(Date.now() - 3600000).toISOString(), isRead: true },
  { id: '2', senderId: 'user', text: 'We\'re looking for availability in March. Can you check your calendar?', sentAt: new Date(Date.now() - 3000000).toISOString(), isRead: true },
  { id: '3', senderId: 'vendor', text: 'Of course! March is mostly available. Could you share the exact date and approximate guest count?', sentAt: new Date(Date.now() - 2400000).toISOString(), isRead: true },
];

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const vendorId = searchParams.get('vendorId');
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      senderId: 'user',
      text: newMessage.trim(),
      sentAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, msg]);
    setNewMessage('');
    setSending(true);
    try {
      // TODO: Replace with real API call when chat-service is ready
      // await api.post(`/chat/${vendorId}/messages`, { text: msg.text });
      await new Promise((r) => setTimeout(r, 300)); // simulated delay
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div>;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-2xl mx-auto bg-white min-h-screen flex flex-col">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-gray-100 transition">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
              V
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">Vendor</p>
              <p className="text-xs text-green-500">Online</p>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition" onClick={() => toast('Voice call coming soon')}>
                <Phone className="w-4 h-4 text-gray-500" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition" onClick={() => toast('Video call coming soon')}>
                <Video className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg) => {
              const isUser = msg.senderId === 'user';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isUser ? 'bg-brand-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}>
                    <p>{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${isUser ? 'text-white/60' : 'text-gray-400'}`}>{formatTime(msg.sentAt)}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Compose */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition" onClick={() => toast('File attachments coming soon')}>
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="p-2.5 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
