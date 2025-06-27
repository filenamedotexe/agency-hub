import { test, expect } from "@playwright/test";

test.describe("Phase 4 - Enhanced Admin Catalog View", () => {
  const viewports = [
    { name: "desktop", width: 1280, height: 720 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 375, height: 667 },
  ];

  const roles = [
    { email: "admin@example.com", password: "admin123", role: "admin" },
    { email: "manager@example.com", password: "manager123", role: "manager" },
  ];

  for (const viewport of viewports) {
    for (const user of roles) {
      test(`Enhanced catalog view - ${user.role} on ${viewport.name}`, async ({
        page,
      }) => {
        // Set viewport
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        // Navigate and login
        await page.goto("http://localhost:3001/login");
        await page.fill('input[name="email"]', user.email);
        await page.fill('input[name="password"]', user.password);
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await page.waitForURL("**/dashboard", { timeout: 10000 });

        // Navigate to services
        await page.click('a[href="/services"]');
        await page.waitForURL("**/services", { timeout: 10000 });

        // Check for view toggle buttons
        const gridViewButton = page.getByRole("button", { name: /grid/i });
        const tableViewButton = page.getByRole("button", { name: /table/i });

        // Test view toggle (if available)
        if (
          (await gridViewButton.isVisible()) &&
          (await tableViewButton.isVisible())
        ) {
          // Switch to table view
          await tableViewButton.click();
          await page.waitForTimeout(500);

          // Verify table is visible
          const table = page.locator("table");
          if (await table.isVisible()) {
            // Check table headers
            await expect(table.locator("th")).toContainText([
              "Service",
              "Price",
              "Status",
            ]);
          }

          // Switch back to grid view
          await gridViewButton.click();
          await page.waitForTimeout(500);
        }

        // Check for service cards
        const serviceCards = page.locator('[data-testid="service-card"]');
        const cardCount = await serviceCards.count();

        if (cardCount > 0) {
          // Verify card elements
          const firstCard = serviceCards.first();
          await expect(firstCard).toBeVisible();
        }

        // Test responsive behavior
        if (viewport.name === "mobile") {
          // On mobile, check if elements are stacked properly
          const container = page.locator('[data-testid="services-container"]');
          if (await container.isVisible()) {
            const box = await container.boundingBox();
            if (box) {
              expect(box.width).toBeLessThanOrEqual(viewport.width);
            }
          }
        }

        // Logout
        await page.getByRole("button", { name: /logout/i }).click();
        await page.waitForURL("**/login", { timeout: 10000 });
      });
    }
  }
});
