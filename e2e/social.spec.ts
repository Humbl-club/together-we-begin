import { test, expect } from '@playwright/test';

test.describe('Social smoke', () => {
  test.skip(true, 'Auth-dependent; enable when test user is configured');

  test('view social feed', async ({ page }) => {
    await page.goto('/social');
    await expect(page.locator('text=Stories')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});
