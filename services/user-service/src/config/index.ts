import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4002),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET: z.string().default('wedding-os-dev'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3001,http://localhost:3002')
    .transform((s) => s.split(',').map((o) => o.trim())),
  AUTH_SERVICE_URL: z.string().default('http://auth-service:4001'),
  VENDOR_SERVICE_URL: z.string().default('http://vendor-service:4003'),
  BOOKING_SERVICE_URL: z.string().default('http://booking-service:4004'),
  PAYMENT_SERVICE_URL: z.string().default('http://payment-service:4005'),
  REVIEW_SERVICE_URL: z.string().default('http://review-service:4009'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('[Config] Invalid env:', JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}
export const config = {
  ...parsed.data,
  sentryDsn: process.env.SENTRY_DSN || '',
};
