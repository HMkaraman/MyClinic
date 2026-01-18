import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly header: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly patientsLink: Locator;
  readonly appointmentsLink: Locator;
  readonly financeLink: Locator;
  readonly settingsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('[data-testid="sidebar"], aside, nav');
    this.header = page.locator('[data-testid="header"], header');
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
    this.patientsLink = page.locator('a[href*="patients"]');
    this.appointmentsLink = page.locator('a[href*="appointments"]');
    this.financeLink = page.locator('a[href*="finance"]');
    this.settingsLink = page.locator('a[href*="settings"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async expectToBeOnDashboard() {
    await expect(this.page).toHaveURL(/.*dashboard/);
  }

  async navigateToPatients() {
    await this.patientsLink.first().click();
    await this.page.waitForURL('**/patients', { timeout: 5000 });
  }

  async navigateToAppointments() {
    await this.appointmentsLink.first().click();
    await this.page.waitForURL('**/appointments', { timeout: 5000 });
  }

  async navigateToFinance() {
    await this.financeLink.first().click();
    await this.page.waitForURL('**/finance', { timeout: 5000 });
  }

  async navigateToSettings() {
    await this.settingsLink.first().click();
    await this.page.waitForURL('**/settings', { timeout: 5000 });
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
    await this.page.waitForURL('**/auth/login', { timeout: 5000 });
  }

  async getUserName(): Promise<string> {
    await this.userMenu.click();
    const userName = await this.page.locator('[data-testid="user-name"]').textContent();
    await this.page.keyboard.press('Escape'); // Close menu
    return userName ?? '';
  }
}
