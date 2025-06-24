import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers/role-auth";

test.describe("Phase 8: Webhook Configuration", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("E2E: Webhook configuration for forms", async ({ page }) => {
    // First, navigate to forms
    await page.goto("/forms");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    // Click on a form to edit
    await page.locator('button:has-text("Edit")').first().click();

    // Wait for form editor
    await page.waitForSelector('text="Form Settings"', { state: "visible" });

    // Click on Settings tab
    await page.locator('button:has-text("Settings")').click();

    // Add webhook URL
    const webhookUrl = "https://example.com/webhook-test";
    await page.fill('input[placeholder*="webhook"]', webhookUrl);

    // Add redirect URL
    const redirectUrl = "https://example.com/thank-you";
    await page.fill('input[placeholder*="redirect"]', redirectUrl);

    // Save settings
    await page.locator('button:has-text("Save Settings")').click();

    // Verify success
    await expect(page.locator('text="Form settings saved"')).toBeVisible();

    // Navigate to automations to verify webhook appears
    await page.goto("/automations");
    await page.waitForLoadState("networkidle");

    // Verify webhook is listed under Form Webhooks
    await expect(page.locator('text="Form Webhooks"')).toBeVisible();
    await expect(page.locator(`text="${webhookUrl}"`)).toBeVisible();
  });

  test("E2E: Content tool webhooks", async ({ page }) => {
    // Navigate to content tools
    await page.goto("/content-tools");
    await page.waitForLoadState("networkidle");

    // Click on a content tool
    await page.locator('button:has-text("Blog Writer")').first().click();

    // Wait for content generator
    await page.waitForSelector('[role="dialog"]', { state: "visible" });

    // Look for webhook configuration option
    await page.locator('button:has-text("Configure Webhook")').click();

    // Add webhook URL
    const webhookUrl = "https://n8n.example.com/webhook/content-tool";
    await page.fill('input[placeholder*="webhook URL"]', webhookUrl);

    // Add custom headers
    await page.locator('button:has-text("Add Header")').click();
    await page.fill('input[placeholder="Header name"]', "X-API-Key");
    await page.fill('input[placeholder="Header value"]', "test-api-key");

    // Save webhook
    await page.locator('button:has-text("Save Webhook")').click();

    // Verify success
    await expect(
      page.locator('text="Webhook configured successfully"')
    ).toBeVisible();

    // Close dialog
    await page.keyboard.press("Escape");

    // Navigate to automations
    await page.goto("/automations");
    await page.waitForLoadState("networkidle");

    // Verify webhook appears under Content Tool Webhooks
    await expect(page.locator('text="Content Tool Webhooks"')).toBeVisible();
    await expect(page.locator(`text="${webhookUrl}"`)).toBeVisible();
  });

  test("E2E: General webhooks", async ({ page }) => {
    // Navigate to automations
    await page.goto("/automations");
    await page.waitForLoadState("networkidle");

    // Create a general webhook
    await page.locator('button:has-text("Create Webhook")').click();

    // Wait for dialog
    await page.waitForSelector('[role="dialog"]', { state: "visible" });

    // Fill webhook details
    await page.fill('input[name="name"]', "Test General Webhook");
    await page.fill('input[name="url"]', "https://api.example.com/webhook");

    // Select webhook type
    await page.locator('select[name="type"]').selectOption("GENERAL");

    // Add headers
    await page.locator('button:has-text("Add Header")').click();
    await page.fill('input[placeholder="Header name"]', "Authorization");
    await page.fill('input[placeholder="Header value"]', "Bearer test-token");

    // Save webhook
    await page.locator('button:has-text("Create Webhook")').click();

    // Verify success
    await expect(
      page.locator('text="Webhook created successfully"')
    ).toBeVisible();

    // Verify webhook appears in list
    await expect(page.locator('text="Test General Webhook"')).toBeVisible();
    await expect(
      page.locator('text="https://api.example.com/webhook"')
    ).toBeVisible();

    // Test webhook toggle
    await page.locator('[data-testid="webhook-toggle"]').first().click();

    // Verify status change
    await expect(page.locator('text="Webhook disabled"')).toBeVisible();

    // Test webhook deletion
    await page.locator('button[aria-label="Delete webhook"]').first().click();

    // Confirm deletion
    await page.locator('button:has-text("Delete")').click();

    // Verify deletion
    await expect(
      page.locator('text="Webhook deleted successfully"')
    ).toBeVisible();
    await expect(page.locator('text="Test General Webhook"')).not.toBeVisible();
  });
});
