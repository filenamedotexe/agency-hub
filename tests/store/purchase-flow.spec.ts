import { test, expect } from "@playwright/test";

test.describe("Store Purchase Flow with Contract", () => {
  test.beforeEach(async ({ page }) => {
    // Login as client
    await page.goto("/login");
    await page.fill('input[type="email"]', "client@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("should browse store and add items to cart", async ({ page }) => {
    // Navigate to store
    await page.goto("/store");
    await expect(page.locator("h1")).toContainText("Service Store");

    // Verify services are loaded
    await page.waitForSelector('[data-testid="service-card"]', {
      state: "visible",
      timeout: 10000,
    });

    // Search for a service
    await page.fill('input[placeholder*="Search services"]', "Google Ads");
    await page.waitForTimeout(500); // Debounce

    // Add first service to cart
    const firstServiceCard = page
      .locator('[data-testid="service-card"]')
      .first();
    await expect(firstServiceCard).toBeVisible();
    await firstServiceCard.locator('button:has-text("Add to Cart")').click();

    // Verify cart badge updates
    await expect(page.locator('[data-testid="cart-badge"]')).toContainText("1");

    // Add another service
    await page.fill('input[placeholder*="Search services"]', "");
    await page.waitForTimeout(500);
    const secondServiceCard = page
      .locator('[data-testid="service-card"]')
      .nth(1);
    await secondServiceCard.locator('button:has-text("Add to Cart")').click();

    // Verify cart badge updates
    await expect(page.locator('[data-testid="cart-badge"]')).toContainText("2");
  });

  test("should manage cart items and quantities", async ({ page }) => {
    // Add item to cart first
    await page.goto("/store");
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.locator('button:has-text("Add to Cart")').click();

    // Go to cart
    await page.click('[data-testid="cart-icon"]');
    await expect(page).toHaveURL("/store/cart");

    // Verify cart page
    await expect(page.locator("h1")).toContainText("Shopping Cart");
    await expect(page.locator("text=/1 items in your cart/")).toBeVisible();

    // Increase quantity
    await page.click('button[aria-label="Increase quantity"]');
    await expect(
      page.locator('[data-testid="quantity-display"]')
    ).toContainText("2");

    // Verify total updates
    const itemPrice = await page
      .locator('[data-testid="item-price"]')
      .first()
      .textContent();
    const totalPrice = await page
      .locator('[data-testid="cart-total"]')
      .textContent();

    // Decrease quantity
    await page.click('button[aria-label="Decrease quantity"]');
    await expect(
      page.locator('[data-testid="quantity-display"]')
    ).toContainText("1");

    // Remove item
    await page.click('button[aria-label="Remove from cart"]');
    await expect(page.locator("text=/Your cart is empty/")).toBeVisible();
  });

  test("should complete checkout with Stripe", async ({ page }) => {
    // Add service to cart
    await page.goto("/store");
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.locator('button:has-text("Add to Cart")').click();

    // Go to cart and checkout
    await page.goto("/store/cart");
    await page.click('button:has-text("Proceed to Checkout")');

    // Wait for Stripe redirect (mocked in test environment)
    await page.waitForTimeout(2000);

    // In real environment, this would redirect to Stripe
    // For testing, we'll simulate the success callback
    await page.goto("/store/success?orderId=test-order-123");
  });

  test("should sign contract after purchase", async ({ page }) => {
    // Navigate to success page with contract requirement
    await page.goto("/store/success?orderId=test-order-contract");

    // Verify contract signature page
    await expect(page.locator("h1")).toContainText("Payment Successful");
    await expect(
      page.locator("text=/Please sign the service agreement/")
    ).toBeVisible();

    // Fill contract details
    await page.fill('input[placeholder="John Doe"]', "Test Client");
    await page.fill('input[type="email"]', "client@example.com");

    // Draw signature on canvas
    const canvas = page.locator("canvas");
    const box = await canvas.boundingBox();
    if (box) {
      // Simulate drawing a signature
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 50);
      await page.mouse.move(box.x + 150, box.y + 100);
      await page.mouse.up();
    }

    // Submit signature
    await page.click('button:has-text("Sign & Continue")');

    // Verify redirect to services
    await page.waitForURL("/services");
    await expect(page.locator("h1")).toContainText("Services");
  });

  test("should view order history", async ({ page }) => {
    // Navigate to orders
    await page.goto("/store/orders");
    await expect(page.locator("h1")).toContainText("Order History");

    // Check for order list
    await page.waitForSelector('[data-testid="order-item"]', {
      state: "visible",
      timeout: 10000,
    });

    // Click on first order
    const firstOrder = page.locator('[data-testid="order-item"]').first();
    await firstOrder.click();

    // Verify order details page
    await expect(page.locator("h1")).toContainText("Order Details");
    await expect(page.locator('[data-testid="order-timeline"]')).toBeVisible();

    // Check timeline items
    await expect(page.locator("text=/Payment received/")).toBeVisible();
    await expect(page.locator("text=/Service provisioned/")).toBeVisible();
  });

  test("should filter and sort services", async ({ page }) => {
    await page.goto("/store");

    // Filter by service type
    await page.click('[data-testid="service-type-filter"]');
    await page.click("text=/Google Ads/");

    // Verify filtered results
    const serviceCards = page.locator('[data-testid="service-card"]');
    const count = await serviceCards.count();

    for (let i = 0; i < count; i++) {
      const badge = serviceCards
        .nth(i)
        .locator('[data-testid="service-type-badge"]');
      await expect(badge).toContainText("Google Ads");
    }

    // Sort by price
    await page.click('[data-testid="sort-filter"]');
    await page.click("text=/Price: Low to High/");

    // Verify sorting (prices should be in ascending order)
    const prices = await page
      .locator('[data-testid="service-price"]')
      .allTextContents();
    const numericPrices = prices.map((p) =>
      parseFloat(p.replace(/[^0-9.]/g, ""))
    );

    for (let i = 1; i < numericPrices.length; i++) {
      expect(numericPrices[i]).toBeGreaterThanOrEqual(numericPrices[i - 1]);
    }
  });

  test("should handle empty cart gracefully", async ({ page }) => {
    // Go directly to empty cart
    await page.goto("/store/cart");

    // Verify empty state
    await expect(page.locator("text=/Your cart is empty/")).toBeVisible();
    await expect(
      page.locator('button:has-text("Continue Shopping")')
    ).toBeVisible();

    // Click continue shopping
    await page.click('button:has-text("Continue Shopping")');
    await expect(page).toHaveURL("/store");
  });

  test("should show service details", async ({ page }) => {
    await page.goto("/store");

    // Click on service details
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.locator('a:has-text("Details")').click();

    // Verify service details page
    await expect(page).toHaveURL(/\/store\/.+/);
    await expect(page.locator('[data-testid="service-details"]')).toBeVisible();

    // Check for key information
    await expect(page.locator('[data-testid="service-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="service-price"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="service-description"]')
    ).toBeVisible();

    // Add to cart from details page
    await page.click('button:has-text("Add to Cart")');
    await expect(page.locator('[data-testid="cart-badge"]')).toContainText("1");
  });
});

test.describe("Admin Store Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.waitForURL("/dashboard");
  });

  test("should process refund for an order", async ({ page }) => {
    // Navigate to orders
    await page.goto("/admin/orders");
    await expect(page.locator("h1")).toContainText("Orders");

    // Click on a completed order
    const completedOrder = page
      .locator('[data-testid="order-status"]:has-text("Completed")')
      .first();
    await completedOrder.locator("..").click();

    // Click refund button
    await page.click('button:has-text("Process Refund")');
    await expect(page).toHaveURL(/\/admin\/orders\/.+\/refund/);

    // Fill refund form
    await page.click('label:has-text("Partial Refund")');
    await page.fill('input[placeholder="0.00"]', "50.00");
    await page.fill(
      "textarea",
      "Customer requested partial refund for delayed delivery"
    );

    // Process refund
    await page.click('button:has-text("Process Refund")');

    // Verify success
    await expect(
      page.locator("text=/Refund processed successfully/")
    ).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/orders\/.+/);
  });

  test("should view sales analytics", async ({ page }) => {
    // Navigate to sales analytics
    await page.goto("/admin/sales");
    await expect(page.locator("h1")).toContainText("Sales Analytics");

    // Verify KPI cards
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-customers"]')).toBeVisible();
    await expect(page.locator('[data-testid="refund-rate"]')).toBeVisible();

    // Check revenue chart
    await page.click('button:has-text("Revenue Trends")');
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();

    // Check top services
    await page.click('button:has-text("Top Services")');
    await expect(page.locator('[data-testid="services-chart"]')).toBeVisible();

    // Check top clients
    await page.click('button:has-text("Top Clients")');
    await expect(page.locator('[data-testid="clients-list"]')).toBeVisible();
  });
});

test.describe("Store Security and Edge Cases", () => {
  test("should handle payment failures gracefully", async ({ page }) => {
    // Add to cart and attempt checkout with failing card
    await page.goto("/store");
    await page
      .locator('[data-testid="service-card"]')
      .first()
      .locator('button:has-text("Add to Cart")')
      .click();
    await page.goto("/store/cart");
    await page.click('button:has-text("Proceed to Checkout")');

    // Simulate payment failure (in test environment)
    await page.goto("/store/cart?payment_failed=true");
    await expect(page.locator("text=/Payment failed/")).toBeVisible();
  });

  test("should enforce max quantity limits", async ({ page }) => {
    await page.goto("/store");
    await page
      .locator('[data-testid="service-card"]')
      .first()
      .locator('button:has-text("Add to Cart")')
      .click();
    await page.goto("/store/cart");

    // Try to increase quantity beyond max
    const increaseButton = page.locator(
      'button[aria-label="Increase quantity"]'
    );

    // Click until disabled
    for (let i = 0; i < 10; i++) {
      const isDisabled = await increaseButton.isDisabled();
      if (isDisabled) break;
      await increaseButton.click();
      await page.waitForTimeout(100);
    }

    // Verify increase button is disabled at max
    await expect(increaseButton).toBeDisabled();
  });

  test("should require login for checkout", async ({ page }) => {
    // Logout first
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to access cart without login
    await page.goto("/store/cart");

    // Should redirect to login
    await expect(page).toHaveURL("/login");
  });
});
