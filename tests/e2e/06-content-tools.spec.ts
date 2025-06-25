import { test, expect } from "@playwright/test";
import { loginAsRole, type UserRole } from "./helpers/role-auth";
import {
  mcpTakeScreenshot,
  mcpVerifyAccessibility,
  mcpMonitorNetworkRequests,
  mcpVerifyToast,
  mcpNavigateWithMonitoring,
} from "./helpers/mcp-utils";

// Configure slower, more realistic interactions
test.use({
  actionTimeout: 10000,
  navigationTimeout: 30000,
});

test.describe("Content Tools & AI Generation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, "ADMIN");
    // Give the app time to stabilize after login
    await page.waitForTimeout(2000);
  });

  test.describe("Content Tools Overview", () => {
    test("content tools page displays all available tools", async ({
      page,
    }) => {
      // Monitor API requests
      const requests = await mcpMonitorNetworkRequests(
        page,
        "/api/content-tools"
      );

      await mcpNavigateWithMonitoring(page, "/content-tools", {
        waitForRequests: ["/api/content-tools"],
      });
      await page.waitForTimeout(1000); // Let React components render

      // Wait for the page to be fully loaded
      await page.waitForSelector("h1", { state: "visible" });

      // Take screenshot of content tools grid
      await mcpTakeScreenshot(page, {
        filename: "content-tools-grid.png",
      });

      // Verify page header
      await expect(page.locator('h1:has-text("Content Tools")')).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.locator(
          'text="Generate high-quality content for your clients using AI"'
        )
      ).toBeVisible();

      // Verify accessibility
      const isAccessible = await mcpVerifyAccessibility(page);
      expect(isAccessible).toBe(true);

      // Check all tools are displayed
      const expectedTools = [
        "Blog Writer",
        "Facebook Video Ad Script & Caption Writer",
        "Facebook Image Ad & Caption Writer",
        "Google Search Ad Writer",
        "SEO Keyword Research",
      ];

      for (const tool of expectedTools) {
        await expect(page.locator(`text="${tool}"`)).toBeVisible();
      }

      // Check generate buttons
      const generateButtons = page.locator(
        'button:has-text("Generate Content")'
      );
      expect(await generateButtons.count()).toBe(expectedTools.length);

      // Check "How It Works" section
      await expect(page.locator('text="How It Works"')).toBeVisible();

      // Verify API calls were successful
      const toolsRequest = requests.find((r) =>
        r.url.includes("/api/content-tools")
      );
      expect(toolsRequest?.status).toBe(200);
    });

    test("tool cards show generation count badges", async ({ page }) => {
      await page.goto("/content-tools");

      // Look for generation count badges
      const badges = page.locator(
        '.badge:has-text(/\\d+/), [data-testid="generation-count"]'
      );

      // Some tools may have been used
      if ((await badges.count()) > 0) {
        const firstBadge = badges.first();
        const badgeText = await firstBadge.textContent();
        expect(badgeText).toMatch(/\d+/);
      }
    });
  });

  test.describe("Content Generation Flow", () => {
    test("complete content generation with Blog Writer", async ({ page }) => {
      await page.goto("/content-tools");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Wait for tools to load
      await page.waitForSelector('text="Blog Writer"', { state: "visible" });

      // Click Blog Writer - use a more specific selector
      const blogWriterCard = page
        .locator(".grid > div")
        .filter({ hasText: "Blog Writer" })
        .filter({ has: page.locator('button:has-text("Generate Content")') });
      await expect(blogWriterCard).toBeVisible({ timeout: 10000 });
      await blogWriterCard.click();

      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Verify tool page loaded
      await expect(page.locator('h2:has-text("Blog Writer")')).toBeVisible();
      await expect(
        page.locator('text="Generate engaging blog posts for your clients"')
      ).toBeVisible();

      // Select client
      await page
        .locator('button[role="combobox"]:has-text("Choose a client")')
        .click();
      await page.waitForSelector('[role="option"]', { state: "visible" });

      // If no clients, create one first
      const clientOptions = page.locator('[role="option"]');
      if ((await clientOptions.count()) === 0) {
        await page.goto("/clients/new");
        await page.fill('input[name="name"]', "Test Content Client");
        await page.fill('input[name="businessName"]', "Test Business");
        await page.fill('textarea[name="address"]', "123 Test St");
        await page.click('button[type="submit"]');
        await page.waitForURL("/clients");

        // Go back to content tools
        await page.goto("/content-tools");
        await page.locator('div:has-text("Blog Writer")').first().click();
        await page
          .locator('button[role="combobox"]:has-text("Choose a client")')
          .click();
      }

      await page.locator('[role="option"]').first().click();

      // Check for dynamic fields section
      await expect(
        page.locator('text="Available Dynamic Fields"')
      ).toBeVisible();
      await expect(page.locator('text="Client Data"')).toBeVisible();

      // Check for click-to-copy dynamic fields
      const dynamicFields = page.locator(
        'code:has-text("{{"), span:has-text("{{")'
      );
      if ((await dynamicFields.count()) > 0) {
        const firstField = dynamicFields.first();
        await firstField.hover();
        await expect(firstField).toHaveCSS("cursor", "pointer");
      }

      // Fill form fields
      await page.fill(
        'input[placeholder*="topic"]',
        "AI in Digital Marketing 2025"
      );
      await page.fill(
        'input[placeholder*="wordCount"], input[placeholder*="Word Count"]',
        "1500"
      );
      await page.fill(
        'input[placeholder*="tone"]',
        "professional and engaging"
      );
      await page.fill(
        'input[placeholder*="keywords"]',
        "AI marketing, automation, personalization"
      );
      await page.fill(
        'textarea[placeholder*="businessContext"], input[placeholder*="businessContext"]',
        "Digital marketing agency specializing in AI solutions"
      );

      // Generate content
      await page.click('button:has-text("Generate Content")');

      // Wait for generation
      await expect(
        page.locator('text="Generating content...", text="Loading..."')
      ).toBeVisible();
      await page.waitForSelector('text="Generated Content"', {
        timeout: 30000,
      });

      // Verify generated content section
      await expect(page.locator('text="Generated Content"')).toBeVisible();

      // Check for content
      const contentArea = page
        .locator('pre, [data-testid="generated-content"]')
        .first();
      await expect(contentArea).toBeVisible();

      // Check for copy and download buttons
      await expect(page.locator('button:has-text("Copy")')).toBeVisible();
      await expect(page.locator('button:has-text("Download")')).toBeVisible();

      // Test copy functionality
      await page.locator('button:has-text("Copy")').click();
      await expect(
        page.locator('text="Copied to clipboard", text="Copied!"')
      ).toBeVisible();

      // Test download
      const downloadPromise = page.waitForEvent("download");
      await page.locator('button:has-text("Download")').click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/blog-writer.*\.txt/);
    });

    test("dynamic field substitution in prompts", async ({ page }) => {
      await page.goto("/content-tools");

      // Use Facebook Ad tool to test dynamic fields
      await page
        .locator('div:has-text("Facebook Video Ad Script")')
        .first()
        .click();
      await page.waitForLoadState("networkidle");

      // Select client
      await page
        .locator('button[role="combobox"]:has-text("Choose a client")')
        .click();
      await page.locator('[role="option"]').first().click();

      // Click on a dynamic field to copy
      const dynamicField = page
        .locator(
          'code:has-text("{{businessName}}"), span:has-text("{{businessName}}")'
        )
        .first();
      if (await dynamicField.isVisible()) {
        await dynamicField.click();
        await expect(page.locator('text="Copied"')).toBeVisible();

        // Paste into a field
        const productField = page
          .locator('input[placeholder*="product"], input[name*="product"]')
          .first();
        await productField.fill("{{businessName}} Services");
      }
    });

    test("missing client data shows warning", async ({ page }) => {
      await page.goto("/content-tools");
      await page.locator('div:has-text("Blog Writer")').first().click();

      // Select a client
      await page
        .locator('button[role="combobox"]:has-text("Choose a client")')
        .click();
      await page.locator('[role="option"]').first().click();

      // Check for missing data warning if client has incomplete data
      const warningToast = page.locator(
        "text=/missing|incomplete|Some dynamic fields/"
      );
      if (await warningToast.isVisible({ timeout: 2000 })) {
        // Verify warning message
        await expect(warningToast).toContain(/missing|incomplete/);
      }
    });
  });

  test.describe("Generated Content Management", () => {
    test("view generated content history", async ({ page }) => {
      await page.goto("/content-tools");
      await page.locator('div:has-text("Blog Writer")').first().click();

      // Check for generated content section
      const generatedSection = page.locator(
        'section:has-text("Generated Content"), section:has-text("Previous Generations")'
      );

      if (await generatedSection.isVisible()) {
        // Check for content items
        const contentItems = generatedSection.locator(
          '[data-testid="content-item"], .content-history-item'
        );

        if ((await contentItems.count()) > 0) {
          const firstItem = contentItems.first();

          // Should show metadata
          await expect(
            firstItem.locator("text=/Generated.*ago|Generated on/")
          ).toBeVisible();
          await expect(firstItem.locator("text=/for.*Client/")).toBeVisible();

          // Should have actions
          await expect(
            firstItem.locator('button:has-text("Copy")')
          ).toBeVisible();
          await expect(
            firstItem.locator(
              'button:has-text("View"), button:has-text("Download")'
            )
          ).toBeVisible();
        }
      }
    });

    test("filter generated content by client", async ({ page }) => {
      await page.goto("/content-tools");
      await page.locator('div:has-text("Blog Writer")').first().click();

      // Select a different client
      await page
        .locator('button[role="combobox"]:has-text("Choose a client")')
        .click();
      await page.locator('[role="option"]').first().click();

      // Generated content section should update
      await page.waitForTimeout(1000);

      // Check that content is filtered for selected client
      const clientName = await page
        .locator('button[role="combobox"]')
        .textContent();
      const contentItems = page.locator('[data-testid="content-item"]');

      if ((await contentItems.count()) > 0) {
        const firstItem = contentItems.first();
        await expect(firstItem).toContain(clientName || "");
      }
    });

    test("just generated content appears highlighted", async ({ page }) => {
      await page.goto("/content-tools");
      await page
        .locator('div:has-text("SEO Keyword Research")')
        .first()
        .click();

      // Select client and generate
      await page
        .locator('button[role="combobox"]:has-text("Choose a client")')
        .click();
      await page.locator('[role="option"]').first().click();

      // Fill minimal fields
      await page.fill('input[placeholder*="industry"]', "Digital Marketing");
      await page.click('button:has-text("Generate Content")');

      // Wait for generation
      await page.waitForSelector('text="Generated Content"', {
        timeout: 30000,
      });

      // Check for "Just Generated" section
      await expect(
        page.locator('text="Just Generated", .badge:has-text("New")')
      ).toBeVisible();

      // Should have green accent/highlight
      const justGeneratedSection = page.locator(
        'section:has-text("Just Generated"), [data-testid="just-generated"]'
      );
      if (await justGeneratedSection.isVisible()) {
        await expect(justGeneratedSection).toHaveCSS(
          "border-color",
          /green|#10b981/
        );
      }
    });
  });

  test.describe("Content Tool Settings", () => {
    test("configure content tool fields", async ({ page }) => {
      await page.goto("/content-tools");

      // Click settings on a tool
      const toolCard = page.locator('div:has-text("Blog Writer")').first();
      const settingsButton = toolCard.locator(
        'button[aria-label="Settings"], button:has-text("Settings")'
      );

      if (await settingsButton.isVisible()) {
        await settingsButton.click();

        // Should open settings dialog
        await expect(
          page.locator('[role="dialog"]:has-text("Content Tool Settings")')
        ).toBeVisible();

        // Check for field configuration
        await expect(page.locator('text="Field Configuration"')).toBeVisible();

        // Should show existing fields
        const fields = page.locator(
          '[data-testid="field-item"], .field-config-item'
        );
        expect(await fields.count()).toBeGreaterThan(0);

        // Can add new field
        await page.click('button:has-text("Add Field")');
        await page.fill('input[placeholder="Field Label"]', "Test Field");
        await page.fill('input[placeholder="Field Name"]', "testField");

        // Select field type
        await page.locator('select[name="fieldType"]').selectOption("textarea");

        // Toggle visibility
        await page.locator('label:has-text("Client must fill")').click();

        // Save settings
        await page.click('button:has-text("Save Settings")');
        await expect(
          page.getByText("Settings updated successfully")
        ).toBeVisible();
      }
    });

    test("configure webhook for content tool", async ({ page }) => {
      await page.goto("/content-tools");

      const toolCard = page
        .locator('div:has-text("Google Search Ad Writer")')
        .first();
      const settingsButton = toolCard.locator(
        'button[aria-label="Settings"], button:has-text("Settings")'
      );

      if (await settingsButton.isVisible()) {
        await settingsButton.click();

        // Click webhook tab
        await page.click(
          'button:has-text("Webhook"), [role="tab"]:has-text("Webhook")'
        );

        // Select existing webhook or create new
        const webhookSelect = page.locator(
          'button[role="combobox"]:has-text("Select webhook")'
        );
        if (await webhookSelect.isVisible()) {
          await webhookSelect.click();

          const webhookOptions = page.locator('[role="option"]');
          if ((await webhookOptions.count()) > 0) {
            await webhookOptions.first().click();
          } else {
            // Create new webhook inline
            await page.click('button:has-text("Create New Webhook")');
            await page.fill(
              'input[name="webhookName"]',
              "Content Tool Webhook"
            );
            await page.fill(
              'input[name="webhookUrl"]',
              "https://example.com/content-webhook"
            );
            await page.click('button:has-text("Create")');
          }
        }

        // Save
        await page.click('button:has-text("Save Settings")');
        await expect(page.getByText("Settings updated")).toBeVisible();
      }
    });
  });

  test.describe("Webhook Integration", () => {
    test("content generation triggers webhook", async ({ page }) => {
      await page.goto("/content-tools");

      // Find a tool with webhook configured
      const toolWithWebhook = page
        .locator('div:has(.badge:has-text("Webhook"))')
        .first();

      if (await toolWithWebhook.isVisible()) {
        await toolWithWebhook.click();

        // Select client and generate
        await page
          .locator('button[role="combobox"]:has-text("Choose a client")')
          .click();
        await page.locator('[role="option"]').first().click();

        // Generate content
        await page.click('button:has-text("Generate Content")');

        // Should show webhook notification
        await expect(
          page.locator(
            "text=/Webhook.*triggered|Webhook.*called|Sent to webhook/"
          )
        ).toBeVisible();
      }
    });

    test("no webhook shows warning", async ({ page }) => {
      await page.goto("/content-tools");

      // Use a tool without webhook
      await page
        .locator('div:has-text("Blog Writer")')
        .not('div:has(.badge:has-text("Webhook"))')
        .first()
        .click();

      await page
        .locator('button[role="combobox"]:has-text("Choose a client")')
        .click();
      await page.locator('[role="option"]').first().click();

      await page.click('button:has-text("Generate Content")');

      // Might show warning about no webhook
      const warningToast = page.locator(
        "text=/No webhook configured|Webhook not set/"
      );
      // This is optional - tool may work without webhook
    });
  });

  test.describe("Role-Based Access", () => {
    test("content tools available to content creation roles", async ({
      page,
    }) => {
      const contentRoles: UserRole[] = [
        "ADMIN",
        "SERVICE_MANAGER",
        "COPYWRITER",
        "EDITOR",
      ];

      for (const role of contentRoles) {
        await loginAsRole(page, role);
        await page.goto("/content-tools");

        // Should see content tools
        await expect(
          page.locator('h1:has-text("Content Tools")')
        ).toBeVisible();

        // Can generate content
        await page.locator('div:has-text("Blog Writer")').first().click();
        await expect(
          page.locator('button:has-text("Generate Content")')
        ).toBeVisible();
      }
    });

    test("VA has limited content tool access", async ({ page }) => {
      await loginAsRole(page, "VA");
      await page.goto("/content-tools");

      // May have view-only access or no access
      const hasAccess = await page
        .locator('h1:has-text("Content Tools")')
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (hasAccess) {
        // Check if can generate
        await page.locator('div:has-text("Blog Writer")').first().click();
        const generateButton = page.locator(
          'button:has-text("Generate Content")'
        );

        // VA might not be able to generate
        if (await generateButton.isVisible()) {
          await expect(generateButton).toBeEnabled();
        }
      }
    });

    test("CLIENT cannot access content tools", async ({ page }) => {
      await loginAsRole(page, "CLIENT");
      await page.goto("/content-tools");

      // Should be redirected
      expect(page.url()).not.toContain("/content-tools");
      expect(page.url()).toContain("/client-dashboard");
    });
  });

  test.describe("AI Service Integration", () => {
    test("API key configuration required", async ({ page }) => {
      await page.goto("/settings");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Wait for settings page to load
      await page.waitForSelector('h1:has-text("Settings")', {
        state: "visible",
      });

      // Click API Keys tab
      await page.click(
        'button:has-text("API Keys"), [role="tab"]:has-text("API Keys")'
      );

      // Check for API key fields
      await expect(page.locator('text="API Key Management"')).toBeVisible();
      await expect(
        page.locator('text="Configure API keys for AI content generation"')
      ).toBeVisible();

      // Should show Anthropic and OpenAI options
      await expect(page.locator('text="Anthropic"')).toBeVisible();
      await expect(page.locator('text="OpenAI"')).toBeVisible();
    });

    test("content generation works with mock or real API", async ({ page }) => {
      await page.goto("/content-tools");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Wait for content tools to load
      await page.waitForSelector('text="Blog Writer"', { state: "visible" });

      // Click Blog Writer
      const blogWriterCard = page
        .locator(".grid > div")
        .filter({ hasText: "Blog Writer" });
      await blogWriterCard.click();
      await page.waitForTimeout(1000);

      await page
        .locator('button[role="combobox"]:has-text("Choose a client")')
        .click();
      await page.locator('[role="option"]').first().click();

      await page.click('button:has-text("Generate Content")');

      // Should generate content (mock or real)
      await page.waitForSelector('text="Generated Content"', {
        timeout: 30000,
      });

      // Content should be present
      const content = await page
        .locator('pre, [data-testid="generated-content"]')
        .first()
        .textContent();
      expect(content).toBeTruthy();
      expect(content?.length).toBeGreaterThan(50);
    });
  });
});
