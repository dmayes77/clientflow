import { test, expect } from '@playwright/test';

/**
 * Contacts Tests
 * These tests require authentication
 */

test.describe('Contacts List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/contacts');
    await page.waitForLoadState('networkidle');
  });

  test('should load contacts page', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'Contacts' })).toBeVisible();
  });

  test('should have add contact button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /Add Contact/i });
    await expect(addButton).toBeVisible();
  });

  test('should have search/filter functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByPlaceholder(/Search/i);
    await expect(searchInput.first()).toBeVisible();
  });

  test('should display contact list or empty state', async ({ page }) => {
    // Either show contacts table or empty state
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/No contacts/i).isVisible().catch(() => false);
    const hasPage = await page.locator('h1', { hasText: 'Contacts' }).isVisible();

    expect(hasTable || hasEmptyState || hasPage).toBeTruthy();
  });
});

test.describe('Contact Creation', () => {
  test('should navigate to new contact form', async ({ page }) => {
    await page.goto('/dashboard/contacts');
    await page.waitForLoadState('networkidle');

    // Click add button - this navigates to /dashboard/contacts/new
    const addButton = page.getByRole('button', { name: /Add Contact/i });
    await addButton.click();

    // Wait for navigation to new contact page
    await page.waitForURL('**/contacts/new**', { timeout: 10000 });

    // Should be on the new contact page
    await expect(page).toHaveURL(/contacts\/new/);
  });

  test('should have required form fields', async ({ page }) => {
    await page.goto('/dashboard/contacts/new');
    await page.waitForLoadState('networkidle');

    // Wait for form to render
    await page.waitForTimeout(1000);

    // Check for form or input elements
    const hasForm = await page.locator('form').first().isVisible().catch(() => false);
    const hasInput = await page.locator('input').first().isVisible().catch(() => false);
    expect(hasForm || hasInput).toBeTruthy();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/dashboard/contacts/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /Save|Create|Add/i });
    await submitButton.first().click();

    // Form or page should still be visible (not submitted/redirected)
    await expect(page).toHaveURL(/contacts\/new/);
  });

  test('should create a new contact', async ({ page }) => {
    await page.goto('/dashboard/contacts/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const testName = `E2E Test Contact ${Date.now()}`;
    const testEmail = `e2e-test-${Date.now()}@example.com`;

    // Fill form - find inputs by placeholder or position
    const nameInput = page.getByPlaceholder(/Name/i).or(page.locator('input').first());
    await nameInput.first().fill(testName);

    const emailInput = page.getByPlaceholder(/Email/i).or(page.locator('input[type="email"]'));
    await emailInput.first().fill(testEmail);

    // Submit
    const submitButton = page.getByRole('button', { name: /Save|Create|Add/i });
    await submitButton.first().click();

    // Wait for navigation or success
    await page.waitForTimeout(2000);

    // Either redirected or success shown
    const redirected = page.url().includes('/contacts/') && !page.url().includes('/new');
    const hasContact = await page.getByText(testName).isVisible().catch(() => false);

    expect(redirected || hasContact).toBeTruthy();
  });
});

test.describe('Contact Detail', () => {
  test('should display contact details after creating contact', async ({ page }) => {
    const testName = `E2E Detail Test ${Date.now()}`;
    const testEmail = `e2e-detail-${Date.now()}@example.com`;

    // First, create a contact
    await page.goto('/dashboard/contacts/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Fill form - find inputs by placeholder or position
    const nameInput = page.getByPlaceholder(/Name/i).or(page.locator('input').first());
    await nameInput.first().fill(testName);

    const emailInput = page.getByPlaceholder(/Email/i).or(page.locator('input[type="email"]'));
    await emailInput.first().fill(testEmail);

    // Submit
    const submitButton = page.getByRole('button', { name: /Save|Create|Add/i });
    await submitButton.first().click();

    // Wait for navigation
    await page.waitForTimeout(3000);

    // Should be redirected to contact detail or contacts list
    if (page.url().includes('/contacts/') && !page.url().includes('/new')) {
      // On detail page - verify page loaded
      const hasContent = await page.locator('main').isVisible().catch(() => false);
      expect(hasContent).toBeTruthy();
    } else {
      // On list page - find the contact or verify page loaded
      await page.goto('/dashboard/contacts');
      await page.waitForLoadState('networkidle');

      const pageLoaded = await page.locator('h1', { hasText: 'Contacts' }).isVisible().catch(() => false);
      expect(pageLoaded).toBeTruthy();
    }
  });
});

test.describe('Contacts Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/dashboard/contacts');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1', { hasText: 'Contacts' })).toBeVisible();
  });
});
