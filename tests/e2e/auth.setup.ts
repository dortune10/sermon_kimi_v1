import { test as setup, expect } from '@playwright/test';

const DEMO_EMAIL = 'demo@sermonscriber.com';
const DEMO_PASSWORD = 'DemoPass123!';
const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/en/login');
  await page.fill('input[type="email"]', DEMO_EMAIL);
  await page.fill('input[type="password"]', DEMO_PASSWORD);
  await page.click('button:has-text("Sign In")');

  // Wait for redirect to dashboard
  await page.waitForURL('**/en/dashboard', { timeout: 15000 });
  await page.waitForLoadState('networkidle');

  // Verify we're logged in by checking page heading
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // Save auth state
  await page.context().storageState({ path: authFile });
});
