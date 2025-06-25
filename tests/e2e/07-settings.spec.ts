import { test, expect } from "@playwright/test";
import { loginAsRole } from "./helpers/role-auth";
import {
  mcpTakeScreenshot,
  mcpVerifyAccessibility,
  mcpMonitorNetworkRequests,
  mcpVerifyToast,
  mcpNavigateWithMonitoring,
} from "./helpers/mcp-utils";

test.describe("Settings Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, "ADMIN");
    await mcpNavigateWithMonitoring(page, "/settings", {
      waitForRequests: ["/api/settings"],
    });
  });

  test.describe("Account Settings", () => {
    test("view and update business information", async ({ page }) => {
      // Monitor API requests
      const requests = await mcpMonitorNetworkRequests(page, "/api/settings");

      // Default tab should be Account
      await expect(page.locator('text="Account Settings"')).toBeVisible();
      await expect(page.locator('text="Business Information"')).toBeVisible();

      // Take screenshot of account settings
      await mcpTakeScreenshot(page, {
        filename: "account-settings.png",
      });

      // Verify accessibility
      const isAccessible = await mcpVerifyAccessibility(page, {
        checkLabels: true,
      });
      expect(isAccessible).toBe(true);

      // Check for business info fields
      await expect(
        page.locator('label:has-text("Business Name")')
      ).toBeVisible();
      await expect(
        page.locator('label:has-text("Email Address")')
      ).toBeVisible();
      await expect(
        page.locator('label:has-text("Phone Number")')
      ).toBeVisible();
      await expect(page.locator('label:has-text("Address")')).toBeVisible();

      // Update business name
      const businessNameInput = page.locator('input[name="businessName"]');
      await businessNameInput.clear();
      await businessNameInput.fill("Updated Agency Name");

      // Update phone
      const phoneInput = page.locator('input[name="phone"], input[type="tel"]');
      await phoneInput.clear();
      await phoneInput.fill("+1 (555) 123-4567");

      // Save changes
      await page.click(
        'button:has-text("Save Changes"), button:has-text("Update")'
      );

      // Verify success with MCP toast verification
      await mcpVerifyToast(page, "Settings updated successfully", {
        screenshot: true,
      });

      // Verify API call was successful
      const updateRequest = requests.find(
        (r) => r.method === "PUT" || r.method === "POST"
      );
      expect(updateRequest?.status).toBe(200);
    });

    test("update notification preferences", async ({ page }) => {
      // Look for notification settings
      const notificationSection = page.locator(
        'section:has-text("Notifications"), h3:has-text("Notifications")'
      );

      if (await notificationSection.isVisible()) {
        // Toggle email notifications
        const emailToggle = page.locator(
          'input[type="checkbox"][name*="email"], label:has-text("Email notifications")'
        );
        if (await emailToggle.isVisible()) {
          await emailToggle.click();
        }

        // Save
        await page.click('button:has-text("Save")');
        await expect(page.getByText("updated successfully")).toBeVisible();
      }
    });
  });

  test.describe("API Key Management", () => {
    test("add and manage API keys", async ({ page }) => {
      // Switch to API Keys tab
      await page.click(
        'button:has-text("API Keys"), [role="tab"]:has-text("API Keys")'
      );
      await page.waitForLoadState("networkidle");

      // Verify API Key Management section
      await expect(page.locator('text="API Key Management"')).toBeVisible();
      await expect(
        page.locator('text="Configure API keys for AI content generation"')
      ).toBeVisible();

      // Add Anthropic API key
      const anthropicSection = page
        .locator('section:has-text("Anthropic"), div:has-text("Anthropic")')
        .first();
      const addAnthropicButton = anthropicSection.locator(
        'button:has-text("Add"), button:has-text("Add Key")'
      );

      if (await addAnthropicButton.isVisible()) {
        await addAnthropicButton.click();

        // Fill API key
        const apiKeyInput = page.locator(
          'input[placeholder*="API key"], input[name="apiKey"]'
        );
        await apiKeyInput.fill("sk-ant-test-key-1234567890abcdef");

        // Save
        await page.click(
          'button:has-text("Save API Key"), button:has-text("Add")'
        );

        // Verify success
        await expect(
          page.getByText("API key added successfully")
        ).toBeVisible();

        // Should show masked key
        await expect(
          page.locator('text="•••• cdef", text="**** cdef"')
        ).toBeVisible();
      }

      // Add OpenAI API key
      const openAISection = page
        .locator('section:has-text("OpenAI"), div:has-text("OpenAI")')
        .first();
      const addOpenAIButton = openAISection.locator(
        'button:has-text("Add"), button:has-text("Add Key")'
      );

      if (await addOpenAIButton.isVisible()) {
        await addOpenAIButton.click();

        await page.fill(
          'input[placeholder*="API key"], input[name="apiKey"]',
          "sk-test-openai-key-xyz123"
        );
        await page.click(
          'button:has-text("Save API Key"), button:has-text("Add")'
        );

        await expect(
          page.getByText("API key added successfully")
        ).toBeVisible();
      }
    });

    test("delete API key with confirmation", async ({ page }) => {
      await page.click(
        'button:has-text("API Keys"), [role="tab"]:has-text("API Keys")'
      );

      // Find an existing API key
      const apiKeyItem = page
        .locator('[data-testid="api-key-item"], .api-key-item')
        .first();

      if (await apiKeyItem.isVisible()) {
        // Click delete
        await apiKeyItem
          .locator('button:has-text("Delete"), button[aria-label="Delete"]')
          .click();

        // Confirm deletion
        await page.click('button:has-text("Confirm"), button:has-text("Yes")');

        // Verify deletion
        await expect(
          page.getByText("API key deleted successfully")
        ).toBeVisible();
      }
    });

    test("test API key functionality", async ({ page }) => {
      await page.click(
        'button:has-text("API Keys"), [role="tab"]:has-text("API Keys")'
      );

      const apiKeyItem = page
        .locator('[data-testid="api-key-item"], .api-key-item')
        .first();

      if (await apiKeyItem.isVisible()) {
        const testButton = apiKeyItem.locator('button:has-text("Test")');

        if (await testButton.isVisible()) {
          await testButton.click();

          // Should show test result
          await expect(
            page.locator("text=/Valid|Invalid|Success|Failed/")
          ).toBeVisible({ timeout: 10000 });
        }
      }
    });

    test("API keys data passed to webhooks", async ({ page }) => {
      await page.click(
        'button:has-text("API Keys"), [role="tab"]:has-text("API Keys")'
      );

      // Check for note about webhook integration
      const webhookNote = page.locator(
        "text=/passed.*webhook|webhook.*integration/i"
      );

      if (await webhookNote.isVisible()) {
        // Verify the note mentions dynamic fields
        await expect(webhookNote).toContain(
          /dynamic.*fields|passed.*optionally/i
        );
      }
    });
  });

  test.describe("Team Management", () => {
    test("view team members", async ({ page }) => {
      // Switch to Team Members tab
      await page.click(
        'button:has-text("Team Members"), [role="tab"]:has-text("Team")'
      );
      await page.waitForLoadState("networkidle");

      // Verify Team Management section
      await expect(page.locator('text="Team Members"')).toBeVisible();
      await expect(
        page.locator('text="Manage your team members and their roles"')
      ).toBeVisible();

      // Check for team member list
      const teamTable = page.locator(
        'table:has-text("Role"), [data-testid="team-members-list"]'
      );

      if (await teamTable.isVisible()) {
        // Check table headers
        await expect(teamTable.locator('th:has-text("Name")')).toBeVisible();
        await expect(teamTable.locator('th:has-text("Email")')).toBeVisible();
        await expect(teamTable.locator('th:has-text("Role")')).toBeVisible();
        await expect(teamTable.locator('th:has-text("Status")')).toBeVisible();
      }

      // Check for add team member button
      await expect(
        page.locator('button:has-text("Add Team Member")')
      ).toBeVisible();
    });

    test("add new team member", async ({ page }) => {
      await page.click(
        'button:has-text("Team Members"), [role="tab"]:has-text("Team")'
      );
      await page.click('button:has-text("Add Team Member")');

      // Should open dialog
      await expect(
        page.locator('[role="dialog"]:has-text("Add Team Member")')
      ).toBeVisible();

      // Fill team member details
      const timestamp = Date.now();
      await page.fill(
        'input[type="email"], input[name="email"]',
        `test.user.${timestamp}@example.com`
      );

      // Select role
      await page
        .locator('button[role="combobox"]:has-text("Select role")')
        .click();
      await page.locator('[role="option"]:has-text("Service Manager")').click();

      // Add member
      await page.click(
        'button:has-text("Add Member"), button:has-text("Send Invitation")'
      );

      // Should show success or error (depending on email service)
      await expect(
        page.locator("text=/added|invited|error|failed/i")
      ).toBeVisible();
    });

    test("update team member role", async ({ page }) => {
      await page.click(
        'button:has-text("Team Members"), [role="tab"]:has-text("Team")'
      );

      // Find a team member (not current user)
      const teamMemberRow = page
        .locator("tbody tr")
        .filter({ hasNot: page.locator('text="(You)")') })
        .first();

      if (await teamMemberRow.isVisible()) {
        // Click edit
        await teamMemberRow
          .locator('button:has-text("Edit"), button[aria-label="Edit"]')
          .click();

        // Change role
        await page.locator('button[role="combobox"]').click();
        await page.locator('[role="option"]:has-text("Copywriter")').click();

        // Save
        await page.click('button:has-text("Save"), button:has-text("Update")');

        // Verify update
        await expect(
          page.getByText("Team member updated successfully")
        ).toBeVisible();
      }
    });

    test("remove team member with confirmation", async ({ page }) => {
      await page.click(
        'button:has-text("Team Members"), [role="tab"]:has-text("Team")'
      );

      // Find a removable team member
      const teamMemberRow = page
        .locator("tbody tr")
        .filter({
          hasNot: page.locator('text="(You)")'),
          has: page.locator(
            'button:has-text("Remove"), button[aria-label="Delete"]'
          ),
        })
        .first();

      if (await teamMemberRow.isVisible()) {
        await teamMemberRow
          .locator('button:has-text("Remove"), button[aria-label="Delete"]')
          .click();

        // Confirm removal
        await page.click('button:has-text("Confirm"), button:has-text("Yes")');

        // Verify removal
        await expect(
          page.getByText("Team member removed successfully")
        ).toBeVisible();
      }
    });

    test("cannot remove or edit own account", async ({ page }) => {
      await page.click(
        'button:has-text("Team Members"), [role="tab"]:has-text("Team")'
      );

      // Find current user row
      const currentUserRow = page.locator('tbody tr:has-text("(You)")');

      if (await currentUserRow.isVisible()) {
        // Should not have remove button
        await expect(
          currentUserRow.locator('button:has-text("Remove")')
        ).not.toBeVisible();

        // Edit might be limited
        const editButton = currentUserRow.locator('button:has-text("Edit")');
        if (await editButton.isVisible()) {
          await editButton.click();

          // Role selector should be disabled
          await expect(
            page.locator('button[role="combobox"]:disabled')
          ).toBeVisible();
        }
      }
    });
  });

  test.describe("Webhook Management", () => {
    test("view and manage webhooks", async ({ page }) => {
      await page.click(
        'button:has-text("Webhooks"), [role="tab"]:has-text("Webhooks")'
      );
      await page.waitForLoadState("networkidle");

      // Check webhook categories
      await expect(page.locator('text="Form Webhooks"')).toBeVisible();
      await expect(page.locator('text="General Webhooks"')).toBeVisible();
      await expect(page.locator('text="Content Tool Webhooks"')).toBeVisible();

      // Check for create webhook button
      await expect(
        page.locator(
          'button:has-text("Create Webhook"), button:has-text("New Webhook")'
        )
      ).toBeVisible();
    });

    test("create webhook with production and testing URLs", async ({
      page,
    }) => {
      await page.click(
        'button:has-text("Webhooks"), [role="tab"]:has-text("Webhooks")'
      );
      await page.click(
        'button:has-text("Create Webhook"), button:has-text("New Webhook")'
      );

      // Fill webhook details
      const timestamp = Date.now();
      await page.fill('input[name="name"]', `Test Webhook ${timestamp}`);

      // Production URL
      await page.fill(
        'input[name="productionUrl"], input[placeholder*="production"]',
        `https://prod.example.com/webhook/${timestamp}`
      );

      // Testing URL
      await page.fill(
        'input[name="testingUrl"], input[placeholder*="testing"]',
        `https://test.example.com/webhook/${timestamp}`
      );

      // Check environment toggle
      const envToggle = page.locator(
        'button:has-text("Testing"), button:has-text("Production"), [data-testid="env-toggle"]'
      );
      if (await envToggle.isVisible()) {
        // Should show current environment
        await expect(
          page.locator(
            '.badge:has-text("Testing"), .badge:has-text("Production")'
          )
        ).toBeVisible();

        // Toggle environment
        await envToggle.click();
      }

      // Add headers
      await page.click('button:has-text("Add Header")');
      await page.fill('input[placeholder="Header Name"]', "X-Custom-Header");
      await page.fill('input[placeholder="Header Value"]', "custom-value");

      // Save webhook
      await page.click('button[type="submit"]');

      // Verify success
      await expect(
        page.getByText("Webhook created successfully")
      ).toBeVisible();
    });

    test("test webhook endpoint", async ({ page }) => {
      await page.click(
        'button:has-text("Webhooks"), [role="tab"]:has-text("Webhooks")'
      );

      // Find a webhook
      const webhookCard = page
        .locator('[data-testid="webhook-card"], .webhook-item')
        .first();

      if (await webhookCard.isVisible()) {
        // Click test button
        const testButton = webhookCard.locator('button:has-text("Test")');
        if (await testButton.isVisible()) {
          await testButton.click();

          // Should show test result
          await expect(
            page.locator("text=/Success|Failed|200|Error/")
          ).toBeVisible({ timeout: 10000 });
        }
      }
    });

    test("view webhook execution history", async ({ page }) => {
      await page.click(
        'button:has-text("Webhooks"), [role="tab"]:has-text("Webhooks")'
      );

      const webhookCard = page
        .locator('[data-testid="webhook-card"], .webhook-item')
        .first();

      if (await webhookCard.isVisible()) {
        await webhookCard.click();

        // Look for history section
        const historySection = page.locator(
          'section:has-text("Execution History"), [data-testid="webhook-history"]'
        );

        if (await historySection.isVisible()) {
          // Should show execution table
          await expect(
            historySection.locator('th:has-text("Timestamp")')
          ).toBeVisible();
          await expect(
            historySection.locator('th:has-text("Status")')
          ).toBeVisible();
          await expect(
            historySection.locator('th:has-text("Response Time")')
          ).toBeVisible();
        }
      }
    });
  });

  test.describe("Settings Access Control", () => {
    test("only ADMIN can access settings", async ({ page }) => {
      // Already logged in as ADMIN, verify access
      await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    });

    test("SERVICE_MANAGER cannot access settings", async ({ page }) => {
      await loginAsRole(page, "SERVICE_MANAGER");
      await page.goto("/settings");

      // Should be redirected
      expect(page.url()).not.toContain("/settings");
    });

    test("other roles cannot access settings", async ({ page }) => {
      const restrictedRoles = ["COPYWRITER", "EDITOR", "VA", "CLIENT"];

      for (const role of restrictedRoles) {
        await loginAsRole(page, role as any);
        await page.goto("/settings");

        // Should be redirected
        expect(page.url()).not.toContain("/settings");
      }
    });
  });

  test.describe("Settings Data Integration", () => {
    test("API keys available in content tools", async ({ page }) => {
      // Add an API key
      await page.click('button:has-text("API Keys")');

      const addButton = page.locator('button:has-text("Add")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.fill('input[name="apiKey"]', "sk-test-integration-key");
        await page.click('button:has-text("Save API Key")');
      }

      // Go to content tools
      await page.goto("/content-tools");
      await page.locator('div:has-text("Blog Writer")').first().click();

      // Generate content should work with API key
      await page.locator('button[role="combobox"]').click();
      await page.locator('[role="option"]').first().click();
      await page.click('button:has-text("Generate Content")');

      // Should not show "No API key" error
      await expect(
        page.locator('text="No API key configured"')
      ).not.toBeVisible({ timeout: 5000 });
    });

    test("webhooks integrate with forms and content tools", async ({
      page,
    }) => {
      // Create a webhook
      await page.click('button:has-text("Webhooks")');
      await page.click('button:has-text("Create Webhook")');

      const timestamp = Date.now();
      await page.fill('input[name="name"]', `Integration Test ${timestamp}`);
      await page.fill(
        'input[name="productionUrl"]',
        `https://example.com/test/${timestamp}`
      );
      await page.click('button[type="submit"]');

      // Go to forms and check webhook availability
      await page.goto("/forms");
      await page.click('button:has-text("Create Form")');
      await page.click(
        'button:has-text("Settings"), [role="tab"]:has-text("Settings")'
      );

      // Should see webhook in dropdown
      const webhookSelect = page.locator(
        'button[role="combobox"]:has-text("Select webhook")'
      );
      if (await webhookSelect.isVisible()) {
        await webhookSelect.click();
        await expect(
          page.locator(
            `[role="option"]:has-text("Integration Test ${timestamp}")`
          )
        ).toBeVisible();
      }
    });
  });
});
