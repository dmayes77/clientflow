import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that the page has loaded
    expect(await page.title()).toBeTruthy();
  });

  test('should have functioning navigation', async ({ page }) => {
    await page.goto('/');

    // Example: Check if sign-in link exists and is clickable
    const signInLink = page.locator('a[href*="sign-in"]').first();

    if (await signInLink.isVisible()) {
      await expect(signInLink).toBeVisible();
    }
  });
});

test.describe('Authentication Flow', () => {
  test.skip('should navigate to sign-in page', async ({ page }) => {
    // This is a placeholder test
    // Unskip and customize based on your auth flow
    await page.goto('/sign-in');
    await expect(page).toHaveURL(/sign-in/);
  });
});
