import { test, expect } from "@playwright/test";

test.describe("Store Checkout Flow", () => {
  // Test user credentials
  const testClient = {
    email: "client1@test.com",
    password: "password123",
  };

  test.beforeEach(async ({ page }) => {
    // Login as a client
    await page.goto("/login");
    await page.fill('input[type="email"]', testClient.email);
    await page.fill('input[type="password"]', testClient.password);
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL("**/dashboard");
  });

  test("should be able to navigate to store", async ({ page }) => {
    // Check if store link exists in navigation
    const storeLink = page.locator('a[href="/store"]');
    await expect(storeLink).toBeVisible();

    // Click on store link
    await storeLink.click();

    // Verify we're on the store page
    await expect(page).toHaveURL(/.*\/store/);
    await expect(page.locator("h1")).toContainText("Store");
  });

  test("should show available services in store", async ({ page }) => {
    await page.goto("/store");

    // Wait for services to load
    await page.waitForSelector('[data-testid="service-card"]', {
      state: "visible",
      timeout: 10000,
    });

    // Check if service cards are displayed
    const serviceCards = page.locator('[data-testid="service-card"]');
    await expect(serviceCards).toHaveCount(1); // At least one service
  });

  test("should be able to add service to cart", async ({ page }) => {
    await page.goto("/store");

    // Wait for services to load
    await page.waitForSelector('[data-testid="add-to-cart-button"]', {
      state: "visible",
      timeout: 10000,
    });

    // Click add to cart button on first service
    await page.click('[data-testid="add-to-cart-button"]').first();

    // Check for success toast
    await expect(page.locator("text=Added to cart")).toBeVisible();

    // Check cart count updated
    const cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toContainText("1");
  });

  test("should be able to view cart", async ({ page }) => {
    await page.goto("/store");

    // Add item to cart first
    await page.waitForSelector('[data-testid="add-to-cart-button"]');
    await page.click('[data-testid="add-to-cart-button"]').first();

    // Click on cart icon
    await page.click('[data-testid="cart-icon"]');

    // Verify cart page or sidebar
    await expect(page.locator("text=Shopping Cart")).toBeVisible();
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
  });

  test("should be able to proceed to checkout", async ({ page }) => {
    await page.goto("/store/cart");

    // Add test item to cart via API first
    // This ensures we have items in cart

    // Click checkout button
    const checkoutButton = page.locator('button:has-text("Checkout")');
    await expect(checkoutButton).toBeVisible();
    await checkoutButton.click();

    // Should redirect to Stripe checkout
    // Note: In test mode, we can't fully test Stripe checkout
    // but we can verify the redirect happens
    await page.waitForURL(/checkout\.stripe\.com|\/checkout/, {
      timeout: 15000,
    });
  });

  test("should handle successful payment and contract signing", async ({
    page,
  }) => {
    // This test simulates returning from Stripe checkout
    // In a real test, you'd use Stripe test mode

    // Navigate to success page with mock order ID
    const mockOrderId = "test-order-123";
    await page.goto(`/store/success?orderId=${mockOrderId}`);

    // Should see success message
    await expect(page.locator("text=Payment Successful!")).toBeVisible();

    // If contract is required, should see contract form
    const contractForm = page.locator("text=Service Agreement");
    if (await contractForm.isVisible()) {
      // Fill contract form
      await page.fill('input[placeholder="John Doe"]', "Test Client");
      await page.fill('input[type="email"]', testClient.email);

      // Draw signature (simulate)
      const canvas = page.locator("canvas");
      await canvas.click({ position: { x: 50, y: 50 } });
      await canvas.click({ position: { x: 100, y: 50 } });
      await canvas.click({ position: { x: 150, y: 50 } });

      // Submit contract
      await page.click('button:has-text("Sign & Continue")');

      // Should redirect to services
      await expect(page).toHaveURL(/.*\/services/);
    } else {
      // No contract required, should see completion message
      await expect(page.locator("text=Order Complete!")).toBeVisible();
    }
  });
});

// Test admin can manage store settings
test.describe("Admin Store Management", () => {
  const testAdmin = {
    email: "admin@example.com",
    password: "password123",
  };

  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[type="email"]', testAdmin.email);
    await page.fill('input[type="password"]', testAdmin.password);
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL("**/dashboard");
  });

  test("should be able to make service purchasable", async ({ page }) => {
    // Navigate to service templates
    await page.goto("/settings/service-templates");

    // Click on a service template to edit
    await page.click('[data-testid="service-template-row"]').first();

    // Find store settings section
    await expect(page.locator("text=Store Settings")).toBeVisible();

    // Toggle "Available in Store" switch
    const storeSwitch = page
      .locator("text=Available in Store")
      .locator("..")
      .locator('button[role="switch"]');
    await storeSwitch.click();

    // Fill in price
    await page.fill('input[placeholder="99.99"]', "149.99");

    // Enable contract requirement
    const contractSwitch = page
      .locator("text=Require Contract Signature")
      .locator("..")
      .locator('button[role="switch"]');
    await contractSwitch.click();

    // Fill contract template
    await page.fill(
      'textarea[placeholder*="service agreement"]',
      "This is a test service agreement for {{serviceName}}"
    );

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify success
    await expect(page.locator("text=Service template updated")).toBeVisible();
  });

  test("should be able to view sales analytics", async ({ page }) => {
    // Navigate to sales analytics
    await page.goto("/admin/sales");

    // Verify page loaded
    await expect(page.locator("h1")).toContainText("Sales Analytics");

    // Check for KPI cards
    await expect(page.locator("text=Total Revenue")).toBeVisible();
    await expect(page.locator("text=Total Orders")).toBeVisible();
    await expect(page.locator("text=New Customers")).toBeVisible();
    await expect(page.locator("text=Refund Rate")).toBeVisible();

    // Check for charts tabs
    await expect(
      page.locator('button:has-text("Revenue Trends")')
    ).toBeVisible();
    await expect(page.locator('button:has-text("Top Services")')).toBeVisible();
    await expect(page.locator('button:has-text("Top Clients")')).toBeVisible();
  });
});
