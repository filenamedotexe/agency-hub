import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers/role-auth";

test.describe("Phase 8: Content Generation", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("E2E: Generate content → View result → Save to client", async ({
    page,
  }) => {
    // Navigate to content tools
    await page.goto("/content-tools");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    // Verify we're on the content tools page
    expect(page.url()).toContain("/content-tools");

    // Click on Blog Writer tool
    await page.locator('button:has-text("Blog Writer")').first().click();

    // Wait for the modal to open
    await page.waitForSelector('[role="dialog"]', { state: "visible" });

    // Select a client
    await page.locator('button[role="combobox"]').click();
    await page.locator('[role="option"]:has-text("Acme")').first().click();

    // Fill in the blog topic
    await page.fill(
      'input[name="topic"]',
      "The Benefits of Digital Marketing for Small Businesses"
    );

    // Fill in keywords
    await page.fill(
      'input[name="keywords"]',
      "digital marketing, small business, online presence, ROI"
    );

    // Select tone
    await page.locator('select[name="tone"]').selectOption("professional");

    // Generate content
    await page.locator('button:has-text("Generate Content")').click();

    // Wait for content generation (mock API response in test environment)
    await page.waitForSelector('[data-testid="generated-content"]', {
      state: "visible",
      timeout: 30000,
    });

    // Verify content was generated
    const generatedContent = await page
      .locator('[data-testid="generated-content"]')
      .textContent();
    expect(generatedContent).toBeTruthy();
    expect(generatedContent?.length).toBeGreaterThan(100);

    // Save the content
    await page.locator('button:has-text("Save to Client")').click();

    // Verify success message
    await expect(
      page.locator('text="Content saved successfully"')
    ).toBeVisible();

    // Navigate to client detail page to verify saved content
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    // Click on the client
    await page.locator('tr:has-text("Acme Corporation")').click();

    // Verify we're on the client detail page
    await expect(page.url()).toMatch(/\/clients\/[a-zA-Z0-9-]+/);

    // Check generated content section
    await page.locator('text="Generated Content"').scrollIntoViewIfNeeded();

    // Verify the content appears in the history
    await expect(page.locator('text="Blog Writer"')).toBeVisible();
    await expect(
      page.locator('text="The Benefits of Digital Marketing"')
    ).toBeVisible();
  });
});
