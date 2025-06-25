import { test, expect } from "@playwright/test";
import { loginAsRole, type UserRole } from "./helpers/role-auth";
import {
  mcpTakeScreenshot,
  mcpVerifyAccessibility,
  mcpMonitorNetworkRequests,
  mcpNavigateWithMonitoring,
  mcpVerifyToast,
} from "./helpers/mcp-utils";

test.describe("Client Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, "ADMIN");
  });

  test.describe("Client CRUD Operations", () => {
    test("create new client with all fields", async ({ page }) => {
      // Monitor API requests
      const requests = await mcpMonitorNetworkRequests(page, "/api/clients");

      await mcpNavigateWithMonitoring(page, "/clients", {
        waitForRequests: ["/api/clients"],
      });

      // Take screenshot of client list
      await mcpTakeScreenshot(page, {
        filename: "client-list-before-create.png",
      });

      // Click new client button
      await page.click('a[href="/clients/new"]');
      await page.waitForURL("/clients/new");

      // Verify form accessibility
      const isAccessible = await mcpVerifyAccessibility(page, {
        checkLabels: true,
      });
      expect(isAccessible).toBe(true);

      // Fill form
      const timestamp = Date.now();
      const clientData = {
        name: `Test Client ${timestamp}`,
        businessName: `Test Business ${timestamp}`,
        address: "123 Test Street, Test City, TS 12345",
        dudaSiteId: `test_site_${timestamp}`,
      };

      await page.fill('input[name="name"]', clientData.name);
      await page.fill('input[name="businessName"]', clientData.businessName);
      await page.fill('textarea[name="address"]', clientData.address);
      await page.fill('input[name="dudaSiteId"]', clientData.dudaSiteId);

      // Take screenshot of filled form
      await mcpTakeScreenshot(page, {
        filename: "client-form-filled.png",
      });

      // Submit
      await page.click('button[type="submit"]');
      await page.waitForURL("/clients");

      // Verify success with MCP toast verification
      await mcpVerifyToast(page, "Client created successfully", {
        screenshot: true,
      });

      // Verify API call was successful
      const createRequest = requests.find((r) => r.method === "POST");
      expect(createRequest?.status).toBe(200);

      await expect(page.getByText(clientData.name)).toBeVisible();
      await expect(page.getByText(clientData.businessName)).toBeVisible();
    });

    test("view client details shows all information", async ({ page }) => {
      await page.goto("/clients");
      await page.waitForLoadState("networkidle");

      // Click on first client
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();
      await page.waitForLoadState("networkidle");

      // Verify client detail page elements
      await expect(
        page.locator("h1").filter({ hasText: /Client Details|.*Client$/ })
      ).toBeVisible();

      // Check for key sections
      await expect(page.locator('text="Business Information"')).toBeVisible();
      await expect(page.locator('text="Services"')).toBeVisible();
      await expect(page.locator('text="Activity Log"')).toBeVisible();

      // Check for dynamic fields section
      await expect(
        page.locator('text="Form Responses", text="Dynamic Fields"').first()
      ).toBeVisible();
    });

    test("edit client information", async ({ page }) => {
      await page.goto("/clients");
      await page.waitForLoadState("networkidle");

      // Click first client
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();
      await page.waitForLoadState("networkidle");

      // Click edit button
      await page.click('button:has-text("Edit")');

      // Update fields
      const updatedName = `Updated Client ${Date.now()}`;
      await page.fill('input[name="name"]', updatedName);

      // Save
      await page.click('button[type="submit"]');

      // Verify update
      await expect(page.getByText("Client updated successfully")).toBeVisible();
      await expect(page.getByText(updatedName)).toBeVisible();
    });

    test("delete client with confirmation", async ({ page }) => {
      // First create a client to delete
      await page.goto("/clients/new");
      const timestamp = Date.now();
      await page.fill('input[name="name"]', `Delete Test ${timestamp}`);
      await page.fill(
        'input[name="businessName"]',
        `Delete Business ${timestamp}`
      );
      await page.click('button[type="submit"]');
      await page.waitForURL("/clients");

      // Find and click the client
      await page.getByText(`Delete Test ${timestamp}`).click();
      await page.waitForLoadState("networkidle");

      // Delete
      await page.click('button:has-text("Delete")');

      // Confirm deletion
      await page.click('button:has-text("Confirm"), button:has-text("Yes")');

      // Verify deletion
      await expect(page.getByText("Client deleted successfully")).toBeVisible();
      await expect(
        page.getByText(`Delete Test ${timestamp}`)
      ).not.toBeVisible();
    });
  });

  test.describe("Client Search and Filtering", () => {
    test("search clients by name", async ({ page }) => {
      await page.goto("/clients");
      await page.waitForLoadState("networkidle");

      // Use search input
      const searchInput = page.locator('input[placeholder="Search"]');
      await searchInput.fill("Test");
      await page.waitForTimeout(500); // Debounce

      // Verify filtered results
      const rows = page.locator("tbody tr");
      const count = await rows.count();

      if (count > 0) {
        // Check that visible rows contain search term
        const firstRowText = await rows.first().textContent();
        expect(firstRowText?.toLowerCase()).toContain("test");
      }
    });

    test("pagination works correctly", async ({ page }) => {
      await page.goto("/clients");
      await page.waitForLoadState("networkidle");

      // Check if pagination exists
      const pagination = page.locator(
        '[aria-label="Pagination"], nav:has(button[aria-label*="page"])'
      );

      if (await pagination.isVisible()) {
        // Test next page
        const nextButton = page.locator('button[aria-label="Go to next page"]');
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          await page.waitForLoadState("networkidle");

          // Verify URL or content changed
          expect(page.url()).toMatch(/page=2|p=2/);
        }
      }
    });
  });

  test.describe("Dynamic Fields and Form Responses", () => {
    test("client detail page shows dynamic fields", async ({ page }) => {
      await page.goto("/clients");
      await page.waitForLoadState("networkidle");

      // Click first client
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();
      await page.waitForLoadState("networkidle");

      // Look for dynamic fields section
      const dynamicFieldsSection = page
        .locator(
          'section:has-text("Form Responses"), section:has-text("Dynamic Fields")'
        )
        .first();
      await expect(dynamicFieldsSection).toBeVisible();

      // Check for client data fields
      await expect(page.locator('text="Client Data"')).toBeVisible();

      // Check for dynamic field display format {{fieldName}}
      const dynamicFields = page.locator("text=/\\{\\{\\w+\\}\\}/");
      const fieldCount = await dynamicFields.count();

      if (fieldCount > 0) {
        // Verify fields are clickable (click-to-copy feature)
        const firstField = dynamicFields.first();
        await expect(firstField).toHaveCSS("cursor", "pointer");
      }
    });

    test("dynamic fields are click-to-copy", async ({ page }) => {
      await page.goto("/clients");
      await page.waitForLoadState("networkidle");

      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();
      await page.waitForLoadState("networkidle");

      // Find a dynamic field
      const dynamicField = page.locator("text=/\\{\\{\\w+\\}\\}/").first();

      if (await dynamicField.isVisible()) {
        // Click to copy
        await dynamicField.click();

        // Should show toast notification
        await expect(page.locator('text="Copied to clipboard"')).toBeVisible();
      }
    });
  });

  test.describe("Generated Content Section", () => {
    test("client detail shows generated content", async ({ page }) => {
      await page.goto("/clients");
      await page.waitForLoadState("networkidle");

      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();
      await page.waitForLoadState("networkidle");

      // Check for generated content section
      const generatedContent = page.locator('text="Generated Content"');

      if (await generatedContent.isVisible()) {
        // Check for content tools used
        await expect(
          page.locator("text=/Blog Writer|Facebook.*Ad|Google.*Ad|SEO Keyword/")
        ).toBeVisible();

        // Check for generation metadata
        const contentItems = page.locator(
          '[data-testid="generated-content-item"]'
        );
        if ((await contentItems.count()) > 0) {
          const firstItem = contentItems.first();
          await expect(
            firstItem.locator("text=/Generated.*ago|Generated on/")
          ).toBeVisible();
        }
      }
    });
  });

  test.describe("Role-Based Access", () => {
    test("SERVICE_MANAGER can create and edit clients", async ({ page }) => {
      await loginAsRole(page, "SERVICE_MANAGER");
      await page.goto("/clients");

      // Should see create button
      await expect(page.locator('a[href="/clients/new"]')).toBeVisible();

      // Can access new client page
      await page.goto("/clients/new");
      expect(page.url()).toContain("/clients/new");
    });

    test("COPYWRITER, EDITOR, VA have read-only access", async ({ page }) => {
      const readOnlyRoles: UserRole[] = ["COPYWRITER", "EDITOR", "VA"];

      for (const role of readOnlyRoles) {
        await loginAsRole(page, role);
        await page.goto("/clients");

        // Should NOT see create button
        await expect(page.locator('a[href="/clients/new"]')).not.toBeVisible();

        // Can view client details
        const clientRow = page.locator("tbody tr").first();
        if (await clientRow.isVisible()) {
          await clientRow.click();
          await page.waitForLoadState("networkidle");

          // Should NOT see edit/delete buttons
          await expect(
            page.locator('button:has-text("Edit")')
          ).not.toBeVisible();
          await expect(
            page.locator('button:has-text("Delete")')
          ).not.toBeVisible();
        }
      }
    });

    test("CLIENT role cannot access clients module", async ({ page }) => {
      await loginAsRole(page, "CLIENT");
      await page.goto("/clients");

      // Should be redirected
      expect(page.url()).not.toContain("/clients");
      expect(page.url()).toContain("/client-dashboard");
    });
  });

  test.describe("Activity Log", () => {
    test("activity log shows client actions", async ({ page }) => {
      await page.goto("/clients");
      await page.waitForLoadState("networkidle");

      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();
      await page.waitForLoadState("networkidle");

      // Check for activity log section
      const activityLog = page.locator('section:has-text("Activity Log")');
      await expect(activityLog).toBeVisible();

      // Check for activity entries
      const activities = activityLog.locator(
        '[data-testid="activity-item"], .activity-item'
      );

      if ((await activities.count()) > 0) {
        const firstActivity = activities.first();
        // Should show user, action, and timestamp
        await expect(
          firstActivity.locator("text=/created|updated|viewed/")
        ).toBeVisible();
        await expect(firstActivity.locator("text=/ago|at/")).toBeVisible();
      }
    });
  });
});
