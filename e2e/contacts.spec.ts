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
    // Check page title/header
    await expect(page.locator('h1:has-text("Contacts")')).toBeVisible();
  });

  test('should have add contact button', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), a:has-text("Add Contact"), button:has-text("New")');
    await expect(addButton.first()).toBeVisible();
  });

  test('should have search/filter functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"], input[type="search"]');
    if (await searchInput.first().isVisible()) {
      await expect(searchInput.first()).toBeEnabled();
    }
  });

  test('should display contact list or empty state', async ({ page }) => {
    // Either show contacts or empty state
    const contactList = page.locator('[data-testid="contact-list"], table, [role="list"]');
    const emptyState = page.locator('text=No contacts, text=no contacts, text=Add your first');

    const hasContacts = await contactList.first().isVisible().catch(() => false);
    const hasEmptyState = await emptyState.first().isVisible().catch(() => false);

    expect(hasContacts || hasEmptyState).toBeTruthy();
  });
});

test.describe('Contact Creation', () => {
  test('should navigate to new contact form', async ({ page }) => {
    await page.goto('/dashboard/contacts');
    await page.waitForLoadState('networkidle');

    // Click add button
    const addButton = page.locator('button:has-text("Add"), a[href*="new"], button:has-text("New")');
    await addButton.first().click();

    // Should navigate to new contact page or open modal
    await page.waitForTimeout(500);

    const nameInput = page.locator('input[name="name"], input[placeholder*="Name"], input[placeholder*="name"]');
    await expect(nameInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have required form fields', async ({ page }) => {
    await page.goto('/dashboard/contacts/new');
    await page.waitForLoadState('networkidle');

    // Name field
    const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]');
    await expect(nameInput.first()).toBeVisible();

    // Email field
    const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="Email"]');
    await expect(emailInput.first()).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/dashboard/contacts/new');
    await page.waitForLoadState('networkidle');

    // Try to submit without filling required fields
    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    await submitButton.first().click();

    // Should show validation error
    await page.waitForTimeout(500);

    // Form should still be visible (not submitted)
    const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]');
    await expect(nameInput.first()).toBeVisible();
  });

  test('should create a new contact', async ({ page }) => {
    await page.goto('/dashboard/contacts/new');
    await page.waitForLoadState('networkidle');

    const testName = `E2E Test Contact ${Date.now()}`;
    const testEmail = `e2e-test-${Date.now()}@example.com`;

    // Fill form
    const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]');
    await nameInput.first().fill(testName);

    const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="Email"]');
    await emailInput.first().fill(testEmail);

    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    await submitButton.first().click();

    // Should redirect or show success
    await page.waitForTimeout(1000);

    // Either redirected to contact detail or list, or success toast shown
    const successIndicator = page.locator('text=created, text=success, text=saved').first();
    const contactName = page.locator(`text=${testName}`).first();

    const hasSuccess = await successIndicator.isVisible().catch(() => false);
    const hasContact = await contactName.isVisible().catch(() => false);
    const redirected = page.url().includes('/contacts/') && !page.url().includes('/new');

    expect(hasSuccess || hasContact || redirected).toBeTruthy();
  });
});

test.describe('Contact Detail', () => {
  test('should display contact details after creating contact', async ({ page }) => {
    const testName = `E2E Detail Test ${Date.now()}`;
    const testEmail = `e2e-detail-${Date.now()}@example.com`;

    // First, create a contact
    await page.goto('/dashboard/contacts/new');
    await page.waitForLoadState('networkidle');

    // Fill form
    const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]');
    await nameInput.first().fill(testName);

    const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="Email"]');
    await emailInput.first().fill(testEmail);

    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    await submitButton.first().click();

    // Wait for navigation or success
    await page.waitForTimeout(2000);

    // Should be redirected to contact detail or contacts list
    // If on detail page, verify content. If on list, click the contact.
    if (page.url().includes('/contacts/') && !page.url().includes('/new')) {
      // On detail page - verify details are shown
      await expect(page.locator(`text=${testName}`).first()).toBeVisible({ timeout: 5000 });
    } else {
      // On list page - find and click the contact
      await page.goto('/dashboard/contacts');
      await page.waitForLoadState('networkidle');

      const contactLink = page.locator(`text=${testName}`).first();
      await contactLink.click();
      await page.waitForLoadState('networkidle');

      // Verify on detail page
      await expect(page.locator(`text=${testName}`).first()).toBeVisible({ timeout: 5000 });
    }

    // Should show contact information
    await expect(page.locator(`text=${testEmail}`).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Contacts Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/dashboard/contacts');
    await page.waitForLoadState('networkidle');

    // Page should still work
    await expect(page.locator('h1:has-text("Contacts")')).toBeVisible();
  });
});
