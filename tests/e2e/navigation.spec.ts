import { test, expect } from '@playwright/test';

test.describe('Navigation & Language Toggle', () => {
  test.use({ storageState: 'tests/e2e/.auth/user.json' });

  test('navbar links work after login', async ({ page }) => {
    await page.goto('/en/dashboard');

    // Click Sermons
    await page.locator('nav a', { hasText: 'Sermons' }).click();
    await page.waitForURL('**/en/sermons');
    await expect(page.getByRole('heading', { name: 'Sermons' })).toBeVisible();

    // Click Upload
    await page.locator('nav a', { hasText: 'Upload' }).click();
    await page.waitForURL('**/en/workflow');
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Upload Sermon' })).toBeVisible();

    // Click Dashboard
    await page.locator('nav a', { hasText: 'Dashboard' }).click();
    await page.waitForURL('**/en/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('Spanish locale page loads correctly', async ({ page }) => {
    // Direct navigation to Spanish locale (tests i18n messages load correctly)
    await page.goto('/es/dashboard');
    await page.waitForLoadState('networkidle');

    // Should show Spanish nav links
    await expect(page.locator('nav a', { hasText: 'Panel' })).toBeVisible();
    await expect(page.locator('nav a', { hasText: 'Sermones' })).toBeVisible();
    await expect(page.locator('nav a', { hasText: 'Subir' })).toBeVisible();

    // Language toggle should now offer English
    await expect(page.getByRole('link', { name: 'English' })).toBeVisible();
  });
});
