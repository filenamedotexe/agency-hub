import { test, expect } from "@playwright/test";

// Use the auth bypass for testing
test.use({
  storageState: {
    cookies: [],
    origins: [
      {
        origin: "http://localhost:3001",
        localStorage: [
          {
            name: "auth-bypass",
            value: "test-user",
          },
        ],
      },
    ],
  },
});

test.describe("Phase 3: Forms Feature", () => {
  test("should navigate to forms page", async ({ page }) => {
    await page.goto("/forms");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    // Verify we're on the forms page
    expect(page.url()).toContain("/forms");

    // Check for key elements
    await expect(page.locator("h1").filter({ hasText: "Forms" })).toBeVisible();
  });

  test("should show form creation UI", async ({ page }) => {
    await page.goto("/forms");
    await page.waitForLoadState("networkidle");

    // Click create form button
    await page.locator("button").filter({ hasText: "Create Form" }).click();
    await page.waitForLoadState("domcontentloaded");

    // Verify we're on the new form page
    expect(page.url()).toContain("/forms/new");
  });

  test("should create a new form", async ({ page }) => {
    await page.goto("/forms/new");
    await page.waitForLoadState("networkidle");

    // Fill form details
    await page.fill('input[id="name"]', "Test Contact Form");
    await page.fill(
      'textarea[id="description"]',
      "A test form for collecting contact information"
    );

    // Add a text field
    await page.locator("button").filter({ hasText: "Text" }).first().click();

    // Wait for the field to be added
    await page.waitForTimeout(500);

    // Update field properties
    const firstFieldLabel = page.locator('input[id*="label"]').first();
    await firstFieldLabel.clear();
    await firstFieldLabel.fill("Full Name");

    // Save the form
    await page
      .locator("button")
      .filter({ hasText: "Create Form" })
      .last()
      .click();

    // Wait for navigation
    await page.waitForTimeout(1000);

    // Verify we're redirected to form detail page
    expect(page.url()).toMatch(/\/forms\/[a-zA-Z0-9-]+$/);
  });
});

test.describe("Phase 3: Webhooks/Automations", () => {
  test("should navigate to automations page", async ({ page }) => {
    await page.goto("/automations");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/automations");
    await expect(
      page.locator("h1").filter({ hasText: "Automations" })
    ).toBeVisible();
  });

  test("should show webhook creation form", async ({ page }) => {
    await page.goto("/automations");
    await page.waitForLoadState("networkidle");

    // Click add webhook button
    await page.locator("button").filter({ hasText: "Add Webhook" }).click();

    // Wait for form to appear
    await page.waitForTimeout(500);

    // Check if form is visible
    await expect(
      page.locator("h2").filter({ hasText: "Webhook" })
    ).toBeVisible();
  });

  test("should create a general webhook", async ({ page }) => {
    await page.goto("/automations");
    await page.waitForLoadState("networkidle");

    // Click add webhook
    await page.locator("button").filter({ hasText: "Add Webhook" }).click();
    await page.waitForTimeout(500);

    // Fill webhook details
    await page.fill('input[id="name"]', "Test Webhook");
    await page.fill('input[id="url"]', "https://example.com/webhook");

    // Save webhook
    await page.locator("button").filter({ hasText: "Create" }).last().click();

    // Wait for save
    await page.waitForTimeout(1000);

    // Verify webhook appears in list
    await expect(page.locator("text=Test Webhook")).toBeVisible();
  });
});

test.describe("Phase 3: Requests Feature", () => {
  test("should navigate to requests page", async ({ page }) => {
    await page.goto("/requests");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/requests");
    await expect(
      page.locator("h1").filter({ hasText: "Requests" })
    ).toBeVisible();
  });

  test("should switch between kanban and list views", async ({ page }) => {
    await page.goto("/requests");
    await page.waitForLoadState("networkidle");

    // Check kanban view is default
    await expect(page.locator("text=To Do")).toBeVisible();
    await expect(page.locator("text=In Progress")).toBeVisible();
    await expect(page.locator("text=Done")).toBeVisible();

    // Switch to list view
    await page.locator("button").filter({ hasText: "List" }).click();
    await page.waitForTimeout(500);

    // Check table headers are visible
    await expect(
      page.locator("th").filter({ hasText: "Description" })
    ).toBeVisible();
  });

  test("should show new request dialog", async ({ page }) => {
    await page.goto("/requests");
    await page.waitForLoadState("networkidle");

    // Click new request button
    await page.locator("button").filter({ hasText: "New Request" }).click();
    await page.waitForTimeout(500);

    // Check dialog is visible
    await expect(
      page.locator("h2").filter({ hasText: "Create New Request" })
    ).toBeVisible();
  });
});

test.describe("Phase 3: Content Tools", () => {
  test("should navigate to content tools page", async ({ page }) => {
    await page.goto("/content-tools");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/content-tools");
    await expect(
      page.locator("h1").filter({ hasText: "Content Tools" })
    ).toBeVisible();
  });

  test("should display all content tools", async ({ page }) => {
    await page.goto("/content-tools");
    await page.waitForLoadState("networkidle");

    // Check for all tool types
    await expect(page.locator("text=Blog Writer")).toBeVisible();
    await expect(page.locator("text=Facebook Video Ad")).toBeVisible();
    await expect(page.locator("text=Facebook Image Ad")).toBeVisible();
    await expect(page.locator("text=Google Search Ad Writer")).toBeVisible();
    await expect(page.locator("text=SEO Keyword Research")).toBeVisible();
  });

  test("should open content generator when tool is clicked", async ({
    page,
  }) => {
    await page.goto("/content-tools");
    await page.waitForLoadState("networkidle");

    // Click on Blog Writer tool
    await page.locator("h3").filter({ hasText: "Blog Writer" }).click();
    await page.waitForTimeout(500);

    // Check generator UI is visible
    await expect(
      page.locator("h2").filter({ hasText: "Blog Writer" })
    ).toBeVisible();
    await expect(page.locator("text=Configuration")).toBeVisible();
  });
});

test.describe("Phase 3: Settings", () => {
  test("should navigate to settings page", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/settings");
    await expect(
      page.locator("h1").filter({ hasText: "Settings" })
    ).toBeVisible();
  });

  test("should show all settings tabs", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Check all tabs are present
    await expect(
      page.locator("button").filter({ hasText: "Account" })
    ).toBeVisible();
    await expect(
      page.locator("button").filter({ hasText: "API Keys" })
    ).toBeVisible();
    await expect(
      page.locator("button").filter({ hasText: "Team Management" })
    ).toBeVisible();
  });

  test("should switch to API Keys tab", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click API Keys tab
    await page.locator("button").filter({ hasText: "API Keys" }).click();
    await page.waitForTimeout(500);

    // Check API key inputs are visible
    await expect(
      page.locator("label").filter({ hasText: "Anthropic API Key" })
    ).toBeVisible();
    await expect(
      page.locator("label").filter({ hasText: "OpenAI API Key" })
    ).toBeVisible();
  });

  test("should switch to Team Management tab", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click Team Management tab
    await page.locator("button").filter({ hasText: "Team Management" }).click();
    await page.waitForTimeout(500);

    // Check add team member button is visible
    await expect(
      page.locator("button").filter({ hasText: "Add Team Member" })
    ).toBeVisible();
  });

  test("should show add team member dialog", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Navigate to team management
    await page.locator("button").filter({ hasText: "Team Management" }).click();
    await page.waitForTimeout(500);

    // Click add team member
    await page.locator("button").filter({ hasText: "Add Team Member" }).click();
    await page.waitForTimeout(500);

    // Check dialog is visible
    await expect(
      page.locator("h2").filter({ hasText: "Add Team Member" })
    ).toBeVisible();
    await expect(
      page.locator("label").filter({ hasText: "Name" })
    ).toBeVisible();
    await expect(
      page.locator("label").filter({ hasText: "Email" })
    ).toBeVisible();
    await expect(
      page.locator("label").filter({ hasText: "Role" })
    ).toBeVisible();
  });
});

test.describe("Phase 3: Integration Tests", () => {
  test("should verify all Phase 3 pages are accessible", async ({ page }) => {
    const phase3Pages = [
      "/forms",
      "/automations",
      "/requests",
      "/content-tools",
      "/settings",
    ];

    for (const pagePath of phase3Pages) {
      await page.goto(pagePath);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForLoadState("networkidle");

      // Verify page loaded successfully
      expect(page.url()).toContain(pagePath);

      // Basic check that page has content
      const mainContent = await page.locator("main").textContent();
      expect(mainContent).toBeTruthy();
    }
  });

  test("should have proper navigation between Phase 3 features", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to Forms
    await page.locator("a").filter({ hasText: "Forms" }).click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/forms");

    // Navigate to Automations
    await page.locator("a").filter({ hasText: "Automations" }).click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/automations");

    // Navigate to Requests
    await page.locator("a").filter({ hasText: "Requests" }).click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/requests");

    // Navigate to Content Tools
    await page.locator("a").filter({ hasText: "Content Tools" }).click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/content-tools");

    // Navigate to Settings
    await page.locator("a").filter({ hasText: "Settings" }).click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/settings");
  });
});
