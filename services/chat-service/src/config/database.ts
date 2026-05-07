import mongoose from 'mongoose';
import { config } from './index';

export async function connectMongo(): Promise<void> {
  await mongoose.connect(config.MONGODB_URL);
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

// Message schema
const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderRole: { type: String, enum: ['customer', 'vendor', 'admin'], required: true },
  content: { type: String, required: true, maxlength: 2000 },
  contentType: { type: String, enum: ['text', 'image', 'document'], default: 'text' },
  mediaUrl: { type: String },
  readBy: [{ userId: String, readAt: Date }],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: -1 });

// Conversation schema
const conversationSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  vendorId: { type: String, required: true },
  lastMessage: { type: String },
  lastMessageAt: { type: Date },
  customerUnread: { type: Number, default: 0 },
  vendorUnread: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

conversationSchema.index({ customerId: 1 });
conversationSchema.index({ vendorId: 1 });

export const Message = mongoose.model('Message', messageSchema);
export const Conversation = mongoose.model('Conversation', conversationSchema);
