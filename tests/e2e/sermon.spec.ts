import { test, expect } from '@playwright/test';

test.describe('Sermon Flow', () => {
  test.use({ storageState: 'tests/e2e/.auth/user.json' });

  test('sermons list loads with demo data', async ({ page }) => {
    await page.goto('/en/sermons');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('The Good Shepherd')).toBeVisible();
    await expect(page.getByText('El Buen Pastor')).toBeVisible();
  });

  test('search filters sermons', async ({ page }) => {
    await page.goto('/en/sermons');
    await page.waitForLoadState('networkidle');

    // Search for English sermon
    await page.fill('input[name="q"]', 'Good Shepherd');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('The Good Shepherd')).toBeVisible();
    await expect(page.getByText('El Buen Pastor')).not.toBeVisible();
  });

  test('status filter works', async ({ page }) => {
    await page.goto('/en/sermons');
    await page.waitForLoadState('networkidle');

    // Filter by completed status — the badge in the filter bar
    await page.locator('form a', { hasText: /^Completed$/ }).click();
    await page.waitForURL('**/en/sermons?status=completed');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('The Good Shepherd')).toBeVisible();
    await expect(page.getByText('El Buen Pastor')).not.toBeVisible();
  });

  test('sermon detail shows transcript and content', async ({ page }) => {
    await page.goto('/en/sermons');
    await page.waitForLoadState('networkidle');

    // Click on the completed sermon
    await page.getByText('The Good Shepherd').click();
    await page.waitForURL('**/en/sermon/**');
    await page.waitForLoadState('networkidle');

    // Check key sections are visible (CardTitle renders as div, so use getByText)
    await expect(page.getByText('Transcript')).toBeVisible();
    await expect(page.getByText('Scripture References')).toBeVisible();
    await expect(page.getByText('Generated Content')).toBeVisible();
  });
});
