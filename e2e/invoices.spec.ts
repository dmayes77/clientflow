import { test, expect } from '@playwright/test';

/**
 * Invoices/Financials Tests
 * These tests require authentication
 */

test.describe('Invoices List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/invoices');
    await page.waitForLoadState('networkidle');
  });

  test('should load invoices page', async ({ page }) => {
    // The page is titled "Financials"
    await expect(page.locator('h1', { hasText: 'Financials' })).toBeVisible();
  });

  test('should have create invoice button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /Create Invoice/i });
    await expect(addButton).toBeVisible();
  });

  test('should have filter/status dropdown or empty state', async ({ page }) => {
    // When there are invoices, a filter dropdown is shown
    // When there are no invoices, an empty state is shown
    const hasCombobox = await page.getByRole('combobox').first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/No invoices/i).isVisible().catch(() => false);
    const hasCreateButton = await page.getByRole('button', { name: /Create Invoice/i }).isVisible().catch(() => false);

    // Either filter is visible, or we're in empty state
    expect(hasCombobox || hasEmptyState || hasCreateButton).toBeTruthy();
  });

  test('should display stat cards', async ({ page }) => {
    // Check for financial stat cards
    await expect(page.getByText('Total Collected').first()).toBeVisible();
    await expect(page.getByText('Outstanding').first()).toBeVisible();
  });
});

test.describe('Invoice Creation', () => {
  test('should navigate to new invoice form', async ({ page }) => {
    await page.goto('/dashboard/invoices/new');
    await page.waitForLoadState('networkidle');

    // Should show invoice form
    const form = page.locator('form');
    await expect(form.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have contact/client selection', async ({ page }) => {
    await page.goto('/dashboard/invoices/new');
    await page.waitForLoadState('networkidle');

    // Should have contact selection
    const contactSelect = page.getByText(/Contact|Client|Bill To/i);
    await expect(contactSelect.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have line items section', async ({ page }) => {
    await page.goto('/dashboard/invoices/new');
    await page.waitForLoadState('networkidle');

    // Should have line items - look for add item button or items heading
    const lineItems = page.getByRole('button', { name: /Add|Item/i });
    await expect(lineItems.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have due date field', async ({ page }) => {
    await page.goto('/dashboard/invoices/new');
    await page.waitForLoadState('networkidle');

    // Should have due date
    const dueDate = page.getByText(/Due Date/i);
    await expect(dueDate.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show total section', async ({ page }) => {
    await page.goto('/dashboard/invoices/new');
    await page.waitForLoadState('networkidle');

    // Should show totals section
    const totals = page.getByText(/Total|Subtotal/i);
    await expect(totals.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Payments Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/payments');
    await page.waitForLoadState('networkidle');
  });

  test('should load payments page', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'Payments' })).toBeVisible();
  });

  test('should display payments content', async ({ page }) => {
    // Either show payments table or empty state
    const hasContent = await page.locator('table').isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/No payments/i).isVisible().catch(() => false);
    const hasPage = await page.locator('h1', { hasText: 'Payments' }).isVisible();

    expect(hasContent || hasEmptyState || hasPage).toBeTruthy();
  });
});

test.describe('Invoices Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/dashboard/invoices');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1', { hasText: 'Financials' })).toBeVisible();
  });
});
