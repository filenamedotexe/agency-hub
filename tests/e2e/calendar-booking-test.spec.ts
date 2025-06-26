import { test, expect } from "@playwright/test";
import { loginAsUser } from "./helpers/auth";

test.describe("Calendar Booking Modal", () => {
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for this test
    test.setTimeout(60000);

    // Login as admin
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL("/dashboard", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // Navigate to calendar
    await page.goto("/calendar");

    // Wait for the calendar page to fully load
    // The calendar page has multiple async operations
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    // Wait for the main calendar heading to be visible
    await page.waitForSelector('h1:has-text("Calendar")', {
      state: "visible",
      timeout: 15000,
    });

    // Wait for the "New Booking" button to be visible and clickable
    await page.waitForSelector('button:has-text("New Booking")', {
      state: "visible",
      timeout: 10000,
    });

    // Give a small buffer for any remaining async operations
    await page.waitForTimeout(500);
  });

  test("service dropdown works correctly with client selection", async ({
    page,
  }) => {
    // Open booking modal
    await page.click('button:has-text("New Booking")');

    // Wait for modal to open
    await expect(page.locator('dialog:has-text("New Booking")')).toBeVisible();

    // Verify initial state - service dropdown should be disabled
    const serviceDropdown = page.locator(
      'button:has-text("Select a client first")'
    );
    await expect(serviceDropdown).toBeVisible();

    // Select a client
    const clientDropdown = page
      .locator('button:has-text("Select a client")')
      .first();
    await clientDropdown.click();

    // Wait for clients to load and select first one
    await page.waitForSelector('[role="option"]');
    await page.click('[role="option"]');

    // Wait for services to load
    await page.waitForTimeout(1000);

    // Verify service dropdown is now enabled
    const enabledServiceDropdown = page.locator(
      'button:has-text("Select a service")'
    );
    await expect(enabledServiceDropdown).toBeVisible();

    // Take screenshot for debugging
    await page.screenshot({ path: "calendar-booking-test.png" });
  });
});

test.describe("Calendar Phase 4 UI/UX Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "admin@example.com", "password123");
  });

  test("Calendar page should load and display properly", async ({ page }) => {
    await page.goto("/calendar");

    // Check page title and header
    await expect(page.locator("h1")).toContainText("Calendar");
    await expect(
      page.locator("text=Manage your bookings and appointments")
    ).toBeVisible();

    // Check main components are present
    await expect(
      page
        .locator('[data-testid="calendar-view"]')
        .or(page.locator(".rbc-calendar"))
    ).toBeVisible();
    await expect(page.locator('button:has-text("New")')).toBeVisible();
    await expect(page.locator('button:has-text("Availability")')).toBeVisible();
  });

  test("Mobile responsiveness - sidebar should be hidden on mobile", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/calendar");

    // Desktop sidebar should be hidden on mobile
    await expect(page.locator(".hidden.md\\:block")).toBeHidden();

    // Mobile menu button should be visible
    await expect(
      page
        .locator('button:has-text("☰")')
        .or(page.locator('button svg[data-testid="menu"]'))
    ).toBeVisible();
  });

  test("Mobile responsiveness - calendar toolbar should stack vertically", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/calendar");

    // Wait for calendar to load
    await page.waitForSelector(".rbc-calendar", { timeout: 10000 });

    // Check if toolbar is properly responsive
    const toolbar = page.locator(".rbc-toolbar");
    await expect(toolbar).toBeVisible();

    // Check if view buttons are present and clickable
    await expect(
      page.locator('.rbc-toolbar button:has-text("Month")')
    ).toBeVisible();
    await expect(
      page.locator('.rbc-toolbar button:has-text("Week")')
    ).toBeVisible();
    await expect(
      page.locator('.rbc-toolbar button:has-text("Day")')
    ).toBeVisible();
  });

  test("Touch interactions - buttons should have proper touch targets", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/calendar");

    // Check button sizes for touch-friendly interactions (min 44px)
    const newBookingBtn = page.locator('button:has-text("New")');
    await expect(newBookingBtn).toBeVisible();

    const btnBox = await newBookingBtn.boundingBox();
    expect(btnBox?.height).toBeGreaterThanOrEqual(44);
  });

  test("Booking modal should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/calendar");

    // Open new booking modal
    await page.click('button:has-text("New")');

    // Modal should be visible and properly sized
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Check if form fields stack vertically on mobile
    await expect(page.locator("form .grid-cols-1")).toBeVisible();
  });

  test("Calendar views should switch properly", async ({ page }) => {
    await page.goto("/calendar");

    // Wait for calendar to load
    await page.waitForSelector(".rbc-calendar", { timeout: 10000 });

    // Test view switching
    await page.click('.rbc-toolbar button:has-text("Month")');
    await expect(page.locator(".rbc-month-view")).toBeVisible();

    await page.click('.rbc-toolbar button:has-text("Day")');
    await expect(page.locator(".rbc-time-view")).toBeVisible();

    await page.click('.rbc-toolbar button:has-text("List")');
    await expect(page.locator(".rbc-agenda-view")).toBeVisible();
  });

  test("Google Calendar integration UI should work", async ({ page }) => {
    await page.goto("/calendar");

    // Check for Google Calendar connection section
    await expect(
      page.locator("text=Google Calendar Integration")
    ).toBeVisible();

    // Should show connect button if not connected
    const connectBtn = page.locator('button:has-text("Connect Calendar")');
    if (await connectBtn.isVisible()) {
      await expect(connectBtn).toBeEnabled();
    }
  });

  test("Desktop layout - sidebar should be visible", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/calendar");

    // Desktop sidebar should be visible
    await expect(page.locator(".hidden.md\\:block")).toBeVisible();

    // Should contain mini calendar and upcoming bookings
    await expect(page.locator("text=Calendar")).toBeVisible();
    await expect(page.locator("text=Upcoming Bookings")).toBeVisible();
  });

  test("Keyboard navigation should work", async ({ page }) => {
    await page.goto("/calendar");

    // Tab navigation should work for main interactive elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Should be able to reach the New Booking button
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });

  test("Loading states should be handled properly", async ({ page }) => {
    await page.goto("/calendar");

    // Should show some loading indication initially
    await page.waitForSelector(".rbc-calendar", { timeout: 10000 });

    // Calendar should eventually load
    await expect(page.locator(".rbc-calendar")).toBeVisible();
  });

  test("Error handling - should show graceful errors", async ({ page }) => {
    // Intercept API calls and force errors
    await page.route("**/api/bookings**", (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Server error" }),
      });
    });

    await page.goto("/calendar");

    // Should still render the calendar structure even with API errors
    await expect(page.locator(".rbc-calendar")).toBeVisible();
  });
});

test.describe("Calendar Booking Creation Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "admin@example.com", "password123");
  });

  test("Should create a new booking via time slot selection", async ({
    page,
  }) => {
    await page.goto("/calendar");

    // Wait for calendar to load
    await page.waitForSelector(".rbc-calendar", { timeout: 10000 });

    // Switch to week view for easier slot selection
    await page.click('.rbc-toolbar button:has-text("Week")');

    // Try to click on a time slot (this might need adjustment based on actual implementation)
    await page.click(".rbc-time-slot", { force: true });

    // Booking modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator("text=New Booking")).toBeVisible();
  });

  test("Should create a new booking via button", async ({ page }) => {
    await page.goto("/calendar");

    // Click New Booking button
    await page.click('button:has-text("New")');

    // Modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator("text=New Booking")).toBeVisible();

    // Should have form fields
    await expect(page.locator('input[placeholder*="Meeting"]')).toBeVisible();
    await expect(page.locator("text=Client")).toBeVisible();
  });
});
