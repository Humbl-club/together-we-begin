import { test, expect } from '@playwright/test';

// Dashboard smoke tests (skipped until a test user/session is configured)

test.describe('Dashboard smoke', () => {
  test.skip(true, 'Auth-dependent; enable when test user is configured');

  test('renders dashboard hero and sections', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('text=Quick Actions')).toBeVisible();
  });
});
