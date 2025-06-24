import { test, expect } from "@playwright/test";
import { loginAsAdmin, navigateToProtectedPage } from "./helpers/auth";

test.describe("Client CRUD Operations", () => {
  test("Complete client workflow", async ({ page }) => {
    // Login first
    await loginAsAdmin(page);

    // Navigate to clients page
    await page.goto("/clients");

    // Wait for page to be fully loaded and interactive
    await page.waitForLoadState("networkidle");

    // Wait for any content to appear (not just spinners to disappear)
    await page.waitForSelector("h1, h2, h3, main", { timeout: 10000 });

    expect(page.url()).toContain("/clients");

    // Navigate to new client page
    await page.goto("/clients/new");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Wait for the form inputs to appear
    await page.waitForSelector('input[placeholder="John Doe"]', {
      timeout: 10000,
    });

    expect(page.url()).toContain("/clients/new");

    // Fill the client form
    await page.fill('input[placeholder="John Doe"]', "Test Client");
    await page.fill('input[placeholder="Acme Corporation"]', "Test Business");

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect to clients list
    await page.waitForURL("/clients", { timeout: 10000 });
    expect(page.url()).toContain("/clients");
  });
});
