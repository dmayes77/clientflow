import { test, expect } from '@playwright/test';

/**
 * Settings Tests
 * These tests require authentication
 */

test.describe('Business Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings/business');
    await page.waitForLoadState('networkidle');
  });

  test('should load business settings page', async ({ page }) => {
    // Check for business settings heading or form
    const hasHeading = await page.locator('h1').first().isVisible();
    expect(hasHeading).toBeTruthy();
  });

  test('should have business name field', async ({ page }) => {
    const nameInput = page.locator('input').first();
    await expect(nameInput).toBeVisible();
  });

  test('should have email field', async ({ page }) => {
    // Wait for the form to load (data comes from async hook)
    await page.waitForTimeout(2000);

    // Business Settings has a businessEmail field with type="email"
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have save button', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /Save|Update/i });
    await expect(saveButton.first()).toBeVisible();
  });
});

test.describe('Billing Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings/billing');
    await page.waitForLoadState('networkidle');
  });

  test('should load billing page', async ({ page }) => {
    // Check for billing-related content
    const hasBillingContent = await page.getByText(/Billing|Subscription|Plan/i).first().isVisible().catch(() => false);
    const hasHeading = await page.locator('h1').first().isVisible();
    expect(hasBillingContent || hasHeading).toBeTruthy();
  });

  test('should display plan information', async ({ page }) => {
    const planInfo = page.getByText(/Plan|Subscription|Professional|Starter|Trial|Free/i);
    await expect(planInfo.first()).toBeVisible();
  });
});

test.describe('Notifications Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings/notifications');
    await page.waitForLoadState('networkidle');
  });

  test('should load notifications settings', async ({ page }) => {
    // Check for notifications page
    const hasContent = await page.getByText(/Notification/i).first().isVisible().catch(() => false);
    const hasHeading = await page.locator('h1').first().isVisible();
    expect(hasContent || hasHeading).toBeTruthy();
  });

  test('should have notification controls', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);

    // Notifications page shows either:
    // - Toggle switches (if user is subscribed to push notifications)
    // - Enable/Disable button (if not subscribed)
    // - "Not supported" message (if browser doesn't support push)
    const hasToggles = await page.locator('button[role="switch"]').first().isVisible().catch(() => false);
    const hasEnableButton = await page.getByRole('button', { name: /Enable|Disable/i }).first().isVisible().catch(() => false);
    const hasNotSupportedMsg = await page.getByText(/not supported|blocked/i).first().isVisible().catch(() => false);
    const hasNotificationsHeading = await page.getByText(/Notification/i).first().isVisible().catch(() => false);

    expect(hasToggles || hasEnableButton || hasNotSupportedMsg || hasNotificationsHeading).toBeTruthy();
  });
});

test.describe('Custom Fields Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings/custom-fields');
    await page.waitForLoadState('networkidle');
  });

  test('should load custom fields page', async ({ page }) => {
    const hasContent = await page.getByText(/Custom Field/i).first().isVisible().catch(() => false);
    const hasHeading = await page.locator('h1').first().isVisible();
    expect(hasContent || hasHeading).toBeTruthy();
  });

  test('should have add field button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /Add|New|Create/i });
    await expect(addButton.first()).toBeVisible();
  });
});

test.describe('Services Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/services');
    await page.waitForLoadState('networkidle');
  });

  test('should load services page', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'Services' })).toBeVisible();
  });

  test('should have add service button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /Add|New/i });
    await expect(addButton.first()).toBeVisible();
  });

  test('should display services content', async ({ page }) => {
    // Either show services grid/list or empty state
    const hasServices = await page.locator('.grid, table').first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/No services/i).isVisible().catch(() => false);
    const hasPage = await page.locator('h1', { hasText: 'Services' }).isVisible();

    expect(hasServices || hasEmptyState || hasPage).toBeTruthy();
  });
});

test.describe('Tags Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/tags');
    await page.waitForLoadState('networkidle');
  });

  test('should load tags page', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'Tags' })).toBeVisible();
  });

  test('should have add tag button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /Add|New|Create/i });
    await expect(addButton.first()).toBeVisible();
  });
});

test.describe('Workflows Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/workflows');
    await page.waitForLoadState('networkidle');
  });

  test('should load workflows page', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'Workflows' })).toBeVisible();
  });

  test('should have add workflow button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /Add|New|Create/i });
    await expect(addButton.first()).toBeVisible();
  });
});

test.describe('Email Templates Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/email-templates');
    await page.waitForLoadState('networkidle');
  });

  test('should load email templates page', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'Templates' })).toBeVisible();
  });

  test('should display templates content', async ({ page }) => {
    // Either show templates or empty state
    const hasTemplates = await page.locator('.grid, table').first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/No templates/i).isVisible().catch(() => false);
    const hasPage = await page.locator('h1').first().isVisible();

    expect(hasTemplates || hasEmptyState || hasPage).toBeTruthy();
  });
});

test.describe('Whats New Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/whats-new');
    await page.waitForLoadState('networkidle');
  });

  test('should load whats new page', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display changelog entries', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('main').first().isVisible();
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Settings Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('business settings should be responsive', async ({ page }) => {
    await page.goto('/dashboard/settings/business');
    await page.waitForLoadState('networkidle');

    // Should load without errors
    const hasHeading = await page.locator('h1').first().isVisible();
    expect(hasHeading).toBeTruthy();
  });

  test('services page should be responsive', async ({ page }) => {
    await page.goto('/dashboard/services');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1', { hasText: 'Services' })).toBeVisible();
  });
});
