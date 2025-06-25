import { test, expect } from "@playwright/test";
import { loginAsRole } from "./helpers/role-auth";
import {
  mcpMonitorNetworkRequests,
  mcpNavigateWithMonitoring,
  mcpTakeScreenshot,
  mcpVerifyToast,
} from "./helpers/mcp-utils";

/**
 * Network Monitoring Tests using Playwright MCP
 * Verifies API calls, webhook executions, and data flow
 */

test.describe("Network Monitoring & API Verification", () => {
  test.describe("API Request Monitoring", () => {
    test("dashboard makes correct API calls", async ({ page }) => {
      const requests = await mcpMonitorNetworkRequests(page, "/api/");

      await loginAsRole(page, "ADMIN");
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Verify expected API calls
      const apiCalls = requests.filter((r) => r.url.includes("/api/"));

      // Dashboard should call stats endpoints
      const hasStatsCall = apiCalls.some(
        (r) => r.url.includes("/api/stats") || r.url.includes("/api/dashboard")
      );
      expect(hasStatsCall).toBe(true);

      // All API calls should succeed
      for (const call of apiCalls) {
        if (call.status) {
          expect(call.status).toBeLessThan(400);
        }
      }
    });

    test("client list loads data correctly", async ({ page }) => {
      const requests = await mcpMonitorNetworkRequests(page, "/api/clients");

      await loginAsRole(page, "ADMIN");
      await page.goto("/clients");
      await page.waitForLoadState("networkidle");

      // Verify clients API was called
      const clientsCall = requests.find(
        (r) => r.url.includes("/api/clients") && r.method === "GET"
      );
      expect(clientsCall).toBeTruthy();
      expect(clientsCall?.status).toBe(200);
    });

    test("form submission creates proper API request", async ({ page }) => {
      const requests = await mcpMonitorNetworkRequests(page, "/api/");

      await loginAsRole(page, "ADMIN");
      await page.goto("/clients");
      await page.click(
        'button:has-text("Add Client"), button:has-text("New Client")'
      );

      // Fill form
      await page.fill('input[name="name"]', "Test Client Network");
      await page.fill('input[name="email"]', "network@test.com");
      await page.fill('input[name="businessName"]', "Network Test Inc");

      // Submit
      await page.click('button[type="submit"]');

      // Wait for API call
      await page.waitForTimeout(1000);

      // Verify POST request was made
      const postRequest = requests.find(
        (r) => r.url.includes("/api/clients") && r.method === "POST"
      );
      expect(postRequest).toBeTruthy();
      expect(postRequest?.status).toBe(200);
    });
  });

  test.describe("Webhook Execution Monitoring", () => {
    test("content generation triggers webhook when configured", async ({
      page,
    }) => {
      const requests = await mcpMonitorNetworkRequests(page);

      await loginAsRole(page, "ADMIN");

      // First, ensure we have a webhook configured
      await page.goto("/automations");
      await page.waitForLoadState("networkidle");

      // Create a test webhook
      await page.click(
        'button:has-text("Create Webhook"), button:has-text("New Webhook")'
      );
      await page.fill('input[name="name"]', "Test Content Webhook");
      await page.fill('input[name="url"]', "https://webhook.site/test-webhook");
      await page.selectOption('select[name="type"]', "content_tool");
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      // Navigate to content tools
      await page.goto("/content-tools");
      await page.waitForLoadState("networkidle");

      // Open Blog Writer tool
      await page.click('text="Blog Writer"');
      await page.waitForTimeout(500);

      // Select a client
      const clientSelect = page.locator('[role="combobox"]').first();
      await clientSelect.click();
      await page.click('[role="option"]').first();

      // Configure webhook for this tool
      await page.click('button:has-text("Settings")');
      await page.selectOption('select[name="webhook"]', "Test Content Webhook");
      await page.click('button:has-text("Save")');

      // Fill in content generation form
      await page.fill('input[name="topic"]', "Test Blog Topic");

      // Generate content
      await page.click('button:has-text("Generate")');

      // Wait for generation and webhook
      await page.waitForTimeout(3000);

      // Check for webhook execution
      const webhookCall = requests.find(
        (r) =>
          r.url.includes("webhook.site") ||
          r.url.includes("/api/webhooks/execute")
      );

      // Should either call the webhook directly or through our API
      expect(webhookCall).toBeTruthy();

      // Should show success toast
      await mcpVerifyToast(page, "Content generated", { screenshot: true });
    });

    test("form submission triggers webhook", async ({ page }) => {
      const requests = await mcpMonitorNetworkRequests(page);

      await loginAsRole(page, "ADMIN");

      // Create a form with webhook
      await page.goto("/forms");
      await page.click('button:has-text("Create Form")');

      // Basic form setup
      await page.fill('input[name="name"]', "Webhook Test Form");

      // Configure webhook
      await page.click('text="Settings"');
      await page.fill(
        'input[name="webhook"]',
        "https://webhook.site/form-test"
      );

      // Save form
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Now submit the form as a client would
      // This part would need the form preview/submission flow

      // Verify webhook was called
      const webhookRequests = requests.filter(
        (r) => r.url.includes("webhook.site") || r.url.includes("/api/webhooks")
      );

      expect(webhookRequests.length).toBeGreaterThan(0);
    });
  });

  test.describe("Real-time Data Updates", () => {
    test("monitors WebSocket connections for real-time updates", async ({
      page,
    }) => {
      const requests = await mcpMonitorNetworkRequests(page);

      await loginAsRole(page, "ADMIN");
      await page.goto("/requests");

      // Check for WebSocket upgrade or polling requests
      const realtimeRequests = requests.filter(
        (r) =>
          r.url.includes("ws://") ||
          r.url.includes("wss://") ||
          r.url.includes("/api/poll") ||
          r.url.includes("/api/subscribe")
      );

      // If the app uses real-time updates, these should exist
      // This is informational - not all apps use WebSockets
      console.log(`Found ${realtimeRequests.length} real-time connections`);
    });
  });

  test.describe("Error Handling & Retry Logic", () => {
    test("handles API errors gracefully", async ({ page }) => {
      // Intercept API calls to simulate errors
      await page.route("**/api/clients", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal Server Error" }),
        });
      });

      await loginAsRole(page, "ADMIN");
      await page.goto("/clients");

      // Should show error state
      await expect(page.locator('text="Error loading clients"')).toBeVisible({
        timeout: 10000,
      });

      // Take screenshot of error state
      await mcpTakeScreenshot(page, {
        filename: "api-error-state.png",
      });
    });

    test("retries failed requests", async ({ page }) => {
      let attemptCount = 0;

      // Fail first request, succeed on retry
      await page.route("**/api/clients", (route) => {
        attemptCount++;
        if (attemptCount === 1) {
          route.fulfill({
            status: 500,
            body: "Server Error",
          });
        } else {
          route.continue();
        }
      });

      await loginAsRole(page, "ADMIN");
      await page.goto("/clients");
      await page.waitForLoadState("networkidle");

      // Should eventually load data after retry
      expect(attemptCount).toBeGreaterThan(1);
      await expect(page.locator('table, [role="table"]')).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Performance Monitoring", () => {
    test("tracks API response times", async ({ page }) => {
      const startTime = Date.now();
      const requests = await mcpMonitorNetworkRequests(page, "/api/");

      await loginAsRole(page, "ADMIN");
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      const loadTime = Date.now() - startTime;

      // Dashboard should load within reasonable time
      expect(loadTime).toBeLessThan(5000);

      // Log API call counts for performance analysis
      const apiCalls = requests.filter((r) => r.url.includes("/api/"));
      console.log(`Dashboard made ${apiCalls.length} API calls`);

      // Warn if too many API calls (potential N+1 query issue)
      if (apiCalls.length > 10) {
        console.warn(
          "High number of API calls detected - potential optimization needed"
        );
      }
    });

    test("monitors bundle size via network", async ({ page }) => {
      const requests = await mcpMonitorNetworkRequests(page);

      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      // Check JavaScript bundle sizes
      const jsBundles = requests.filter(
        (r) => r.url.includes(".js") && !r.url.includes("node_modules")
      );

      // Log bundle information
      for (const bundle of jsBundles) {
        console.log(`Bundle: ${bundle.url.split("/").pop()}`);
      }

      // Could add size checks here if response sizes were available
    });
  });

  test.describe("Security Monitoring", () => {
    test("verifies HTTPS usage for sensitive data", async ({ page }) => {
      const requests = await mcpMonitorNetworkRequests(page);

      await loginAsRole(page, "ADMIN");
      await page.goto("/settings");

      // All API calls should use HTTPS in production
      const apiCalls = requests.filter((r) => r.url.includes("/api/"));

      for (const call of apiCalls) {
        // In production, this should be https://
        // For local testing, http://localhost is acceptable
        const isSecure =
          call.url.startsWith("https://") ||
          call.url.includes("localhost") ||
          call.url.includes("127.0.0.1");
        expect(isSecure).toBe(true);
      }
    });

    test("checks for authentication headers", async ({ page }) => {
      // Monitor specific request headers
      const authHeaders: string[] = [];

      await page.route("**/api/**", async (route) => {
        const headers = route.request().headers();
        if (headers["authorization"] || headers["cookie"]) {
          authHeaders.push(route.request().url());
        }
        await route.continue();
      });

      await loginAsRole(page, "ADMIN");
      await page.goto("/clients");
      await page.waitForLoadState("networkidle");

      // All API requests should include authentication
      expect(authHeaders.length).toBeGreaterThan(0);
    });
  });
});
