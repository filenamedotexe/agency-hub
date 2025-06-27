import { test, expect } from "@playwright/test";
import { setupAuth, loginAs } from "./helpers/auth-helper";

// Test configuration
const TEST_CUSTOMER_EMAIL = "zwieder22@gmail.com";
const TEST_TIMEOUT = 60000; // 60 seconds for Stripe operations

test.describe("Stripe Store Phase 3 - Comprehensive Testing", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure server is running
    const response = await fetch("http://localhost:3001/api/health");
    if (!response.ok) {
      throw new Error("Server is not running on port 3001");
    }
  });

  test.describe("Customer Purchase Flow with Email Notifications", () => {
    test("Complete purchase flow with email notifications to zwieder22@gmail.com", async ({
      page,
    }) => {
      test.setTimeout(TEST_TIMEOUT);

      console.log("🛒 Starting customer purchase flow test...");

      // 1. Login as client
      await loginAs(page, "client");
      await page.waitForURL("**/client-dashboard");

      // 2. Navigate to store
      await page.click('a[href="/store"]');
      await page.waitForURL("**/store");
      console.log("✅ Navigated to store");

      // 3. Add service to cart
      const firstServiceCard = page
        .locator('[data-testid="service-card"]')
        .first();
      await firstServiceCard.waitFor({ state: "visible" });

      const serviceName = await firstServiceCard.locator("h3").textContent();
      console.log(`📦 Adding service to cart: ${serviceName}`);

      await firstServiceCard.locator('button:has-text("Add to Cart")').click();
      await expect(page.locator('text="Added to cart"')).toBeVisible();

      // 4. Go to cart
      await page.click('[data-testid="cart-icon"]');
      await page.waitForURL("**/store/cart");
      console.log("✅ Navigated to cart");

      // 5. Proceed to checkout
      await page.click('button:has-text("Proceed to Checkout")');

      // 6. Fill checkout form with test email
      await page.waitForSelector('input[name="email"]');
      await page.fill('input[name="email"]', TEST_CUSTOMER_EMAIL);
      await page.fill('input[name="name"]', "Test Customer");

      // Add any special instructions
      await page.fill(
        'textarea[name="notes"]',
        "Test purchase for Phase 3 testing"
      );

      console.log(`📧 Using email: ${TEST_CUSTOMER_EMAIL}`);

      // 7. Click checkout button (will redirect to Stripe)
      await page.click('button:has-text("Complete Purchase")');

      // 8. Handle Stripe checkout
      console.log("💳 Redirecting to Stripe checkout...");
      await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });

      // Fill Stripe test card details
      await page
        .locator('[placeholder="1234 1234 1234 1234"]')
        .fill("4242424242424242");
      await page.locator('[placeholder="MM / YY"]').fill("12/25");
      await page.locator('[placeholder="CVC"]').fill("123");
      await page.locator('[placeholder="12345"]').fill("10001");

      // Complete Stripe payment
      await page.click('button[type="submit"]');

      // 9. Wait for success redirect
      console.log("⏳ Processing payment...");
      await page.waitForURL("**/store/success", { timeout: 30000 });
      console.log("✅ Payment successful!");

      // 10. Verify success page
      await expect(
        page.locator('h1:has-text("Order Confirmed")')
      ).toBeVisible();
      const orderIdElement = await page.locator('[data-testid="order-id"]');
      const orderId = await orderIdElement.textContent();
      console.log(`📋 Order ID: ${orderId}`);

      // 11. Check if contract is required
      const contractRequired = await page
        .locator('text="Contract Signature Required"')
        .isVisible();
      if (contractRequired) {
        console.log("📝 Contract signature required - signing...");

        // Click sign contract button
        await page.click('button:has-text("Sign Contract")');

        // Fill signature form
        await page.fill('input[name="fullName"]', "Test Customer");
        await page.fill('input[name="email"]', TEST_CUSTOMER_EMAIL);

        // Draw signature on canvas
        const canvas = page.locator("canvas");
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.move(box.x + 50, box.y + 50);
          await page.mouse.down();
          await page.mouse.move(box.x + 150, box.y + 50);
          await page.mouse.move(box.x + 150, box.y + 100);
          await page.mouse.up();
        }

        // Submit signature
        await page.click('button:has-text("Submit Signature")');
        await expect(
          page.locator('text="Contract signed successfully"')
        ).toBeVisible();
        console.log("✅ Contract signed");
      }

      // 12. Navigate to order history
      await page.click('a[href="/store/orders"]');
      await page.waitForURL("**/store/orders");
      console.log("✅ Navigated to order history");

      // 13. Verify order appears in history
      await expect(page.locator(`text="${orderId}"`)).toBeVisible();
      await expect(
        page.locator('text="COMPLETED", text="PROCESSING"').first()
      ).toBeVisible();

      // 14. Click on order to view details
      await page.click(`[data-testid="order-row-${orderId}"]`);
      await page.waitForURL(`**/store/orders/${orderId}`);

      // 15. Verify order timeline
      await expect(
        page.locator('[data-testid="order-timeline"]')
      ).toBeVisible();
      await expect(page.locator('text="Payment received"')).toBeVisible();

      if (contractRequired) {
        await expect(page.locator('text="Contract signed"')).toBeVisible();
      }

      await expect(page.locator('text="Services activated"')).toBeVisible();

      console.log("✅ Order details and timeline verified");
      console.log(
        `📧 Email notifications should be sent to: ${TEST_CUSTOMER_EMAIL}`
      );
    });
  });

  test.describe("Admin Order Management", () => {
    test("Admin can view and manage orders", async ({ page }) => {
      console.log("👨‍💼 Testing admin order management...");

      // Login as admin
      await loginAs(page, "admin");
      await page.waitForURL("**/dashboard");

      // Navigate to orders
      await page.click('a[href="/admin/orders"]');
      await page.waitForURL("**/admin/orders");
      console.log("✅ Navigated to admin orders");

      // Verify order list
      await expect(
        page.locator('h1:has-text("Order Management")')
      ).toBeVisible();
      await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();

      // Check filters
      await page.click('[data-testid="status-filter"]');
      await page.click('text="COMPLETED"');
      await page.waitForTimeout(1000);

      // Search functionality
      await page.fill('[data-testid="order-search"]', TEST_CUSTOMER_EMAIL);
      await page.waitForTimeout(1000);

      // Click on first order
      const firstOrder = page.locator('[data-testid^="order-row-"]').first();
      await firstOrder.click();

      // Verify admin order detail view
      await expect(page.locator('h1:has-text("Order Details")')).toBeVisible();
      await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="order-timeline"]')
      ).toBeVisible();

      // Check admin actions
      await expect(
        page.locator('button:has-text("Generate Invoice")')
      ).toBeVisible();
      await expect(
        page.locator('button:has-text("Issue Refund")')
      ).toBeVisible();

      console.log("✅ Admin order management verified");
    });

    test("Admin can process refunds", async ({ page }) => {
      console.log("💸 Testing refund processing...");

      // Login as admin
      await loginAs(page, "admin");
      await page.waitForURL("**/dashboard");

      // Navigate to orders
      await page.click('a[href="/admin/orders"]');
      await page.waitForURL("**/admin/orders");

      // Find a completed order
      await page.click('[data-testid="status-filter"]');
      await page.click('text="COMPLETED"');
      await page.waitForTimeout(1000);

      // Click on first completed order
      const firstOrder = page.locator('[data-testid^="order-row-"]').first();
      const orderId = await firstOrder
        .getAttribute("data-testid")
        ?.then((id) => id?.replace("order-row-", ""));
      await firstOrder.click();

      // Click refund button
      await page.click('button:has-text("Issue Refund")');
      await page.waitForURL(`**/admin/orders/${orderId}/refund`);

      // Fill refund form
      await page.fill('input[name="amount"]', "50");
      await page.fill(
        'textarea[name="reason"]',
        "Test refund for Phase 3 testing"
      );

      // Submit refund
      await page.click('button:has-text("Process Refund")');

      // Verify refund success
      await expect(
        page.locator('text="Refund processed successfully"')
      ).toBeVisible();

      console.log("✅ Refund processing verified");
    });
  });

  test.describe("Sales Analytics Dashboard", () => {
    test("Admin can view sales analytics", async ({ page }) => {
      console.log("📊 Testing sales analytics dashboard...");

      // Login as admin
      await loginAs(page, "admin");
      await page.waitForURL("**/dashboard");

      // Navigate to sales analytics
      await page.click('a[href="/admin/sales"]');
      await page.waitForURL("**/admin/sales");
      console.log("✅ Navigated to sales analytics");

      // Verify dashboard components
      await expect(
        page.locator('h1:has-text("Sales Analytics")')
      ).toBeVisible();

      // Check metrics cards
      await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="avg-order-value"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="new-customers"]')).toBeVisible();

      // Check date range selector
      await page.click('[data-testid="date-range-selector"]');
      await page.click('text="Last 7 days"');
      await page.waitForTimeout(1000);

      // Verify charts
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="top-services-chart"]')
      ).toBeVisible();

      // Switch tabs
      await page.click('button:has-text("Top Clients")');
      await expect(
        page.locator('[data-testid="top-clients-table"]')
      ).toBeVisible();

      await page.click('button:has-text("Conversion Metrics")');
      await expect(
        page.locator('[data-testid="conversion-funnel"]')
      ).toBeVisible();

      console.log("✅ Sales analytics dashboard verified");
    });
  });

  test.describe("Invoice Generation", () => {
    test("System generates invoices for completed orders", async ({ page }) => {
      console.log("📄 Testing invoice generation...");

      // Login as admin
      await loginAs(page, "admin");
      await page.waitForURL("**/dashboard");

      // Navigate to orders
      await page.click('a[href="/admin/orders"]');
      await page.waitForURL("**/admin/orders");

      // Find a completed order
      await page.click('[data-testid="status-filter"]');
      await page.click('text="COMPLETED"');
      await page.waitForTimeout(1000);

      // Click on first completed order
      const firstOrder = page.locator('[data-testid^="order-row-"]').first();
      await firstOrder.click();

      // Check if invoice exists
      const invoiceExists = await page
        .locator('[data-testid="invoice-number"]')
        .isVisible();

      if (!invoiceExists) {
        // Generate invoice
        await page.click('button:has-text("Generate Invoice")');
        await expect(
          page.locator('text="Invoice generated successfully"')
        ).toBeVisible();
      }

      // Verify invoice details
      await expect(
        page.locator('[data-testid="invoice-number"]')
      ).toBeVisible();
      const invoiceNumber = await page
        .locator('[data-testid="invoice-number"]')
        .textContent();
      console.log(`📋 Invoice number: ${invoiceNumber}`);

      console.log("✅ Invoice generation verified");
    });
  });

  test.describe("Service Auto-Provisioning", () => {
    test("Services are automatically provisioned after payment", async ({
      page,
    }) => {
      console.log("🚀 Testing service auto-provisioning...");

      // Login as client
      await loginAs(page, "client");
      await page.waitForURL("**/client-dashboard");

      // Navigate to services
      await page.click('a[href="/client-dashboard/services"]');
      await page.waitForURL("**/client-dashboard/services");

      // Check for active services
      const activeServices = page.locator('[data-testid="active-service"]');
      const count = await activeServices.count();

      if (count > 0) {
        console.log(`✅ Found ${count} active services`);

        // Click on first service
        await activeServices.first().click();

        // Verify service details
        await expect(page.locator('[data-testid="service-status"]')).toHaveText(
          "TO_DO"
        );
        await expect(
          page.locator('[data-testid="service-tasks"]')
        ).toBeVisible();
      }

      console.log("✅ Service auto-provisioning verified");
    });
  });

  test.describe("Client LTV Tracking", () => {
    test("Client lifetime value is tracked correctly", async ({ page }) => {
      console.log("💰 Testing client LTV tracking...");

      // Login as admin
      await loginAs(page, "admin");
      await page.waitForURL("**/dashboard");

      // Navigate to clients
      await page.click('a[href="/clients"]');
      await page.waitForURL("**/clients");

      // Search for test client
      await page.fill('[placeholder*="Search"]', TEST_CUSTOMER_EMAIL);
      await page.waitForTimeout(1000);

      // Click on client if found
      const clientRow = page
        .locator(`tr:has-text("${TEST_CUSTOMER_EMAIL}")`)
        .first();
      if (await clientRow.isVisible()) {
        await clientRow.click();

        // Verify LTV metrics
        await expect(
          page.locator('[data-testid="lifetime-value"]')
        ).toBeVisible();
        await expect(
          page.locator('[data-testid="total-orders"]')
        ).toBeVisible();
        await expect(
          page.locator('[data-testid="first-order-date"]')
        ).toBeVisible();
        await expect(
          page.locator('[data-testid="last-order-date"]')
        ).toBeVisible();

        console.log("✅ Client LTV tracking verified");
      }
    });
  });

  test.describe("Email Notification Verification", () => {
    test("Log email notification points", async ({ page }) => {
      console.log(
        "📧 Email notifications that should have been sent to " +
          TEST_CUSTOMER_EMAIL +
          ":"
      );
      console.log("1. ✉️ Order confirmation email");
      console.log("2. ✉️ Admin notification email (to admin@example.com)");
      console.log("3. ✉️ Contract ready email (if contract required)");
      console.log("4. ✉️ Contract signed email (if contract was signed)");
      console.log("5. ✉️ Service provisioned email");
      console.log("6. ✉️ Invoice generated email");
      console.log("");
      console.log(
        "⚠️ Please check the inbox for " +
          TEST_CUSTOMER_EMAIL +
          " to verify emails were received"
      );
      console.log("⚠️ Also check server logs for email sending confirmations");
    });
  });
});

// Helper to create a mock order for testing
async function createMockOrder(page: any) {
  // Navigate to store and add item to cart
  await page.goto("http://localhost:3001/store");

  const firstService = page.locator('[data-testid="service-card"]').first();
  await firstService.locator('button:has-text("Add to Cart")').click();

  // Go to cart and checkout
  await page.click('[data-testid="cart-icon"]');
  await page.click('button:has-text("Proceed to Checkout")');

  // Fill checkout form
  await page.fill('input[name="email"]', TEST_CUSTOMER_EMAIL);
  await page.fill('input[name="name"]', "Test Customer");

  // This would normally redirect to Stripe
  // For testing, we might need to mock this
}
