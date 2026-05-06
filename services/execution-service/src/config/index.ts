import { z } from 'zod';
const e = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4006),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000').transform((s) => s.split(',').map((o) => o.trim())),
});
const p = e.safeParse(process.env);
if (!p.success) { console.error(p.error.flatten()); process.exit(1); }
export const config = p.data;
