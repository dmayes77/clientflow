import { test, expect } from '@playwright/test';

/**
 * Bookings Tests
 * These tests require authentication
 */

test.describe('Bookings List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/bookings');
    await page.waitForLoadState('networkidle');
  });

  test('should load bookings page', async ({ page }) => {
    // Bookings page redirects to calendar, so check for either
    const isOnBookings = page.url().includes('/bookings');
    const isOnCalendar = page.url().includes('/calendar');
    expect(isOnBookings || isOnCalendar).toBeTruthy();
  });

  test('should have create booking button', async ({ page }) => {
    // Navigate to calendar since bookings may redirect there
    await page.goto('/dashboard/calendar');
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: /New|Add|Book/i });
    await expect(addButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display calendar or list view', async ({ page }) => {
    await page.goto('/dashboard/calendar');
    await page.waitForLoadState('networkidle');

    // Should show calendar
    await expect(page.locator('h1', { hasText: 'Calendar' })).toBeVisible();
  });
});

test.describe('Calendar View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/calendar');
    await page.waitForLoadState('networkidle');
  });

  test('should load calendar page', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'Calendar' })).toBeVisible();
  });

  test('should display month/week navigation', async ({ page }) => {
    // Should have navigation controls
    const navButton = page.getByRole('button', { name: /Today|Week|Month/i });
    await expect(navButton.first()).toBeVisible();
  });

  test('should navigate between dates', async ({ page }) => {
    // Find next/prev buttons by aria-label or icon
    const nextButton = page.locator('button[aria-label*="next"], button[aria-label*="forward"]');
    const prevButton = page.locator('button[aria-label*="prev"], button[aria-label*="back"]');

    if (await nextButton.first().isVisible()) {
      await nextButton.first().click();
      await page.waitForTimeout(500);
      if (await prevButton.first().isVisible()) {
        await prevButton.first().click();
      }
    }
  });
});

test.describe('Booking Creation', () => {
  test('should navigate to new booking form', async ({ page }) => {
    await page.goto('/dashboard/bookings/new');
    await page.waitForLoadState('networkidle');

    // Should show booking form or stepper
    const form = page.locator('form');
    await expect(form.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have service selection', async ({ page }) => {
    await page.goto('/dashboard/bookings/new');
    await page.waitForLoadState('networkidle');

    // Should have service/package selection - look for the actual UI
    const serviceSelect = page.getByText(/Select a service|Service|Package/i);
    await expect(serviceSelect.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have date/time selection', async ({ page }) => {
    await page.goto('/dashboard/bookings/new');
    await page.waitForLoadState('networkidle');

    // Should have date picker or date-related text
    const datePicker = page.getByText(/Date|Pick a date|When/i);
    await expect(datePicker.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have contact selection', async ({ page }) => {
    await page.goto('/dashboard/bookings/new');
    await page.waitForLoadState('networkidle');

    // Should have contact selection
    const contactSelect = page.getByText(/Contact|Client|Who/i);
    await expect(contactSelect.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Bookings Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/dashboard/calendar');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1', { hasText: 'Calendar' })).toBeVisible();
  });

  test('calendar should work on mobile', async ({ page }) => {
    await page.goto('/dashboard/calendar');
    await page.waitForLoadState('networkidle');

    // Calendar header should still be visible
    await expect(page.locator('h1', { hasText: 'Calendar' })).toBeVisible();
  });
});
