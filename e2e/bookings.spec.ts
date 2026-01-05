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
    await expect(page.locator('h1:has-text("Bookings")')).toBeVisible();
  });

  test('should have create booking button', async ({ page }) => {
    const addButton = page.locator('button:has-text("New"), a:has-text("New Booking"), button:has-text("Add")');
    await expect(addButton.first()).toBeVisible();
  });

  test('should display bookings list or empty state', async ({ page }) => {
    const bookingList = page.locator('table, [role="list"], [data-testid="bookings-list"]');
    const emptyState = page.locator('text=No bookings, text=no bookings');

    const hasBookings = await bookingList.first().isVisible().catch(() => false);
    const hasEmptyState = await emptyState.first().isVisible().catch(() => false);

    expect(hasBookings || hasEmptyState).toBeTruthy();
  });
});

test.describe('Calendar View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/calendar');
    await page.waitForLoadState('networkidle');
  });

  test('should load calendar page', async ({ page }) => {
    // Calendar should be visible
    const calendar = page.locator('[class*="calendar"], [role="grid"], [data-testid="calendar"]');
    await expect(calendar.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display month/week navigation', async ({ page }) => {
    // Should have navigation controls
    const navButton = page.locator('button:has-text("Today"), button:has-text("Week"), button:has-text("Month")');
    await expect(navButton.first()).toBeVisible();
  });

  test('should navigate between dates', async ({ page }) => {
    // Find next/prev buttons
    const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next"], [aria-label*="forward"]');
    const prevButton = page.locator('button:has-text("Prev"), button[aria-label*="prev"], button[aria-label*="back"]');

    if (await nextButton.first().isVisible()) {
      await nextButton.first().click();
      await page.waitForTimeout(500);
      await prevButton.first().click();
    }
  });
});

test.describe('Booking Creation', () => {
  test('should navigate to new booking form', async ({ page }) => {
    await page.goto('/dashboard/bookings/new');
    await page.waitForLoadState('networkidle');

    // Should show booking form
    const form = page.locator('form, [data-testid="booking-form"]');
    await expect(form.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have service selection', async ({ page }) => {
    await page.goto('/dashboard/bookings/new');
    await page.waitForLoadState('networkidle');

    // Should have service/package selection
    const serviceSelect = page.locator('select, [role="combobox"], [data-testid="service-select"], text=Select a service');
    await expect(serviceSelect.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have date/time selection', async ({ page }) => {
    await page.goto('/dashboard/bookings/new');
    await page.waitForLoadState('networkidle');

    // Should have date picker
    const datePicker = page.locator('input[type="date"], [data-testid="date-picker"], button:has-text("Pick a date"), [role="calendar"]');
    await expect(datePicker.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have contact selection', async ({ page }) => {
    await page.goto('/dashboard/bookings/new');
    await page.waitForLoadState('networkidle');

    // Should have contact selection
    const contactSelect = page.locator('text=Contact, text=Client, input[placeholder*="contact"], input[placeholder*="client"]');
    await expect(contactSelect.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Bookings Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/dashboard/bookings');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("Bookings")')).toBeVisible();
  });

  test('calendar should work on mobile', async ({ page }) => {
    await page.goto('/dashboard/calendar');
    await page.waitForLoadState('networkidle');

    // Calendar should still be visible
    const calendar = page.locator('[class*="calendar"], [role="grid"], [data-testid="calendar"]');
    await expect(calendar.first()).toBeVisible({ timeout: 10000 });
  });
});
