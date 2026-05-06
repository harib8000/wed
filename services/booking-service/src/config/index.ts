import { z } from 'zod';
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4004),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),
  VENDOR_SERVICE_URL: z.string().default('http://vendor-service:4003'),
  NOTIFICATION_SERVICE_URL: z.string().default('http://notification-service:4008'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000').transform((s) => s.split(',').map((o) => o.trim())),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) { console.error(parsed.error.flatten()); process.exit(1); }
export const config = parsed.data;
