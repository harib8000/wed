import { z } from 'zod';
const e = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4008),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  // FCM
  FIREBASE_ADMIN_CREDENTIALS: z.string().optional(), // JSON string
  FIREBASE_PROJECT_ID: z.string().optional(),
  // MSG91 SMS + WhatsApp
  MSG91_AUTH_KEY: z.string().default(''),
  MSG91_SENDER_ID: z.string().default('WEDDOS'),
  MSG91_WHATSAPP_NUMBER: z.string().default(''),
  // SendGrid
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().default('noreply@weddingosx.com'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000').transform((s) => s.split(',').map((o) => o.trim())),
});
const p = e.safeParse(process.env);
if (!p.success) { console.error(p.error.flatten()); process.exit(1); }
export const config = p.data;
