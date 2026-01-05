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
    await expect(page.locator('h1:has-text("Business"), text=Business Settings, text=Business Profile')).toBeVisible();
  });

  test('should have business name field', async ({ page }) => {
    const nameInput = page.locator('input[name="businessName"], input[name="name"], input[placeholder*="Business"]');
    await expect(nameInput.first()).toBeVisible();
  });

  test('should have email field', async ({ page }) => {
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    await expect(emailInput.first()).toBeVisible();
  });

  test('should have save button', async ({ page }) => {
    const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
    await expect(saveButton.first()).toBeVisible();
  });
});

test.describe('Billing Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings/billing');
    await page.waitForLoadState('networkidle');
  });

  test('should load billing page', async ({ page }) => {
    await expect(page.locator('h1:has-text("Billing"), text=Billing, text=Subscription')).toBeVisible();
  });

  test('should display current plan', async ({ page }) => {
    const planInfo = page.locator('text=Plan, text=Subscription, text=Professional, text=Starter, text=Trial');
    await expect(planInfo.first()).toBeVisible();
  });
});

test.describe('Notifications Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings/notifications');
    await page.waitForLoadState('networkidle');
  });

  test('should load notifications settings', async ({ page }) => {
    await expect(page.locator('h1:has-text("Notifications"), text=Notification Settings')).toBeVisible();
  });

  test('should have toggle switches', async ({ page }) => {
    const toggles = page.locator('button[role="switch"], input[type="checkbox"], [data-state="checked"], [data-state="unchecked"]');
    await expect(toggles.first()).toBeVisible();
  });
});

test.describe('Custom Fields Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings/custom-fields');
    await page.waitForLoadState('networkidle');
  });

  test('should load custom fields page', async ({ page }) => {
    await expect(page.locator('h1:has-text("Custom Fields"), text=Custom Fields')).toBeVisible();
  });

  test('should have add field button', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")');
    await expect(addButton.first()).toBeVisible();
  });
});

test.describe('Services Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/services');
    await page.waitForLoadState('networkidle');
  });

  test('should load services page', async ({ page }) => {
    await expect(page.locator('h1:has-text("Services")')).toBeVisible();
  });

  test('should have add service button', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a:has-text("Add Service")');
    await expect(addButton.first()).toBeVisible();
  });

  test('should display services list or empty state', async ({ page }) => {
    const serviceList = page.locator('table, [role="list"], [data-testid="services-list"], .grid');
    const emptyState = page.locator('text=No services, text=no services, text=Add your first');

    const hasServices = await serviceList.first().isVisible().catch(() => false);
    const hasEmptyState = await emptyState.first().isVisible().catch(() => false);

    expect(hasServices || hasEmptyState).toBeTruthy();
  });
});

test.describe('Tags Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/tags');
    await page.waitForLoadState('networkidle');
  });

  test('should load tags page', async ({ page }) => {
    await expect(page.locator('h1:has-text("Tags")')).toBeVisible();
  });

  test('should have add tag button', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")');
    await expect(addButton.first()).toBeVisible();
  });
});

test.describe('Workflows Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/workflows');
    await page.waitForLoadState('networkidle');
  });

  test('should load workflows page', async ({ page }) => {
    await expect(page.locator('h1:has-text("Workflows"), h1:has-text("Automation")')).toBeVisible();
  });

  test('should have add workflow button', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")');
    await expect(addButton.first()).toBeVisible();
  });
});

test.describe('Email Templates Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/email-templates');
    await page.waitForLoadState('networkidle');
  });

  test('should load email templates page', async ({ page }) => {
    await expect(page.locator('h1:has-text("Templates"), h1:has-text("Email")')).toBeVisible();
  });

  test('should display templates list', async ({ page }) => {
    const templateList = page.locator('table, [role="list"], .grid');
    const emptyState = page.locator('text=No templates, text=no templates');

    const hasTemplates = await templateList.first().isVisible().catch(() => false);
    const hasEmptyState = await emptyState.first().isVisible().catch(() => false);

    expect(hasTemplates || hasEmptyState).toBeTruthy();
  });
});

test.describe('Whats New Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/whats-new');
    await page.waitForLoadState('networkidle');
  });

  test('should load whats new page', async ({ page }) => {
    await expect(page.locator('h1:has-text("What\'s New")')).toBeVisible();
  });

  test('should display changelog entries', async ({ page }) => {
    // Either show releases or loading state
    const releases = page.locator('[class*="card"], [data-testid="changelog"]');
    await expect(releases.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Settings Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('business settings should be responsive', async ({ page }) => {
    await page.goto('/dashboard/settings/business');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("Business"), text=Business Settings, text=Business Profile')).toBeVisible();
  });

  test('services page should be responsive', async ({ page }) => {
    await page.goto('/dashboard/services');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("Services")')).toBeVisible();
  });
});
