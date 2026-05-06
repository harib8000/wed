import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4003),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  ELASTICSEARCH_URL: z.string().default('http://elasticsearch:9200'),
  ELASTICSEARCH_INDEX: z.string().default('vendors'),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET: z.string().default('wedding-os-dev'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3001')
    .transform((s) => s.split(',').map((o) => o.trim())),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('[Config]', JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}
export const config = parsed.data;
