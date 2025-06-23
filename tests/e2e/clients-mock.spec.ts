import { test, expect } from "@playwright/test";

// Mock authentication by setting cookies/localStorage
async function mockLogin(page: any) {
  // Set a mock session
  await page.addInitScript(() => {
    // Mock user session in localStorage
    localStorage.setItem(
      "supabase.auth.token",
      JSON.stringify({
        access_token: "mock-token",
        user: {
          id: "mock-user-id",
          email: "admin@example.com",
          role: "ADMIN",
        },
      })
    );
  });
}

test.describe("Client UI Components", () => {
  test("client list page has all UI elements", async ({ page }) => {
    await mockLogin(page);

    // Mock the API response
    await page.route("/api/clients*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          clients: [
            {
              id: "1",
              name: "Test Client",
              businessName: "Test Business",
              address: "123 Test St",
              dudaSiteId: "test-123",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }),
      });
    });

    await page.goto("/clients");

    // Check for key UI elements
    await expect(page.locator("h1")).toContainText("Clients");
    await expect(page.locator('button:has-text("Add Client")')).toBeVisible();
    await expect(
      page.locator('input[placeholder="Search clients..."]')
    ).toBeVisible();

    // Check table headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Business")')).toBeVisible();

    // Check client data is displayed
    await expect(page.locator("text=Test Client")).toBeVisible();
    await expect(page.locator("text=Test Business")).toBeVisible();
  });

  test("add client form has validation", async ({ page }) => {
    await mockLogin(page);

    await page.goto("/clients/new");

    // Check form elements exist
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="businessName"]')).toBeVisible();
    await expect(page.locator('textarea[name="address"]')).toBeVisible();
    await expect(page.locator('input[name="dudaSiteId"]')).toBeVisible();

    // Try to submit empty form
    await page.click('button:has-text("Create Client")');

    // Should show validation errors
    await expect(page.locator("text=Name is required")).toBeVisible();
    await expect(page.locator("text=Business name is required")).toBeVisible();
  });

  test("responsive design works on mobile", async ({ page }) => {
    await mockLogin(page);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mock the API response
    await page.route("/api/clients*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          clients: [],
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: 0,
        }),
      });
    });

    await page.goto("/clients");

    // Mobile elements should be visible
    await expect(page.locator('button:has-text("Add Client")')).toBeVisible();
    await expect(
      page.locator('input[placeholder="Search clients..."]')
    ).toBeVisible();

    // Some columns should be hidden on mobile
    const dudaSiteHeader = page.locator('th:has-text("Duda Site ID")');
    await expect(dudaSiteHeader).toBeHidden();
  });
});
