import { test, expect } from "@playwright/test";

test.describe("Client Management", () => {
  test("Can access clients page with saved auth", async ({ page }) => {
    // Go directly to clients - auth should be loaded from storage
    await page.goto("/clients");

    // Should NOT redirect to login
    expect(page.url()).not.toContain("/login");
    expect(page.url()).toContain("/clients");

    // Wait for content
    await page.waitForSelector("h1", { timeout: 10000 });

    // Should see clients page
    const heading = await page.textContent("h1");
    expect(heading).toContain("Clients");
  });

  test("Can create a new client", async ({ page }) => {
    // Navigate to new client page
    await page.goto("/clients/new");

    // Wait for form
    await page.waitForSelector('input[placeholder="John Doe"]', {
      timeout: 10000,
    });

    // Fill form
    await page.fill('input[placeholder="John Doe"]', "Test Client");
    await page.fill('input[placeholder="Acme Corporation"]', "Test Business");

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to clients list
    await page.waitForURL("/clients", { timeout: 10000 });
    expect(page.url()).toContain("/clients");
  });
});
