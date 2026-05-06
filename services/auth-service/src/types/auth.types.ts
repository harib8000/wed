import { z } from 'zod';

export const SendOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, 'Phone must be in format +91XXXXXXXXXX'),
});

export const VerifyOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, 'Phone must be in format +91XXXXXXXXXX'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
  deviceId: z.string().optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').optional(),
  // also accepted from httpOnly cookie; this is fallback body
});

export const RegisterVendorSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Phone must be in format +91XXXXXXXXXX'),
  businessName: z.string().min(2).max(255),
  category: z.enum([
    'venue', 'catering', 'photography', 'videography', 'decor',
    'makeup', 'mehendi', 'music', 'transport', 'invitation', 'priest', 'other',
  ]),
  city: z.string().min(2).max(100),
});

export const GoogleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
  deviceId: z.string().optional(),
});

export type SendOtpInput = z.infer<typeof SendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type RegisterVendorInput = z.infer<typeof RegisterVendorSchema>;
