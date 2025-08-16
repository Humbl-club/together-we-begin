import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('displays invite code form initially', async ({ page }) => {
    await expect(page.getByText('Welcome to HUMBL')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your invite code')).toBeVisible();
  });

  test('validates invite code before proceeding', async ({ page }) => {
    // Try to proceed without entering code
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Should stay on same page
    await expect(page.getByText('Welcome to HUMBL')).toBeVisible();
  });

  test('shows signup form after valid invite code', async ({ page }) => {
    // Mock the invite code validation
    await page.route('**/invites*', async route => {
      await route.fulfill({
        status: 200,
        json: {
          id: '123',
          code: 'TESTCODE',
          status: 'pending',
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        },
      });
    });

    await page.fill('input[name="inviteCode"]', 'TESTCODE');
    await page.getByRole('button', { name: /continue/i }).click();

    // Should show signup form
    await expect(page.getByText('Create your account')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
  });

  test('completes full signup flow', async ({ page }) => {
    // Mock successful API calls
    await page.route('**/invites*', async route => {
      await route.fulfill({
        status: 200,
        json: {
          id: '123',
          code: 'TESTCODE',
          status: 'pending',
        },
      });
    });

    await page.route('**/auth/v1/signup', async route => {
      await route.fulfill({
        status: 200,
        json: {
          user: { id: '123', email: 'test@example.com' },
          session: { access_token: 'fake-token' },
        },
      });
    });

    // Enter invite code
    await page.fill('input[name="inviteCode"]', 'TESTCODE');
    await page.getByRole('button', { name: /continue/i }).click();

    // Fill signup form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="fullName"]', 'Test User');
    
    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});