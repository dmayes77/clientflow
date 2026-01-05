import { test, expect } from '@playwright/test';

/**
 * Dashboard Tests
 * These tests require authentication (handled by auth.setup.ts)
 */

test.describe('Dashboard Overview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should load dashboard page', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'Overview' })).toBeVisible();
  });

  test('should display KPI cards', async ({ page }) => {
    // Wait for analytics to load
    await page.waitForTimeout(2000);

    // Revenue card
    await expect(page.getByText('Revenue').first()).toBeVisible();

    // Bookings card
    await expect(page.getByText('Bookings').first()).toBeVisible();

    // Contacts card
    await expect(page.getByText('Contacts').first()).toBeVisible();
  });

  test('should display quick action buttons', async ({ page }) => {
    // Wait for page to fully render
    await page.waitForTimeout(1000);

    await expect(page.locator('button:has-text("New Booking")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Contact")')).toBeVisible();
    await expect(page.locator('button:has-text("New Invoice")')).toBeVisible();
  });

  test('should navigate to new booking when clicking quick action', async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("New Booking")').click();
    await page.waitForURL('**/bookings/new**', { timeout: 10000 });
    await expect(page).toHaveURL(/bookings\/new/);
  });

  test('should display charts', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Revenue chart
    await expect(page.getByRole('heading', { name: /Revenue/i })).toBeVisible();

    // Booking status chart
    await expect(page.getByRole('heading', { name: /Booking Status/i })).toBeVisible();

    // Weekly activity
    await expect(page.getByRole('heading', { name: /Weekly Activity/i })).toBeVisible();
  });

  test('should display roadmap voting section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Vote on Features/i })).toBeVisible();
  });
});

test.describe('Dashboard Navigation', () => {
  test('should have sidebar navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for sidebar links
    await expect(page.locator('a[href="/dashboard/contacts"]')).toBeVisible();
  });

  test('should navigate to calendar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.locator('a[href="/dashboard/calendar"]').click();
    await page.waitForURL('**/calendar**');
    await expect(page).toHaveURL(/calendar/);
  });

  test('should navigate to contacts', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.locator('a[href="/dashboard/contacts"]').click();
    await page.waitForURL('**/contacts**');
    await expect(page).toHaveURL(/contacts/);
  });

  test('should navigate to services', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.locator('a[href="/dashboard/services"]').click();
    await page.waitForURL('**/services**');
    await expect(page).toHaveURL(/services/);
  });

  test('should navigate to invoices', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.locator('a[href="/dashboard/invoices"]').click();
    await page.waitForURL('**/invoices**');
    await expect(page).toHaveURL(/invoices/);
  });
});

test.describe('Dashboard Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Page should still show overview heading
    await expect(page.locator('h1', { hasText: 'Overview' })).toBeVisible();
  });

  test('should have toggle sidebar button on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Toggle sidebar button should be visible
    await expect(page.getByRole('button', { name: /Toggle Sidebar/i })).toBeVisible();
  });
});
