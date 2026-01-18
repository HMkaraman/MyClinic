import { test, expect } from '@playwright/test';

test.describe('Invoices', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test.describe('Invoices List', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/finance/invoices');

      await expect(page).toHaveURL(/.*login|.*auth/);
    });

    test.skip('should display invoices list when authenticated', async ({ page }) => {
      // Login first
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'admin@myclinic.test');
      await page.fill('input[type="password"]', 'AdminPass123!');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/dashboard', { timeout: 10000 });

      // Navigate to invoices
      await page.goto('/finance/invoices');

      // Check for invoices page elements
      await expect(page.locator('h1, h2').first()).toContainText(/invoice/i);
    });
  });

  test.describe('Invoice Details', () => {
    test.skip('should show invoice details', async ({ page }) => {
      // Requires auth and seeded invoice
      await page.goto('/finance/invoices');

      // Click on first invoice
      await page.locator('table tbody tr').first().click();

      // Check for invoice details
      await expect(page.locator('[data-testid="invoice-number"], .invoice-number')).toBeVisible();
    });
  });

  test.describe('Add Payment', () => {
    test.skip('should open payment modal', async ({ page }) => {
      // Requires auth and seeded invoice
      await page.goto('/finance/invoices/test-invoice-id');

      // Click add payment button
      await page.click('button:has-text("Payment"), button:has-text("Pay")');

      // Check modal is open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });
  });

  test.describe('Invoice Status', () => {
    test.skip('should display correct status badges', async ({ page }) => {
      // Requires auth and seeded invoices
      await page.goto('/finance/invoices');

      // Check for status badges
      const statusBadges = page.locator('[data-testid="invoice-status"], .badge');
      await expect(statusBadges.first()).toBeVisible();
    });
  });
});
