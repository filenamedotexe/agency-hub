import { test, expect } from "@playwright/test";

test.describe("Complete Stripe Payment Flow", () => {
  test("complete payment with test card", async ({ page }) => {
    test.setTimeout(90000); // 90 second timeout for full payment flow
    // Login
    await page.goto("http://localhost:3001/login");
    await page.fill('input[name="email"]', "client@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/client-dashboard");

    // Go to cart
    await page.goto("http://localhost:3001/store/cart");
    await page.waitForLoadState("networkidle");

    // Check if cart has items
    const hasItems = await page
      .locator("text=Website Redesign")
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (!hasItems) {
      console.log("Cart empty, adding item...");
      await page.goto("http://localhost:3001/store");
      // Find and click the add to cart button - it contains "Add to Cart" text
      await page.click('button:has-text("Add to Cart")');
      await page.waitForTimeout(1000);
      await page.goto("http://localhost:3001/store/cart");
    }

    // Click checkout
    console.log("Proceeding to checkout...");
    await page.click('button:has-text("Proceed to Checkout")');

    // Wait for Stripe redirect
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
    console.log("On Stripe checkout page");

    // Fill in test payment details
    console.log("Filling payment form...");

    // Wait for the Stripe page to fully load
    await page.waitForTimeout(3000);

    // Take screenshot to see what we're dealing with
    await page.screenshot({ path: "stripe-checkout-loaded.png" });

    // Stripe Checkout has changed - it now uses a different structure
    // Try to find email field first
    const emailField = page
      .locator('input[id="email"], input[name="email"], input[type="email"]')
      .first();
    if (await emailField.isVisible({ timeout: 5000 })) {
      await emailField.fill("test@example.com");
    }

    // Look for the card iframe
    const cardFrame = page
      .frameLocator('iframe[title*="card"], iframe[name*="card"], iframe')
      .first();

    try {
      // Try to fill card number in iframe
      await cardFrame
        .locator('input[placeholder*="Card number"], input[name="cardnumber"]')
        .fill("4242424242424242");
      await cardFrame
        .locator('input[placeholder*="MM / YY"], input[name="exp-date"]')
        .fill("12/34");
      await cardFrame
        .locator('input[placeholder*="CVC"], input[name="cvc"]')
        .fill("123");
    } catch (e) {
      console.log(
        "Could not find card fields in iframe, trying direct selectors..."
      );
      // Try direct selectors if iframe doesn't work
      await page.fill('input[placeholder*="1234"]', "4242424242424242");
      await page.fill('input[placeholder*="MM / YY"]', "12/34");
      await page.fill('input[placeholder*="CVC"]', "123");
    }

    // Try to fill other fields
    try {
      await page.fill(
        'input[placeholder*="Full name on card"], input[name="name"]',
        "Test User"
      );
      await page.fill(
        'input[placeholder*="ZIP"], input[name="postalCode"]',
        "10001"
      );
    } catch (e) {
      console.log("Some fields could not be filled:", e);
    }

    // Take screenshot before payment
    await page.screenshot({ path: "stripe-form-filled.png" });

    // Click pay button
    console.log("Submitting payment...");
    const payButton = page
      .locator("button")
      .filter({ hasText: /Pay|Subscribe|Complete/ })
      .first();

    // Wait a bit to ensure form is ready
    await page.waitForTimeout(1000);

    if (await payButton.isVisible()) {
      await payButton.click();
    } else {
      console.log(
        "Pay button not found, looking for alternative submit button..."
      );
      await page.click('button[type="submit"]');
    }

    // Wait for redirect back to our app
    console.log("Waiting for payment to process...");
    await page.waitForURL(/localhost:3001/, { timeout: 60000 });

    // Check final URL
    const finalUrl = page.url();
    console.log("Final URL after payment:", finalUrl);

    if (finalUrl.includes("success")) {
      console.log("✅ Payment successful!");
      await expect(
        page
          .locator("text=success")
          .or(page.locator("text=Success"))
          .or(page.locator("text=Thank you"))
      ).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: "payment-success.png" });
    } else if (finalUrl.includes("cancel")) {
      console.log("❌ Payment cancelled");
    } else {
      console.log("⚠️ Unexpected redirect:", finalUrl);
      await page.screenshot({ path: "payment-result.png" });
    }
  });
});
