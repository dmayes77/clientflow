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
    await expect(page.locator('h1:has-text("Financials"), h1:has-text("Invoices")')).toBeVisible();
  });

  test('should have create invoice button', async ({ page }) => {
    const addButton = page.locator('button:has-text("New"), a:has-text("New Invoice"), button:has-text("Create")');
    await expect(addButton.first()).toBeVisible();
  });

  test('should have filter/status tabs', async ({ page }) => {
    // Check for status filters
    const statusFilters = page.locator('button:has-text("All"), button:has-text("Draft"), button:has-text("Sent"), button:has-text("Paid")');
    await expect(statusFilters.first()).toBeVisible();
  });

  test('should display invoices list or empty state', async ({ page }) => {
    const invoiceList = page.locator('table, [role="list"], [data-testid="invoices-list"]');
    const emptyState = page.locator('text=No invoices, text=no invoices');

    const hasInvoices = await invoiceList.first().isVisible().catch(() => false);
    const hasEmptyState = await emptyState.first().isVisible().catch(() => false);

    expect(hasInvoices || hasEmptyState).toBeTruthy();
  });
});

test.describe('Invoice Creation', () => {
  test('should navigate to new invoice form', async ({ page }) => {
    await page.goto('/dashboard/invoices/new');
    await page.waitForLoadState('networkidle');

    // Should show invoice form
    const form = page.locator('form, [data-testid="invoice-form"]');
    await expect(form.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have contact/client selection', async ({ page }) => {
    await page.goto('/dashboard/invoices/new');
    await page.waitForLoadState('networkidle');

    // Should have contact selection
    const contactSelect = page.locator('text=Contact, text=Client, text=Bill To, input[placeholder*="contact"], input[placeholder*="client"]');
    await expect(contactSelect.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have line items section', async ({ page }) => {
    await page.goto('/dashboard/invoices/new');
    await page.waitForLoadState('networkidle');

    // Should have line items
    const lineItems = page.locator('text=Line Items, text=Items, text=Add Item, button:has-text("Add")');
    await expect(lineItems.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have due date field', async ({ page }) => {
    await page.goto('/dashboard/invoices/new');
    await page.waitForLoadState('networkidle');

    // Should have due date
    const dueDate = page.locator('text=Due Date, input[name*="due"], [data-testid="due-date"]');
    await expect(dueDate.first()).toBeVisible({ timeout: 5000 });
  });

  test('should calculate totals', async ({ page }) => {
    await page.goto('/dashboard/invoices/new');
    await page.waitForLoadState('networkidle');

    // Should show totals section
    const totals = page.locator('text=Total, text=Subtotal');
    await expect(totals.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Payments Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/payments');
    await page.waitForLoadState('networkidle');
  });

  test('should load payments page', async ({ page }) => {
    await expect(page.locator('h1:has-text("Payments")')).toBeVisible();
  });

  test('should display payments list or empty state', async ({ page }) => {
    const paymentList = page.locator('table, [role="list"], [data-testid="payments-list"]');
    const emptyState = page.locator('text=No payments, text=no payments');

    const hasPayments = await paymentList.first().isVisible().catch(() => false);
    const hasEmptyState = await emptyState.first().isVisible().catch(() => false);

    expect(hasPayments || hasEmptyState).toBeTruthy();
  });
});

test.describe('Invoices Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/dashboard/invoices');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("Financials"), h1:has-text("Invoices")')).toBeVisible();
  });
});
