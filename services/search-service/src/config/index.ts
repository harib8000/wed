import { z } from 'zod';

const e = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4011),
  ELASTICSEARCH_URL: z.string().default('http://localhost:9200'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000').transform((s) => s.split(',').map((o) => o.trim())),
});

const parsed = e.safeParse(process.env);
if (!parsed.success) { console.error(parsed.error.flatten()); process.exit(1); }
export const config = {
  ...parsed.data,
  sentryDsn: process.env.SENTRY_DSN || '',
};
