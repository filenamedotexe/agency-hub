import { test, expect } from "@playwright/test";

test.describe("Detailed Checkout Test", () => {
  test("test checkout with console logging", async ({ page }) => {
    // Capture console logs
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`Browser console error: ${msg.text()}`);
      }
    });

    // Capture network responses
    page.on("response", (response) => {
      if (
        response.url().includes("/api/checkout") ||
        response.url().includes("/api/orders")
      ) {
        console.log(`API Response ${response.status()}: ${response.url()}`);
        if (!response.ok()) {
          response.text().then((text) => console.log("Response body:", text));
        }
      }
    });

    // Login as client
    await page.goto("http://localhost:3001/login");
    await page.fill('input[name="email"]', "client@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL("**/client-dashboard");

    // Go to cart
    await page.goto("http://localhost:3001/store/cart");
    await page.waitForLoadState("networkidle");

    // Check if we have items
    const hasItems = await page
      .locator("text=Website Redesign")
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (!hasItems) {
      console.log("Cart is empty, adding item first...");
      await page.goto("http://localhost:3001/store");
      await page.waitForSelector("text=Website Redesign");

      // Try to find and click add to cart button
      const addButton = page
        .locator("button")
        .filter({ has: page.locator('[data-lucide="shopping-cart"]') })
        .first();
      await addButton.click();
      await page.waitForTimeout(1000);

      // Go back to cart
      await page.goto("http://localhost:3001/store/cart");
      await page.waitForLoadState("networkidle");
    }

    // Verify cart has items
    await expect(page.locator("text=Website Redesign")).toBeVisible();

    // Click checkout and wait for navigation or error
    console.log("Clicking Proceed to Checkout...");
    const checkoutButton = page.locator(
      'button:has-text("Proceed to Checkout")'
    );

    // Set up promise to wait for either navigation or alert
    const navigationPromise = page
      .waitForNavigation({
        url: /checkout\.stripe\.com|order|success/,
        timeout: 15000,
      })
      .catch(() => null);

    const alertPromise = page
      .waitForEvent("dialog", { timeout: 5000 })
      .catch(() => null);

    await checkoutButton.click();

    // Wait for either navigation or alert
    const [navigation, alert] = await Promise.all([
      navigationPromise,
      alertPromise,
    ]);

    if (alert) {
      console.log("Alert message:", alert.message());
      await alert.dismiss();
    }

    // Check final URL
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    console.log("Final URL:", finalUrl);

    if (finalUrl.includes("checkout.stripe.com")) {
      console.log("SUCCESS: Redirected to Stripe checkout!");
      // Take screenshot of Stripe page
      await page.screenshot({ path: "stripe-checkout-success.png" });
    } else {
      console.log("Failed to reach Stripe. Taking screenshot...");
      await page.screenshot({ path: "checkout-failed.png" });

      // Check if there's an error message on the page
      const errorText = await page.locator("text=Failed").allTextContents();
      if (errorText.length > 0) {
        console.log("Error messages on page:", errorText);
      }
    }
  });
});
