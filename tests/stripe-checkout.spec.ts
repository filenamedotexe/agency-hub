import { test, expect } from "@playwright/test";

test.describe("Stripe Store and Checkout Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login as client first
    await page.goto("http://localhost:3001/login");
    await page.fill('input[name="email"]', "client@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect to client dashboard
    await page.waitForURL("**/client-dashboard");
  });

  test("complete add to cart and checkout flow", async ({ page }) => {
    // Navigate to store
    await page.goto("http://localhost:3001/store");

    // Wait for services to load
    await page.waitForSelector("text=Website Redesign");

    // Log page content for debugging
    const pageContent = await page.textContent("body");
    console.log("Store page content:", pageContent);

    // Test 1: Add item to cart
    console.log("Testing add to cart...");

    // Find the button (might be "Add to Cart" or "Add More (X)")
    let addToCartButton = page
      .locator('button:has-text("Add to Cart")')
      .first();
    const hasAddToCart = await addToCartButton
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    if (!hasAddToCart) {
      // If "Add to Cart" is not visible, look for "Add More"
      addToCartButton = page
        .locator("button")
        .filter({ hasText: /Add More/ })
        .first();
      console.log('Found "Add More" button instead of "Add to Cart"');
    }

    await addToCartButton.click();

    // Wait for button to change (either "Added!" or "Add More (1)")
    await page.waitForTimeout(1000); // Give time for the button to update
    const buttonTextAfter = await addToCartButton.textContent();
    console.log("Button text after adding to cart:", buttonTextAfter);

    // Check that the button changed from "Add to Cart"
    expect(buttonTextAfter).not.toBe("Add to Cart");

    // Check for success toast
    const toastVisible = await page.locator("text=Added to cart").isVisible();
    console.log("Success toast visible:", toastVisible);

    // Check cart badge shows 1 item
    const cartBadge = await page.locator("text=Cart 1").isVisible();
    console.log("Cart badge shows 1 item:", cartBadge);

    // Test 2: Navigate to cart
    console.log("Navigating to cart...");
    await page.goto("http://localhost:3001/store/cart");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Verify cart has the item
    await expect(page.locator("text=Website Redesign")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=$5,000.00")).toBeVisible();

    // Test 3: Proceed to checkout
    console.log("Testing checkout...");
    const checkoutButton = page.locator(
      'button:has-text("Proceed to Checkout")'
    );
    await checkoutButton.click();

    // Wait for either order creation or Stripe redirect
    await page.waitForLoadState("networkidle");

    // Check if we're on the order review page or Stripe checkout
    const currentUrl = page.url();
    console.log("Current URL after checkout:", currentUrl);

    if (currentUrl.includes("order/review")) {
      // We're on order review page
      console.log("On order review page");

      // Click continue to payment
      const paymentButton = page.locator(
        'button:has-text("Continue to Payment")'
      );
      await paymentButton.click();

      // Wait for Stripe redirect
      await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
      console.log("Redirected to Stripe checkout");
    } else if (currentUrl.includes("checkout.stripe.com")) {
      // Direct to Stripe
      console.log("Redirected directly to Stripe checkout");
    }

    // Verify we're on Stripe checkout
    expect(page.url()).toContain("checkout.stripe.com");

    // Test 4: Fill Stripe test payment (if on Stripe page)
    if (page.url().includes("checkout.stripe.com")) {
      console.log("On Stripe checkout, filling test payment...");

      // Wait for Stripe form to load
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });

      // Fill test card details
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[placeholder*="1234"]', "4242424242424242");
      await page.fill('input[placeholder*="MM / YY"]', "12/34");
      await page.fill('input[placeholder*="CVC"]', "123");
      await page.fill('input[name="billingName"]', "Test User");

      // Click pay button
      const payButton = page.locator('button[type="submit"]');
      await payButton.click();

      // Wait for payment processing
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Check if we're redirected back to success page
      const finalUrl = page.url();
      console.log("Final URL:", finalUrl);

      if (finalUrl.includes("localhost:3001")) {
        console.log("Payment completed, redirected back to app");

        // Verify success page
        if (finalUrl.includes("success")) {
          await expect(page.locator("text=Payment Successful")).toBeVisible();
        }
      }
    }
  });
});
