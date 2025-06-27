import { test, expect } from "@playwright/test";

test.describe("Debug Cart API", () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on("console", (msg) => {
      console.log(`Browser console ${msg.type()}: ${msg.text()}`);
    });

    // Capture network errors
    page.on("response", (response) => {
      if (!response.ok() && response.url().includes("/api/")) {
        console.log(
          `API Error: ${response.status()} ${response.statusText()} - ${response.url()}`
        );
      }
    });

    // Login as client
    await page.goto("http://localhost:3001/login");
    await page.fill('input[name="email"]', "client@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL("**/client-dashboard");
  });

  test("debug add to cart API call", async ({ page }) => {
    // Navigate to store
    await page.goto("http://localhost:3001/store");

    // Wait for services to load
    await page.waitForSelector("text=Website Redesign");

    // Set up request interceptor to log cart API calls
    page.on("request", (request) => {
      if (request.url().includes("/api/cart")) {
        console.log(`API Request: ${request.method()} ${request.url()}`);
        console.log(`Headers:`, request.headers());
        if (request.method() === "POST") {
          console.log(`Body:`, request.postData());
        }
      }
    });

    // Click Add to Cart
    console.log("Clicking Add to Cart button...");
    const addToCartButton = page
      .locator('button:has-text("Add to Cart")')
      .first();
    await addToCartButton.click();

    // Wait a bit to capture any API responses
    await page.waitForTimeout(3000);

    // Check current state
    const buttonText = await addToCartButton.textContent();
    console.log("Button text after click:", buttonText);

    // Check for any error toasts
    const toasts = await page.locator('[role="status"]').allTextContents();
    console.log("Toast messages:", toasts);

    // Navigate to cart to check if item was added
    await page.goto("http://localhost:3001/store/cart");
    await page.waitForLoadState("networkidle");

    const cartContent = await page.textContent("body");
    console.log(
      'Cart page contains "Website Redesign":',
      cartContent.includes("Website Redesign")
    );
  });
});
