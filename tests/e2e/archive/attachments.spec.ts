import { test, expect, type Page } from "@playwright/test";

// Helper function to login as admin
async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");
}

test.describe("File Attachments", () => {
  test.beforeEach(async ({ page }) => {
    // Verify server is running
    const response = await fetch("http://localhost:3001");
    if (!response.ok) throw new Error("Server not responding on port 3001");

    await loginAsAdmin(page);
  });

  test("should upload file to task", async ({ page }) => {
    // Navigate to clients page
    await page.goto("http://localhost:3001/clients");

    // Wait for content to load - check for either table rows or loading skeleton
    const tableLoaded = await page.waitForSelector("tbody tr, tbody .h-4", {
      timeout: 30000,
    });

    // Additional wait to ensure data is loaded
    await page.waitForTimeout(2000);

    // Check if we have actual data rows (not skeleton)
    const hasData = await page
      .locator("tbody tr")
      .filter({ hasNot: page.locator(".h-4") })
      .count();

    if (hasData === 0) {
      // Take a screenshot for debugging
      await page.screenshot({ path: "no-clients-debug.png" });
      throw new Error("No clients found in the table after waiting");
    }

    // Click on first client row in table
    await page.locator("tbody tr").first().click();

    // Wait for client detail page
    await page.waitForURL(/\/clients\/[a-f0-9-]+/);

    // Click on first service card
    await page.locator(".grid > div").first().click();

    // Wait for service dialog
    await page.waitForSelector('[role="dialog"]');

    // Click on attachments button for first task
    await page.locator('button[title="Manage attachments"]').first().click();

    // Upload a test file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-document.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("Test PDF content"),
    });

    // Wait for upload to complete
    await page.waitForSelector("text=test-document.pdf", { timeout: 10000 });

    // Verify file appears in attachment list
    await expect(page.locator("text=test-document.pdf")).toBeVisible();
  });

  test("should show file validation errors", async ({ page }) => {
    // Navigate to clients page
    await page.goto("http://localhost:3001/clients");
    await page.waitForLoadState("networkidle");

    // Click on first client row in table
    await page.locator("tbody tr").first().click();

    // Wait for client detail page
    await page.waitForURL(/\/clients\/[a-f0-9-]+/);

    // Click on first service card
    await page.locator(".grid > div").first().click();

    // Wait for service dialog
    await page.waitForSelector('[role="dialog"]');

    // Click on attachments button for first task
    await page.locator('button[title="Manage attachments"]').first().click();

    // Try to upload invalid file type
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.exe",
      mimeType: "application/x-msdownload",
      buffer: Buffer.from("Invalid file"),
    });

    // Verify error message
    await expect(page.locator("text=File type not allowed")).toBeVisible();
  });

  test("should upload multiple files", async ({ page }) => {
    // Navigate to clients page
    await page.goto("http://localhost:3001/clients");
    await page.waitForLoadState("networkidle");

    // Click on first client row in table
    await page.locator("tbody tr").first().click();

    // Wait for client detail page
    await page.waitForURL(/\/clients\/[a-f0-9-]+/);

    // Click on first service card
    await page.locator(".grid > div").first().click();

    // Wait for service dialog and click on Service Files tab
    await page.waitForSelector('[role="dialog"]');
    await page.locator('button:has-text("Service Files")').click();

    // Upload multiple files
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      {
        name: "document1.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("PDF content 1"),
      },
      {
        name: "image1.png",
        mimeType: "image/png",
        buffer: Buffer.from("PNG content"),
      },
    ]);

    // Wait for uploads to complete
    await page.waitForSelector("text=document1.pdf", { timeout: 10000 });
    await page.waitForSelector("text=image1.png", { timeout: 10000 });

    // Verify both files appear
    await expect(page.locator("text=document1.pdf")).toBeVisible();
    await expect(page.locator("text=image1.png")).toBeVisible();
  });

  test("should delete attachment", async ({ page }) => {
    // First upload a file
    await page.goto("http://localhost:3001/clients");
    await page.waitForLoadState("networkidle");
    await page.locator('[data-testid="client-card"]').first().click();
    await page.waitForSelector('[data-testid="client-services"]');
    await page.locator('[data-testid="service-card"]').first().click();
    await page.waitForSelector('[role="dialog"]');
    await page.locator('button:has-text("Service Files")').click();

    // Upload a file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "to-delete.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("Delete me"),
    });

    await page.waitForSelector("text=to-delete.pdf", { timeout: 10000 });

    // Delete the file
    await page.locator('button[title="Delete attachment"]').first().click();

    // Confirm deletion in dialog
    await page.locator('button:has-text("Delete")').click();

    // Verify file is removed
    await expect(page.locator("text=to-delete.pdf")).not.toBeVisible();
  });

  test("should show file size limit error", async ({ page }) => {
    // Navigate to service
    await page.goto("http://localhost:3001/clients");
    await page.waitForLoadState("networkidle");
    await page.locator('[data-testid="client-card"]').first().click();
    await page.waitForSelector('[data-testid="client-services"]');
    await page.locator('[data-testid="service-card"]').first().click();
    await page.waitForSelector('[role="dialog"]');
    await page.locator('button[title="Manage attachments"]').first().click();

    // Create a file that exceeds size limit (11MB for documents)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "large-file.pdf",
      mimeType: "application/pdf",
      buffer: largeBuffer,
    });

    // Verify error message
    await expect(page.locator("text=File size exceeds")).toBeVisible();
  });
});
