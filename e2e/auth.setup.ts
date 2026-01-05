import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { createClerkClient } from '@clerk/backend';

const authFile = path.join(__dirname, '../.playwright/.auth/user.json');

/**
 * Global auth setup - runs once before all tests
 * Uses Clerk's Backend API to create a sign-in token, bypassing 2FA
 *
 * Required environment variables:
 * - E2E_TEST_EMAIL: Test user email
 * - CLERK_SECRET_KEY: Clerk secret key for Backend API
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!email) {
    console.warn('⚠️  E2E_TEST_EMAIL not set.');
    console.warn('   Set this in .env.local or as environment variables.');
    console.warn('   Skipping authenticated tests.');
    return;
  }

  if (!secretKey) {
    console.warn('⚠️  CLERK_SECRET_KEY not set.');
    console.warn('   Required for E2E authentication bypass.');
    console.warn('   Skipping authenticated tests.');
    return;
  }

  // Initialize Clerk Backend client
  const clerkClient = createClerkClient({ secretKey });

  // Get user by email
  const users = await clerkClient.users.getUserList({
    emailAddress: [email],
  });

  if (users.data.length === 0) {
    console.error(`❌ No user found with email: ${email}`);
    return;
  }

  const user = users.data[0];
  console.log(`✅ Found user: ${user.id} (${user.emailAddresses[0]?.emailAddress})`);

  // Create a sign-in token that bypasses 2FA
  const signInToken = await clerkClient.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 300, // 5 minutes
  });

  console.log('✅ Created sign-in token');

  // Get base URL from playwright config
  const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  // Navigate to sign-in page with the ticket
  const signInUrl = `${baseURL}/sign-in?__clerk_ticket=${signInToken.token}`;
  console.log('📍 Navigating to sign-in with ticket...');

  await page.goto(signInUrl);

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 30000 });

  // Verify we're on the dashboard by checking for dashboard sidebar elements
  await expect(page.locator('a[href="/dashboard/contacts"], a:has-text("Contacts")')).toBeVisible({ timeout: 10000 });

  console.log('✅ Successfully authenticated');

  // Save signed-in state
  await page.context().storageState({ path: authFile });
});
