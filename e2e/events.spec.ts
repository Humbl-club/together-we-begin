import { test, expect } from '@playwright/test';

test.describe('Events smoke', () => {
  test.skip(true, 'Auth-dependent; enable when test user is configured');

  test('view events', async ({ page }) => {
    await page.goto('/events');
    await expect(page.locator('text=Events')).toBeVisible();
  });
});
