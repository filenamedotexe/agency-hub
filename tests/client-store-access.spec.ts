import { test, expect } from "@playwright/test";
import { createClient, authenticateAsUser } from "./helpers/user-helpers";

test.describe("Client Store Access", () => {
  let clientUser: any;

  test.beforeEach(async () => {
    // Create a client user for testing
    clientUser = await createClient({
      name: "Test Client Company",
      email: "testclient@example.com",
      password: "password123",
    });
  });

  test("client can access store page", async ({ page }) => {
    // Login as client
    await authenticateAsUser(page, clientUser.email, "password123");

    // Navigate to store page
    await page.goto("http://localhost:3001/store");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that we're on the store page (not redirected)
    expect(page.url()).toBe("http://localhost:3001/store");

    // Check for store page content
    await expect(
      page.getByRole("heading", { name: /Service Store/i })
    ).toBeVisible();

    // Check that the Store link is visible in navigation
    await expect(page.getByRole("link", { name: "Store" })).toBeVisible();
  });

  test("client can access order history page", async ({ page }) => {
    // Login as client
    await authenticateAsUser(page, clientUser.email, "password123");

    // Navigate to order history page
    await page.goto("http://localhost:3001/store/orders");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that we're on the orders page (not redirected)
    expect(page.url()).toBe("http://localhost:3001/store/orders");

    // Check for orders page content
    await expect(
      page.getByRole("heading", { name: /Order History/i })
    ).toBeVisible();

    // Check that the Order History link is visible in navigation
    await expect(
      page.getByRole("link", { name: "Order History" })
    ).toBeVisible();
  });

  test("client navigation shows store links", async ({ page }) => {
    // Login as client
    await authenticateAsUser(page, clientUser.email, "password123");

    // Go to client dashboard
    await page.goto("http://localhost:3001/client-dashboard");

    // Wait for navigation to load
    await page.waitForLoadState("networkidle");

    // Check that both store-related links are visible in the navigation
    await expect(page.getByRole("link", { name: "Store" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Order History" })
    ).toBeVisible();

    // Click on Store link and verify navigation
    await page.getByRole("link", { name: "Store" }).click();
    await page.waitForURL("**/store");
    expect(page.url()).toBe("http://localhost:3001/store");

    // Click on Order History link and verify navigation
    await page.getByRole("link", { name: "Order History" }).click();
    await page.waitForURL("**/store/orders");
    expect(page.url()).toBe("http://localhost:3001/store/orders");
  });
});
