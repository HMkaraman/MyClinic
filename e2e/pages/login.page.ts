import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly twoFactorInput: Locator;
  readonly verifyButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-testid="error-message"], .text-destructive');
    this.twoFactorInput = page.locator('input[data-testid="2fa-code"], input[placeholder*="code"]');
    this.verifyButton = page.locator('button:has-text("Verify")');
  }

  async goto() {
    await this.page.goto('/auth/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async verify2FA(code: string) {
    await this.twoFactorInput.fill(code);
    await this.verifyButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectRedirectToDashboard() {
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
  }

  async expectRedirectTo2FA() {
    await this.page.waitForURL('**/auth/2fa', { timeout: 5000 });
  }

  async isOnLoginPage() {
    return this.page.url().includes('/auth/login');
  }
}
