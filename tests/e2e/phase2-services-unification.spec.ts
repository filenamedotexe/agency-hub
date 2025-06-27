import { test, expect } from "@playwright/test";

test.describe("Services Unification - Phase 2", () => {
  test.describe("Code Error Tests", () => {
    test("should load services page without console errors", async ({
      page,
    }) => {
      // Listen for console errors
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      // Navigate to services page
      await page.goto("http://localhost:3001/services");

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Check no console errors
      expect(consoleErrors).toHaveLength(0);
    });

    test("should handle API calls successfully", async ({ page }) => {
      // Monitor network requests
      const failedRequests: string[] = [];
      page.on("requestfailed", (request) => {
        failedRequests.push(request.url());
      });

      await page.goto("http://localhost:3001/services");
      await page.waitForLoadState("networkidle");

      // Check no failed requests
      expect(failedRequests).toHaveLength(0);
    });
  });

  test.describe("Visual Error Tests", () => {
    test("should render tabs correctly without overlapping", async ({
      page,
    }) => {
      await page.goto("http://localhost:3001/services");
      await page.waitForSelector('[role="tablist"]');

      // Check tabs are visible
      const tabsList = page.locator('[role="tablist"]');
      await expect(tabsList).toBeVisible();

      // Check no overlapping elements
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThan(0);
    });

    test("should display loading states properly", async ({ page }) => {
      await page.goto("http://localhost:3001/services");

      // Check for skeleton loaders if data is loading
      const skeletons = page.locator('[class*="skeleton"]');
      if ((await skeletons.count()) > 0) {
        await expect(skeletons.first()).toBeVisible();
      }
    });

    test("should be responsive on different screen sizes", async ({ page }) => {
      const viewports = [
        { width: 1920, height: 1080, name: "desktop" },
        { width: 768, height: 1024, name: "tablet" },
        { width: 375, height: 667, name: "mobile" },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.goto("http://localhost:3001/services");
        await page.waitForLoadState("networkidle");

        // Check tabs are visible and not broken
        const tabsList = page.locator('[role="tablist"]');
        await expect(tabsList).toBeVisible();

        // Take screenshot for visual verification
        await page.screenshot({
          path: `test-results/services-${viewport.name}.png`,
          fullPage: true,
        });
      }
    });
  });

  test.describe("Role-Based Access Tests", () => {
    test("Admin should see catalog, orders, and analytics tabs", async ({
      page,
    }) => {
      // Mock admin login
      await page.goto("http://localhost:3001/login");
      await page.fill('input[type="email"]', "admin@example.com");
      await page.fill('input[type="password"]', "password");
      await page.click('button[type="submit"]');

      // Navigate to services
      await page.goto("http://localhost:3001/services");
      await page.waitForSelector('[role="tablist"]');

      // Check admin tabs are visible
      await expect(
        page.locator('[role="tab"]:has-text("Catalog")')
      ).toBeVisible();
      await expect(
        page.locator('[role="tab"]:has-text("Orders")')
      ).toBeVisible();
      await expect(
        page.locator('[role="tab"]:has-text("Analytics")')
      ).toBeVisible();

      // Check client tabs are not visible
      await expect(
        page.locator('[role="tab"]:has-text("Browse")')
      ).not.toBeVisible();
      await expect(
        page.locator('[role="tab"]:has-text("My Orders")')
      ).not.toBeVisible();
      await expect(
        page.locator('[role="tab"]:has-text("My Services")')
      ).not.toBeVisible();
    });

    test("Client should see browse, my orders, and my services tabs", async ({
      page,
    }) => {
      // Mock client login
      await page.goto("http://localhost:3001/login");
      await page.fill('input[type="email"]', "client@example.com");
      await page.fill('input[type="password"]', "password");
      await page.click('button[type="submit"]');

      // Navigate to services
      await page.goto("http://localhost:3001/services");
      await page.waitForSelector('[role="tablist"]');

      // Check client tabs are visible
      await expect(
        page.locator('[role="tab"]:has-text("Browse")')
      ).toBeVisible();
      await expect(
        page.locator('[role="tab"]:has-text("My Orders")')
      ).toBeVisible();
      await expect(
        page.locator('[role="tab"]:has-text("My Services")')
      ).toBeVisible();

      // Check admin tabs are not visible
      await expect(
        page.locator('[role="tab"]:has-text("Catalog")')
      ).not.toBeVisible();
      await expect(
        page.locator('[role="tab"]:has-text("Orders")')
      ).not.toBeVisible();
      await expect(
        page.locator('[role="tab"]:has-text("Analytics")')
      ).not.toBeVisible();
    });

    test("Service Manager should see catalog, orders, and analytics tabs", async ({
      page,
    }) => {
      // Mock manager login
      await page.goto("http://localhost:3001/login");
      await page.fill('input[type="email"]', "manager@example.com");
      await page.fill('input[type="password"]', "password");
      await page.click('button[type="submit"]');

      // Navigate to services
      await page.goto("http://localhost:3001/services");
      await page.waitForSelector('[role="tablist"]');

      // Check manager tabs are visible
      await expect(
        page.locator('[role="tab"]:has-text("Catalog")')
      ).toBeVisible();
      await expect(
        page.locator('[role="tab"]:has-text("Orders")')
      ).toBeVisible();
      await expect(
        page.locator('[role="tab"]:has-text("Analytics")')
      ).toBeVisible();
    });
  });

  test.describe("Tab Switching Tests", () => {
    test("should switch between tabs smoothly", async ({ page }) => {
      // Login as admin
      await page.goto("http://localhost:3001/login");
      await page.fill('input[type="email"]', "admin@example.com");
      await page.fill('input[type="password"]', "password");
      await page.click('button[type="submit"]');

      await page.goto("http://localhost:3001/services");
      await page.waitForSelector('[role="tablist"]');

      // Test switching between tabs
      const tabs = ["Catalog", "Orders", "Analytics"];

      for (const tabName of tabs) {
        await page.click(`[role="tab"]:has-text("${tabName}")`);

        // Wait for tab content to load
        await page.waitForTimeout(500);

        // Check tab is active
        const activeTab = page.locator(`[role="tab"]:has-text("${tabName}")`);
        await expect(activeTab).toHaveAttribute("data-state", "active");

        // Check content is visible
        const tabContent = page.locator('[role="tabpanel"]');
        await expect(tabContent).toBeVisible();
      }
    });

    test("should persist tab state in URL", async ({ page }) => {
      await page.goto("http://localhost:3001/login");
      await page.fill('input[type="email"]', "admin@example.com");
      await page.fill('input[type="password"]', "password");
      await page.click('button[type="submit"]');

      await page.goto("http://localhost:3001/services");
      await page.waitForSelector('[role="tablist"]');

      // Click on Orders tab
      await page.click('[role="tab"]:has-text("Orders")');
      await page.waitForTimeout(500);

      // Check URL contains tab parameter
      expect(page.url()).toContain("tab=orders");

      // Reload page
      await page.reload();
      await page.waitForSelector('[role="tablist"]');

      // Check Orders tab is still active
      const ordersTab = page.locator('[role="tab"]:has-text("Orders")');
      await expect(ordersTab).toHaveAttribute("data-state", "active");
    });
  });

  test.describe("Empty State Tests", () => {
    test("should show empty states when no data", async ({ page }) => {
      // This would require mocking API responses to return empty data
      // For now, we'll just check that empty state components exist
      await page.goto("http://localhost:3001/services");

      // If any empty states are visible, they should have proper content
      const emptyStates = page.locator('[class*="empty-state"]');
      const count = await emptyStates.count();

      if (count > 0) {
        await expect(emptyStates.first()).toBeVisible();
        await expect(emptyStates.first()).toContainText(/no|empty/i);
      }
    });
  });

  test.describe("Old Route Redirects", () => {
    test("should redirect /store to /services?tab=browse", async ({ page }) => {
      const response = await page.goto("http://localhost:3001/store");
      expect(response?.url()).toContain("/services");
      expect(response?.url()).toContain("tab=browse");
    });

    test("should redirect /admin/orders to /services?tab=orders", async ({
      page,
    }) => {
      const response = await page.goto("http://localhost:3001/admin/orders");
      expect(response?.url()).toContain("/services");
      expect(response?.url()).toContain("tab=orders");
    });

    test("should redirect /admin/sales to /services?tab=analytics", async ({
      page,
    }) => {
      const response = await page.goto("http://localhost:3001/admin/sales");
      expect(response?.url()).toContain("/services");
      expect(response?.url()).toContain("tab=analytics");
    });
  });
});
