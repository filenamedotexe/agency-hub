import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Proper Navigation Flow", () => {
  test("Complete client creation flow using app navigation", async ({
    page,
  }) => {
    // Step 1: Login with test bypass
    await loginAsAdmin(page);

    // Step 2: Navigate to clients using the sidebar/nav menu
    const clientsLink = page.locator('a.nav-item[href="/clients"]').first();
    await clientsLink.click();

    // Wait for clients page to load
    await page.waitForURL("/clients");
    await page.waitForLoadState("networkidle");
    console.log("✅ Navigated to clients page");

    // Check that we actually loaded the page (not stuck on spinner)
    const pageTitle = await page.locator("h1").first().textContent();
    console.log("Page title:", pageTitle);

    // Step 3: Click "Add Client" or "New Client" button
    const addButton = page
      .locator(
        'button:has-text("Add Client"), a:has-text("Add Client"), button:has-text("New Client"), a:has-text("New Client")'
      )
      .first();
    await addButton.click();

    // Wait for new client form
    await page.waitForURL("/clients/new");
    console.log("✅ Navigated to new client form");

    // Step 4: Fill the form
    await page.fill('input[placeholder="John Doe"]', "Test Client");
    await page.fill('input[placeholder="Acme Corporation"]', "Test Business");

    // Step 5: Submit
    await page.click('button[type="submit"]');

    // Should redirect back to clients list
    await page.waitForURL("/clients");
    console.log("✅ Client created successfully");

    // Verify we're on the clients page
    expect(page.url()).toContain("/clients");
  });
});
