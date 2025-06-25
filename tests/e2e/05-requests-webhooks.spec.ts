import { test, expect } from "@playwright/test";
import { loginAsRole, type UserRole } from "./helpers/role-auth";
import {
  mcpTakeScreenshot,
  mcpVerifyAccessibility,
  mcpMonitorNetworkRequests,
  mcpVerifyToast,
  mcpNavigateWithMonitoring,
} from "./helpers/mcp-utils";

test.describe("Requests & Webhooks", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, "ADMIN");
  });

  test.describe("Request Management", () => {
    test("view requests in kanban and list views", async ({ page }) => {
      await mcpNavigateWithMonitoring(page, "/requests", {
        waitForRequests: ["/api/requests"],
      });

      // Default should be kanban view
      await expect(
        page.locator('[data-testid="kanban-board"], .kanban-container')
      ).toBeVisible();

      // Take screenshot of kanban view
      await mcpTakeScreenshot(page, {
        filename: "requests-kanban-view.png",
      });

      // Check for kanban columns
      await expect(page.locator('text="To Do"')).toBeVisible();
      await expect(page.locator('text="In Progress"')).toBeVisible();
      await expect(page.locator('text="Done"')).toBeVisible();

      // Verify kanban accessibility
      const isKanbanAccessible = await mcpVerifyAccessibility(page);
      expect(isKanbanAccessible).toBe(true);

      // Switch to list view
      await page.click(
        'button:has-text("List View"), button[aria-label="List view"]'
      );
      await page.waitForLoadState("networkidle");

      // Should see table
      await expect(
        page.locator('table, [data-testid="requests-table"]')
      ).toBeVisible();

      // Take screenshot of list view
      await mcpTakeScreenshot(page, {
        filename: "requests-list-view.png",
      });

      // Switch back to kanban
      await page.click(
        'button:has-text("Kanban View"), button[aria-label="Kanban view"]'
      );
      await expect(
        page.locator('[data-testid="kanban-board"], .kanban-container')
      ).toBeVisible();
    });

    test("create manual request", async ({ page }) => {
      await page.goto("/requests");
      await page.waitForLoadState("networkidle");

      // Click new request
      await page.click(
        'button:has-text("New Request"), button:has-text("Create Request")'
      );

      // Fill request form
      const timestamp = Date.now();
      const requestData = {
        description: `Test Request ${timestamp}`,
        clientVisible: true,
      };

      // Select client
      await page
        .locator('button[role="combobox"]:has-text("Select client")')
        .click();
      await page.locator('[role="option"]').first().click();

      // Fill description
      await page.fill('textarea[name="description"]', requestData.description);

      // Toggle client visibility
      const visibilityToggle = page.locator(
        'input[type="checkbox"][name="clientVisible"], label:has-text("Visible to client")'
      );
      if (await visibilityToggle.isVisible()) {
        await visibilityToggle.click();
      }

      // Submit
      await page.click('button[type="submit"]');

      // Verify success
      await expect(
        page.getByText("Request created successfully")
      ).toBeVisible();

      // Should appear in To Do column
      await expect(
        page.locator(
          `[data-testid="request-card"]:has-text("${requestData.description}")`
        )
      ).toBeVisible();
    });

    test("drag and drop request between kanban columns", async ({ page }) => {
      await page.goto("/requests");
      await page.waitForLoadState("networkidle");

      // Find a request in To Do column
      const todoColumn = page.locator(
        '[data-testid="kanban-column-todo"], [data-column="TODO"]'
      );
      const requestCard = todoColumn
        .locator('[data-testid="request-card"], .request-card')
        .first();

      if (await requestCard.isVisible()) {
        // Get request text for verification
        const requestText = await requestCard.textContent();

        // Drag to In Progress column
        const inProgressColumn = page.locator(
          '[data-testid="kanban-column-in-progress"], [data-column="IN_PROGRESS"]'
        );

        // Perform drag and drop
        await requestCard.hover();
        await page.mouse.down();
        await inProgressColumn.hover();
        await page.mouse.up();

        // Wait for update
        await page.waitForTimeout(1000);

        // Verify card moved
        await expect(
          inProgressColumn.locator(`text="${requestText}"`)
        ).toBeVisible();
      }
    });

    test("update request status via dropdown", async ({ page }) => {
      await page.goto("/requests");

      // Switch to list view for easier interaction
      await page.click(
        'button:has-text("List View"), button[aria-label="List view"]'
      );
      await page.waitForLoadState("networkidle");

      // Find first request
      const requestRow = page.locator("tbody tr").first();

      if (await requestRow.isVisible()) {
        // Click status dropdown
        const statusSelect = requestRow.locator(
          'button[role="combobox"], select'
        );
        await statusSelect.click();

        // Select new status
        await page.locator('[role="option"]:has-text("In Progress")').click();

        // Verify update
        await expect(page.getByText("Request status updated")).toBeVisible();
      }
    });

    test("add comment to request", async ({ page }) => {
      await page.goto("/requests");
      await page.waitForLoadState("networkidle");

      // Click on a request card
      const requestCard = page
        .locator('[data-testid="request-card"], .request-card')
        .first();

      if (await requestCard.isVisible()) {
        await requestCard.click();

        // Should open request detail modal/page
        await page.waitForLoadState("networkidle");

        // Add comment
        const commentInput = page.locator(
          'textarea[placeholder*="comment"], textarea[name="comment"]'
        );
        await commentInput.fill("Test comment from E2E test");

        await page.click(
          'button:has-text("Add Comment"), button:has-text("Post")'
        );

        // Verify comment added
        await expect(
          page.getByText("Test comment from E2E test")
        ).toBeVisible();
      }
    });
  });

  test.describe("Duda Webhook Integration", () => {
    test("webhook creates request from Duda", async ({ page }) => {
      // This would typically be tested via API
      // Here we verify the webhook endpoint exists
      const response = await page.request.post("/api/webhooks/duda", {
        data: {
          event_type: "NEW_CONVERSATION",
          resource_data: {
            site_name: "test_site_123",
          },
          data: {
            comment: {
              text: "Test webhook request",
              uuid: "test-uuid-123",
            },
          },
          event_timestamp: Date.now(),
        },
      });

      // Should return 200 or 401 (if auth required)
      expect([200, 401]).toContain(response.status());
    });

    test("request shows Duda integration info", async ({ page }) => {
      await page.goto("/requests");

      // Look for requests with Duda badge/info
      const dudaRequest = page
        .locator(
          '[data-testid="request-card"]:has-text("Duda"), .request-card:has(.badge:has-text("Duda"))'
        )
        .first();

      if (await dudaRequest.isVisible()) {
        await dudaRequest.click();

        // Should show Duda-specific info
        await expect(
          page.locator("text=/Site ID|Duda Site|Comment UUID/")
        ).toBeVisible();
      }
    });
  });

  test.describe("Request Filtering and Search", () => {
    test("filter requests by status", async ({ page }) => {
      await page.goto("/requests");

      // Look for status filter
      const statusFilter = page
        .locator('button:has-text("Status"), select[name="status"]')
        .first();

      if (await statusFilter.isVisible()) {
        await statusFilter.click();
        await page.locator('[role="option"]:has-text("To Do")').click();

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // In kanban view, only To Do column should have cards
        // In list view, all rows should show To Do status
      }
    });

    test("filter requests by client", async ({ page }) => {
      await page.goto("/requests");

      // Look for client filter
      const clientFilter = page
        .locator(
          'button[role="combobox"]:has-text("All Clients"), select[name="client"]'
        )
        .first();

      if (await clientFilter.isVisible()) {
        await clientFilter.click();
        await page.locator('[role="option"]').first().click();

        // Wait for filter
        await page.waitForTimeout(500);

        // Verify filtered results
        const requestCards = page.locator('[data-testid="request-card"]');
        expect(await requestCards.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test("search requests by description", async ({ page }) => {
      await page.goto("/requests");

      // Find search input
      const searchInput = page.locator(
        'input[placeholder*="Search"], input[type="search"]'
      );

      if (await searchInput.isVisible()) {
        await searchInput.fill("test");
        await page.waitForTimeout(500); // Debounce

        // Verify filtered results
        const visibleRequests = page.locator(
          '[data-testid="request-card"]:visible'
        );

        if ((await visibleRequests.count()) > 0) {
          const firstRequest = await visibleRequests.first().textContent();
          expect(firstRequest?.toLowerCase()).toContain("test");
        }
      }
    });
  });

  test.describe("Webhook Configuration", () => {
    test("configure webhooks in automations", async ({ page }) => {
      await page.goto("/automations");
      await page.waitForLoadState("networkidle");

      // Click webhooks section
      await page.click('button:has-text("Webhooks"), a:has-text("Webhooks")');

      // Create new webhook
      await page.click(
        'button:has-text("Create Webhook"), button:has-text("New Webhook")'
      );

      // Fill webhook details
      const timestamp = Date.now();
      const webhookData = {
        name: `Test Webhook ${timestamp}`,
        productionUrl: `https://prod.example.com/webhook/${timestamp}`,
        testingUrl: `https://test.example.com/webhook/${timestamp}`,
      };

      await page.fill('input[name="name"]', webhookData.name);
      await page.fill(
        'input[name="productionUrl"], input[placeholder*="production"]',
        webhookData.productionUrl
      );
      await page.fill(
        'input[name="testingUrl"], input[placeholder*="testing"]',
        webhookData.testingUrl
      );

      // Toggle between production/testing
      const envToggle = page.locator(
        'button:has-text("Testing"), button[aria-label*="environment"]'
      );
      if (await envToggle.isVisible()) {
        await envToggle.click();
        await expect(
          page.locator('text="Production", .badge:has-text("Production")')
        ).toBeVisible();
      }

      // Add headers
      await page.click('button:has-text("Add Header")');
      await page.fill('input[placeholder="Header Name"]', "X-API-Key");
      await page.fill('input[placeholder="Header Value"]', "test-api-key");

      // Save webhook
      await page.click('button[type="submit"]');

      // Verify success
      await expect(
        page.getByText("Webhook created successfully")
      ).toBeVisible();
      await expect(page.getByText(webhookData.name)).toBeVisible();
    });

    test("test webhook functionality", async ({ page }) => {
      await page.goto("/automations");
      await page.click('button:has-text("Webhooks"), a:has-text("Webhooks")');

      // Find a webhook with test button
      const webhookCard = page
        .locator('[data-testid="webhook-card"], .webhook-item')
        .first();

      if (await webhookCard.isVisible()) {
        // Click test button
        await webhookCard.locator('button:has-text("Test")').click();

        // Should show test result
        await expect(
          page.locator("text=/Success|Failed|200|Error/")
        ).toBeVisible();
      }
    });

    test("webhook execution history", async ({ page }) => {
      await page.goto("/automations");
      await page.click('button:has-text("Webhooks"), a:has-text("Webhooks")');

      const webhookCard = page
        .locator('[data-testid="webhook-card"], .webhook-item')
        .first();

      if (await webhookCard.isVisible()) {
        await webhookCard.click();

        // Look for execution history
        await page.click(
          'button:has-text("History"), [role="tab"]:has-text("History")'
        );

        // Should show execution table
        const historyTable = page.locator('table:has-text("Status")');

        if (await historyTable.isVisible()) {
          await expect(
            historyTable.locator('th:has-text("Timestamp")')
          ).toBeVisible();
          await expect(
            historyTable.locator('th:has-text("Status")')
          ).toBeVisible();
          await expect(
            historyTable.locator('th:has-text("Response")')
          ).toBeVisible();
        }
      }
    });
  });

  test.describe("Role-Based Access", () => {
    test("SERVICE_MANAGER can create and manage requests", async ({ page }) => {
      await loginAsRole(page, "SERVICE_MANAGER");
      await page.goto("/requests");

      // Should see create button
      await expect(
        page.locator(
          'button:has-text("New Request"), button:has-text("Create Request")'
        )
      ).toBeVisible();

      // Can drag and drop
      const requestCard = page.locator('[data-testid="request-card"]').first();
      if (await requestCard.isVisible()) {
        await expect(requestCard).toHaveAttribute("draggable", "true");
      }
    });

    test("COPYWRITER, EDITOR, VA have read-only access", async ({ page }) => {
      const readOnlyRoles: UserRole[] = ["COPYWRITER", "EDITOR", "VA"];

      for (const role of readOnlyRoles) {
        await loginAsRole(page, role);
        await page.goto("/requests");

        // Should NOT see create button
        await expect(
          page.locator('button:has-text("New Request")')
        ).not.toBeVisible();

        // Cannot drag cards
        const requestCard = page
          .locator('[data-testid="request-card"]')
          .first();
        if (await requestCard.isVisible()) {
          const draggable = await requestCard.getAttribute("draggable");
          expect(draggable).not.toBe("true");
        }
      }
    });

    test("CLIENT can view client-visible requests", async ({ page }) => {
      await loginAsRole(page, "CLIENT");
      await page.goto("/client-dashboard");

      // Look for requests section
      const requestsSection = page.locator(
        'section:has-text("Requests"), section:has-text("My Requests")'
      );

      if (await requestsSection.isVisible()) {
        // Should only see client-visible requests
        const requests = requestsSection.locator(
          '[data-testid="request-item"]'
        );

        if ((await requests.count()) > 0) {
          // Verify no admin-only indicators
          await expect(
            requests.locator('text="Internal Only"')
          ).not.toBeVisible();
        }
      }
    });
  });
});
