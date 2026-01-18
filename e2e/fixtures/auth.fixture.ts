import { test as base, expect, Page } from '@playwright/test';

// Test user credentials for different roles
export const testUsers = {
  admin: {
    email: 'admin@myclinic.test',
    password: 'AdminPass123!',
    name: 'Admin User',
    role: 'ADMIN',
  },
  doctor: {
    email: 'doctor@myclinic.test',
    password: 'DoctorPass123!',
    name: 'Dr. Test',
    role: 'DOCTOR',
  },
  reception: {
    email: 'reception@myclinic.test',
    password: 'ReceptionPass123!',
    name: 'Reception Staff',
    role: 'RECEPTION',
  },
};

export type TestUserRole = keyof typeof testUsers;

// Extend Playwright test with custom fixtures
export const test = base.extend<{
  authenticatedPage: Page;
  loginAs: (role: TestUserRole) => Promise<void>;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Will be set up in loginAs
    await use(page);
  },

  loginAs: async ({ page }, use) => {
    const login = async (role: TestUserRole) => {
      const user = testUsers[role];
      await page.goto('/auth/login');

      // Wait for the login form to be visible
      await page.waitForSelector('input[type="email"]');

      // Fill in login form
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);

      // Click login button
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      // Verify we're logged in by checking for user menu or dashboard elements
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({
        timeout: 5000,
      });
    };

    await use(login);
  },
});

// Helper function to get storage state path for a role
export function getStorageStatePath(role: TestUserRole): string {
  return `./e2e/.auth/${role}.json`;
}

// Helper to check if user is authenticated
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for auth token in localStorage
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    return !!token;
  } catch {
    return false;
  }
}

// Helper to wait for successful login
export async function waitForLogin(page: Page): Promise<void> {
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

// Helper to logout
export async function logout(page: Page): Promise<void> {
  // Click user menu
  await page.click('[data-testid="user-menu"]');

  // Click logout button
  await page.click('[data-testid="logout-button"]');

  // Wait for redirect to login page
  await page.waitForURL('**/auth/login', { timeout: 5000 });
}

export { expect };
