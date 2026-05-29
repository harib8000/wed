import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // JWT
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PRIVATE_KEY_PATH: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // OTP
  MSG91_AUTH_KEY: z.string().default(''),
  MSG91_OTP_TEMPLATE_ID: z.string().default(''),
  OTP_TTL_MINUTES: z.coerce.number().default(10),
  OTP_RATE_LIMIT_MAX: z.coerce.number().default(3),
  OTP_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().default(10),
  OTP_LOCKOUT_MAX_ATTEMPTS: z.coerce.number().default(5),
  OTP_LOCKOUT_DURATION_MINUTES: z.coerce.number().default(30),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // CORS
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3001,http://localhost:3002')
    .transform((s) => s.split(',').map((o) => o.trim())),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors;
  console.error('[Config] Invalid environment variables:', JSON.stringify(errors, null, 2));
  process.exit(1);
}

export const config = {
  ...parsed.data,
  sentryDsn: process.env.SENTRY_DSN || '',
};
export type Config = typeof config;
