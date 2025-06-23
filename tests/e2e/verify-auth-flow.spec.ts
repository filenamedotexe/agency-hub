import { test, expect } from "@playwright/test";

test.describe("Verify Auth Flow", () => {
  test.beforeAll(async () => {
    const response = await fetch("http://localhost:3001");
    if (!response.ok) {
      throw new Error("Server not responding on port 3001");
    }
  });

  test("Auth flow and dashboard layout renders correctly", async ({ page }) => {
    // Set up console logging BEFORE any navigation
    page.on("console", (msg) => {
      console.log(`Browser ${msg.type()}: ${msg.text()}`);
    });

    page.on("pageerror", (error) => {
      console.log("Page error:", error.message);
    });

    page.on("requestfailed", (request) => {
      console.log(
        "Request failed:",
        request.url(),
        request.failure()?.errorText
      );
    });

    // Step 1: Go to login page
    await page.goto("/login");
    await expect(page).toHaveURL("/login");
    console.log("✓ Login page loaded");

    // Step 2: Fill login form
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    console.log("✓ Filled login form");

    // Step 3: Submit and wait for navigation
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard", { timeout: 10000 });
    console.log("✓ Redirected to dashboard");

    // Step 4: Check if dashboard layout rendered
    const sidebar = await page.locator("nav").first().isVisible();
    console.log("Sidebar visible:", sidebar);

    const header = await page.locator("header").isVisible();
    console.log("Header visible:", header);

    const main = await page.locator("main").isVisible();
    console.log("Main content area visible:", main);

    // Step 5: Check if user menu is present
    const userAvatar = await page.locator('button:has-text("A")').isVisible();
    console.log("User avatar visible:", userAvatar);

    // Step 6: Try navigating to clients
    console.log("Navigating to /clients...");
    await page.goto("/clients");

    // Wait for navigation to complete
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    // Check URL
    const currentUrl = page.url();
    console.log("Current URL:", currentUrl);

    // Check if we're still on clients page
    expect(currentUrl).toContain("/clients");

    // Take screenshot for debugging
    await page.screenshot({
      path: "auth-flow-clients-debug.png",
      fullPage: true,
    });

    // Success - we made it to the clients page
    console.log("✓ Successfully navigated to clients page");
  });
});
