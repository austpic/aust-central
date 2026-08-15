import { existsSync } from 'node:fs';
import { z } from 'zod';

/**
 * Environment contract.
 *
 * Every value the server needs is declared here and validated once, at boot.
 * A missing or weak secret must crash the process immediately — a server that
 * starts with a default signing key is worse than one that refuses to start.
 */

/**
 * Load `.env` for local development.
 *
 * Uses Node's built-in loader (21+) rather than a dependency. Real deployments
 * inject variables through the orchestrator and ship no .env file at all, so a
 * missing file is normal and never fatal here — the schema below is what
 * decides whether the process may start.
 *
 * Values already present in the environment win: `loadEnvFile` does not
 * overwrite them, so an explicit `DATABASE_URL=... npm start` still overrides
 * the file, and the test harness's variables are never clobbered.
 */
if (!process.env.SKIP_DOTENV && existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch (error) {
    console.warn(`Could not read .env: ${error.message}`);
  }
}

const csv = (value) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

/** Secrets must be long enough that brute-forcing the signature is not viable. */
const secret = (name) =>
  z
    .string({ required_error: `${name} is required` })
    .min(32, `${name} must be at least 32 characters`);

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),

    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),

    // Public origin of the API itself, used to build links in outbound email.
    PUBLIC_URL: z.string().url().default('http://localhost:3000'),

    DATABASE_URL: z
      .string({ required_error: 'DATABASE_URL is required' })
      .startsWith('postgres', 'DATABASE_URL must be a PostgreSQL connection string'),

    // --- Auth ---------------------------------------------------------------
    JWT_ACCESS_SECRET: secret('JWT_ACCESS_SECRET'),
    // Kept separate from the access secret so rotating one does not invalidate
    // the other, and so a leaked access secret cannot mint refresh tokens.
    JWT_ACCESS_TTL: z.string().default('15m'),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

    /**
     * Server-side pepper mixed into every password hash. Unlike the per-user
     * salt (which argon2 stores alongside the hash), this never touches the
     * database — a stolen dump alone is not enough to mount an offline attack.
     */
    PASSWORD_PEPPER: secret('PASSWORD_PEPPER'),

    PASSWORD_MIN_LENGTH: z.coerce.number().int().min(8).default(10),

    // Restrict registration to university addresses when set, e.g. "aust.edu".
    ALLOWED_EMAIL_DOMAIN: z.string().optional(),

    // --- Transport / CORS ---------------------------------------------------
    // Comma-separated allowlist. Never "*" — credentials ride on these requests.
    CORS_ORIGINS: z.string().default('http://localhost:3000').transform(csv),

    // --- Rate limiting ------------------------------------------------------
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    RATE_LIMIT_WINDOW: z.string().default('1 minute'),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
    AUTH_RATE_LIMIT_WINDOW: z.string().default('15 minutes'),

    // --- Uploads ------------------------------------------------------------
    STORAGE_DIR: z.string().default('./storage'),
    MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
    MAX_UPLOADS_PER_REQUEST: z.coerce.number().int().positive().default(6),

    // --- Mail ---------------------------------------------------------------
    // Optional in development: with no host configured the mailer logs to
    // stdout instead of sending, so password reset is still testable locally.
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_SECURE: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'),
    MAIL_FROM: z.string().default('AUST Central <no-reply@aust-central.local>'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;

    // Production-only invariants. These are the mistakes that ship quietly.
    if (env.CORS_ORIGINS.includes('*')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGINS'],
        message: 'CORS_ORIGINS may not be "*" in production',
      });
    }

    if (env.JWT_ACCESS_SECRET === env.PASSWORD_PEPPER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['PASSWORD_PEPPER'],
        message: 'PASSWORD_PEPPER must differ from JWT_ACCESS_SECRET',
      });
    }

    if (!env.SMTP_HOST) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SMTP_HOST'],
        message: 'SMTP_HOST is required in production — password reset depends on it',
      });
    }

    if (!env.PUBLIC_URL.startsWith('https://')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['PUBLIC_URL'],
        message: 'PUBLIC_URL must use https in production',
      });
    }
  });

/**
 * Parse and freeze the environment.
 *
 * @param {NodeJS.ProcessEnv} source
 * @returns {Readonly<z.infer<typeof schema>>}
 */
export function loadEnv(source = process.env) {
  const result = schema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    // Deliberately not using the logger: it is not built yet at this point.
    console.error(`Invalid environment configuration:\n${details}`);
    throw new Error('Invalid environment configuration');
  }

  return Object.freeze(result.data);
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
