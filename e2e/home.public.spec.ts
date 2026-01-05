import { test, expect } from '@playwright/test';

/**
 * Public/Marketing Site Tests
 * These tests don't require authentication
 */

test.describe('Marketing Site', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should have a title
    expect(await page.title()).toBeTruthy();

    // Should have main content
    await expect(page.locator('main')).toBeVisible();
  });

  test('should have navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for common nav elements
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('should have sign-in link', async ({ page }) => {
    await page.goto('/');

    const signInLink = page.locator('a[href*="sign-in"]').first();
    if (await signInLink.isVisible()) {
      await expect(signInLink).toBeEnabled();
    }
  });

  test('should have sign-up link', async ({ page }) => {
    await page.goto('/');

    const signUpLink = page.locator('a[href*="sign-up"]').first();
    if (await signUpLink.isVisible()) {
      await expect(signUpLink).toBeEnabled();
    }
  });
});

test.describe('Sign In Page', () => {
  test('should load sign-in page', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Should have some form element for sign-in
    const signInForm = page.locator('form, [data-clerk], input[type="email"], input[placeholder*="Email"]');
    await expect(signInForm.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Sign Up Page', () => {
  test('should load sign-up page', async ({ page }) => {
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');

    // Should have form inputs for sign-up
    const firstNameInput = page.getByRole('textbox', { name: /first name/i });
    await expect(firstNameInput).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Roadmap Page', () => {
  test('should load public roadmap', async ({ page }) => {
    await page.goto('/roadmap');
    await page.waitForLoadState('networkidle');

    // Should have roadmap content
    expect(await page.title()).toContain('Roadmap');
  });
});
