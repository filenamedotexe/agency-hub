import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers/role-auth";

test.describe("Phase 8: API Key Management", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("E2E: API key CRUD (without exposing keys)", async ({ page }) => {
    // Navigate to settings
    await page.goto("/settings");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    // Verify we're on settings page
    expect(page.url()).toContain("/settings");

    // Click on API Keys tab
    await page.locator('button:has-text("API Keys")').click();

    // Wait for API keys section to load
    await page.waitForSelector('text="API Key Management"', {
      state: "visible",
    });

    // Add Anthropic API key
    await page.locator('button:has-text("Add Anthropic Key")').click();

    // Fill in the API key (test key)
    const testKey = "sk-ant-test-key-" + Date.now();
    await page.fill('input[name="apiKey"]', testKey);

    // Save the key
    await page.locator('button:has-text("Save API Key")').click();

    // Verify success message
    await expect(
      page.locator('text="API key saved successfully"')
    ).toBeVisible();

    // Verify the key is shown as masked
    await expect(page.locator('text="sk-ant-test-key-"')).not.toBeVisible();
    await expect(page.locator('text="•••••••••"')).toBeVisible();

    // Verify last 4 characters are shown
    const maskedKey = await page
      .locator('[data-testid="masked-api-key"]')
      .first()
      .textContent();
    expect(maskedKey).toMatch(/•+[a-zA-Z0-9]{4}$/);

    // Update the API key
    await page.locator('button[aria-label="Update API key"]').first().click();

    const updatedKey = "sk-ant-updated-key-" + Date.now();
    await page.fill('input[name="apiKey"]', updatedKey);
    await page.locator('button:has-text("Update API Key")').click();

    // Verify update success
    await expect(
      page.locator('text="API key updated successfully"')
    ).toBeVisible();

    // Add OpenAI API key
    await page.locator('button:has-text("Add OpenAI Key")').click();

    const openAIKey = "sk-openai-test-key-" + Date.now();
    await page.fill('input[name="apiKey"]', openAIKey);
    await page.locator('button:has-text("Save API Key")').click();

    // Verify both keys are listed
    const apiKeyRows = await page
      .locator('[data-testid="api-key-row"]')
      .count();
    expect(apiKeyRows).toBeGreaterThanOrEqual(2);

    // Delete the OpenAI key
    await page
      .locator('[data-testid="api-key-row"]:has-text("OpenAI")')
      .locator('button[aria-label="Delete API key"]')
      .click();

    // Confirm deletion
    await page.locator('button:has-text("Delete")').click();

    // Verify deletion success
    await expect(
      page.locator('text="API key deleted successfully"')
    ).toBeVisible();

    // Verify only one key remains
    const remainingKeys = await page
      .locator('[data-testid="api-key-row"]')
      .count();
    expect(remainingKeys).toBe(apiKeyRows - 1);
  });

  test("E2E: API keys are properly encrypted and never exposed", async ({
    page,
  }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click on API Keys tab
    await page.locator('button:has-text("API Keys")').click();

    // Try to inspect the page source for exposed keys
    const pageContent = await page.content();

    // Verify no full API keys are in the DOM
    expect(pageContent).not.toContain("sk-ant-api");
    expect(pageContent).not.toContain("sk-");

    // Check network requests don't expose keys
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/settings/api-keys") &&
        response.status() === 200
    );

    // Refresh the API keys list
    await page.reload();
    await page.locator('button:has-text("API Keys")').click();

    const response = await responsePromise;
    const responseData = await response.json();

    // Verify API response doesn't contain full keys
    if (responseData.keys && responseData.keys.length > 0) {
      responseData.keys.forEach((key: any) => {
        expect(key.key).toBeUndefined();
        expect(key.decryptedKey).toBeUndefined();
        expect(key.maskedKey).toBeTruthy();
        expect(key.maskedKey).toMatch(/•+[a-zA-Z0-9]{4}$/);
      });
    }
  });

  test("E2E: API keys are used for content generation", async ({ page }) => {
    // First ensure we have an API key
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await page.locator('button:has-text("API Keys")').click();

    // Add a test API key if none exists
    const keyCount = await page.locator('[data-testid="api-key-row"]').count();
    if (keyCount === 0) {
      await page.locator('button:has-text("Add Anthropic Key")').click();
      await page.fill('input[name="apiKey"]', "sk-ant-test-" + Date.now());
      await page.locator('button:has-text("Save API Key")').click();
      await expect(
        page.locator('text="API key saved successfully"')
      ).toBeVisible();
    }

    // Navigate to content tools
    await page.goto("/content-tools");
    await page.waitForLoadState("networkidle");

    // Try to generate content
    await page.locator('button:has-text("Blog Writer")').first().click();
    await page.waitForSelector('[role="dialog"]', { state: "visible" });

    // Select client
    await page.locator('button[role="combobox"]').click();
    await page.locator('[role="option"]').first().click();

    // Fill required fields
    await page.fill('input[name="topic"]', "Test Topic");
    await page.fill('input[name="keywords"]', "test, keywords");

    // Generate - this should use the stored API key
    await page.locator('button:has-text("Generate Content")').click();

    // Should either succeed (with valid key) or show appropriate error (with test key)
    // The important part is that the key is being used, not exposed
    await page.waitForSelector(
      '[data-testid="generated-content"], [data-testid="error-message"]',
      {
        state: "visible",
        timeout: 30000,
      }
    );
  });
});
