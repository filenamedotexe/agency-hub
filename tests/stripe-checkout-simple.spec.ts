import { test, expect } from "@playwright/test";

test.describe("Simple Checkout Flow", () => {
  test("test checkout with existing cart item", async ({ page }) => {
    // Login as client
    await page.goto("http://localhost:3001/login");
    await page.fill('input[name="email"]', "client@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect to client dashboard
    await page.waitForURL("**/client-dashboard");

    // Go directly to cart (assuming item is already there)
    console.log("Navigating to cart...");
    await page.goto("http://localhost:3001/store/cart");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check if cart has items
    const emptyCart = await page.locator("text=Your cart is empty").isVisible();

    if (emptyCart) {
      console.log("Cart is empty, adding an item first...");

      // Go to store and add item
      await page.goto("http://localhost:3001/store");
      await page.waitForSelector("text=Website Redesign");

      // Click the first button with shopping cart icon
      const addButton = page
        .locator("button")
        .filter({ has: page.locator('[data-lucide="shopping-cart"]') })
        .first();
      await addButton.click();

      // Wait and go back to cart
      await page.waitForTimeout(1000);
      await page.goto("http://localhost:3001/store/cart");
      await page.waitForLoadState("networkidle");
    }

    // Verify cart has the item
    console.log("Checking cart contents...");
    await expect(page.locator("text=Website Redesign")).toBeVisible({
      timeout: 10000,
    });
    // Check for the price in the order summary
    await expect(
      page.locator("span").filter({ hasText: "$5,000" })
    ).toBeVisible();

    // Click Proceed to Checkout
    console.log("Clicking Proceed to Checkout...");
    const checkoutButton = page.locator(
      'button:has-text("Proceed to Checkout")'
    );
    await checkoutButton.click();

    // Wait for either order creation or Stripe redirect
    console.log("Waiting for checkout to process...");
    await page.waitForLoadState("networkidle");

    // Check if we're on the order review page or Stripe checkout
    const currentUrl = page.url();
    console.log("Current URL after checkout:", currentUrl);

    if (currentUrl.includes("order") && currentUrl.includes("review")) {
      // We're on order review page
      console.log("On order review page");

      // Look for payment button
      const paymentButton = page
        .locator("button")
        .filter({ hasText: /Continue to Payment|Proceed to Payment|Pay Now/ })
        .first();

      if (await paymentButton.isVisible()) {
        console.log("Clicking payment button...");
        await paymentButton.click();

        // Wait for redirect
        await page.waitForLoadState("networkidle");
      }
    }

    // Check if we got redirected to Stripe
    const finalUrl = page.url();
    console.log("Final URL:", finalUrl);

    if (finalUrl.includes("checkout.stripe.com")) {
      console.log("SUCCESS: Redirected to Stripe checkout!");

      // Verify Stripe page loaded
      await expect(page).toHaveURL(/checkout\.stripe\.com/);

      // Optional: Check for Stripe elements
      const stripeLoaded = await page
        .waitForSelector('input[name="email"]', { timeout: 10000 })
        .catch(() => null);
      if (stripeLoaded) {
        console.log("Stripe checkout form loaded successfully");
      }
    } else if (finalUrl.includes("localhost") && finalUrl.includes("success")) {
      console.log("SUCCESS: Payment already completed, on success page");
    } else {
      console.log("Did not reach Stripe checkout. Current URL:", finalUrl);
    }
  });
});
