import { test, expect } from '@playwright/test';

test.describe('Appointments', () => {
  // These tests require authentication and seeded database
  // Skip in CI unless proper setup is done

  test.beforeEach(async ({ page }) => {
    // Clear cookies to ensure clean state
    await page.context().clearCookies();
  });

  test.describe('Appointments List', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/appointments');

      await expect(page).toHaveURL(/.*login|.*auth/);
    });

    test.skip('should display appointments list when authenticated', async ({ page }) => {
      // Login first
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'admin@myclinic.test');
      await page.fill('input[type="password"]', 'AdminPass123!');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/dashboard', { timeout: 10000 });

      // Navigate to appointments
      await page.goto('/appointments');

      // Check for appointments page elements
      await expect(page.locator('h1, h2').first()).toContainText(/appointment/i);
    });
  });

  test.describe('Create Appointment', () => {
    test.skip('should open create appointment modal', async ({ page }) => {
      // Requires auth
      await page.goto('/appointments');

      // Click create button
      await page.click('button:has-text("New"), button:has-text("Create"), button:has-text("Add")');

      // Check modal is open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });
  });

  test.describe('Appointment Status Changes', () => {
    test.skip('should allow changing appointment status', async ({ page }) => {
      // Requires auth and seeded appointment
      await page.goto('/appointments');

      // Click on first appointment
      await page.locator('table tbody tr').first().click();

      // Check for status change options
      await expect(page.locator('select, [role="combobox"]')).toBeVisible();
    });
  });
});
