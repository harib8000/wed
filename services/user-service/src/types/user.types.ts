import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().datetime().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  // Couple fields
  partnerName: z.string().max(100).optional(),
  weddingDate: z.string().datetime().optional(),
  estimatedBudgetPaise: z.number().int().positive().optional(),
  guestCount: z.number().int().positive().max(100000).optional(),
  venueCity: z.string().max(100).optional(),
  // Vendor fields
  businessName: z.string().max(200).optional(),
  businessCity: z.string().max(100).optional(),
});

export const UpdateNotifPrefsSchema = z.object({
  whatsappNotif: z.boolean().optional(),
  emailNotif: z.boolean().optional(),
  pushNotif: z.boolean().optional(),
  smsNotif: z.boolean().optional(),
});

export const RegisterPushTokenSchema = z.object({
  token: z.string().min(10),
  platform: z.enum(['ios', 'android', 'web']),
  deviceId: z.string().max(200).optional(),
});

export const UploadKycSchema = z.object({
  docType: z.enum(['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'GSTIN', 'BANK_STATEMENT']),
  contentType: z.string().regex(/^image\/(jpeg|png|webp)|application\/pdf$/),
});

export const CreateChecklistItemSchema = z.object({
  title: z.string().min(1).max(300),
  detail: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  daysBeforeEvent: z.number().int().min(0).optional(),
  isDone: z.boolean().optional(),
});

export const UpdateChecklistItemSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  detail: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  daysBeforeEvent: z.number().int().min(0).optional(),
  isDone: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type UpdateNotifPrefsInput = z.infer<typeof UpdateNotifPrefsSchema>;
