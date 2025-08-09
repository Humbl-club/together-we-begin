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
});

test('announcement banner uses status role on /social', async ({ page }) => {
  await page.goto('/social');
  await expect(page.locator('[role="status"]')).toHaveCount(1);
});
