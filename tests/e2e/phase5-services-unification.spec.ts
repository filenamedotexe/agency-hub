import { test, expect } from "@playwright/test";

test.describe("Phase 5 - API & Route Redirects", () => {
  // Test all device types including specific iPhone/iPad models
  const devices = [
    { name: "Desktop HD", width: 1920, height: 1080 },
    { name: "Desktop", width: 1280, height: 720 },
    { name: "iPad Pro", width: 1024, height: 1366 },
    { name: "iPad", width: 768, height: 1024 },
    { name: "iPhone 14 Pro Max", width: 430, height: 932 },
    { name: "iPhone 14", width: 390, height: 844 },
    { name: "iPhone SE", width: 375, height: 667 },
    { name: "Android Pixel 7", width: 412, height: 915 },
    { name: "Android Galaxy S22", width: 360, height: 780 },
  ];

  const testUsers = [
    { email: "admin@example.com", password: "password123", role: "admin" },
    { email: "manager@example.com", password: "password123", role: "manager" },
    { email: "client@example.com", password: "password123", role: "client" },
  ];

  const redirectTests = [
    {
      oldPath: "/store",
      expectedPath: "/services?tab=browse",
      tabName: "browse",
      clientAccess: true, // Clients should see browse tab
    },
    {
      oldPath: "/admin/orders",
      expectedPath: "/services?tab=orders",
      tabName: "orders",
      clientAccess: false, // Clients shouldn't see orders tab
    },
    {
      oldPath: "/admin/sales",
      expectedPath: "/services?tab=analytics",
      tabName: "analytics",
      clientAccess: false, // Clients shouldn't see analytics tab
    },
  ];

  // Test each redirect on each device for each user role
  for (const device of devices) {
    test.describe(`${device.name} (${device.width}x${device.height})`, () => {
      for (const user of testUsers) {
        test.describe(`${user.role} role`, () => {
          test.beforeEach(async ({ page }) => {
            // Set viewport
            await page.setViewportSize({
              width: device.width,
              height: device.height,
            });

            // Login
            await page.goto("http://localhost:3001/login");
            await page.fill('input[name="email"]', user.email);
            await page.fill('input[name="password"]', user.password);
            await page.click('button[type="submit"]');

            // Wait for dashboard to load
            await page.waitForURL("**/dashboard", { timeout: 10000 });
          });

          test.afterEach(async ({ page }) => {
            // Logout
            if (device.width >= 1024) {
              // Desktop - direct logout button
              const logoutButton = page.getByRole("button", {
                name: /sign out|logout/i,
              });
              if (await logoutButton.isVisible()) {
                await logoutButton.click();
              }
            } else {
              // Mobile - open menu first
              const menuButton = page.getByRole("button", {
                name: /menu|toggle navigation/i,
              });
              if (await menuButton.isVisible()) {
                await menuButton.click();
                await page.waitForTimeout(300);
                const logoutButton = page.getByRole("button", {
                  name: /sign out|logout/i,
                });
                if (await logoutButton.isVisible()) {
                  await logoutButton.click();
                }
              }
            }
          });

          for (const redirect of redirectTests) {
            // Skip admin routes for client users
            if (user.role === "client" && !redirect.clientAccess) {
              test.skip(`${redirect.oldPath} redirect - not accessible for clients`, async () => {});
              continue;
            }

            test(`${redirect.oldPath} redirects to ${redirect.expectedPath}`, async ({
              page,
            }) => {
              // Navigate to old path
              await page.goto(`http://localhost:3001${redirect.oldPath}`);

              // Wait for redirect
              await page.waitForTimeout(1000);

              // Verify we're on the correct URL
              expect(page.url()).toContain(redirect.expectedPath);

              // Wait for page to fully load
              await page.waitForLoadState("networkidle");

              // Verify the Services page loaded
              await expect(
                page.getByRole("heading", { name: /services/i, level: 1 })
              ).toBeVisible();

              // Verify the correct tab is active
              if (user.role !== "client" || redirect.clientAccess) {
                // Check if we're on mobile (tabs might be icons only)
                const isMobile = device.width < 768;

                if (!isMobile) {
                  // Desktop/tablet - check for tab text
                  const activeTab = page.getByRole("tab", { selected: true });
                  const tabText = await activeTab.textContent();

                  if (redirect.tabName === "browse") {
                    expect(tabText?.toLowerCase()).toContain("browse");
                  } else if (redirect.tabName === "orders") {
                    expect(tabText?.toLowerCase()).toContain("orders");
                  } else if (redirect.tabName === "analytics") {
                    expect(tabText?.toLowerCase()).toContain("analytics");
                  }
                }

                // Verify tab content loaded
                await page.waitForTimeout(500);

                // Check for specific content based on tab
                if (
                  redirect.tabName === "browse" ||
                  (user.role !== "client" && redirect.tabName === "catalog")
                ) {
                  // Should see service cards or "browse services" content
                  const serviceContent = page
                    .locator(
                      '[data-testid="service-card"], [data-testid="browse-content"]'
                    )
                    .first();
                  await expect(serviceContent).toBeVisible({ timeout: 5000 });
                } else if (redirect.tabName === "orders") {
                  // Should see orders table or order content
                  await expect(page.getByText(/order|#/i).first()).toBeVisible({
                    timeout: 5000,
                  });
                } else if (redirect.tabName === "analytics") {
                  // Should see analytics content
                  await expect(
                    page.getByText(/revenue|analytics|sales/i).first()
                  ).toBeVisible({ timeout: 5000 });
                }
              }
            });
          }

          // Test that individual order pages still work (not redirected)
          if (user.role !== "client") {
            test("Individual order pages are not redirected", async ({
              page,
            }) => {
              const orderId = "test-order-123";
              await page.goto(`http://localhost:3001/admin/orders/${orderId}`);

              // Should stay on the same URL (not redirect)
              expect(page.url()).toContain(`/admin/orders/${orderId}`);
            });
          }
        });
      }
    });
  }

  // Test redirect persistence across page refreshes
  test("Redirects persist after page refresh", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Login as admin
    await page.goto("http://localhost:3001/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");

    // Navigate to old store URL
    await page.goto("http://localhost:3001/store");
    await page.waitForURL("**/services?tab=browse");

    // Refresh page
    await page.reload();

    // Should still be on services page with browse tab
    expect(page.url()).toContain("/services?tab=browse");
  });

  // Test navigation menu doesn't show old paths
  test("Navigation menu shows only new Services link", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Login as admin
    await page.goto("http://localhost:3001/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");

    // Check navigation doesn't have old links
    const navigation = page.locator("nav").first();

    // Should not have Store link
    await expect(
      navigation.getByRole("link", { name: /^store$/i })
    ).not.toBeVisible();

    // Should not have Orders link (outside of Services)
    await expect(
      navigation.getByRole("link", { name: /^orders$/i })
    ).not.toBeVisible();

    // Should not have Sales Analytics link
    await expect(
      navigation.getByRole("link", { name: /sales analytics/i })
    ).not.toBeVisible();

    // Should have Services link
    await expect(
      navigation.getByRole("link", { name: /services/i })
    ).toBeVisible();
  });
});
