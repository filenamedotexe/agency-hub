import { test, expect } from "@playwright/test";

test.describe("Simple Clients Page Test", () => {
  test("can access clients page after login", async ({ page }) => {
    // Enable all console logging
    page.on("console", (msg) => {
      console.log(`Browser ${msg.type()}: ${msg.text()}`);
    });

    page.on("response", (response) => {
      if (response.status() >= 400) {
        console.log(
          `Failed request: ${response.url()} - Status: ${response.status()}`
        );
      }
    });

    // Step 1: Login
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect after login
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 10000,
    });
    console.log("Login successful, redirected to:", page.url());

    // Step 2: Go to clients page
    await page.goto("/clients");
    console.log("Navigated to clients, current URL:", page.url());

    // Step 3: Wait for any content to load
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    // Step 4: Check what's actually on the page
    const pageContent = await page.textContent("body");
    console.log("Page text content:", pageContent?.slice(0, 200));

    // Step 5: Take a screenshot
    await page.screenshot({ path: "simple-clients-test.png", fullPage: true });

    // Step 6: Simple check - just verify we're on the clients page
    expect(page.url()).toContain("/clients");
  });
});
