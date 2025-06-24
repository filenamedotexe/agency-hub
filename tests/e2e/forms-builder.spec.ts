import { test, expect } from "@playwright/test";
import { loginAsRole, navigateWithRole } from "./helpers/role-auth";

test.describe("Form Builder - Drag & Drop", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await loginAsRole(page, "ADMIN");

    // Navigate to create new form
    await navigateWithRole(page, "/forms/new", true);
    await page.waitForLoadState("domcontentloaded");
  });

  test("can add different field types", async ({ page }) => {
    // Fill form name
    await page.fill('input[id="name"]', "Field Types Test");

    // Test all field types
    const fieldTypes = [
      { button: "Text", expectedLabel: "New text field" },
      { button: "Email", expectedLabel: "New email field" },
      { button: "Number", expectedLabel: "New number field" },
      { button: "Phone", expectedLabel: "New phone field" },
      { button: "Date", expectedLabel: "New date field" },
      { button: "Select", expectedLabel: "New select field" },
      { button: "Radio", expectedLabel: "New radio field" },
      { button: "Checkbox", expectedLabel: "New checkbox field" },
      { button: "Textarea", expectedLabel: "New textarea field" },
      { button: "File", expectedLabel: "New file field" },
    ];

    for (const fieldType of fieldTypes) {
      // Click the field type button
      await page.click(`button:has-text('${fieldType.button}')`);
      await page.waitForTimeout(300);

      // Verify field was added
      const fields = page.locator('[data-testid="sortable-field"]');
      const currentCount = await fields.count();

      // Find the newly added field (last one)
      const newField = fields.nth(currentCount - 1);
      const labelInput = newField.locator('input[placeholder="Field label"]');

      // Verify default label
      await expect(labelInput).toHaveValue(fieldType.expectedLabel);
    }

    // Verify total field count
    const allFields = page.locator('[data-testid="sortable-field"]');
    await expect(allFields).toHaveCount(fieldTypes.length);
  });

  test("can drag and drop to reorder fields", async ({ page }) => {
    // Add three fields
    await page.fill('input[id="name"]', "Drag Drop Test");

    // Add fields with distinct labels
    await page.click("button:has-text('Text')");
    await page.waitForTimeout(300);
    await page.click("button:has-text('Email')");
    await page.waitForTimeout(300);
    await page.click("button:has-text('Number')");
    await page.waitForTimeout(300);

    // Label the fields distinctly
    const fields = page.locator('[data-testid="sortable-field"]');
    await fields
      .nth(0)
      .locator('input[placeholder="Field label"]')
      .fill("First Field");
    await fields
      .nth(1)
      .locator('input[placeholder="Field label"]')
      .fill("Second Field");
    await fields
      .nth(2)
      .locator('input[placeholder="Field label"]')
      .fill("Third Field");

    // Get initial order
    const getFieldLabels = async () => {
      const labels = [];
      const count = await fields.count();
      for (let i = 0; i < count; i++) {
        const value = await fields
          .nth(i)
          .locator('input[placeholder="Field label"]')
          .inputValue();
        labels.push(value);
      }
      return labels;
    };

    const initialOrder = await getFieldLabels();
    expect(initialOrder).toEqual([
      "First Field",
      "Second Field",
      "Third Field",
    ]);

    // Drag first field to last position
    const firstField = fields.nth(0);
    const lastField = fields.nth(2);

    // Get drag handle
    const dragHandle = firstField.locator('[data-testid="drag-handle"]');

    // Perform drag operation
    await dragHandle.hover();
    await page.mouse.down();
    await lastField.hover();
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Verify new order
    const newOrder = await getFieldLabels();
    expect(newOrder[0]).not.toBe("First Field");
    expect(newOrder).toContain("First Field");
  });

  test("can configure field properties", async ({ page }) => {
    // Add a text field
    await page.fill('input[id="name"]', "Field Configuration Test");
    await page.click("button:has-text('Text')");
    await page.waitForTimeout(300);

    const field = page.locator('[data-testid="sortable-field"]').first();

    // Configure label
    const labelInput = field.locator('input[placeholder="Field label"]');
    await labelInput.clear();
    await labelInput.fill("Full Name");

    // Configure name
    const nameInput = field.locator('input[placeholder="field_name"]');
    await nameInput.clear();
    await nameInput.fill("full_name");

    // Configure placeholder
    const placeholderInput = field.locator(
      'input[placeholder="Placeholder text"]'
    );
    if (await placeholderInput.isVisible()) {
      await placeholderInput.fill("Enter your full name");
    }

    // Make required
    const requiredCheckbox = field.locator('input[type="checkbox"]');
    await requiredCheckbox.check();

    // Add description
    const descriptionInput = field.locator('input[placeholder="Help text"]');
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill("Please enter your legal full name");
    }

    // Verify all values are set
    await expect(labelInput).toHaveValue("Full Name");
    await expect(nameInput).toHaveValue("full_name");
    await expect(requiredCheckbox).toBeChecked();
  });

  test("can configure select/radio field options", async ({ page }) => {
    await page.fill('input[id="name"]', "Options Configuration Test");

    // Add a select field
    await page.click("button:has-text('Select')");
    await page.waitForTimeout(300);

    const field = page.locator('[data-testid="sortable-field"]').first();

    // Configure field name
    await field.locator('input[placeholder="Field label"]').fill("Country");
    await field.locator('input[placeholder="field_name"]').fill("country");

    // Check default options
    const options = field.locator('[data-testid="field-option"]');
    await expect(options).toHaveCount(2); // Default 2 options

    // Edit first option
    const firstOption = options.nth(0);
    await firstOption.locator("input").first().clear();
    await firstOption.locator("input").first().fill("United States");
    await firstOption.locator("input").nth(1).clear();
    await firstOption.locator("input").nth(1).fill("US");

    // Edit second option
    const secondOption = options.nth(1);
    await secondOption.locator("input").first().clear();
    await secondOption.locator("input").first().fill("Canada");
    await secondOption.locator("input").nth(1).clear();
    await secondOption.locator("input").nth(1).fill("CA");

    // Add a third option
    const addOptionButton = field.locator("button:has-text('Add Option')");
    await addOptionButton.click();
    await page.waitForTimeout(300);

    // Verify third option was added
    await expect(options).toHaveCount(3);

    // Configure third option
    const thirdOption = options.nth(2);
    await thirdOption.locator("input").first().fill("United Kingdom");
    await thirdOption.locator("input").nth(1).fill("UK");

    // Remove second option
    const removeButton = secondOption.locator("button[title='Remove option']");
    await removeButton.click();
    await page.waitForTimeout(300);

    // Verify option was removed
    await expect(options).toHaveCount(2);
  });

  test("can remove fields", async ({ page }) => {
    await page.fill('input[id="name"]', "Remove Fields Test");

    // Add multiple fields
    await page.click("button:has-text('Text')");
    await page.waitForTimeout(300);
    await page.click("button:has-text('Email')");
    await page.waitForTimeout(300);
    await page.click("button:has-text('Number')");
    await page.waitForTimeout(300);

    // Verify we have 3 fields
    const fields = page.locator('[data-testid="sortable-field"]');
    await expect(fields).toHaveCount(3);

    // Remove the middle field
    const removeButton = fields.nth(1).locator("button[title='Remove field']");
    await removeButton.click();
    await page.waitForTimeout(300);

    // Verify field was removed
    await expect(fields).toHaveCount(2);

    // Remove all fields
    await fields.nth(1).locator("button[title='Remove field']").click();
    await page.waitForTimeout(300);
    await fields.nth(0).locator("button[title='Remove field']").click();
    await page.waitForTimeout(300);

    // Verify all fields removed
    await expect(fields).toHaveCount(0);
    await expect(page.locator("text='No fields added yet'")).toBeVisible();
  });

  test("form settings tab works correctly", async ({ page }) => {
    await page.fill('input[id="name"]', "Settings Test Form");

    // Add a field first
    await page.click("button:has-text('Text')");
    await page.waitForTimeout(300);

    // Switch to settings tab
    await page.click("button:has-text('Settings')");
    await page.waitForTimeout(500);

    // Configure webhook
    const webhookInput = page.locator('input[placeholder*="webhook"]');
    if (await webhookInput.isVisible()) {
      await webhookInput.fill("https://example.com/webhook");
    }

    // Configure redirect URL
    const redirectInput = page.locator('input[placeholder*="redirect"]');
    if (await redirectInput.isVisible()) {
      await redirectInput.fill("https://example.com/thank-you");
    }

    // Switch back to fields tab
    await page.click("button:has-text('Form Fields')");
    await page.waitForTimeout(500);

    // Verify field is still there
    const fields = page.locator('[data-testid="sortable-field"]');
    await expect(fields).toHaveCount(1);

    // Save form
    await page.click("button:has-text('Create Form')");
    await page.waitForURL("**/forms");
  });

  test("mobile tap-to-add fallback works", async ({ page, context }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.fill('input[id="name"]', "Mobile Test Form");

    // On mobile, buttons should still work with tap
    await page.tap("button:has-text('Text')");
    await page.waitForTimeout(300);

    // Verify field was added
    const fields = page.locator('[data-testid="sortable-field"]');
    await expect(fields).toHaveCount(1);

    // Test scrolling to see all field types
    const fieldTypeContainer = page.locator(
      '[data-testid="field-type-selector"]'
    );
    if (await fieldTypeContainer.isVisible()) {
      // Scroll horizontally if needed
      await fieldTypeContainer.scrollIntoViewIfNeeded();
    }

    // Add more fields via tap
    await page.tap("button:has-text('Email')");
    await page.waitForTimeout(300);
    await page.tap("button:has-text('Phone')");
    await page.waitForTimeout(300);

    // Verify all fields added
    await expect(fields).toHaveCount(3);

    // Test field configuration on mobile
    const firstField = fields.first();
    await firstField.locator('input[placeholder="Field label"]').tap();
    await page.keyboard.type("Mobile Field");

    // Verify mobile interactions work
    await expect(
      firstField.locator('input[placeholder="Field label"]')
    ).toHaveValue("Mobile Field");
  });
});
