import { test, expect } from '@playwright/test';

test.describe('Messages smoke', () => {
  test.skip(true, 'Auth-dependent; enable when test user is configured');

  test('send a message', async ({ page }) => {
    await page.goto('/messages');
    await expect(page.locator('text=Messages')).toBeVisible();
  });
});
