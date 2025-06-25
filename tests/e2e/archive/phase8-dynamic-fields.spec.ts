import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers/role-auth";

test.describe("Phase 8: Dynamic Field Replacement", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("E2E: Dynamic field replacement in content generation", async ({
    page,
  }) => {
    // First, ensure the client has some form responses with dynamic fields
    await page.goto("/forms");
    await page.waitForLoadState("networkidle");

    // Create a test form response for a client
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    // Click on Acme Corporation
    await page.locator('tr:has-text("Acme Corporation")').click();
    await expect(page.url()).toMatch(/\/clients\/[a-zA-Z0-9-]+/);

    // Now navigate to content tools
    await page.goto("/content-tools");
    await page.waitForLoadState("networkidle");

    // Click on Facebook Ad tool which uses dynamic fields
    await page.locator('button:has-text("Facebook Image Ad")').first().click();

    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { state: "visible" });

    // Select client
    await page.locator('button[role="combobox"]').click();
    await page.locator('[role="option"]:has-text("Acme")').first().click();

    // Check that dynamic fields are available in the prompt editor
    await page.locator('button:has-text("Insert Dynamic Field")').click();

    // Verify dynamic field menu appears
    await expect(page.locator('[role="menu"]')).toBeVisible();

    // Look for business_name field
    const businessNameField = page.locator(
      '[role="menuitem"]:has-text("business_name")'
    );
    await expect(businessNameField).toBeVisible();

    // Insert the dynamic field
    await businessNameField.click();

    // Verify the field was inserted into the prompt
    const promptTextarea = page.locator('textarea[name="prompt"]');
    const promptValue = await promptTextarea.inputValue();
    expect(promptValue).toContain("{{business_name}}");

    // Add some additional text
    await promptTextarea.fill(
      `Create a Facebook ad for {{business_name}} highlighting their services.`
    );

    // Generate content
    await page.locator('button:has-text("Generate Content")').click();

    // Wait for generation
    await page.waitForSelector('[data-testid="generated-content"]', {
      state: "visible",
      timeout: 30000,
    });

    // Verify the dynamic field was replaced in the generated content
    const generatedContent = await page
      .locator('[data-testid="generated-content"]')
      .textContent();
    expect(generatedContent).toBeTruthy();

    // The generated content should contain the actual business name, not the placeholder
    expect(generatedContent).toContain("Acme Corporation");
    expect(generatedContent).not.toContain("{{business_name}}");
  });

  test("E2E: Multiple dynamic fields in content generation", async ({
    page,
  }) => {
    await page.goto("/content-tools");
    await page.waitForLoadState("networkidle");

    // Use Google Search Ad Writer
    await page
      .locator('button:has-text("Google Search Ad Writer")')
      .first()
      .click();
    await page.waitForSelector('[role="dialog"]', { state: "visible" });

    // Select client
    await page.locator('button[role="combobox"]').click();
    await page.locator('[role="option"]:has-text("TechStart")').first().click();

    // Create prompt with multiple dynamic fields
    const promptTextarea = page.locator('textarea[name="prompt"]');
    await promptTextarea.fill(
      `Create Google Search ads for {{business_name}} located in {{city}}, {{state}}. Focus on their {{primary_service}} services.`
    );

    // Add keywords
    await page.fill(
      'input[name="keywords"]',
      "{{primary_service}}, {{city}} services"
    );

    // Generate content
    await page.locator('button:has-text("Generate Content")').click();

    // Wait for generation
    await page.waitForSelector('[data-testid="generated-content"]', {
      state: "visible",
      timeout: 30000,
    });

    // Verify all dynamic fields were replaced
    const generatedContent = await page
      .locator('[data-testid="generated-content"]')
      .textContent();
    expect(generatedContent).toBeTruthy();

    // Should not contain any placeholders
    expect(generatedContent).not.toContain("{{");
    expect(generatedContent).not.toContain("}}");

    // Should contain actual values (assuming test data has these)
    expect(generatedContent?.toLowerCase()).toContain("tech");
  });
});
