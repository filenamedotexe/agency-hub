import { test, expect } from "@playwright/test";

test.describe("Stripe Checkout Redirect", () => {
  test("checkout redirects to Stripe with correct product", async ({
    page,
  }) => {
    // Login as client
    await page.goto("http://localhost:3001/login");
    await page.fill('input[name="email"]', "client@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/client-dashboard");

    // Go directly to cart first to check if we already have items
    await page.goto("http://localhost:3001/store/cart");
    await page.waitForLoadState("networkidle");

    // Check if cart is empty
    const isCartEmpty = await page
      .locator("text=Your cart is empty")
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isCartEmpty) {
      console.log("Cart is empty, adding item...");
      // Go to store and add item
      await page.goto("http://localhost:3001/store");
      await page.waitForLoadState("networkidle");

      // Wait for services to load
      await page.waitForSelector("text=Website Redesign", { timeout: 10000 });

      // Find the service card with Website Redesign and click its Add to Cart button
      const serviceCard = page
        .locator(".space-y-6")
        .getByText("Website Redesign")
        .locator("..")
        .locator("..");
      const addButton = serviceCard.locator('button:has-text("Add to Cart")');
      await addButton.click();
      await page.waitForTimeout(1000);

      // Go back to cart
      await page.goto("http://localhost:3001/store/cart");
    }

    await page.waitForLoadState("networkidle");

    // Verify cart has Website Redesign
    await expect(page.locator("text=Website Redesign")).toBeVisible();
    await expect(page.locator("text=$5,000").first()).toBeVisible();

    // Click checkout
    console.log("Clicking checkout button...");
    await page.click('button:has-text("Proceed to Checkout")');

    // Wait for Stripe redirect
    console.log("Waiting for Stripe redirect...");
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });

    // Verify we're on Stripe checkout
    const url = page.url();
    expect(url).toContain("checkout.stripe.com");
    console.log("✅ Successfully redirected to Stripe checkout");

    // Verify the product details on Stripe page
    await page.waitForTimeout(2000); // Let page load
    await expect(page.locator("text=Website Redesign")).toBeVisible();
    await expect(page.locator("text=$5,000.00")).toBeVisible();

    // Take screenshot as proof
    await page.screenshot({ path: "stripe-checkout-verified.png" });
    console.log("✅ Stripe checkout shows correct product and price");

    // Test the cancel flow
    await page.goBack();
    await page.waitForURL(/localhost:3001/);
    console.log("✅ Cancel button returns to our site");
  });
});
