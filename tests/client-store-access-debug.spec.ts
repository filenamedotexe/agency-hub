import { test, expect } from "@playwright/test";

test.describe("Client Store Access - Debug", () => {
  test("debug client access to store", async ({ page }) => {
    // Enable console logging
    page.on("console", (msg) => console.log("Browser console:", msg.text()));
    page.on("pageerror", (error) => console.log("Page error:", error));

    // Go to login page
    await page.goto("http://localhost:3001/login");

    // Login as the test client user
    await page.fill('input[name="email"]', "client@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect to client dashboard
    await page.waitForURL("**/client-dashboard", { timeout: 10000 });
    console.log("Successfully logged in and redirected to:", page.url());

    // Check what's in the navigation
    const storeLink = page.locator('a[href="/store"]');
    const storeCount = await storeLink.count();
    console.log("Store links found in navigation:", storeCount);

    if (storeCount > 0) {
      // Click the store link if it exists
      await storeLink.first().click();
      await page.waitForLoadState("networkidle");
      console.log("After clicking store link, URL is:", page.url());

      // Take a screenshot
      await page.screenshot({ path: "store-page.png", fullPage: true });
    } else {
      // Navigate directly
      console.log("No store link found, navigating directly...");
      await page.goto("http://localhost:3001/store");
      await page.waitForLoadState("networkidle");
      console.log("After direct navigation, URL is:", page.url());

      // Take a screenshot
      await page.screenshot({ path: "store-page-direct.png", fullPage: true });
    }

    // Check the page content
    const pageContent = await page.content();
    console.log("Page title:", await page.title());

    // Check if it's a 404 page
    const is404 =
      pageContent.includes("404") || pageContent.includes("not be found");
    console.log("Is 404 page?", is404);

    // Try to find any headings
    const headings = await page.locator("h1, h2, h3").allTextContents();
    console.log("All headings on page:", headings);
  });
});
