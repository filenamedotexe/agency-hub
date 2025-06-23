import { test, expect } from "@playwright/test";

test("Debug: Auth state on clients page", async ({ page }) => {
  // Enable console logging
  page.on("console", (msg) => {
    console.log("Console:", msg.type(), msg.text());
  });

  // Login
  await page.goto("/login");
  await page.fill('input[name="email"]', "admin@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");

  console.log("✓ Logged in, on dashboard");

  // Inject console logging into the page
  await page.evaluate(() => {
    console.log("Window location:", window.location.href);
    console.log("Local storage:", localStorage);
    console.log("Session storage:", sessionStorage);
  });

  // Navigate to clients
  await page.goto("/clients", { waitUntil: "networkidle" });

  // Wait a bit
  await page.waitForTimeout(3000);

  // Check what's visible
  const spinnerVisible = await page.locator(".animate-spin").isVisible();
  console.log("Loading spinner visible:", spinnerVisible);

  // Try to get React state
  await page.evaluate(() => {
    // Log any React Fiber info if available
    const reactRoot = document.querySelector("#__next");
    console.log("React root element:", reactRoot);

    // Check if there are any error boundaries
    const errorElements = document.querySelectorAll("[data-error]");
    console.log("Error elements:", errorElements.length);
  });

  // Take screenshot
  await page.screenshot({ path: "clients-auth-debug.png", fullPage: true });

  // Final check
  expect(spinnerVisible).toBe(false);
});
