import { z } from 'zod';

const e = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4012),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_ACCESS_KEY_ID: z.string().default('local-dev-key'),
  AWS_SECRET_ACCESS_KEY: z.string().default('local-dev-secret'),
  S3_BUCKET: z.string().default('weddingos-dev-media'),
  S3_ENDPOINT: z.string().optional(), // for local MinIO
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000').transform((s) => s.split(',').map((o) => o.trim())),
});

const parsed = e.safeParse(process.env);
if (!parsed.success) { console.error(parsed.error.flatten()); process.exit(1); }
export const config = {
  ...parsed.data,
  sentryDsn: process.env.SENTRY_DSN || '',
};
