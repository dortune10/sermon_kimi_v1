import { test, expect } from '@playwright/test';

const DEMO_EMAIL = 'demo@sermonscriber.com';
const DEMO_PASSWORD = 'DemoPass123!';

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page).toHaveTitle(/SermonScriber/);
    // CardTitle is a div, not a heading — use text match
    await expect(page.getByText('Welcome back', { exact: false })).toBeVisible();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/en/login');
    await page.fill('input[type="email"]', DEMO_EMAIL);
    await page.fill('input[type="password"]', DEMO_PASSWORD);
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('**/en/dashboard', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('unauthenticated user is redirected from dashboard', async ({ page }) => {
    await page.goto('/en/dashboard');
    await page.waitForURL('**/en/login**', { timeout: 10000 });
  });
});
