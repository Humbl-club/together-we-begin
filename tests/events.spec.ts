import { test, expect } from '@playwright/test';

/**
 * EVENTS TESTS
 *
 * Tests for event creation, management, RSVPs, and event interactions
 */

test.describe('Events', () => {

  test.beforeEach(async ({ page }) => {
    // These tests would require authentication
    // For now, we'll test the UI flows
  });

  test('should display events page', async ({ page }) => {
    await page.goto('/events');

    // Check for events page elements
    await expect(page.locator('text=Events')).toBeVisible();
    await expect(page.locator('[data-testid="events-list"]')).toBeVisible();
  });

  test('should display create event button', async ({ page }) => {
    await page.goto('/events');

    // Check for create event button
    await expect(page.locator('text=Create Event')).toBeVisible();
    await expect(page.locator('button:has-text("Create Event")')).toBeVisible();
  });

  test('should navigate to create event page', async ({ page }) => {
    await page.goto('/events');

    await page.click('text=Create Event');

    // Should navigate to event creation page
    await expect(page).toHaveURL(/.*event.*new.*/);
    await expect(page.locator('text=Create New Event')).toBeVisible();
  });

  test('should display event creation form', async ({ page }) => {
    await page.goto('/events/new');

    // Check for event creation form elements
    await expect(page.locator('input[placeholder*="event title"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="event description"]')).toBeVisible();
    await expect(page.locator('input[type="datetime-local"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="location"]')).toBeVisible();
    await expect(page.locator('select[name="eventType"]')).toBeVisible();
  });

  test('should validate event title', async ({ page }) => {
    await page.goto('/events/new');

    const titleInput = page.locator('input[placeholder*="event title"]');

    // Test empty title
    await page.click('button:has-text("Create Event")');
    await expect(page.locator('text=Event title is required')).toBeVisible();

    // Test title too short
    await titleInput.fill('A');
    await page.click('button:has-text("Create Event")');
    await expect(page.locator('text=Title must be at least')).toBeVisible();
  });

  test('should validate event date', async ({ page }) => {
    await page.goto('/events/new');

    // Test past date
    await page.fill('input[placeholder*="event title"]', 'Test Event');
    await page.fill('input[type="datetime-local"]', '2020-01-01T10:00');
    await page.click('button:has-text("Create Event")');

    await expect(page.locator('text=Event date cannot be in the past')).toBeVisible();
  });

  test('should handle event creation', async ({ page }) => {
    await page.goto('/events/new');

    // Fill event form
    await page.fill('input[placeholder*="event title"]', 'Test Community Event');
    await page.fill('textarea[placeholder*="event description"]', 'A test event for automated testing');
    await page.fill('input[type="datetime-local"]', '2024-12-31T15:00');
    await page.fill('input[placeholder*="location"]', 'Community Center');
    await page.selectOption('select[name="eventType"]', 'workshop');

    await page.click('button:has-text("Create Event")');

    // Should show success message
    await expect(page.locator('text=Event created successfully')).toBeVisible();

    // Should redirect to event page
    await expect(page).toHaveURL(/.*event.*/);
  });

  test('should display event details', async ({ page }) => {
    await page.goto('/events/1'); // Assuming event with ID 1 exists

    // Check for event details
    await expect(page.locator('[data-testid="event-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-location"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-attendees"]')).toBeVisible();
  });

  test('should display RSVP options', async ({ page }) => {
    await page.goto('/events/1');

    // Check for RSVP buttons
    await expect(page.locator('button:has-text("Going")')).toBeVisible();
    await expect(page.locator('button:has-text("Interested")')).toBeVisible();
    await expect(page.locator('button:has-text("Not Going")')).toBeVisible();
  });

  test('should handle RSVP going', async ({ page }) => {
    await page.goto('/events/1');

    await page.click('button:has-text("Going")');

    // Should show confirmation
    await expect(page.locator('text=You are going to this event')).toBeVisible();

    // Should update attendee count
    await expect(page.locator('[data-testid="attendee-count"]')).toBeVisible();
  });

  test('should handle RSVP interested', async ({ page }) => {
    await page.goto('/events/1');

    await page.click('button:has-text("Interested")');

    // Should show confirmation
    await expect(page.locator('text=You are interested in this event')).toBeVisible();
  });

  test('should handle RSVP not going', async ({ page }) => {
    await page.goto('/events/1');

    await page.click('button:has-text("Not Going")');

    // Should show confirmation
    await expect(page.locator('text=You are not going to this event')).toBeVisible();
  });

  test('should display event organizer info', async ({ page }) => {
    await page.goto('/events/1');

    // Check for organizer information
    await expect(page.locator('text=Organized by')).toBeVisible();
    await expect(page.locator('[data-testid="organizer-avatar"]')).toBeVisible();
    await expect(page.locator('[data-testid="organizer-name"]')).toBeVisible();
  });

  test('should display event attendees', async ({ page }) => {
    await page.goto('/events/1');

    // Check for attendees section
    await expect(page.locator('text=Attendees')).toBeVisible();
    await expect(page.locator('[data-testid="attendee-list"]')).toBeVisible();
  });

  test('should handle event sharing', async ({ page }) => {
    await page.goto('/events/1');

    await page.click('[data-testid="share-event"]');

    // Check for share options
    await expect(page.locator('text=Share Event')).toBeVisible();
    await expect(page.locator('text=Copy Link')).toBeVisible();
    await expect(page.locator('text=Share to Social')).toBeVisible();
  });

  test('should display event comments', async ({ page }) => {
    await page.goto('/events/1');

    // Check for comments section
    await expect(page.locator('text=Comments')).toBeVisible();
    await expect(page.locator('[data-testid="comments-section"]')).toBeVisible();
  });

  test('should handle event commenting', async ({ page }) => {
    await page.goto('/events/1');

    const commentTextarea = page.locator('textarea[placeholder*="Write a comment"]');

    await commentTextarea.fill('This is a test comment on the event');

    await page.click('button:has-text("Comment")');

    // Should display the comment
    await expect(page.locator('text=This is a test comment on the event')).toBeVisible();
  });

  test('should display event categories', async ({ page }) => {
    await page.goto('/events');

    // Check for event categories/filters
    await expect(page.locator('text=All Events')).toBeVisible();
    await expect(page.locator('text=Workshops')).toBeVisible();
    await expect(page.locator('text=Social')).toBeVisible();
    await expect(page.locator('text=Meetings')).toBeVisible();
  });

  test('should filter events by category', async ({ page }) => {
    await page.goto('/events');

    await page.click('text=Workshops');

    // Should filter events
    await expect(page.locator('[data-testid="events-list"]')).toBeVisible();
  });

  test('should display upcoming events', async ({ page }) => {
    await page.goto('/events');

    // Check for upcoming events section
    await expect(page.locator('text=Upcoming Events')).toBeVisible();
    await expect(page.locator('[data-testid="upcoming-events"]')).toBeVisible();
  });

  test('should display past events', async ({ page }) => {
    await page.goto('/events');

    // Check for past events section
    await expect(page.locator('text=Past Events')).toBeVisible();
    await expect(page.locator('[data-testid="past-events"]')).toBeVisible();
  });

  test('should handle event search', async ({ page }) => {
    await page.goto('/events');

    const searchInput = page.locator('input[placeholder*="Search events"]');

    await searchInput.fill('community');
    await searchInput.press('Enter');

    // Should show search results
    await expect(page.locator('text=Search Results')).toBeVisible();
  });

  test('should display event calendar view', async ({ page }) => {
    await page.goto('/events');

    await page.click('text=Calendar View');

    // Should show calendar
    await expect(page.locator('[data-testid="event-calendar"]')).toBeVisible();
  });

  test('should handle calendar navigation', async ({ page }) => {
    await page.goto('/events');
    await page.click('text=Calendar View');

    // Click next month
    await page.click('[data-testid="next-month"]');

    // Should update calendar
    await expect(page.locator('[data-testid="event-calendar"]')).toBeVisible();
  });

  test('should display event on calendar', async ({ page }) => {
    await page.goto('/events');
    await page.click('text=Calendar View');

    // Check for event indicators on calendar
    await expect(page.locator('[data-testid="calendar-event"]')).toBeVisible();
  });

  test('should handle event editing', async ({ page }) => {
    await page.goto('/events/1');

    // Click edit event (assuming user is organizer)
    await page.click('text=Edit Event');

    // Should show edit form
    await expect(page.locator('input[placeholder*="event title"]')).toBeVisible();
  });

  test('should handle event deletion', async ({ page }) => {
    await page.goto('/events/1');

    // Click delete event
    await page.click('text=Delete Event');

    // Check for confirmation dialog
    await expect(page.locator('text=Are you sure you want to delete this event?')).toBeVisible();
  });

  test('should confirm event deletion', async ({ page }) => {
    await page.goto('/events/1');

    await page.click('text=Delete Event');
    await page.click('button:has-text("Delete")');

    // Should show success message
    await expect(page.locator('text=Event deleted successfully')).toBeVisible();

    // Should redirect to events list
    await expect(page).toHaveURL(/.*events.*/);
  });

  test('should display event capacity', async ({ page }) => {
    await page.goto('/events/1');

    // Check for capacity information
    await expect(page.locator('text=Capacity')).toBeVisible();
    await expect(page.locator('[data-testid="event-capacity"]')).toBeVisible();
  });

  test('should handle full event RSVP', async ({ page }) => {
    // This would require an event at capacity
    await page.goto('/events/1');

    // If event is full, RSVP button should be disabled or show waitlist
    await expect(page.locator('text=Event Full')).toBeVisible();
  });

  test('should display event tags', async ({ page }) => {
    await page.goto('/events/1');

    // Check for event tags
    await expect(page.locator('[data-testid="event-tags"]')).toBeVisible();
  });

  test('should handle event tag filtering', async ({ page }) => {
    await page.goto('/events');

    const eventTag = page.locator('[data-testid="event-tag"]').first();
    await eventTag.click();

    // Should filter events by tag
    await expect(page.locator('[data-testid="events-list"]')).toBeVisible();
  });

  test('should display event location on map', async ({ page }) => {
    await page.goto('/events/1');

    // Check for map integration
    await expect(page.locator('[data-testid="event-map"]')).toBeVisible();
  });

  test('should handle event export', async ({ page }) => {
    await page.goto('/events/1');

    await page.click('text=Export Event');

    // Check for export options
    await expect(page.locator('text=Add to Calendar')).toBeVisible();
    await expect(page.locator('text=Download ICS')).toBeVisible();
  });

  test('should display event notifications', async ({ page }) => {
    await page.goto('/events/1');

    // Check for notification settings
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('input[type="checkbox"]')).toBeVisible();
  });

  test('should handle event reminder settings', async ({ page }) => {
    await page.goto('/events/1');

    // Check for reminder options
    await expect(page.locator('text=Remind me')).toBeVisible();
    await expect(page.locator('select[name="reminder"]')).toBeVisible();
  });

  test('should display related events', async ({ page }) => {
    await page.goto('/events/1');

    // Check for related events section
    await expect(page.locator('text=Related Events')).toBeVisible();
    await expect(page.locator('[data-testid="related-events"]')).toBeVisible();
  });

  test('should handle event waitlist', async ({ page }) => {
    // This would require an event at capacity with waitlist enabled
    await page.goto('/events/1');

    await page.click('button:has-text("Join Waitlist")');

    // Should show waitlist confirmation
    await expect(page.locator('text=Added to waitlist')).toBeVisible();
  });

  test('should display event statistics for organizer', async ({ page }) => {
    await page.goto('/events/1');

    // Click on event stats (for organizer)
    await page.click('text=Event Stats');

    // Should show statistics
    await expect(page.locator('text=Total RSVPs')).toBeVisible();
    await expect(page.locator('text=Going')).toBeVisible();
    await expect(page.locator('text=Interested')).toBeVisible();
  });

  test('should handle event duplication', async ({ page }) => {
    await page.goto('/events/1');

    // Click duplicate event
    await page.click('text=Duplicate Event');

    // Should navigate to create event with pre-filled data
    await expect(page).toHaveURL(/.*event.*new.*/);
    await expect(page.locator('input[placeholder*="event title"]')).toHaveValue('Test Community Event (Copy)');
  });

  test('should display event on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/events/1');

    // Check mobile responsiveness
    await expect(page.locator('[data-testid="event-title"]')).toBeVisible();

    // Check for mobile-specific elements
    await expect(page.locator('[data-testid="mobile-rsvp"]')).toBeVisible();
  });

  test('should handle mobile event RSVP', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/events/1');

    await page.click('[data-testid="mobile-rsvp"]');

    // Should show mobile RSVP options
    await expect(page.locator('button:has-text("Going")')).toBeVisible();
  });

  test('should display event virtual meeting link', async ({ page }) => {
    await page.goto('/events/1');

    // Check for virtual meeting information
    await expect(page.locator('text=Virtual Meeting')).toBeVisible();
    await expect(page.locator('[data-testid="meeting-link"]')).toBeVisible();
  });

  test('should handle virtual event join', async ({ page }) => {
    await page.goto('/events/1');

    await page.click('text=Join Meeting');

    // Should open meeting link or show meeting details
    await expect(page.locator('[data-testid="meeting-details"]')).toBeVisible();
  });
});
