import { test, expect } from "@playwright/test";

test.describe("Client CRUD with Auth Bypass", () => {
  test.beforeEach(async ({ context }) => {
    // Set test bypass cookie
    await context.addCookies([
      {
        name: "test-auth-bypass",
        value: "true",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("Complete client creation flow", async ({ page }) => {
    // 1. Navigate to clients list
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    // Take screenshot for debugging
    await page.screenshot({ path: "test-clients-list.png" });

    // 2. Click Add Client button
    await page.click('button:has-text("Add Client")');

    // 3. Wait for navigation to new client form
    await page.waitForURL("/clients/new");
    await page.screenshot({ path: "test-new-client-form.png" });

    // 4. Fill out the form
    const testClient = {
      name: "Test Client " + Date.now(),
      businessName: "Test Business Inc",
      address: "123 Test Street",
      dudaSiteId: "test_" + Date.now(),
    };

    await page.fill('input[name="name"]', testClient.name);
    await page.fill('input[name="businessName"]', testClient.businessName);
    await page.fill('textarea[name="address"]', testClient.address);
    await page.fill('input[name="dudaSiteId"]', testClient.dudaSiteId);

    // 5. Submit the form
    await page.click('button[type="submit"]:has-text("Create Client")');

    // 6. Verify redirect to clients list
    await page.waitForURL("/clients", { timeout: 10000 });

    // 7. Verify the client appears in the list
    await page.waitForSelector(`text=${testClient.name}`, { timeout: 5000 });

    // Take final screenshot
    await page.screenshot({ path: "test-client-created.png" });

    expect(page.url()).toContain("/clients");
  });
});
