import { z } from 'zod';
const e = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4009),
  DATABASE_URL: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  VENDOR_SERVICE_URL: z.string().default('http://vendor-service:4003'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000').transform((s) => s.split(',').map((o) => o.trim())),
});
const p = e.safeParse(process.env);
if (!p.success) { console.error(p.error.flatten()); process.exit(1); }
export const config = p.data;
