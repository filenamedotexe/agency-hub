import { test, expect, type Page } from "@playwright/test";

// Helper function to login as admin
async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', "admin@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");
}

test.describe("Client CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("Admin can create a new client", async ({ page }) => {
    // Navigate to clients page
    await page.goto("/clients");

    // Click add client button
    await page.click("text=Add Client");
    await expect(page).toHaveURL("/clients/new");

    // Fill in the form
    const testClient = {
      name: "Test Client " + Date.now(),
      businessName: "Test Business Inc.",
      address: "123 Test Street\nTest City, TS 12345",
      dudaSiteId: "test_site_" + Date.now(),
    };

    await page.fill('input[name="name"]', testClient.name);
    await page.fill('input[name="businessName"]', testClient.businessName);
    await page.fill('textarea[name="address"]', testClient.address);
    await page.fill('input[name="dudaSiteId"]', testClient.dudaSiteId);

    // Submit the form
    await page.click('button:has-text("Create Client")');

    // Should redirect to clients list
    await expect(page).toHaveURL("/clients");

    // Should show success toast
    await expect(
      page.locator("text=Client created successfully")
    ).toBeVisible();

    // Client should appear in the list
    await expect(page.locator(`text=${testClient.name}`)).toBeVisible();
    await expect(page.locator(`text=${testClient.businessName}`)).toBeVisible();
  });

  test("Admin can view client details", async ({ page }) => {
    // Create a client first
    await page.goto("/clients");
    await page.click("text=Add Client");

    const clientName = "Detail Test Client " + Date.now();
    await page.fill('input[name="name"]', clientName);
    await page.fill('input[name="businessName"]', "Detail Test Business");
    await page.click('button:has-text("Create Client")');
    await page.waitForURL("/clients");

    // Click on the client to view details
    await page.click(`text=${clientName}`);

    // Should be on client detail page
    await expect(page).toHaveURL(/\/clients\/[a-z0-9-]+$/);

    // Should display client information
    await expect(page.locator("h1")).toContainText(clientName);
    await expect(page.locator("text=Detail Test Business")).toBeVisible();

    // Should show activity log
    await expect(page.locator("text=Activity Log")).toBeVisible();
    await expect(page.locator("text=created client")).toBeVisible();
  });

  test("Admin can edit a client", async ({ page }) => {
    // Create a client first
    await page.goto("/clients");
    await page.click("text=Add Client");

    const originalName = "Edit Test Client " + Date.now();
    await page.fill('input[name="name"]', originalName);
    await page.fill('input[name="businessName"]', "Original Business");
    await page.click('button:has-text("Create Client")');
    await page.waitForURL("/clients");

    // Navigate to client detail
    await page.click(`text=${originalName}`);

    // Click edit button
    await page.click('button:has-text("Edit")');

    // Should be on edit page
    await expect(page).toHaveURL(/\/clients\/[a-z0-9-]+\/edit$/);

    // Update the client
    const updatedName = "Updated " + originalName;
    await page.fill('input[name="name"]', updatedName);
    await page.fill('input[name="businessName"]', "Updated Business");

    // Submit the form
    await page.click('button:has-text("Update Client")');

    // Should redirect to clients list
    await expect(page).toHaveURL("/clients");

    // Should show success toast
    await expect(
      page.locator("text=Client updated successfully")
    ).toBeVisible();

    // Updated client should appear in the list
    await expect(page.locator(`text=${updatedName}`)).toBeVisible();
    await expect(page.locator("text=Updated Business")).toBeVisible();
  });

  test("Admin can delete a client", async ({ page }) => {
    // Create a client to delete
    await page.goto("/clients");
    await page.click("text=Add Client");

    const clientName = "Delete Test Client " + Date.now();
    await page.fill('input[name="name"]', clientName);
    await page.fill('input[name="businessName"]', "Delete Test Business");
    await page.click('button:has-text("Create Client")');
    await page.waitForURL("/clients");

    // Navigate to client detail
    await page.click(`text=${clientName}`);

    // Open more options menu
    await page.click('button[aria-label="More options"]');

    // Click delete option
    await page.click("text=Delete Client");

    // Confirm deletion in dialog
    await expect(page.locator("text=Are you sure?")).toBeVisible();
    await page.click('button:has-text("Delete")');

    // Should redirect to clients list
    await expect(page).toHaveURL("/clients");

    // Should show success toast
    await expect(
      page.locator("text=Client deleted successfully")
    ).toBeVisible();

    // Client should not appear in the list
    await expect(page.locator(`text=${clientName}`)).not.toBeVisible();
  });

  test("Search and filter clients", async ({ page }) => {
    // Create multiple clients
    const clients = [
      { name: "Search Alpha Client", businessName: "Alpha Corp" },
      { name: "Search Beta Client", businessName: "Beta Inc" },
      { name: "Search Gamma Client", businessName: "Gamma LLC" },
    ];

    for (const client of clients) {
      await page.goto("/clients/new");
      await page.fill('input[name="name"]', client.name);
      await page.fill('input[name="businessName"]', client.businessName);
      await page.click('button:has-text("Create Client")');
      await page.waitForURL("/clients");
    }

    // Test search functionality
    await page.fill('input[placeholder="Search clients..."]', "Beta");
    await page.waitForTimeout(500); // Debounce delay

    // Should only show matching client
    await expect(page.locator("text=Search Beta Client")).toBeVisible();
    await expect(page.locator("text=Search Alpha Client")).not.toBeVisible();
    await expect(page.locator("text=Search Gamma Client")).not.toBeVisible();

    // Clear search
    await page.fill('input[placeholder="Search clients..."]', "");
    await page.waitForTimeout(500);

    // Test sorting
    await page.selectOption('select:has-text("Sort by")', "name");
    await page.selectOption('select:has-text("Newest First")', "asc");

    // Verify alphabetical order
    const rows = page.locator("tbody tr");
    const firstRow = await rows.first().textContent();
    expect(firstRow).toContain("Alpha");
  });

  test("Form validation prevents bad data", async ({ page }) => {
    await page.goto("/clients/new");

    // Try to submit empty form
    await page.click('button:has-text("Create Client")');

    // Should show validation errors
    await expect(page.locator("text=Name is required")).toBeVisible();
    await expect(page.locator("text=Business name is required")).toBeVisible();

    // Fill only name
    await page.fill('input[name="name"]', "Test");
    await page.click('button:has-text("Create Client")');

    // Should still show business name error
    await expect(page.locator("text=Business name is required")).toBeVisible();
    await expect(page.locator("text=Name is required")).not.toBeVisible();
  });
});

test.describe("Responsive Client Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("Client list is responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/clients");

    // Add button should be visible
    await expect(page.locator('button:has-text("Add Client")')).toBeVisible();

    // Table should be scrollable
    const table = page.locator("table");
    await expect(table).toBeVisible();

    // Some columns should be hidden on mobile
    await expect(page.locator('th:has-text("Duda Site ID")')).not.toBeVisible();
    await expect(page.locator('th:has-text("Added")')).not.toBeVisible();
  });

  test("Client form works on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/clients/new");

    // Form should be accessible
    await page.fill('input[name="name"]', "Mobile Test Client");
    await page.fill('input[name="businessName"]', "Mobile Business");

    // Submit button should be reachable
    await page.click('button:has-text("Create Client")');

    // Should redirect successfully
    await expect(page).toHaveURL("/clients");
  });
});
