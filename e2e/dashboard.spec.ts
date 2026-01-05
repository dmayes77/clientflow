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
    await expect(page.locator('h1:has-text("Overview")')).toBeVisible();
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('should display KPI cards', async ({ page }) => {
    // Revenue card
    await expect(page.locator('text=Revenue')).toBeVisible();

    // Bookings card
    await expect(page.locator('p:has-text("Bookings")')).toBeVisible();

    // Contacts card
    await expect(page.locator('p:has-text("Contacts")')).toBeVisible();

    // Services card
    await expect(page.locator('p:has-text("Services")')).toBeVisible();
  });

  test('should display quick action buttons', async ({ page }) => {
    await expect(page.locator('button:has-text("New Booking"), button:has-text("Book")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Contact"), button:has-text("Contact")')).toBeVisible();
    await expect(page.locator('button:has-text("New Invoice"), button:has-text("Invoice")')).toBeVisible();
  });

  test('should navigate to new booking when clicking quick action', async ({ page }) => {
    await page.locator('button:has-text("New Booking"), button:has-text("Book")').first().click();
    await page.waitForURL('**/dashboard/bookings/new**');
    await expect(page).toHaveURL(/dashboard\/bookings\/new/);
  });

  test('should display charts', async ({ page }) => {
    // Revenue chart
    await expect(page.locator('text=Revenue (30 Days)')).toBeVisible();

    // Booking status chart
    await expect(page.locator('text=Booking Status')).toBeVisible();

    // Weekly activity
    await expect(page.locator('text=Weekly Activity')).toBeVisible();
  });

  test('should display roadmap voting section', async ({ page }) => {
    await expect(page.locator('text=Vote on Features')).toBeVisible();
  });
});

test.describe('Dashboard Navigation', () => {
  test('should have sidebar navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check sidebar is present (may be collapsed on mobile)
    const sidebar = page.locator('[data-sidebar]');
    await expect(sidebar).toBeVisible();
  });

  test('should navigate to calendar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Open sidebar if collapsed (mobile)
    const trigger = page.locator('[data-sidebar-trigger]');
    if (await trigger.isVisible()) {
      await trigger.click();
    }

    await page.locator('a[href="/dashboard/calendar"]').click();
    await page.waitForURL('**/dashboard/calendar**');
    await expect(page).toHaveURL(/dashboard\/calendar/);
  });

  test('should navigate to contacts', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const trigger = page.locator('[data-sidebar-trigger]');
    if (await trigger.isVisible()) {
      await trigger.click();
    }

    await page.locator('a[href="/dashboard/contacts"]').click();
    await page.waitForURL('**/dashboard/contacts**');
    await expect(page).toHaveURL(/dashboard\/contacts/);
  });

  test('should navigate to services', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const trigger = page.locator('[data-sidebar-trigger]');
    if (await trigger.isVisible()) {
      await trigger.click();
    }

    await page.locator('a[href="/dashboard/services"]').click();
    await page.waitForURL('**/dashboard/services**');
    await expect(page).toHaveURL(/dashboard\/services/);
  });

  test('should navigate to settings', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const trigger = page.locator('[data-sidebar-trigger]');
    if (await trigger.isVisible()) {
      await trigger.click();
    }

    // Switch to Account section
    await page.locator('button:has-text("Account")').click();

    await page.locator('a[href="/dashboard/settings/business"]').click();
    await page.waitForURL('**/dashboard/settings/business**');
    await expect(page).toHaveURL(/dashboard\/settings\/business/);
  });
});

test.describe('Dashboard Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Page should still show overview
    await expect(page.locator('h1:has-text("Overview")')).toBeVisible();

    // Quick actions should show short labels
    await expect(page.locator('button:has-text("Book")')).toBeVisible();
    await expect(page.locator('button:has-text("Contact")')).toBeVisible();
    await expect(page.locator('button:has-text("Invoice")')).toBeVisible();
  });

  test('should have hamburger menu on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Sidebar trigger should be visible
    const trigger = page.locator('[data-sidebar-trigger], button[aria-label*="sidebar"], button[aria-label*="menu"]');
    await expect(trigger.first()).toBeVisible();
  });
});
