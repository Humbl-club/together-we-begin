import { test, expect } from '@playwright/test';

/**
 * CHALLENGES TESTS
 *
 * Tests for challenge creation, participation, progress tracking, and rewards
 */

test.describe('Challenges', () => {

  test.beforeEach(async ({ page }) => {
    // These tests would require authentication
    // For now, we'll test the UI flows
  });

  test('should display challenges page', async ({ page }) => {
    await page.goto('/challenges');

    // Check for challenges page elements
    await expect(page.locator('text=Challenges')).toBeVisible();
    await expect(page.locator('[data-testid="challenges-list"]')).toBeVisible();
  });

  test('should display create challenge button', async ({ page }) => {
    await page.goto('/challenges');

    // Check for create challenge button
    await expect(page.locator('text=Create Challenge')).toBeVisible();
    await expect(page.locator('button:has-text("Create Challenge")')).toBeVisible();
  });

  test('should navigate to create challenge page', async ({ page }) => {
    await page.goto('/challenges');

    await page.click('text=Create Challenge');

    // Should navigate to challenge creation page
    await expect(page).toHaveURL(/.*challenge.*new.*/);
    await expect(page.locator('text=Create New Challenge')).toBeVisible();
  });

  test('should display challenge creation form', async ({ page }) => {
    await page.goto('/challenges/new');

    // Check for challenge creation form elements
    await expect(page.locator('input[placeholder*="challenge title"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="challenge description"]')).toBeVisible();
    await expect(page.locator('select[name="challengeType"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="duration"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="target"]')).toBeVisible();
  });

  test('should validate challenge title', async ({ page }) => {
    await page.goto('/challenges/new');

    const titleInput = page.locator('input[placeholder*="challenge title"]');

    // Test empty title
    await page.click('button:has-text("Create Challenge")');
    await expect(page.locator('text=Challenge title is required')).toBeVisible();

    // Test title too short
    await titleInput.fill('A');
    await page.click('button:has-text("Create Challenge")');
    await expect(page.locator('text=Title must be at least')).toBeVisible();
  });

  test('should handle challenge creation', async ({ page }) => {
    await page.goto('/challenges/new');

    // Fill challenge form
    await page.fill('input[placeholder*="challenge title"]', '30-Day Fitness Challenge');
    await page.fill('textarea[placeholder*="challenge description"]', 'A 30-day fitness challenge for community members');
    await page.selectOption('select[name="challengeType"]', 'fitness');
    await page.fill('input[placeholder*="duration"]', '30');
    await page.fill('input[placeholder*="target"]', '10000'); // 10k steps per day

    await page.click('button:has-text("Create Challenge")');

    // Should show success message
    await expect(page.locator('text=Challenge created successfully')).toBeVisible();

    // Should redirect to challenge page
    await expect(page).toHaveURL(/.*challenge.*/);
  });

  test('should display challenge details', async ({ page }) => {
    await page.goto('/challenges/1'); // Assuming challenge with ID 1 exists

    // Check for challenge details
    await expect(page.locator('[data-testid="challenge-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-duration"]')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-target"]')).toBeVisible();
  });

  test('should display challenge progress', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for progress elements
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-percentage"]')).toBeVisible();
    await expect(page.locator('[data-testid="days-completed"]')).toBeVisible();
  });

  test('should display join challenge button', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for join button
    await expect(page.locator('button:has-text("Join Challenge")')).toBeVisible();
  });

  test('should handle joining challenge', async ({ page }) => {
    await page.goto('/challenges/1');

    await page.click('button:has-text("Join Challenge")');

    // Should show confirmation
    await expect(page.locator('text=Successfully joined challenge')).toBeVisible();

    // Button should change to leave
    await expect(page.locator('button:has-text("Leave Challenge")')).toBeVisible();
  });

  test('should handle leaving challenge', async ({ page }) => {
    await page.goto('/challenges/1');

    await page.click('button:has-text("Leave Challenge")');

    // Should show confirmation dialog
    await expect(page.locator('text=Are you sure you want to leave this challenge?')).toBeVisible();
  });

  test('should confirm leaving challenge', async ({ page }) => {
    await page.goto('/challenges/1');

    await page.click('button:has-text("Leave Challenge")');
    await page.click('button:has-text("Leave")');

    // Should show success message
    await expect(page.locator('text=Successfully left challenge')).toBeVisible();
  });

  test('should display challenge participants', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for participants section
    await expect(page.locator('text=Participants')).toBeVisible();
    await expect(page.locator('[data-testid="participants-list"]')).toBeVisible();
  });

  test('should display leaderboard', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for leaderboard
    await expect(page.locator('text=Leaderboard')).toBeVisible();
    await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();
  });

  test('should handle progress update', async ({ page }) => {
    await page.goto('/challenges/1');

    // Click update progress
    await page.click('button:has-text("Update Progress")');

    // Check for progress input
    await expect(page.locator('input[placeholder*="Enter progress"]')).toBeVisible();
    await expect(page.locator('button:has-text("Submit")')).toBeVisible();
  });

  test('should submit progress update', async ({ page }) => {
    await page.goto('/challenges/1');

    await page.click('button:has-text("Update Progress")');

    const progressInput = page.locator('input[placeholder*="Enter progress"]');
    await progressInput.fill('5000'); // 5000 steps

    await page.click('button:has-text("Submit")');

    // Should show success message
    await expect(page.locator('text=Progress updated successfully')).toBeVisible();
  });

  test('should validate progress input', async ({ page }) => {
    await page.goto('/challenges/1');

    await page.click('button:has-text("Update Progress")');

    const progressInput = page.locator('input[placeholder*="Enter progress"]');

    // Test invalid input
    await progressInput.fill('invalid');
    await page.click('button:has-text("Submit")');

    // Should show validation error
    await expect(page.locator('text=Please enter a valid number')).toBeVisible();
  });

  test('should display challenge rewards', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for rewards section
    await expect(page.locator('text=Rewards')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-rewards"]')).toBeVisible();
  });

  test('should display challenge rules', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for rules section
    await expect(page.locator('text=Rules')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-rules"]')).toBeVisible();
  });

  test('should display challenge categories', async ({ page }) => {
    await page.goto('/challenges');

    // Check for challenge categories
    await expect(page.locator('text=All Challenges')).toBeVisible();
    await expect(page.locator('text=Fitness')).toBeVisible();
    await expect(page.locator('text=Learning')).toBeVisible();
    await expect(page.locator('text=Community')).toBeVisible();
  });

  test('should filter challenges by category', async ({ page }) => {
    await page.goto('/challenges');

    await page.click('text=Fitness');

    // Should filter challenges
    await expect(page.locator('[data-testid="challenges-list"]')).toBeVisible();
  });

  test('should display active challenges', async ({ page }) => {
    await page.goto('/challenges');

    // Check for active challenges section
    await expect(page.locator('text=Active Challenges')).toBeVisible();
    await expect(page.locator('[data-testid="active-challenges"]')).toBeVisible();
  });

  test('should display completed challenges', async ({ page }) => {
    await page.goto('/challenges');

    // Check for completed challenges section
    await expect(page.locator('text=Completed Challenges')).toBeVisible();
    await expect(page.locator('[data-testid="completed-challenges"]')).toBeVisible();
  });

  test('should handle challenge search', async ({ page }) => {
    await page.goto('/challenges');

    const searchInput = page.locator('input[placeholder*="Search challenges"]');

    await searchInput.fill('fitness');
    await searchInput.press('Enter');

    // Should show search results
    await expect(page.locator('text=Search Results')).toBeVisible();
  });

  test('should display challenge statistics', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for statistics
    await expect(page.locator('text=Total Participants')).toBeVisible();
    await expect(page.locator('text=Average Progress')).toBeVisible();
    await expect(page.locator('text=Completion Rate')).toBeVisible();
  });

  test('should display challenge timeline', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for timeline
    await expect(page.locator('[data-testid="challenge-timeline"]')).toBeVisible();
  });

  test('should handle challenge sharing', async ({ page }) => {
    await page.goto('/challenges/1');

    await page.click('[data-testid="share-challenge"]');

    // Check for share options
    await expect(page.locator('text=Share Challenge')).toBeVisible();
    await expect(page.locator('text=Copy Link')).toBeVisible();
  });

  test('should display challenge comments', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for comments section
    await expect(page.locator('text=Discussion')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-comments"]')).toBeVisible();
  });

  test('should handle challenge commenting', async ({ page }) => {
    await page.goto('/challenges/1');

    const commentTextarea = page.locator('textarea[placeholder*="Write a comment"]');

    await commentTextarea.fill('Great challenge! Loving the community support.');

    await page.click('button:has-text("Comment")');

    // Should display the comment
    await expect(page.locator('text=Great challenge! Loving the community support.')).toBeVisible();
  });

  test('should display challenge milestones', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for milestones
    await expect(page.locator('text=Milestones')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-milestones"]')).toBeVisible();
  });

  test('should handle milestone achievement', async ({ page }) => {
    await page.goto('/challenges/1');

    // This would trigger when user reaches a milestone
    // Check for achievement notification
    await expect(page.locator('[data-testid="achievement-notification"]')).toBeVisible();
  });

  test('should display challenge badges', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for badges section
    await expect(page.locator('text=Badges')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-badges"]')).toBeVisible();
  });

  test('should handle challenge completion', async ({ page }) => {
    // This would trigger when challenge is completed
    await page.goto('/challenges/1');

    // Check for completion celebration
    await expect(page.locator('[data-testid="completion-celebration"]')).toBeVisible();
    await expect(page.locator('text=Challenge Completed!')).toBeVisible();
  });

  test('should display challenge creator info', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for creator information
    await expect(page.locator('text=Created by')).toBeVisible();
    await expect(page.locator('[data-testid="creator-avatar"]')).toBeVisible();
    await expect(page.locator('[data-testid="creator-name"]')).toBeVisible();
  });

  test('should handle challenge editing', async ({ page }) => {
    await page.goto('/challenges/1');

    // Click edit challenge (assuming user is creator)
    await page.click('text=Edit Challenge');

    // Should show edit form
    await expect(page.locator('input[placeholder*="challenge title"]')).toBeVisible();
  });

  test('should handle challenge deletion', async ({ page }) => {
    await page.goto('/challenges/1');

    // Click delete challenge
    await page.click('text=Delete Challenge');

    // Check for confirmation dialog
    await expect(page.locator('text=Are you sure you want to delete this challenge?')).toBeVisible();
  });

  test('should confirm challenge deletion', async ({ page }) => {
    await page.goto('/challenges/1');

    await page.click('text=Delete Challenge');
    await page.click('button:has-text("Delete")');

    // Should show success message
    await expect(page.locator('text=Challenge deleted successfully')).toBeVisible();

    // Should redirect to challenges list
    await expect(page).toHaveURL(/.*challenges.*/);
  });

  test('should display challenge templates', async ({ page }) => {
    await page.goto('/challenges/new');

    // Check for template selection
    await expect(page.locator('text=Choose a Template')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-templates"]')).toBeVisible();
  });

  test('should handle template selection', async ({ page }) => {
    await page.goto('/challenges/new');

    const templateCard = page.locator('[data-testid="template-card"]').first();
    await templateCard.click();

    // Should pre-fill form with template data
    await expect(page.locator('input[placeholder*="challenge title"]')).not.toHaveValue('');
  });

  test('should display challenge difficulty levels', async ({ page }) => {
    await page.goto('/challenges/new');

    // Check for difficulty selection
    await expect(page.locator('select[name="difficulty"]')).toBeVisible();
    await expect(page.locator('text=Beginner')).toBeVisible();
    await expect(page.locator('text=Intermediate')).toBeVisible();
    await expect(page.locator('text=Advanced')).toBeVisible();
  });

  test('should display challenge privacy settings', async ({ page }) => {
    await page.goto('/challenges/new');

    // Check for privacy options
    await expect(page.locator('select[name="privacy"]')).toBeVisible();
    await expect(page.locator('text=Public')).toBeVisible();
    await expect(page.locator('text=Organization Only')).toBeVisible();
  });

  test('should handle challenge duplication', async ({ page }) => {
    await page.goto('/challenges/1');

    // Click duplicate challenge
    await page.click('text=Duplicate Challenge');

    // Should navigate to create challenge with pre-filled data
    await expect(page).toHaveURL(/.*challenge.*new.*/);
    await expect(page.locator('input[placeholder*="challenge title"]')).toHaveValue('30-Day Fitness Challenge (Copy)');
  });

  test('should display challenge on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/challenges/1');

    // Check mobile responsiveness
    await expect(page.locator('[data-testid="challenge-title"]')).toBeVisible();

    // Check for mobile-specific elements
    await expect(page.locator('[data-testid="mobile-progress"]')).toBeVisible();
  });

  test('should handle mobile challenge join', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/challenges/1');

    await page.click('[data-testid="mobile-join"]');

    // Should show mobile join confirmation
    await expect(page.locator('text=Successfully joined challenge')).toBeVisible();
  });

  test('should display challenge notifications', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for notification settings
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('input[type="checkbox"]')).toBeVisible();
  });

  test('should handle challenge reminder settings', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for reminder options
    await expect(page.locator('text=Remind me')).toBeVisible();
    await expect(page.locator('select[name="reminder"]')).toBeVisible();
  });

  test('should display challenge streaks', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for streak counter
    await expect(page.locator('text=Current Streak')).toBeVisible();
    await expect(page.locator('[data-testid="streak-counter"]')).toBeVisible();
  });

  test('should display challenge achievements', async ({ page }) => {
    await page.goto('/challenges/1');

    // Check for achievements section
    await expect(page.locator('text=Achievements')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-achievements"]')).toBeVisible();
  });
});
