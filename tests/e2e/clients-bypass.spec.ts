import { test, expect } from "@playwright/test";

test.describe("Client Tests with Auth Bypass", () => {
  test.beforeEach(async ({ page, context }) => {
    // Set the test bypass cookie BEFORE navigating
    await context.addCookies([
      {
        name: "test-auth-bypass",
        value: "true",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("Can navigate to clients page with bypass", async ({ page }) => {
    // Navigate directly - bypass should work
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    // Should not be redirected to login
    expect(page.url()).toContain("/clients");
    expect(page.url()).not.toContain("/login");
  });

  test("Can create a client with bypass", async ({ page }) => {
    // Navigate to new client form
    await page.goto("/clients/new");
    await page.waitForLoadState("networkidle");

    // Should be on the form page
    expect(page.url()).toContain("/clients/new");

    // Fill the form
    await page.fill('input[name="name"]', "Test Client");
    await page.fill('input[name="businessName"]', "Test Business");

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to clients list
    await page.waitForURL("/clients");
    expect(page.url()).toContain("/clients");
  });
});
