import { test, expect } from '@playwright/test';

/**
 * ORGANIZATION MANAGEMENT TESTS
 *
 * Tests for creating, managing, and switching between organizations
 */

test.describe('Organization Management', () => {

  test.beforeEach(async ({ page }) => {
    // These tests would require authentication
    // For now, we'll test the UI flows
  });

  test('should display organization creation page', async ({ page }) => {
    await page.goto('/organization/new');

    // Check for organization creation form
    await expect(page.locator('text=Create Organization')).toBeVisible();
    await expect(page.locator('input[placeholder*="organization name"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="slug"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="description"]')).toBeVisible();
  });

  test('should validate organization name', async ({ page }) => {
    await page.goto('/organization/new');

    const nameInput = page.locator('input[placeholder*="organization name"]');

    // Test empty name
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Organization name is required')).toBeVisible();

    // Test name too short
    await nameInput.fill('A');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=name must be at least')).toBeVisible();
  });

  test('should validate organization slug', async ({ page }) => {
    await page.goto('/organization/new');

    const slugInput = page.locator('input[placeholder*="slug"]');

    // Test invalid characters
    await slugInput.fill('Invalid Slug With Spaces!@#');
    await page.click('button:has-text("Create")');

    // Should show validation error
    await expect(page.locator('text=Slug can only contain')).toBeVisible();
  });

  test('should auto-generate slug from name', async ({ page }) => {
    await page.goto('/organization/new');

    const nameInput = page.locator('input[placeholder*="organization name"]');
    const slugInput = page.locator('input[placeholder*="slug"]');

    await nameInput.fill('Test Organization Name');

    // Slug should be auto-generated
    await expect(slugInput).toHaveValue('test-organization-name');
  });

  test('should check slug availability', async ({ page }) => {
    await page.goto('/organization/new');

    const slugInput = page.locator('input[placeholder*="slug"]');

    await slugInput.fill('taken-slug');
    await page.click('button:has-text("Check Availability")');

    // Should show availability status
    await expect(page.locator('text=Slug is')).toBeVisible();
  });

  test('should handle organization creation success', async ({ page }) => {
    await page.goto('/organization/new');

    // Fill form with valid data
    await page.fill('input[placeholder*="organization name"]', 'Test Organization');
    await page.fill('input[placeholder*="slug"]', 'test-organization');
    await page.fill('textarea[placeholder*="description"]', 'A test organization for automated testing');

    // Select subscription tier
    await page.click('select[name="subscriptionTier"]');
    await page.click('text=Free');

    await page.click('button:has-text("Create Organization")');

    // Should redirect to organization dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);
    await expect(page.locator('text=Welcome to Test Organization')).toBeVisible();
  });

  test('should display organization switcher', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for organization switcher
    const orgSwitcher = page.locator('[data-testid="org-switcher"]').or(
      page.locator('text=Switch Organization')
    ).or(
      page.locator('.organization-selector')
    );

    await expect(orgSwitcher).toBeVisible();
  });

  test('should show organization members', async ({ page }) => {
    await page.goto('/admin/organization');

    // Check for members section
    await expect(page.locator('text=Members')).toBeVisible();
    await expect(page.locator('text=Add Member')).toBeVisible();

    // Check for member list
    await expect(page.locator('[data-testid="member-list"]')).toBeVisible();
  });

  test('should handle member invitation', async ({ page }) => {
    await page.goto('/admin/organization');

    await page.click('text=Add Member');

    // Check for invitation form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('select[name="role"]')).toBeVisible();

    // Fill invitation form
    await page.fill('input[type="email"]', 'newmember@example.com');
    await page.selectOption('select[name="role"]', 'member');

    await page.click('button:has-text("Send Invitation")');

    // Should show success message
    await expect(page.locator('text=Invitation sent')).toBeVisible();
  });

  test('should validate invitation email', async ({ page }) => {
    await page.goto('/admin/organization');

    await page.click('text=Add Member');

    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button:has-text("Send Invitation")');

    // Should show validation error
    await expect(page.locator('text=Invalid email format')).toBeVisible();
  });

  test('should display organization settings', async ({ page }) => {
    await page.goto('/admin/organization');

    // Check for settings sections
    await expect(page.locator('text=General Settings')).toBeVisible();
    await expect(page.locator('text=Branding')).toBeVisible();
    await expect(page.locator('text=Features')).toBeVisible();
    await expect(page.locator('text=Billing')).toBeVisible();
  });

  test('should handle organization branding', async ({ page }) => {
    await page.goto('/admin/organization');

    await page.click('text=Branding');

    // Check for branding options
    await expect(page.locator('input[type="file"]')).toBeVisible(); // Logo upload
    await expect(page.locator('input[type="color"]')).toBeVisible(); // Color picker
    await expect(page.locator('select[name="theme"]')).toBeVisible(); // Theme selector
  });

  test('should manage organization features', async ({ page }) => {
    await page.goto('/admin/organization');

    await page.click('text=Features');

    // Check for feature toggles
    await expect(page.locator('input[type="checkbox"]')).toBeVisible();
    await expect(page.locator('text=Events')).toBeVisible();
    await expect(page.locator('text=Social')).toBeVisible();
    await expect(page.locator('text=Challenges')).toBeVisible();
  });

  test('should handle member role changes', async ({ page }) => {
    await page.goto('/admin/organization');

    // Click on a member
    const memberItem = page.locator('[data-testid="member-item"]').first();
    await memberItem.click();

    // Check for role change options
    await expect(page.locator('select[name="role"]')).toBeVisible();
    await expect(page.locator('text=Admin')).toBeVisible();
    await expect(page.locator('text=Member')).toBeVisible();
    await expect(page.locator('text=Moderator')).toBeVisible();
  });

  test('should handle member removal', async ({ page }) => {
    await page.goto('/admin/organization');

    // Click on a member
    const memberItem = page.locator('[data-testid="member-item"]').first();
    await memberItem.click();

    // Check for remove button
    await expect(page.locator('button:has-text("Remove")')).toBeVisible();

    // Click remove and confirm
    await page.click('button:has-text("Remove")');
    await page.click('button:has-text("Confirm")');

    // Should show success message
    await expect(page.locator('text=Member removed')).toBeVisible();
  });

  test('should display organization analytics', async ({ page }) => {
    await page.goto('/admin/organization');

    await page.click('text=Analytics');

    // Check for analytics data
    await expect(page.locator('text=Total Members')).toBeVisible();
    await expect(page.locator('text=Active Users')).toBeVisible();
    await expect(page.locator('text=Events Created')).toBeVisible();
    await expect(page.locator('text=Posts Created')).toBeVisible();
  });

  test('should handle organization deletion', async ({ page }) => {
    await page.goto('/admin/organization');

    await page.click('text=Danger Zone');

    // Check for deletion section
    await expect(page.locator('text=Delete Organization')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();

    // Click delete and check confirmation
    await page.click('button:has-text("Delete")');
    await expect(page.locator('text=This action cannot be undone')).toBeVisible();
  });

  test('should prevent deletion without confirmation', async ({ page }) => {
    await page.goto('/admin/organization');

    await page.click('text=Danger Zone');
    await page.click('button:has-text("Delete")');

    // Try to delete without typing confirmation
    await page.click('button:has-text("Delete Organization")');

    // Should show error
    await expect(page.locator('text=Please type')).toBeVisible();
  });

  test('should handle organization export', async ({ page }) => {
    await page.goto('/admin/organization');

    await page.click('text=Export Data');

    // Check for export options
    await expect(page.locator('text=Export Members')).toBeVisible();
    await expect(page.locator('text=Export Events')).toBeVisible();
    await expect(page.locator('text=Export Posts')).toBeVisible();
  });

  test('should display organization onboarding for new orgs', async ({ page }) => {
    // This would test the onboarding flow for newly created organizations
    await page.goto('/organization/onboarding');

    // Check for onboarding steps
    await expect(page.locator('text=Welcome')).toBeVisible();
    await expect(page.locator('text=Set up your organization')).toBeVisible();
    await expect(page.locator('text=Next')).toBeVisible();
  });

  test('should handle organization theme customization', async ({ page }) => {
    await page.goto('/admin/organization');

    await page.click('text=Branding');
    await page.click('text=Theme');

    // Check for theme customization options
    await expect(page.locator('text=Primary Color')).toBeVisible();
    await expect(page.locator('text=Secondary Color')).toBeVisible();
    await expect(page.locator('text=Font Family')).toBeVisible();
    await expect(page.locator('text=Logo')).toBeVisible();
  });

  test('should validate organization slug uniqueness', async ({ page }) => {
    await page.goto('/organization/new');

    // Try to create org with existing slug
    await page.fill('input[placeholder*="organization name"]', 'Another Test Org');
    await page.fill('input[placeholder*="slug"]', 'humbl-girls-club'); // Assuming this exists

    await page.click('button:has-text("Create Organization")');

    // Should show slug already taken error
    await expect(page.locator('text=Slug is already taken')).toBeVisible();
  });
});
