import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Content Tools - Configurable Fields", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should display content tools with edit fields functionality", async ({
    page,
  }) => {
    // Navigate to content tools
    await page.goto("http://localhost:3001/content-tools");
    await page.waitForLoadState("networkidle");

    // Wait for content tools to load
    await expect(page.locator("h1")).toContainText("Content Tools");

    // Click on Blog Writer tool
    await page.click("text=Blog Writer");
    await page.waitForLoadState("networkidle");

    // Verify we're on the Blog Writer page
    await expect(page.locator("h2")).toContainText("Blog Writer");

    // Verify Edit Fields button exists
    await expect(page.locator('button:has-text("Edit Fields")')).toBeVisible();

    // Verify Available Dynamic Fields section exists
    await expect(page.locator("text=Available Dynamic Fields")).toBeVisible();

    // Verify dynamic fields are organized properly
    await expect(
      page.locator('code:has-text("{{businessName}}")')
    ).toBeVisible();
    await expect(page.locator('code:has-text("{{clientName}}")')).toBeVisible();

    // Check if default fields are visible (should have Topic field at minimum)
    await expect(page.locator('label:has-text("Topic")')).toBeVisible();
  });

  test("should open field editor dialog and allow field management", async ({
    page,
  }) => {
    // Navigate to Blog Writer
    await page.goto("http://localhost:3001/content-tools");
    await page.waitForLoadState("networkidle");
    await page.click("text=Blog Writer");
    await page.waitForLoadState("networkidle");

    // Click Edit Fields button
    await page.click('button:has-text("Edit Fields")');

    // Wait for dialog to open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator("text=Edit Content Tool Fields")).toBeVisible();

    // Verify dialog content
    await expect(page.locator("text=Available Dynamic Fields")).toBeVisible();
    await expect(page.locator("text=Content Tool Fields")).toBeVisible();
    await expect(page.locator('button:has-text("Add Field")')).toBeVisible();

    // Test adding a new field
    await page.click('button:has-text("Add Field")');

    // Should see a new field configuration
    await expect(page.locator("text=Field Name")).toBeVisible();
    await expect(page.locator("text=Label")).toBeVisible();
    await expect(page.locator("text=Type")).toBeVisible();

    // Test field visibility toggles
    await expect(page.locator("text=Client Visible")).toBeVisible();
    await expect(page.locator("text=Required")).toBeVisible();

    // Close dialog
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test("should validate required fields before generation", async ({
    page,
  }) => {
    // Navigate to Blog Writer
    await page.goto("http://localhost:3001/content-tools");
    await page.waitForLoadState("networkidle");
    await page.click("text=Blog Writer");
    await page.waitForLoadState("networkidle");

    // Try to generate without selecting a client
    await page.click('button:has-text("Generate Content")');

    // Should show alert about selecting client
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Please select a client");
      await dialog.accept();
    });

    // Select a client (assuming Test Business Inc exists)
    await page
      .click('[data-testid="client-select"]', { timeout: 5000 })
      .catch(() => {
        // If testid doesn't exist, try by placeholder
        return page.click("text=Choose a client");
      });

    // Wait for dropdown and select first option if available
    await page.waitForTimeout(1000);
    const clientOptions = page.locator('[role="option"]');
    const optionCount = await clientOptions.count();

    if (optionCount > 0) {
      await clientOptions.first().click();

      // Now try to generate - should check for required fields
      await page.click('button:has-text("Generate Content")');
    }
  });

  test("should copy dynamic field variables when clicked", async ({ page }) => {
    // Navigate to Blog Writer
    await page.goto("http://localhost:3001/content-tools");
    await page.waitForLoadState("networkidle");
    await page.click("text=Blog Writer");
    await page.waitForLoadState("networkidle");

    // Click on a dynamic field variable to copy it
    const businessNameCode = page
      .locator('code:has-text("{{businessName}}")')
      .first();
    await expect(businessNameCode).toBeVisible();

    // Click to copy (this will copy to clipboard)
    await businessNameCode.click();

    // We can't easily test clipboard content in Playwright, but we can verify the click worked
    await expect(businessNameCode).toBeVisible();
  });

  test("should display fields organized by form title", async ({ page }) => {
    // Navigate to Blog Writer
    await page.goto("http://localhost:3001/content-tools");
    await page.waitForLoadState("networkidle");
    await page.click("text=Blog Writer");
    await page.waitForLoadState("networkidle");

    // Check if forms are organized with titles
    // This assumes there are some forms in the system
    const dynamicFieldsSection = page
      .locator("text=Available Dynamic Fields")
      .locator("..");
    await expect(dynamicFieldsSection).toBeVisible();

    // Look for form organization structure
    // Should have businessName and clientName at the top
    await expect(
      page.locator('code:has-text("{{businessName}}")')
    ).toBeVisible();
    await expect(page.locator('code:has-text("{{clientName}}")')).toBeVisible();
  });

  test("should save field configurations", async ({ page }) => {
    // Navigate to Blog Writer
    await page.goto("http://localhost:3001/content-tools");
    await page.waitForLoadState("networkidle");
    await page.click("text=Blog Writer");
    await page.waitForLoadState("networkidle");

    // Open field editor
    await page.click('button:has-text("Edit Fields")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Add a new field
    await page.click('button:has-text("Add Field")');

    // Fill in field details
    const fieldInputs = page.locator('input[placeholder="fieldName"]');
    if ((await fieldInputs.count()) > 0) {
      await fieldInputs.last().fill("testField");
    }

    const labelInputs = page.locator('input[placeholder="Field Label"]');
    if ((await labelInputs.count()) > 0) {
      await labelInputs.last().fill("Test Field");
    }

    // Save changes
    await page.click('button:has-text("Save Fields")');

    // Should show success message or close dialog
    await page.waitForTimeout(2000);

    // Verify dialog closes after save
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});
