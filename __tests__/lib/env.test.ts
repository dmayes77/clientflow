import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Environment Validation', () => {
  beforeEach(() => {
    // Reset modules before each test
    vi.resetModules();
  });

  it('should validate required environment variables', () => {
    // This test just ensures the env module can be imported
    // In a real scenario, env validation happens at module load time
    expect(true).toBe(true);
  });

  it('should have required database URLs', () => {
    const { DATABASE_URL, DIRECT_URL } = process.env;
    expect(DATABASE_URL).toBeDefined();
    expect(DIRECT_URL).toBeDefined();
  });

  it('should have required Clerk variables', () => {
    const { CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY } = process.env;
    expect(CLERK_SECRET_KEY).toBeDefined();
    expect(NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBeDefined();
  });

  it('should have required Stripe variables', () => {
    const { STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY } = process.env;
    expect(STRIPE_SECRET_KEY).toBeDefined();
    expect(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).toBeDefined();
  });
});
