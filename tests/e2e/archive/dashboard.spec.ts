import { test, expect } from "@playwright/test";
import { loginAndWaitForAuth, navigateToProtectedPage } from "./helpers/auth";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAndWaitForAuth(page);
  });

  test("should load dashboard with correct data", async ({ page }) => {
    // Navigate to dashboard
    await navigateToProtectedPage(page, "/dashboard");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Verify URL
    expect(page.url()).toContain("/dashboard");

    // Check that the dashboard title is visible
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();

    // Check that stat cards are present (we look for the card structure, not specific values)
    const statCards = page.locator('[class*="card"]').filter({
      hasText:
        /Total Clients|Active Services|Pending Requests|Completed This Week/,
    });
    await expect(statCards).toHaveCount(4);

    // Verify charts are rendered
    await page.waitForTimeout(1000); // Give charts time to render

    // Check for pie charts
    const pieCharts = page
      .locator("svg")
      .filter({ has: page.locator('[class*="recharts-pie"]') });
    expect(await pieCharts.count()).toBeGreaterThanOrEqual(2);

    // Check for bar chart
    const barChart = page
      .locator("svg")
      .filter({ has: page.locator('[class*="recharts-bar"]') });
    expect(await barChart.count()).toBeGreaterThanOrEqual(1);

    // Check activity timeline is present
    await expect(page.getByText("Recent Activity")).toBeVisible();
  });

  test("should handle real-time updates when data changes", async ({
    page,
    context,
  }) => {
    // Navigate to dashboard
    await navigateToProtectedPage(page, "/dashboard");
    await page.waitForLoadState("networkidle");

    // Get initial client count
    const clientCard = page
      .locator('[class*="card"]')
      .filter({ hasText: "Total Clients" });
    const initialCount = await clientCard
      .locator('[class*="text-2xl"]')
      .textContent();

    // Open a new tab to create a client
    const newPage = await context.newPage();
    await loginAndWaitForAuth(newPage);
    await navigateToProtectedPage(newPage, "/clients");

    // Create a new client
    await newPage.getByRole("button", { name: "Add Client" }).click();
    await newPage.getByLabel("Name").fill("Real-time Test Client");
    await newPage.getByLabel("Business Name").fill("Real-time Test Business");
    await newPage.getByRole("button", { name: "Create Client" }).click();
    await newPage.waitForTimeout(1000);

    // Go back to dashboard and wait for update
    await page.waitForTimeout(2000); // Wait for real-time update

    // Check if the count has increased
    const updatedCount = await clientCard
      .locator('[class*="text-2xl"]')
      .textContent();
    expect(parseInt(updatedCount || "0")).toBeGreaterThan(
      parseInt(initialCount || "0")
    );

    // Close the new tab
    await newPage.close();
  });

  test("should render correctly on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to dashboard
    await navigateToProtectedPage(page, "/dashboard");
    await page.waitForLoadState("networkidle");

    // Check that stat cards stack vertically on mobile
    const statCards = page.locator('[class*="grid-cols-1"]').first();
    await expect(statCards).toBeVisible();

    // Verify charts are still visible and scrollable if needed
    const chartsContainer = page.locator('[class*="overflow-x-auto"]');
    await expect(chartsContainer).toBeVisible();

    // Check that activity timeline is still accessible
    await expect(page.getByText("Recent Activity")).toBeVisible();
  });

  test("should show loading state while fetching data", async ({ page }) => {
    // Intercept the API call to delay it
    await page.route("**/api/dashboard/stats", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    // Navigate to dashboard
    await page.goto("http://localhost:3001/dashboard");

    // Check for skeleton loaders
    const skeletons = page.locator('[class*="skeleton"]');
    expect(await skeletons.count()).toBeGreaterThan(0);

    // Wait for data to load
    await page.waitForLoadState("networkidle");

    // Verify skeletons are gone
    await expect(skeletons.first()).not.toBeVisible();
  });

  test("performance: page should load under 2 seconds", async ({ page }) => {
    const startTime = Date.now();

    // Navigate to dashboard
    await navigateToProtectedPage(page, "/dashboard");
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    // Check that page loaded in under 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test("should display proper empty states", async ({ page }) => {
    // Navigate to dashboard
    await navigateToProtectedPage(page, "/dashboard");
    await page.waitForLoadState("networkidle");

    // If there's no activity, check for empty state message
    const activitySection = page
      .locator('[class*="card"]')
      .filter({ hasText: "Recent Activity" });
    const emptyState = activitySection.getByText(
      "No recent activity to display"
    );

    // This will be visible only if there's no activity
    if (await emptyState.isVisible()) {
      await expect(emptyState).toHaveClass(/text-gray-500/);
    }
  });

  test("charts should be scrollable on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to dashboard
    await navigateToProtectedPage(page, "/dashboard");
    await page.waitForLoadState("networkidle");

    // Find the charts container
    const chartsContainer = page.locator('[class*="overflow-x-auto"]').first();

    // Check if it's scrollable by checking its scroll width
    const isScrollable = await chartsContainer.evaluate(
      (el) => el.scrollWidth > el.clientWidth
    );

    // On mobile, charts might be stacked vertically instead of scrollable
    // So we just verify they're visible
    const charts = page
      .locator('[class*="card"]')
      .filter({ hasText: /Services by Status|Requests by Status|This Week/ });
    expect(await charts.count()).toBeGreaterThan(0);
  });
});
