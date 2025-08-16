import { test, expect } from '@playwright/test';

const pages: Array<{ path: string; h1: string }> = [
  { path: '/dashboard', h1: 'Dashboard' },
  { path: '/social', h1: 'Social Feed' },
  { path: '/events', h1: 'Events' },
  { path: '/wellness', h1: 'Wellness' },
];

pages.forEach(({ path, h1 }) => {
  test(`has sr-only H1 on ${path}`, async ({ page }) => {
    await page.goto(path);
    const locator = page.locator('h1', { hasText: h1 });
    await expect(locator).toHaveCount(1);
  });
});

test('skip link moves focus to main content on /social', async ({ page }) => {
  await page.goto('/social');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  const hash = await page.evaluate(() => window.location.hash);
  expect(hash).toBe('#main-content');
});

test('composer button is accessible on /social', async ({ page }) => {
  await page.goto('/social');
  const composer = page.getByRole('button', { name: 'Open post composer' });
  await expect(composer).toHaveCount(1);
  // Check focus-visible ring styles are present (class-based assertion)
  await expect(composer).toHaveAttribute('class', /focus-visible:ring-2/);
});

test('announcement banner uses status role on /social', async ({ page }) => {
  await page.goto('/social');
  await expect(page.locator('[role="status"]')).toHaveCount(1);
});

// New A11Y + Theming + Density + Sidebar assertions

test('applies brand theme via query param', async ({ page }) => {
  await page.goto('/dashboard?brand=blush');
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(theme).toBe('blush');
});

test('uses compact density on mobile', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/dashboard');
  const density = await page.evaluate(() => document.documentElement.getAttribute('data-density'));
  expect(density).toBe('compact');
});

test('primary interactive controls meet 44px target', async ({ page }) => {
  await page.goto('/social');
  const btn = page.getByRole('button', { name: 'Open post composer' });
  const box = await btn.boundingBox();
  expect(box?.height || 0).toBeGreaterThanOrEqual(44);
});

// Sidebar collapse to mini (desktop)

test('sidebar collapses to icon state via trigger', async ({ page }) => {
  await page.goto('/dashboard');
  // Ensure label initially visible
  await expect(page.locator('[data-sidebar="content"] >> text=Dashboard')).toBeVisible();
  // Click trigger to collapse
  await page.click('[data-sidebar="trigger"]');
  // Text label should disappear in collapsed icon mode
  await expect(page.locator('[data-sidebar="content"] >> text=Dashboard')).toHaveCount(0);
});
