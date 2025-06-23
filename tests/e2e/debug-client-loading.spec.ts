import { test, expect } from "@playwright/test";

test.describe("Debug Client Page Loading Issue", () => {
  test.beforeAll(async () => {
    // CRITICAL: Verify server is responding before any tests
    const response = await fetch("http://localhost:3001");
    if (!response.ok) {
      throw new Error("Server not responding on port 3001");
    }
  });

  test("Debug: Why is client page stuck loading?", async ({ page }) => {
    // Enable console logging
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log("Console Error:", msg.text());
      }
    });

    // Enable request logging
    page.on("request", (request) => {
      if (request.url().includes("/api/")) {
        console.log("API Request:", request.method(), request.url());
      }
    });

    // Enable response logging
    page.on("response", (response) => {
      if (response.url().includes("/api/")) {
        console.log("API Response:", response.status(), response.url());
      }
    });

    // Login as admin
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL("/dashboard");
    console.log("✓ Login successful, on dashboard");

    // Navigate to clients page
    await page.goto("/clients");
    console.log("✓ Navigated to /clients");

    // Wait a bit to see what happens
    await page.waitForTimeout(3000);

    // Check what's visible
    const hasTable = await page
      .locator("table")
      .isVisible()
      .catch(() => false);
    const hasLoading = await page
      .locator(".animate-pulse")
      .isVisible()
      .catch(() => false);
    const hasError = await page
      .locator("text=/error|failed/i")
      .isVisible()
      .catch(() => false);
    const hasNoClients = await page
      .locator("text=No clients found")
      .isVisible()
      .catch(() => false);

    console.log("Page state:", {
      hasTable,
      hasLoading,
      hasError,
      hasNoClients,
    });

    // Get the actual HTML to see what's rendered
    const bodyHTML = await page.locator("body").innerHTML();
    if (bodyHTML.includes("Loading") || bodyHTML.includes("Skeleton")) {
      console.log("Page contains loading indicators");

      // Check if React Query is stuck
      const mainContent = await page.locator("main").innerHTML();
      console.log("Main content preview:", mainContent.substring(0, 500));
    }

    // Take a screenshot for visual debugging
    await page.screenshot({ path: "client-loading-debug.png", fullPage: true });

    // Check network tab for failed requests
    const failedRequests = [];
    page.on("requestfailed", (request) => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure(),
      });
    });

    await page.waitForTimeout(1000);

    if (failedRequests.length > 0) {
      console.log("Failed requests:", failedRequests);
    }

    // Final assertion
    expect(hasLoading).toBe(false); // Should not be stuck loading
  });
});
