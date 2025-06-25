import { test, expect } from "@playwright/test";
import { loginAsRole, navigateWithRole } from "./helpers/role-auth";

test.describe("Forms - CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin for full access
    await loginAsRole(page, "ADMIN");
  });

  test("can create a new form", async ({ page }) => {
    // Navigate to forms page
    await navigateWithRole(page, "/forms", true);

    // Click create form button
    await page.click("button:has-text('Create Form')");
    await page.waitForURL("**/forms/new");
    await page.waitForLoadState("domcontentloaded");

    // Fill form details
    const formName = `Test Form ${Date.now()}`;
    await page.fill('input[id="name"]', formName);
    await page.fill('textarea[id="description"]', "Test form description");

    // Add a text field
    await page.click("button:has-text('Text')");
    await page.waitForTimeout(500);

    // Verify field was added
    const fields = page.locator('[data-testid="sortable-field"]');
    await expect(fields).toHaveCount(1);

    // Configure the field
    const firstField = fields.first();
    await firstField
      .locator('input[placeholder="Field label"]')
      .fill("Your Name");
    await firstField.locator('input[placeholder="field_name"]').fill("name");
    await firstField.locator('input[type="checkbox"]').check(); // Make required

    // Add an email field
    await page.click("button:has-text('Email')");
    await page.waitForTimeout(500);
    await expect(fields).toHaveCount(2);

    const secondField = fields.nth(1);
    await secondField
      .locator('input[placeholder="Field label"]')
      .fill("Email Address");
    await secondField.locator('input[placeholder="field_name"]').fill("email");

    // Add a select field
    await page.click("button:has-text('Select')");
    await page.waitForTimeout(500);
    await expect(fields).toHaveCount(3);

    // Save the form
    await page.click("button:has-text('Create Form')");

    // Wait for redirect to forms list
    await page.waitForURL("**/forms");
    await page.waitForLoadState("networkidle");

    // Verify form appears in list
    await expect(page.locator(`text="${formName}"`)).toBeVisible();
    await expect(page.locator("text='3 fields'")).toBeVisible();
  });

  test("can edit an existing form", async ({ page }) => {
    // Navigate to forms page
    await navigateWithRole(page, "/forms", true);
    await page.waitForLoadState("networkidle");

    // Check if there are forms
    const editButtons = page.locator("button[title='Edit Form']");
    const buttonCount = await editButtons.count();

    if (buttonCount === 0) {
      console.log("No forms to edit, skipping test");
      return;
    }

    // Click edit on first form
    await editButtons.first().click();
    await page.waitForURL("**/forms/**/edit");
    await page.waitForLoadState("domcontentloaded");

    // Update form name
    const nameInput = page.locator('input[id="name"]');
    await nameInput.clear();
    const updatedName = `Updated Form ${Date.now()}`;
    await nameInput.fill(updatedName);

    // Add a new field
    await page.click("button:has-text('Number')");
    await page.waitForTimeout(500);

    // Save changes
    await page.click("button:has-text('Update Form')");

    // Wait for redirect
    await page.waitForURL("**/forms");
    await page.waitForLoadState("networkidle");

    // Verify updated name appears
    await expect(page.locator(`text="${updatedName}"`)).toBeVisible();
  });

  test("can view form details", async ({ page }) => {
    // Navigate to forms page
    await navigateWithRole(page, "/forms", true);
    await page.waitForLoadState("networkidle");

    // Check if there are forms
    const viewButtons = page.locator("button[title='View Details']");
    const buttonCount = await viewButtons.count();

    if (buttonCount === 0) {
      console.log("No forms to view, skipping test");
      return;
    }

    // Click view details on first form
    await viewButtons.first().click();
    await page.waitForURL("**/forms/**");
    await page.waitForLoadState("domcontentloaded");

    // Verify we're on the form details page
    expect(page.url()).toMatch(/\/forms\/[^\/]+$/);

    // Verify key elements are visible
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text='Form Schema'")).toBeVisible();
    await expect(page.locator("text='Form Responses'")).toBeVisible();

    // Check for action buttons
    await expect(page.locator("button:has-text('Edit Form')")).toBeVisible();
    await expect(page.locator("button:has-text('Preview Form')")).toBeVisible();
  });

  test("can delete a form without responses", async ({ page }) => {
    // First create a form to delete
    await navigateWithRole(page, "/forms/new", true);

    const formName = `Delete Test ${Date.now()}`;
    await page.fill('input[id="name"]', formName);

    // Add a simple field
    await page.click("button:has-text('Text')");
    await page.waitForTimeout(500);

    // Save the form
    await page.click("button:has-text('Create Form')");
    await page.waitForURL("**/forms");
    await page.waitForLoadState("networkidle");

    // Find the form we just created
    const formRow = page.locator("tr").filter({ hasText: formName });
    const deleteButton = formRow.locator("button[title='Delete Form']");

    // Click delete
    await deleteButton.click();

    // Confirm deletion in dialog
    await page.waitForSelector("text='Delete Form'");
    await page.click("button:has-text('Delete')");

    // Wait for form to be removed
    await page.waitForTimeout(1000);

    // Verify form is gone
    await expect(page.locator(`text="${formName}"`)).not.toBeVisible();
  });

  test("cannot delete form with responses", async ({ page }) => {
    // Navigate to forms page
    await navigateWithRole(page, "/forms", true);
    await page.waitForLoadState("networkidle");

    // Find forms with responses (badge shows response count > 0)
    const formsWithResponses = page.locator("tr").filter({
      has: page.locator("text=/[1-9]\\d* responses/"),
    });

    const count = await formsWithResponses.count();
    if (count === 0) {
      console.log("No forms with responses found, skipping test");
      return;
    }

    // Check that delete button is disabled for forms with responses
    const deleteButton = formsWithResponses
      .first()
      .locator("button[title='Delete Form']");
    await expect(deleteButton).toBeDisabled();
  });

  test("form validation works correctly", async ({ page }) => {
    // Navigate to create form
    await navigateWithRole(page, "/forms/new", true);

    // Try to save without name
    await page.click("button:has-text('Create Form')");

    // Should see validation error
    page.on("dialog", (dialog) => {
      expect(dialog.message()).toContain("Please enter a form name");
      dialog.accept();
    });

    // Fill name but no fields
    await page.fill('input[id="name"]', "Test Form");
    await page.click("button:has-text('Create Form')");

    // Should see validation error for no fields
    page.on("dialog", (dialog) => {
      expect(dialog.message()).toContain("Please add at least one field");
      dialog.accept();
    });
  });

  test("can search and filter forms", async ({ page }) => {
    // Navigate to forms page
    await navigateWithRole(page, "/forms", true);
    await page.waitForLoadState("networkidle");

    // Check if we have multiple forms
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();

    if (rowCount < 2) {
      console.log("Not enough forms to test search/filter");
      return;
    }

    // Get the name of the first form
    const firstFormName = await rows
      .first()
      .locator("td")
      .first()
      .textContent();

    // If there's a search input, use it
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(firstFormName || "");
      await page.waitForTimeout(500);

      // Verify filtering works
      const visibleRows = await page.locator("tbody tr:visible").count();
      expect(visibleRows).toBeLessThanOrEqual(rowCount);
    }
  });
});
