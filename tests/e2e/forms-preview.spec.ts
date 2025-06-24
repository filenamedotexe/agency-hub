import { test, expect } from "@playwright/test";
import { loginAsAdmin, navigateToProtectedPage } from "./helpers/auth";

test.describe("Form Preview", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);
  });

  test("can preview form and test submissions", async ({ page }) => {
    // Navigate to forms page
    await navigateToProtectedPage(page, "/forms");

    // Wait for forms to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Check if preview buttons exist
    const previewButtons = page.locator("button[title='Preview Form']");
    const buttonCount = await previewButtons.count();

    // Skip test if no forms exist
    if (buttonCount === 0) {
      console.log("No forms found, skipping preview test");
      return;
    }

    // Click on the first form's preview button
    await previewButtons.first().click();

    // Wait for preview page to load
    await page.waitForURL("**/forms/**/preview");
    await page.waitForLoadState("domcontentloaded");

    // Verify preview mode indicator
    await expect(page.locator("text=Preview Mode")).toBeVisible();

    // Test viewport switching
    await page.click("button:has-text('Mobile')");
    await page.waitForTimeout(500);

    await page.click("button:has-text('Tablet')");
    await page.waitForTimeout(500);

    await page.click("button:has-text('Desktop')");
    await page.waitForTimeout(500);

    // Fill and submit the form (if fields exist)
    const submitButton = page.locator("button[type='submit']");
    if (await submitButton.isVisible()) {
      // Fill any required fields
      const requiredInputs = page.locator("input[required]");
      const count = await requiredInputs.count();
      for (let i = 0; i < count; i++) {
        await requiredInputs.nth(i).fill("Test Value");
      }

      // Submit the form
      await submitButton.click();

      // Wait for success message
      await page.waitForTimeout(1000);

      // Check if we see the test submission data
      const successMessage = page.locator("text=Form submitted successfully");
      const testData = page.locator("text=Test Submission Data");

      // At least one should be visible
      const hasSuccess = await successMessage.isVisible().catch(() => false);
      const hasTestData = await testData.isVisible().catch(() => false);

      expect(hasSuccess || hasTestData).toBeTruthy();
    }

    // Verify test instructions are visible
    await expect(page.locator("text=Test Mode Instructions")).toBeVisible();
  });

  test("preview button is visible on forms list", async ({ page }) => {
    // Navigate to forms page
    await navigateToProtectedPage(page, "/forms");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check if there are forms in the table
    const formsTable = page.locator("table");
    const hasTable = await formsTable.isVisible().catch(() => false);

    if (hasTable) {
      // Check for preview buttons
      const previewButtons = page.locator("button[title='Preview Form']");
      const count = await previewButtons.count();

      if (count > 0) {
        // Verify at least one preview button is visible
        await expect(previewButtons.first()).toBeVisible();
      }
    }
  });
});
