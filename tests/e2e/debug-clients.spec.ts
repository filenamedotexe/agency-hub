import { test, expect, type Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");
}

test.describe("Debug Clients Page", () => {
  test("check if clients page loads", async ({ page }) => {
    // First check if server is running
    const response = await fetch("http://localhost:3001");
    if (!response.ok) throw new Error("Server not responding on port 3001");

    // Login first
    await loginAsAdmin(page);

    // Listen for console errors
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to clients
    await page.goto("http://localhost:3001/clients");

    // Wait a bit
    await page.waitForTimeout(3000);

    // Log any console errors
    if (consoleErrors.length > 0) {
      console.log("Console errors:", consoleErrors);
    }

    // Take screenshot
    await page.screenshot({ path: "clients-page-debug.png", fullPage: true });

    // Check for any error messages
    const errorElement = await page.locator("text=/error|failed/i").first();
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log("Error found:", errorText);
    }

    // Check if we have the table
    const hasTable = await page.locator("table").isVisible();
    console.log("Has table:", hasTable);

    // Check for loading skeletons
    const hasSkeletons = await page.locator(".h-4.w-32").isVisible();
    console.log("Has loading skeletons:", hasSkeletons);

    // Get page content for debugging
    const content = await page.content();
    if (content.includes("Loading") || content.includes("loading")) {
      console.log("Page seems to be stuck loading");
    }

    // Check network activity
    const responses = [];
    page.on("response", (response) => {
      if (response.url().includes("/api/")) {
        responses.push({
          url: response.url(),
          status: response.status(),
          ok: response.ok(),
        });
      }
    });

    // Reload page to capture network
    await page.reload();
    await page.waitForTimeout(2000);

    console.log("API responses:", responses);
  });
});
