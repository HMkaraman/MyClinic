import { test, expect } from '@playwright/test';

import { LoginPage } from './pages/login.page';
import { DashboardPage } from './pages/dashboard.page';
import { testUsers } from './fixtures/auth.fixture';

test.describe('Authentication', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await loginPage.goto();

      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login('invalid@example.com', 'wrongpassword');

      await loginPage.expectError('Invalid');
    });

    test('should show error for empty email', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login('', 'password123');

      // Check for HTML5 validation or custom error
      const emailInput = loginPage.emailInput;
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('should show error for empty password', async ({ page }) => {
      await loginPage.goto();
      await loginPage.passwordInput.focus();
      await loginPage.loginButton.click();

      const passwordInput = loginPage.passwordInput;
      await expect(passwordInput).toHaveAttribute('required', '');
    });

    test('should redirect to dashboard on successful login', async ({ page }) => {
      // This test requires a real backend with test user seeded
      test.skip(process.env.CI !== undefined, 'Requires seeded database');

      await loginPage.goto();
      await loginPage.login(testUsers.admin.email, testUsers.admin.password);

      await loginPage.expectRedirectToDashboard();
    });
  });

  test.describe('Logout', () => {
    test.skip('should logout successfully', async ({ page }) => {
      // This test requires authentication setup
      // Skip for now as it requires seeded database

      await dashboardPage.goto();
      await dashboardPage.logout();

      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      // Clear any stored auth
      await page.context().clearCookies();

      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/.*login|.*auth/);
    });

    test('should redirect to login when accessing patients without auth', async ({ page }) => {
      await page.context().clearCookies();

      await page.goto('/patients');

      await expect(page).toHaveURL(/.*login|.*auth/);
    });

    test('should redirect to login when accessing settings without auth', async ({ page }) => {
      await page.context().clearCookies();

      await page.goto('/settings');

      await expect(page).toHaveURL(/.*login|.*auth/);
    });
  });

  test.describe('Session Persistence', () => {
    test('should persist auth state after page reload', async ({ page }) => {
      test.skip(process.env.CI !== undefined, 'Requires seeded database');

      await loginPage.goto();
      await loginPage.login(testUsers.admin.email, testUsers.admin.password);

      await loginPage.expectRedirectToDashboard();

      // Reload page
      await page.reload();

      // Should still be on dashboard
      await expect(page).toHaveURL(/.*dashboard/);
    });
  });
});
