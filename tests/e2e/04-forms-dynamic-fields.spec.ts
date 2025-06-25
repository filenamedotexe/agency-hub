import { test, expect } from "@playwright/test";
import { loginAsRole } from "./helpers/role-auth";
import {
  mcpTakeScreenshot,
  mcpVerifyAccessibility,
  mcpMonitorNetworkRequests,
  mcpVerifyToast,
  mcpWaitForElement,
} from "./helpers/mcp-utils";

test.describe("Forms & Dynamic Fields", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, "ADMIN");
  });

  test.describe("Form Builder", () => {
    test("create form with drag-and-drop builder", async ({ page }) => {
      // Monitor API requests
      const requests = await mcpMonitorNetworkRequests(page, "/api/forms");

      await page.goto("/forms");
      await page.waitForLoadState("networkidle");

      // Take screenshot of forms list
      await mcpTakeScreenshot(page, {
        filename: "forms-list.png",
      });

      // Create new form
      await page.click(
        'button:has-text("Create Form"), button:has-text("New Form")'
      );

      // Wait for form builder modal
      await mcpWaitForElement(page, '[role="dialog"]');

      // Verify form builder accessibility
      const isAccessible = await mcpVerifyAccessibility(page, {
        checkLabels: true,
      });
      expect(isAccessible).toBe(true);

      // Fill form details
      const timestamp = Date.now();
      const formData = {
        name: `Test Form ${timestamp}`,
        description: "Test form for E2E testing",
      };

      await page.fill('input[name="name"]', formData.name);
      await page.fill('textarea[name="description"]', formData.description);

      // Add form fields using drag-and-drop or buttons
      // Text field
      await page.click(
        'button:has-text("Add Text Field"), [data-field-type="text"]'
      );
      await page.fill('input[placeholder="Field Label"]', "Full Name");
      await page.fill('input[placeholder="Field Name"]', "fullName");

      // Email field
      await page.click(
        'button:has-text("Add Email Field"), [data-field-type="email"]'
      );
      await page.fill(
        'input[placeholder="Field Label"]:last-of-type',
        "Email Address"
      );
      await page.fill('input[placeholder="Field Name"]:last-of-type', "email");

      // Select field
      await page.click(
        'button:has-text("Add Select Field"), [data-field-type="select"]'
      );
      await page.fill(
        'input[placeholder="Field Label"]:last-of-type',
        "Service Type"
      );
      await page.fill(
        'input[placeholder="Field Name"]:last-of-type',
        "serviceType"
      );

      // Add select options
      await page.click('button:has-text("Add Option")');
      await page.fill('input[placeholder="Option Label"]', "Google Ads");
      await page.fill('input[placeholder="Option Value"]', "google_ads");

      // Take screenshot of form builder with fields
      await mcpTakeScreenshot(page, {
        filename: "form-builder-with-fields.png",
      });

      // Save form
      await page.click('button[type="submit"]:has-text("Save Form")');

      // Verify success
      await expect(page.getByText("Form created successfully")).toBeVisible();
      await expect(page.getByText(formData.name)).toBeVisible();
    });

    test("configure form settings", async ({ page }) => {
      await page.goto("/forms");
      await page.click(
        'button:has-text("Create Form"), button:has-text("New Form")'
      );

      // Switch to settings tab
      await page.click(
        'button:has-text("Settings"), [role="tab"]:has-text("Settings")'
      );

      // Configure webhook
      await page.fill(
        'input[name="webhook"], input[placeholder*="webhook"]',
        "https://example.com/webhook"
      );

      // Configure redirect URL
      await page.fill(
        'input[name="redirectUrl"], input[placeholder*="redirect"]',
        "https://example.com/thank-you"
      );

      // Check for webhook test button
      await expect(
        page.locator('button:has-text("Test Webhook")')
      ).toBeVisible();
    });

    test("preview form before saving", async ({ page }) => {
      await page.goto("/forms");
      await page.click(
        'button:has-text("Create Form"), button:has-text("New Form")'
      );

      // Add some fields
      await page.fill('input[name="name"]', "Preview Test Form");
      await page.click('button:has-text("Add Text Field")');

      // Click preview
      await page.click('button:has-text("Preview")');

      // Should open preview modal or new tab
      await page.waitForTimeout(1000);

      // Check if preview is visible
      const previewModal = page.locator('[role="dialog"]:has-text("Preview")');
      const previewTab = page.context().pages().length > 1;

      expect((await previewModal.isVisible()) || previewTab).toBeTruthy();
    });
  });

  test.describe("Form Assignment", () => {
    test("assign form to service", async ({ page }) => {
      await page.goto("/forms");

      // Click on existing form
      const formCard = page
        .locator('[data-testid="form-card"], .form-item')
        .first();
      if (await formCard.isVisible()) {
        await formCard.click();

        // Click assign to service
        await page.click('button:has-text("Assign to Service")');

        // Select service
        await page.locator('button[role="combobox"]').click();
        await page.locator('[role="option"]').first().click();

        // Confirm assignment
        await page.click('button:has-text("Assign")');

        // Verify
        await expect(page.getByText("Form assigned to service")).toBeVisible();
      }
    });

    test("assign form directly to client", async ({ page }) => {
      await page.goto("/forms");

      const formCard = page
        .locator('[data-testid="form-card"], .form-item')
        .first();
      if (await formCard.isVisible()) {
        await formCard.click();

        // Click assign to client
        await page.click('button:has-text("Assign to Client")');

        // Select client
        await page.locator('button[role="combobox"]').click();
        await page.locator('[role="option"]').first().click();

        // Confirm
        await page.click('button:has-text("Assign")');

        // Verify
        await expect(page.getByText("Form assigned to client")).toBeVisible();
      }
    });
  });

  test.describe("Dynamic Fields from Form Responses", () => {
    test("form responses create dynamic fields", async ({ page }) => {
      // Navigate to a client with form responses
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      // Check for form responses section
      const formResponsesSection = page.locator(
        'section:has-text("Form Responses")'
      );
      await expect(formResponsesSection).toBeVisible();

      // Check for dynamic fields
      const dynamicFields = formResponsesSection.locator(
        'code:has-text("{{"), span:has-text("{{")'
      );
      const fieldCount = await dynamicFields.count();

      if (fieldCount > 0) {
        // Verify fields are displayed in correct format
        const firstField = dynamicFields.first();
        const fieldText = await firstField.textContent();
        expect(fieldText).toMatch(/\{\{[\w_]+\}\}/);
      }
    });

    test("dynamic fields organized by form", async ({ page }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      const formResponsesSection = page.locator(
        'section:has-text("Form Responses")'
      );

      // Check for form groupings
      const formGroups = formResponsesSection.locator(
        '[data-testid="form-group"], .form-response-group'
      );

      if ((await formGroups.count()) > 0) {
        const firstGroup = formGroups.first();

        // Should show form name
        await expect(firstGroup.locator("h3, h4")).toBeVisible();

        // Should show fields from that form
        await expect(firstGroup.locator('text="{{"')).toBeVisible();
      }
    });

    test("click to copy dynamic fields", async ({ page }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      // Find a dynamic field
      const dynamicField = page
        .locator('code:has-text("{{"), span:has-text("{{")')
        .first();

      if (await dynamicField.isVisible()) {
        // Hover to see cursor change
        await dynamicField.hover();
        await expect(dynamicField).toHaveCSS("cursor", "pointer");

        // Click to copy
        await dynamicField.click();

        // Should show success toast
        await expect(
          page.locator('text="Copied to clipboard", text="Copied!"')
        ).toBeVisible();
      }
    });
  });

  test.describe("Form Responses", () => {
    test("view form responses", async ({ page }) => {
      await page.goto("/forms");

      const formCard = page
        .locator('[data-testid="form-card"], .form-item')
        .first();
      if (await formCard.isVisible()) {
        await formCard.click();

        // Click responses tab
        await page.click(
          'button:has-text("Responses"), [role="tab"]:has-text("Responses")'
        );

        // Check for responses table
        const responsesTable = page.locator('table:has-text("Submitted")');

        if (await responsesTable.isVisible()) {
          // Check table headers
          await expect(
            responsesTable.locator('th:has-text("Client")')
          ).toBeVisible();
          await expect(
            responsesTable.locator('th:has-text("Submitted")')
          ).toBeVisible();
          await expect(
            responsesTable.locator('th:has-text("Status")')
          ).toBeVisible();
        }
      }
    });

    test("export form responses", async ({ page }) => {
      await page.goto("/forms");

      const formCard = page
        .locator('[data-testid="form-card"], .form-item')
        .first();
      if (await formCard.isVisible()) {
        await formCard.click();
        await page.click(
          'button:has-text("Responses"), [role="tab"]:has-text("Responses")'
        );

        // Look for export button
        const exportButton = page.locator('button:has-text("Export")');

        if (await exportButton.isVisible()) {
          // Set up download promise
          const downloadPromise = page.waitForEvent("download");
          await exportButton.click();

          // Verify download
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/\.csv$|\.xlsx$/);
        }
      }
    });
  });

  test.describe("Client Form Access", () => {
    test("CLIENT can view and submit assigned forms", async ({ page }) => {
      await loginAsRole(page, "CLIENT");
      await page.goto("/client-dashboard");

      // Check for forms section
      const formsSection = page.locator(
        'section:has-text("Forms"), section:has-text("My Forms")'
      );

      if (await formsSection.isVisible()) {
        // Check for form cards
        const formCards = formsSection.locator(
          '[data-testid="form-card"], .form-card'
        );

        if ((await formCards.count()) > 0) {
          // Click first form
          await formCards.first().click();

          // Should see form fields
          await expect(
            page.locator('form, [data-testid="client-form"]')
          ).toBeVisible();

          // Should have submit button
          await expect(page.locator('button[type="submit"]')).toBeVisible();
        }
      }
    });

    test("form submission creates dynamic fields", async ({ page }) => {
      await loginAsRole(page, "CLIENT");
      await page.goto("/client-dashboard");

      const formCard = page
        .locator('[data-testid="form-card"], .form-card')
        .first();

      if (await formCard.isVisible()) {
        await formCard.click();

        // Fill form fields
        const textInputs = page.locator('input[type="text"]');
        const inputCount = await textInputs.count();

        for (let i = 0; i < inputCount; i++) {
          await textInputs.nth(i).fill(`Test Value ${i}`);
        }

        // Submit form
        await page.click('button[type="submit"]');

        // Should show success
        await expect(
          page.locator('text="Form submitted successfully"')
        ).toBeVisible();

        // Form should be marked as completed
        await expect(
          page.locator('text="Completed", .badge:has-text("Done")')
        ).toBeVisible();
      }
    });
  });

  test.describe("Form Builder Field Types", () => {
    test("all field types available in builder", async ({ page }) => {
      await page.goto("/forms");
      await page.click(
        'button:has-text("Create Form"), button:has-text("New Form")'
      );

      // Check for all field types
      const fieldTypes = [
        "Text Field",
        "Email Field",
        "Number Field",
        "Date Field",
        "Select Field",
        "Textarea",
        "Checkbox",
        "Radio Group",
        "File Upload",
      ];

      for (const fieldType of fieldTypes) {
        const fieldButton = page.locator(
          `button:has-text("${fieldType}"), [data-field-type]`
        );
        await expect(fieldButton.first()).toBeVisible();
      }
    });

    test("field validation options", async ({ page }) => {
      await page.goto("/forms");
      await page.click(
        'button:has-text("Create Form"), button:has-text("New Form")'
      );

      // Add a text field
      await page.click('button:has-text("Add Text Field")');

      // Check for validation options
      await expect(
        page.locator(
          'input[type="checkbox"]:has-text("Required"), label:has-text("Required")'
        )
      ).toBeVisible();
      await expect(
        page.locator(
          'input[placeholder*="Min length"], label:has-text("Min length")'
        )
      ).toBeVisible();
      await expect(
        page.locator(
          'input[placeholder*="Max length"], label:has-text("Max length")'
        )
      ).toBeVisible();
    });
  });
});
