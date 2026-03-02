import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const serverEnv = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    WAHA_BASE_URL: z.url().default('http://localhost:3000/api'),
    WAHA_API_KEY: z.string().min(16),
    WAHA_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    WAHA_DEFAULT_SESSION: z.string().default('default'),
    WAHA_WEBHOOK_SECRET: z.string().min(8).optional(),
    WAHA_WEBHOOK_URL: z.string().url().optional(),
    WAHA_CONTACTS_DB_PATH: z.string().optional(),
    CALCOM_API_BASE_URL: z.string().url().optional(),
    CALCOM_API_KEY: z.string().min(8).optional(),
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    WAHA_BASE_URL: process.env.WAHA_BASE_URL,
    WAHA_API_KEY: process.env.WAHA_API_KEY,
    WAHA_TIMEOUT_MS: process.env.WAHA_TIMEOUT_MS,
    WAHA_DEFAULT_SESSION: process.env.WAHA_DEFAULT_SESSION,
    WAHA_WEBHOOK_SECRET: process.env.WAHA_WEBHOOK_SECRET,
    WAHA_WEBHOOK_URL: process.env.WAHA_WEBHOOK_URL,
    WAHA_CONTACTS_DB_PATH: process.env.WAHA_CONTACTS_DB_PATH,
    CALCOM_API_BASE_URL: process.env.CALCOM_API_BASE_URL,
    CALCOM_API_KEY: process.env.CALCOM_API_KEY,
  },
});
