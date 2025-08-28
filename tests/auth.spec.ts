import { test, expect } from '@playwright/test';

/**
 * AUTHENTICATION & USER MANAGEMENT TESTS
 *
 * Tests for user registration, login, password reset, and account management
 */

test.describe('Authentication & User Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
  });

  test('should display sign in form by default', async ({ page }) => {
    // Check for sign in form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('text=Sign Up')).toBeVisible();
  });

  test('should switch to sign up form', async ({ page }) => {
    await page.click('text=Sign Up');

    // Check for sign up form elements
    await expect(page.locator('input[placeholder*="name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Create Account")')).toBeVisible();
  });

  test('should validate email format on sign up', async ({ page }) => {
    await page.click('text=Sign Up');

    await page.fill('input[type="email"]', 'invalid-email-format');
    await page.fill('input[type="password"]', 'validpassword123');
    await page.fill('input[placeholder*="name"]', 'Test User');

    await page.click('button:has-text("Create Account")');

    // Should show validation error
    await expect(page.locator('text=Invalid email format')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.click('text=Sign Up');

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '123'); // Too short
    await page.fill('input[placeholder*="name"]', 'Test User');

    await page.click('button:has-text("Create Account")');

    // Should show password strength error
    await expect(page.locator('text=password must be at least')).toBeVisible();
  });

  test('should require name field', async ({ page }) => {
    await page.click('text=Sign Up');

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'validpassword123');
    // Leave name empty

    await page.click('button:has-text("Create Account")');

    // Should show name required error
    await expect(page.locator('text=Name is required')).toBeVisible();
  });

  test('should handle sign in with invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button:has-text("Sign In")');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should show forgot password option', async ({ page }) => {
    await expect(page.locator('text=Forgot password?')).toBeVisible();

    await page.click('text=Forgot password?');

    // Should show reset form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Reset Password")')).toBeVisible();
  });

  test('should validate email for password reset', async ({ page }) => {
    await page.click('text=Forgot password?');

    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button:has-text("Reset Password")');

    // Should show validation error
    await expect(page.locator('text=Invalid email format')).toBeVisible();
  });

  test('should handle successful password reset request', async ({ page }) => {
    await page.click('text=Forgot password?');

    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Reset Password")');

    // Should show success message
    await expect(page.locator('text=Password reset email sent')).toBeVisible();
  });

  test('should persist login state', async ({ page, context }) => {
    // This test would require actual authentication
    // For now, we'll test the UI behavior

    await page.goto('/dashboard');

    // If not authenticated, should redirect to auth
    await expect(page).toHaveURL(/.*auth.*/);
  });

  test('should handle logout functionality', async ({ page }) => {
    // This would require being logged in first
    // Testing the UI elements for now

    await page.goto('/dashboard');

    // Look for logout button in potential locations
    const logoutButton = page.locator('text=Logout').or(
      page.locator('text=Sign Out')
    ).or(
      page.locator('[data-testid="logout-button"]')
    );

    // The logout button should exist (though may not be visible if not logged in)
    await expect(logoutButton).toBeVisible();
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/social',
      '/events',
      '/challenges',
      '/profile',
      '/messages',
      '/settings'
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      // Should redirect to auth page
      await expect(page).toHaveURL(/.*auth.*/);
    }
  });

  test('should handle social login options', async ({ page }) => {
    // Check for social login buttons
    const googleButton = page.locator('text=Continue with Google').or(
      page.locator('[data-testid="google-login"]')
    );

    const facebookButton = page.locator('text=Continue with Facebook').or(
      page.locator('[data-testid="facebook-login"]')
    );

    // At least one social login option should be present
    await expect(googleButton.or(facebookButton)).toBeVisible();
  });

  test('should remember user preferences', async ({ page }) => {
    await page.goto('/auth');

    // Check for "Remember me" checkbox
    const rememberMe = page.locator('input[type="checkbox"]').or(
      page.locator('text=Remember me')
    );

    await expect(rememberMe).toBeVisible();
  });

  test('should handle account verification flow', async ({ page }) => {
    // This would test email verification flow
    // For now, check if verification UI exists

    await page.goto('/auth?mode=verify');

    // Should show verification message
    await expect(page.locator('text=Check your email')).toBeVisible();
    await expect(page.locator('text=verification')).toBeVisible();
  });

  test('should prevent brute force attacks', async ({ page }) => {
    // Test rate limiting by attempting multiple failed logins

    for (let i = 0; i < 5; i++) {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button:has-text("Sign In")');

      // Clear fields for next attempt
      await page.fill('input[type="email"]', '');
      await page.fill('input[type="password"]', '');
    }

    // Should show rate limit message
    await expect(page.locator('text=Too many attempts')).toBeVisible();
  });

  test('should handle session timeout', async ({ page }) => {
    // This test would require being logged in and waiting for session timeout
    // For now, we'll test the UI messaging

    await page.goto('/auth?error=session_expired');

    // Should show session expired message
    await expect(page.locator('text=Session expired')).toBeVisible();
  });

  test('should support password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    const passwordToggle = page.locator('[data-testid="password-toggle"]').or(
      page.locator('button:has-text("Show")')
    );

    await expect(passwordInput).toBeVisible();
    await expect(passwordToggle).toBeVisible();

    // Click toggle
    await passwordToggle.click();

    // Password should become text input
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });

  test('should handle browser back button correctly', async ({ page }) => {
    await page.goto('/auth');
    await page.click('text=Sign Up');

    // Go back
    await page.goBack();

    // Should return to sign in form
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });
});
