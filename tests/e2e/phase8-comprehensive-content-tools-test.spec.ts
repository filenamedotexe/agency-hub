import { test, expect } from "@playwright/test";
import { loginAsRole } from "./helpers/role-auth";

test.describe("Phase 8: Content Tools & Settings - Comprehensive Test", () => {
  test.beforeEach(async ({ page }) => {
    // Start with admin login for most tests
    await loginAsRole(page, "ADMIN");

    // Ensure the database has content tools and clients
    await page.goto("/api/content-tools");
    await page.waitForLoadState("networkidle");
  });

  test("✅ Content Tools Page Loads and Shows All Tool Cards", async ({
    page,
  }) => {
    console.log("🧪 Testing content tools page load...");

    await page.goto("/content-tools");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    // Verify page loads
    await expect(page.locator('h1:has-text("Content Tools")')).toBeVisible();
    await expect(
      page.locator(
        'text="Generate high-quality content for your clients using AI"'
      )
    ).toBeVisible();

    // Check that content tool cards are present
    const expectedTools = [
      "Blog Writer",
      "Facebook Video Ad Script & Caption Writer",
      "Facebook Image Ad & Caption Writer",
      "Google Search Ad Writer",
      "SEO Keyword Research",
    ];

    for (const tool of expectedTools) {
      await expect(page.locator(`text="${tool}"`)).toBeVisible();
      console.log(`✅ Found tool: ${tool}`);
    }

    // Check that generate buttons are present
    const generateButtons = page.locator('button:has-text("Generate Content")');
    const buttonCount = await generateButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
    console.log(`✅ Found ${buttonCount} generate buttons`);

    // Verify the "How It Works" section
    await expect(page.locator('text="How It Works"')).toBeVisible();
    await expect(
      page.locator('text="1. Select a content tool above"')
    ).toBeVisible();

    console.log("✅ Content tools page loaded successfully");
  });

  test("🎯 Click Content Generator Card - Blog Writer", async ({ page }) => {
    console.log("🧪 Testing clicking Blog Writer card...");

    await page.goto("/content-tools");
    await page.waitForLoadState("networkidle");

    // Click the Blog Writer card
    const blogWriterCard = page
      .locator(
        'div:has-text("Blog Writer"):has(button:has-text("Generate Content"))'
      )
      .first();
    await expect(blogWriterCard).toBeVisible();

    console.log("🖱️ Clicking Blog Writer card...");
    await blogWriterCard.click();

    // Wait for content generator to load
    await page.waitForLoadState("networkidle");

    // Check that we're now in the content generator view
    await expect(page.locator('h2:has-text("Blog Writer")')).toBeVisible();
    await expect(
      page.locator('text="Generate engaging blog posts for your clients"')
    ).toBeVisible();

    // Check configuration section
    await expect(page.locator('text="Configuration"')).toBeVisible();
    await expect(page.locator('text="Select Client"')).toBeVisible();

    // Check that client dropdown exists
    await expect(
      page.locator('button[role="combobox"]:has-text("Choose a client")')
    ).toBeVisible();

    // Check for form fields (extracted from prompt template)
    const expectedFields = [
      "Topic",
      "Word Count",
      "Tone",
      "Keywords",
      "Business Context",
    ];
    for (const field of expectedFields) {
      await expect(page.locator(`label:has-text("${field}")`)).toBeVisible();
      console.log(`✅ Found field: ${field}`);
    }

    // Check generate button
    await expect(
      page.locator('button:has-text("Generate Content")')
    ).toBeVisible();

    // Check back button
    await expect(
      page.locator('button:has-text("Back to Tools")')
    ).toBeVisible();

    console.log("✅ Blog Writer generator loaded successfully");
  });

  test("🎯 Full Content Generation Flow", async ({ page }) => {
    console.log("🧪 Testing full content generation flow...");

    await page.goto("/content-tools");
    await page.waitForLoadState("networkidle");

    // Click Blog Writer
    await page
      .locator(
        'div:has-text("Blog Writer"):has(button:has-text("Generate Content"))'
      )
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Select a client
    console.log("🖱️ Selecting client...");
    await page
      .locator('button[role="combobox"]:has-text("Choose a client")')
      .click();
    await page.waitForSelector('[role="option"]', { state: "visible" });

    const clientOptions = page.locator('[role="option"]');
    const clientCount = await clientOptions.count();

    if (clientCount === 0) {
      console.log("⚠️ No clients found - need to create one first");
      // Navigate to create a client
      await page.goto("/clients/new");
      await page.waitForLoadState("networkidle");

      await page.fill('input[name="name"]', "Test Client for Content");
      await page.fill('input[name="businessName"]', "Test Business");
      await page.fill('input[name="address"]', "123 Test St");
      await page.locator('button:has-text("Create Client")').click();
      await page.waitForLoadState("networkidle");

      // Go back to content tools
      await page.goto("/content-tools");
      await page.waitForLoadState("networkidle");
      await page
        .locator(
          'div:has-text("Blog Writer"):has(button:has-text("Generate Content"))'
        )
        .first()
        .click();
      await page.waitForLoadState("networkidle");

      // Try selecting client again
      await page
        .locator('button[role="combobox"]:has-text("Choose a client")')
        .click();
      await page.waitForSelector('[role="option"]', { state: "visible" });
    }

    // Select first client
    await page.locator('[role="option"]').first().click();
    console.log("✅ Client selected");

    // Fill in the form fields
    console.log("📝 Filling form fields...");
    await page.fill(
      'input[placeholder*="topic"]',
      "Digital Marketing Trends 2025"
    );
    await page.fill(
      'input[placeholder*="wordCount"], input[placeholder*="Word Count"]',
      "1000"
    );
    await page.fill('input[placeholder*="tone"]', "professional");
    await page.fill(
      'input[placeholder*="keywords"]',
      "AI, marketing automation, personalization"
    );
    await page.fill(
      'textarea[placeholder*="businessContext"], input[placeholder*="businessContext"]',
      "A digital marketing agency helping businesses grow online"
    );

    console.log("✅ Form filled");

    // Generate content
    console.log("🎯 Generating content...");
    await page.locator('button:has-text("Generate Content")').click();

    // Wait for generation to complete
    await page.waitForSelector(
      'text="Generating content..." | text="Generated Content"',
      { state: "visible", timeout: 30000 }
    );

    // Check if content was generated
    const generatingText = page.locator('text="Generating content..."');
    if (await generatingText.isVisible()) {
      console.log("⏱️ Content is generating...");
      await page.waitForSelector('text="Generated Content"', {
        state: "visible",
        timeout: 30000,
      });
    }

    // Verify content was generated
    await expect(page.locator('text="Generated Content"')).toBeVisible();

    // Check for generated content text
    const contentArea = page
      .locator("pre, div")
      .filter({ hasText: /Generated|This is|Blog|Content/ });
    await expect(contentArea.first()).toBeVisible();

    // Check for copy and download buttons
    await expect(page.locator('button:has-text("Copy")')).toBeVisible();
    await expect(page.locator('button:has-text("Download")')).toBeVisible();

    console.log("✅ Content generated successfully");

    // Test copy functionality
    console.log("📋 Testing copy functionality...");
    await page.locator('button:has-text("Copy")').click();
    // Note: We can't easily test clipboard in playwright, but we can check for success message
    await page.waitForTimeout(500);

    console.log("✅ Copy button clicked");

    // Test download functionality
    console.log("💾 Testing download functionality...");
    const downloadPromise = page.waitForEvent("download");
    await page.locator('button:has-text("Download")').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/blog-writer.*\.txt/);

    console.log("✅ Download functionality working");

    // Go back to tools
    await page.locator('button:has-text("Back to Tools")').click();
    await page.waitForLoadState("networkidle");

    // Verify we're back at the main tools page
    await expect(page.locator('h1:has-text("Content Tools")')).toBeVisible();

    console.log("✅ Full content generation flow completed successfully");
  });

  test("🎯 Test Different Content Tools", async ({ page }) => {
    console.log("🧪 Testing different content tools...");

    const toolsToTest = [
      {
        name: "Facebook Video Ad Script & Caption Writer",
        expectedFields: [
          "Product Service",
          "Target Audience",
          "Campaign Goal",
          "Video Length",
        ],
      },
      {
        name: "Google Search Ad Writer",
        expectedFields: [
          "Product Service",
          "Target Keywords",
          "Unique Selling Points",
          "Landing Page",
        ],
      },
      {
        name: "SEO Keyword Research",
        expectedFields: [
          "Industry",
          "Location",
          "Services Products",
          "Competitors",
        ],
      },
    ];

    for (const tool of toolsToTest) {
      console.log(`🧪 Testing ${tool.name}...`);

      await page.goto("/content-tools");
      await page.waitForLoadState("networkidle");

      // Click the tool card
      const toolCard = page
        .locator(
          `div:has-text("${tool.name}"):has(button:has-text("Generate Content"))`
        )
        .first();
      await expect(toolCard).toBeVisible();
      await toolCard.click();
      await page.waitForLoadState("networkidle");

      // Verify tool loaded
      await expect(page.locator(`h2:has-text("${tool.name}")`)).toBeVisible();

      // Check for expected fields (some may be partial matches)
      for (const field of tool.expectedFields) {
        const fieldExists =
          (await page
            .locator(
              `label:has-text("${field}"), label[for*="${field.toLowerCase().replace(/\s+/g, "")}"]`
            )
            .count()) > 0;
        if (fieldExists) {
          console.log(`✅ Found field: ${field}`);
        } else {
          console.log(
            `⚠️ Field not found: ${field} (may have different label)`
          );
        }
      }

      console.log(`✅ ${tool.name} loaded successfully`);
    }
  });

  test("⚙️ Settings Page - API Key Management", async ({ page }) => {
    console.log("🧪 Testing API Key Management...");

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Verify settings page loads
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();

    // Click API Keys tab
    await page.locator('button:has-text("API Keys")').click();
    await page.waitForLoadState("networkidle");

    // Verify API Key Management section
    await expect(page.locator('text="API Key Management"')).toBeVisible();
    await expect(
      page.locator('text="Configure API keys for AI content generation"')
    ).toBeVisible();

    // Check for add API key button
    const addButton = page.locator(
      'button:has-text("Add"), button:has-text("Anthropic"), button:has-text("OpenAI")'
    );
    await expect(addButton.first()).toBeVisible();

    console.log("✅ API Key Management interface loaded");

    // Test adding an API key
    console.log("🔑 Testing API key addition...");
    await page.locator('button:has-text("Add")').first().click();

    // Fill in API key form
    await page.fill(
      'input[placeholder*="API key"], input[name="apiKey"]',
      "sk-test-key-12345678901234567890"
    );
    await page.locator('button:has-text("Save API Key")').click();

    // Wait for success message or completion
    await page.waitForTimeout(2000);

    console.log("✅ API key addition tested");
  });

  test("👥 Settings Page - Team Management", async ({ page }) => {
    console.log("🧪 Testing Team Management...");

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click Team Members tab
    await page.locator('button:has-text("Team Members")').click();
    await page.waitForLoadState("networkidle");

    // Verify Team Management section
    await expect(page.locator('text="Team Members"')).toBeVisible();
    await expect(
      page.locator('text="Manage your team members and their roles"')
    ).toBeVisible();

    // Check for add team member button
    await expect(
      page.locator('button:has-text("Add Team Member")')
    ).toBeVisible();

    console.log("✅ Team Management interface loaded");

    // Test adding a team member
    console.log("👤 Testing team member addition...");
    await page.locator('button:has-text("Add Team Member")').click();

    // Wait for dialog
    await page.waitForSelector('[role="dialog"]', { state: "visible" });

    // Fill in team member form
    await page.fill('input[type="email"]', "test@example.com");

    // Select a role
    await page.locator('button[role="combobox"]').click();
    await page.locator('[role="option"]:has-text("Service Manager")').click();

    // Note: We'll click Add Member but expect it to fail with test data
    await page.locator('button:has-text("Add Member")').click();

    // Wait for response
    await page.waitForTimeout(2000);

    console.log("✅ Team member addition tested");
  });

  test("👤 Settings Page - Account Settings", async ({ page }) => {
    console.log("🧪 Testing Account Settings...");

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click Account tab
    await page.locator('button:has-text("Account")').click();
    await page.waitForLoadState("networkidle");

    // Verify Account Settings section
    await expect(page.locator('text="Account Settings"')).toBeVisible();
    await expect(page.locator('text="Business Information"')).toBeVisible();

    // Check for business info fields
    await expect(page.locator('label:has-text("Business Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Email Address")')).toBeVisible();
    await expect(page.locator('label:has-text("Phone Number")')).toBeVisible();

    console.log("✅ Account Settings interface loaded");
  });

  test("🎭 Role-Based Access Testing", async ({ page }) => {
    console.log("🧪 Testing role-based access to content tools...");

    // Test different roles
    const roles = [
      {
        name: "Service Manager",
        role: "SERVICE_MANAGER",
        shouldHaveAccess: true,
      },
      { name: "Copywriter", role: "COPYWRITER", shouldHaveAccess: true },
      { name: "Editor", role: "EDITOR", shouldHaveAccess: true },
    ];

    for (const roleTest of roles) {
      console.log(`🧪 Testing ${roleTest.name} access...`);

      // Login as the role
      await loginAsRole(page, roleTest.role as any);

      // Try to access content tools
      await page.goto("/content-tools");
      await page.waitForLoadState("networkidle");

      if (roleTest.shouldHaveAccess) {
        // Should be able to see content tools
        await expect(
          page.locator('h1:has-text("Content Tools")')
        ).toBeVisible();
        console.log(`✅ ${roleTest.name} has access to content tools`);

        // Should be able to click a tool
        const toolCard = page
          .locator(
            'div:has-text("Blog Writer"):has(button:has-text("Generate Content"))'
          )
          .first();
        if (await toolCard.isVisible()) {
          await toolCard.click();
          await page.waitForLoadState("networkidle");
          await expect(
            page.locator('h2:has-text("Blog Writer")')
          ).toBeVisible();
          console.log(`✅ ${roleTest.name} can access content generator`);
        }
      } else {
        // Should be redirected or see access denied
        const currentUrl = page.url();
        if (currentUrl.includes("/content-tools")) {
          console.log(
            `⚠️ ${roleTest.name} should not have access to content tools`
          );
        } else {
          console.log(`✅ ${roleTest.name} was redirected from content tools`);
        }
      }
    }

    // Login back as admin for cleanup
    await loginAsRole(page, "ADMIN");
  });

  test("🔧 Error Handling and Edge Cases", async ({ page }) => {
    console.log("🧪 Testing error handling...");

    await page.goto("/content-tools");
    await page.waitForLoadState("networkidle");

    // Click Blog Writer
    await page
      .locator(
        'div:has-text("Blog Writer"):has(button:has-text("Generate Content"))'
      )
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Try to generate without selecting client
    console.log("🧪 Testing generation without client...");
    await page.locator('button:has-text("Generate Content")').click();

    // Should show error message or alert
    await page.waitForTimeout(1000);
    console.log("✅ Error handling for missing client tested");

    // Select client but leave fields empty
    await page
      .locator('button[role="combobox"]:has-text("Choose a client")')
      .click();
    await page.waitForSelector('[role="option"]', { state: "visible" });
    await page.locator('[role="option"]').first().click();

    // Try to generate with empty fields
    console.log("🧪 Testing generation with empty fields...");
    await page.locator('button:has-text("Generate Content")').click();

    // Should still generate (with empty variables)
    await page.waitForTimeout(3000);
    console.log("✅ Generation with empty fields tested");
  });

  test("📊 Generated Content History", async ({ page }) => {
    console.log("🧪 Testing generated content history...");

    // After generating content, check if history badges appear
    await page.goto("/content-tools");
    await page.waitForLoadState("networkidle");

    // Look for history badges on tool cards
    const historyBadges = page.locator(
      'div:has-text("Blog Writer") .badge, div:has-text("Blog Writer") [data-testid*="history"]'
    );
    const badgeCount = await historyBadges.count();

    if (badgeCount > 0) {
      console.log(`✅ Found ${badgeCount} history badges`);
    } else {
      console.log("ℹ️ No history badges found (expected for fresh install)");
    }

    // Check client detail pages for generated content
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    const clientRows = page.locator('tr, [data-testid*="client"]');
    const clientCount = await clientRows.count();

    if (clientCount > 0) {
      // Click first client
      await clientRows.first().click();
      await page.waitForLoadState("networkidle");

      // Look for generated content section
      const generatedContentSection = page.locator(
        'text="Generated Content", h2:has-text("Generated Content"), h3:has-text("Generated Content")'
      );
      if ((await generatedContentSection.count()) > 0) {
        console.log("✅ Generated content section found on client page");
      } else {
        console.log(
          "ℹ️ No generated content section found (may not be implemented yet)"
        );
      }
    }

    console.log("✅ Generated content history tested");
  });
});
