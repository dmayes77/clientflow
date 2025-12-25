import { z } from 'zod';

/**
 * Environment variable validation schema
 * Validates all required environment variables at build/runtime
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
  DIRECT_URL: z.string().url('Invalid DIRECT_URL'),

  // Clerk Auth
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().min(1),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().min(1),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'Invalid STRIPE_SECRET_KEY'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'Invalid STRIPE_PUBLISHABLE_KEY'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'Invalid STRIPE_WEBHOOK_SECRET'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  // Email
  RESEND_API_KEY: z.string().startsWith('re_', 'Invalid RESEND_API_KEY'),
  FROM_EMAIL: z.string().email('Invalid FROM_EMAIL'),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),

  // Internal
  INTERNAL_API_KEY: z.string().min(1),
  ADMIN_PASSCODE: z.string().min(1),

  // Public URLs
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid NEXT_PUBLIC_APP_URL'),
  NEXT_PUBLIC_API_URL: z.string().url('Invalid NEXT_PUBLIC_API_URL'),

  // Admin
  ADMIN_USER_IDS: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Validated environment variables
 * Use this instead of process.env to get type-safe access to env vars
 */
export const env = (() => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        return `  - ${err.path.join('.')}: ${err.message}`;
      });

      console.error('❌ Invalid environment variables:\n' + missingVars.join('\n'));

      // In production, fail hard
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Missing required environment variables');
      }

      // In development, warn but continue
      console.warn('⚠️  Continuing with invalid environment variables (development mode)');
    }

    // Return process.env as fallback (unvalidated)
    return process.env as z.infer<typeof envSchema>;
  }
})();

/**
 * Server-only environment variables
 * These should never be exposed to the client
 */
export const serverEnv = {
  DATABASE_URL: env.DATABASE_URL,
  DIRECT_URL: env.DIRECT_URL,
  CLERK_SECRET_KEY: env.CLERK_SECRET_KEY,
  STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
  CLOUDINARY_API_SECRET: env.CLOUDINARY_API_SECRET,
  RESEND_API_KEY: env.RESEND_API_KEY,
  GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
  INTERNAL_API_KEY: env.INTERNAL_API_KEY,
  ADMIN_PASSCODE: env.ADMIN_PASSCODE,
} as const;

/**
 * Client-safe environment variables
 * These are safe to expose to the browser
 */
export const clientEnv = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,
} as const;
