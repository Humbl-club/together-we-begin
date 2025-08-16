import { test, expect } from '@playwright/test';

// Auth-dependent; keep skipped until test user & data fixtures are configured
// This smoke spec asserts presence of mobile sticky CTA on an event card

test.describe('Events register CTA (mobile) - smoke', () => {
  test.skip(true, 'Auth and seed-dependent; enable when test user & events are configured');

  test('shows sticky register CTA on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/events');

    // Look for sticky CTA
    const sticky = page.getByTestId('mobile-sticky-cta');
    await expect(sticky).toBeVisible();

    // Try clicking Register
    const btn = page.getByTestId('mobile-register-button');
    await btn.click();
  });
});
