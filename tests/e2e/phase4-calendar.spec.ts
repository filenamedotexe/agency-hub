import { test, expect } from "@playwright/test";

// Test calendar functionality for all roles and device responsiveness
test.describe("Phase 4 - Calendar Feature Testing", () => {
  // Test different viewport sizes
  const viewports = [
    { name: "desktop", width: 1280, height: 720 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 375, height: 667 },
  ];

  // Test different user roles
  const roles = [
    { email: "admin@example.com", password: "admin123", role: "admin" },
    { email: "manager@example.com", password: "manager123", role: "manager" },
    { email: "client@example.com", password: "client123", role: "client" },
  ];

  for (const viewport of viewports) {
    for (const user of roles) {
      test(`Calendar - ${user.role} role on ${viewport.name}`, async ({
        page,
      }) => {
        // Set viewport
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        // Navigate to login
        await page.goto("http://localhost:3001/login");

        // Login
        await page.fill('input[name="email"]', user.email);
        await page.fill('input[name="password"]', user.password);
        await page.click('button[type="submit"]');

        // Wait for navigation to dashboard
        await page.waitForURL("**/dashboard", { timeout: 10000 });

        // Navigate to calendar
        await page.click('a[href="/calendar"]');
        await page.waitForURL("**/calendar", { timeout: 10000 });

        // Wait for calendar to load
        await page.waitForSelector(".rbc-calendar", { timeout: 10000 });

        // Test calendar view switching
        const viewButtons = ["Month", "Week", "Day", "Agenda"];
        for (const view of viewButtons) {
          const button = page.getByRole("button", { name: view, exact: true });
          if (await button.isVisible()) {
            await button.click();
            await page.waitForTimeout(500); // Wait for view change animation
          }
        }

        // Test calendar navigation
        await page.getByRole("button", { name: "Today" }).click();
        await page.waitForTimeout(500);

        await page.getByRole("button", { name: "Back" }).click();
        await page.waitForTimeout(500);

        await page.getByRole("button", { name: "Next" }).click();
        await page.waitForTimeout(500);

        // Test new booking modal (except for client role)
        if (user.role !== "client") {
          await page.getByRole("button", { name: /new booking/i }).click();

          // Wait for modal to open
          await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

          // Verify form fields are present
          await expect(page.getByLabel(/title/i)).toBeVisible();
          await expect(page.getByLabel(/client/i)).toBeVisible();
          await expect(page.getByLabel(/service/i)).toBeVisible();
          await expect(page.getByLabel(/date/i)).toBeVisible();
          await expect(page.getByLabel(/start time/i)).toBeVisible();
          await expect(page.getByLabel(/end time/i)).toBeVisible();

          // Close modal
          await page.keyboard.press("Escape");
          await page.waitForTimeout(500);
        }

        // Test sidebar components
        if (viewport.name !== "mobile") {
          // Mini calendar should be visible on desktop/tablet
          await expect(page.locator(".react-calendar")).toBeVisible();

          // Upcoming bookings should be visible
          await expect(page.getByText(/upcoming bookings/i)).toBeVisible();
        }

        // Test responsive behavior
        if (viewport.name === "mobile") {
          // On mobile, sidebar might be collapsed or hidden
          const sidebar = page.locator('[data-testid="calendar-sidebar"]');
          if (await sidebar.isVisible()) {
            // Check if it's properly styled for mobile
            const box = await sidebar.boundingBox();
            expect(box?.width).toBeLessThan(viewport.width);
          }
        }

        // Logout
        await page.getByRole("button", { name: /logout/i }).click();
        await page.waitForURL("**/login", { timeout: 10000 });
      });
    }
  }
});
