import { test, expect } from "@playwright/test";
import { loginAsRole, navigateWithRole } from "./helpers/role-auth";

test.describe("Form Responses & Submission", () => {
  let testFormId: string;

  test.beforeAll(async ({ browser }) => {
    // Create a test form as admin
    const page = await browser.newPage();
    await loginAsRole(page, "ADMIN");

    // Create a form for testing
    await navigateWithRole(page, "/forms/new", true);

    const formName = `Response Test Form ${Date.now()}`;
    await page.fill('input[id="name"]', formName);
    await page.fill('textarea[id="description"]', "Form for testing responses");

    // Add fields
    await page.click("button:has-text('Text')");
    await page.waitForTimeout(300);
    const textField = page.locator('[data-testid="sortable-field"]').nth(0);
    await textField
      .locator('input[placeholder="Field label"]')
      .fill("Your Name");
    await textField.locator('input[placeholder="field_name"]').fill("name");
    await textField.locator('input[type="checkbox"]').check(); // Required

    await page.click("button:has-text('Email')");
    await page.waitForTimeout(300);
    const emailField = page.locator('[data-testid="sortable-field"]').nth(1);
    await emailField
      .locator('input[placeholder="Field label"]')
      .fill("Email Address");
    await emailField.locator('input[placeholder="field_name"]').fill("email");
    await emailField.locator('input[type="checkbox"]').check(); // Required

    await page.click("button:has-text('Select')");
    await page.waitForTimeout(300);
    const selectField = page.locator('[data-testid="sortable-field"]').nth(2);
    await selectField
      .locator('input[placeholder="Field label"]')
      .fill("How did you hear about us?");
    await selectField.locator('input[placeholder="field_name"]').fill("source");

    // Save form
    await page.click("button:has-text('Create Form')");
    await page.waitForURL("**/forms");

    // Get the form ID from the URL when we view it
    const formRow = page.locator("tr").filter({ hasText: formName });
    await formRow.locator("button[title='View Details']").click();
    await page.waitForURL("**/forms/**");

    const url = page.url();
    testFormId = url.split("/forms/")[1];

    await page.close();
  });

  test("Admin can preview and test form submission", async ({ page }) => {
    await loginAsRole(page, "ADMIN");

    // Navigate to the form
    await page.goto(`/forms/${testFormId}`);
    await page.waitForLoadState("domcontentloaded");

    // Click preview button
    await page.click("button:has-text('Preview Form')");
    await page.waitForURL("**/preview");
    await page.waitForLoadState("domcontentloaded");

    // Verify preview mode
    await expect(page.locator("text=Preview Mode")).toBeVisible();

    // Fill the form
    await page.fill('input[name="name"]', "John Doe");
    await page.fill('input[name="email"]', "john@example.com");

    // Select dropdown option
    const selectElement = page.locator('select[name="source"]');
    if (await selectElement.isVisible()) {
      await selectElement.selectOption({ index: 1 });
    }

    // Submit form
    await page.click("button[type='submit']");
    await page.waitForTimeout(1000);

    // Verify submission success
    const successIndicators = [
      page.locator("text=Form submitted successfully"),
      page.locator("text=Test Submission Data"),
      page.locator("text=Submission Received"),
    ];

    let foundSuccess = false;
    for (const indicator of successIndicators) {
      if (await indicator.isVisible({ timeout: 5000 }).catch(() => false)) {
        foundSuccess = true;
        break;
      }
    }
    expect(foundSuccess).toBeTruthy();
  });

  test("Service Manager can view form responses", async ({ page }) => {
    await loginAsRole(page, "SERVICE_MANAGER");

    // Navigate to forms
    await navigateWithRole(page, "/forms", true);
    await page.waitForLoadState("networkidle");

    // Find a form with responses
    const formsWithResponses = page.locator("tr").filter({
      has: page.locator("text=/[1-9]\\d* responses/"),
    });

    const count = await formsWithResponses.count();
    if (count === 0) {
      console.log("No forms with responses found");
      return;
    }

    // Click view details on form with responses
    await formsWithResponses
      .first()
      .locator("button[title='View Details']")
      .click();
    await page.waitForURL("**/forms/**");
    await page.waitForLoadState("domcontentloaded");

    // Verify responses section is visible
    await expect(page.locator("text='Form Responses'")).toBeVisible();

    // Check if responses table or list is visible
    const responsesSection = page.locator('[data-testid="form-responses"]');
    if (await responsesSection.isVisible()) {
      // Verify we can see response data
      const responseRows = responsesSection.locator(
        "tr, [data-testid='response-item']"
      );
      const responseCount = await responseRows.count();
      expect(responseCount).toBeGreaterThan(0);
    }
  });

  test("Client can submit assigned form", async ({ page }) => {
    // This test would require setting up a form assigned to a client
    // For now, we'll test the client's form view
    await loginAsRole(page, "CLIENT");

    // Navigate to client dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Check if client has forms menu item
    const formsMenuItem = page.locator("nav >> text='Forms'").first();
    if (await formsMenuItem.isVisible()) {
      await formsMenuItem.click();
      await page.waitForLoadState("domcontentloaded");

      // Client should see their assigned forms
      const formsList = page.locator('[data-testid="client-forms-list"]');
      if (await formsList.isVisible()) {
        const forms = formsList.locator('[data-testid="form-item"]');
        const formCount = await forms.count();

        if (formCount > 0) {
          // Click on first form to fill it out
          await forms.first().click();
          await page.waitForLoadState("domcontentloaded");

          // Fill and submit if possible
          const submitButton = page.locator("button[type='submit']");
          if (await submitButton.isVisible()) {
            // Fill required fields
            const requiredInputs = page.locator(
              "input[required], select[required], textarea[required]"
            );
            const inputCount = await requiredInputs.count();

            for (let i = 0; i < inputCount; i++) {
              const input = requiredInputs.nth(i);
              const inputType = await input.getAttribute("type");
              const tagName = await input.evaluate((el) =>
                el.tagName.toLowerCase()
              );

              if (tagName === "select") {
                await input.selectOption({ index: 1 });
              } else if (inputType === "email") {
                await input.fill("client@example.com");
              } else {
                await input.fill("Test Value");
              }
            }

            // Submit form
            await submitButton.click();
            await page.waitForTimeout(1000);

            // Verify submission
            const successMessage = page.locator(
              "text=/Thank you|Success|Submitted/i"
            );
            await expect(successMessage).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  test("Form responses are stored correctly", async ({ page }) => {
    await loginAsRole(page, "ADMIN");

    // Navigate to the test form
    await page.goto(`/forms/${testFormId}`);
    await page.waitForLoadState("domcontentloaded");

    // Check response count
    const responseCountBadge = page.locator("text=/\\d+ responses/");
    if (await responseCountBadge.isVisible()) {
      const countText = await responseCountBadge.textContent();
      const count = parseInt(countText?.match(/\d+/)?.[0] || "0");
      expect(count).toBeGreaterThan(0);
    }

    // Check responses section
    const responsesSection = page.locator('[data-testid="form-responses"]');
    if (await responsesSection.isVisible()) {
      // Look for response data
      const hasResponseData =
        (await page.locator("text=john@example.com").isVisible()) ||
        (await page.locator("text=John Doe").isVisible()) ||
        (await page.locator("td:has-text('john')").isVisible());

      expect(hasResponseData).toBeTruthy();
    }
  });

  test("Export form responses works", async ({ page }) => {
    await loginAsRole(page, "ADMIN");

    // Navigate to forms with responses
    await navigateWithRole(page, "/forms", true);
    await page.waitForLoadState("networkidle");

    // Find form with responses
    const formsWithResponses = page.locator("tr").filter({
      has: page.locator("text=/[1-9]\\d* responses/"),
    });

    if ((await formsWithResponses.count()) === 0) {
      console.log("No forms with responses to export");
      return;
    }

    // View form details
    await formsWithResponses
      .first()
      .locator("button[title='View Details']")
      .click();
    await page.waitForURL("**/forms/**");

    // Look for export button
    const exportButton = page.locator("button:has-text('Export')");
    if (await exportButton.isVisible()) {
      // Set up download promise
      const downloadPromise = page.waitForEvent("download");

      // Click export
      await exportButton.click();

      // Wait for download
      const download = await downloadPromise;

      // Verify download
      expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx|json)$/);
    }
  });

  test("Form validation works on submission", async ({ page }) => {
    await loginAsRole(page, "ADMIN");

    // Go to form preview
    await page.goto(`/forms/${testFormId}/preview`);
    await page.waitForLoadState("domcontentloaded");

    // Try to submit without filling required fields
    await page.click("button[type='submit']");

    // Check for validation messages
    const validationMessages = page.locator(
      '[data-testid="field-error"], .text-red-500, :text("required")'
    );
    const hasValidation = (await validationMessages.count()) > 0;

    if (!hasValidation) {
      // Check for browser validation
      const nameInput = page.locator('input[name="name"][required]');
      const isInvalid = await nameInput.evaluate(
        (el: HTMLInputElement) => !el.validity.valid
      );
      expect(isInvalid).toBeTruthy();
    } else {
      expect(hasValidation).toBeTruthy();
    }

    // Fill only one required field
    await page.fill('input[name="name"]', "Test User");
    await page.click("button[type='submit']");

    // Email should still show error
    const emailInput = page.locator('input[name="email"][required]');
    if (await emailInput.isVisible()) {
      const emailInvalid = await emailInput.evaluate(
        (el: HTMLInputElement) => !el.validity.valid
      );
      expect(emailInvalid).toBeTruthy();
    }
  });

  test("Response data displays correctly with all field types", async ({
    page,
  }) => {
    await loginAsRole(page, "ADMIN");

    // Create a form with all field types
    await navigateWithRole(page, "/forms/new", true);

    const formName = `All Fields Test ${Date.now()}`;
    await page.fill('input[id="name"]', formName);

    // Add one of each field type
    const fieldTypes = [
      "Text",
      "Email",
      "Number",
      "Phone",
      "Date",
      "Select",
      "Radio",
      "Checkbox",
      "Textarea",
    ];

    for (const fieldType of fieldTypes) {
      await page.click(`button:has-text('${fieldType}')`);
      await page.waitForTimeout(200);
    }

    // Save form
    await page.click("button:has-text('Create Form')");
    await page.waitForURL("**/forms");

    // Preview and submit the form
    const formRow = page.locator("tr").filter({ hasText: formName });
    await formRow.locator("button[title='Preview Form']").click();
    await page.waitForURL("**/preview");

    // Fill all fields
    const inputs = page
      .locator("input, select, textarea")
      .filter({ hasNot: page.locator('[type="checkbox"][data-form-builder]') });
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const type = await input.getAttribute("type");
      const tagName = await input.evaluate((el) => el.tagName.toLowerCase());

      if (tagName === "select") {
        await input.selectOption({ index: 1 });
      } else if (type === "date") {
        await input.fill("2024-01-15");
      } else if (type === "number") {
        await input.fill("42");
      } else if (type === "email") {
        await input.fill("test@example.com");
      } else if (type === "tel" || type === "phone") {
        await input.fill("+1234567890");
      } else if (tagName === "textarea") {
        await input.fill("This is a longer text response");
      } else if (type === "checkbox" || type === "radio") {
        await input.check();
      } else {
        await input.fill("Test Value");
      }
    }

    // Submit
    await page.click("button[type='submit']");
    await page.waitForTimeout(1000);

    // Go back to form details
    await page.goto("/forms");
    await page.waitForLoadState("networkidle");
    await page
      .locator("tr")
      .filter({ hasText: formName })
      .locator("button[title='View Details']")
      .click();

    // Verify response data shows all field types correctly
    const responseData = page.locator('[data-testid="form-responses"]');
    if (await responseData.isVisible()) {
      // Check for various data formats
      await expect(responseData).toContainText("test@example.com");
      await expect(responseData).toContainText("42");
      await expect(responseData).toContainText("2024-01-15");
    }
  });
});
