import { test, expect } from '@playwright/test';

// Wellness smoke tests (skipped until test data is configured if route is protected)

test.describe('Wellness smoke', () => {
  test.skip(true, 'May be auth-dependent; enable when test user is configured');

  test('renders wellness header and widget', async ({ page }) => {
    await page.goto('/wellness');
    await expect(page.getByText('Wellness')).toBeVisible();
    await expect(page.getByText('Wellness Tracking')).toBeVisible();
  });
});
