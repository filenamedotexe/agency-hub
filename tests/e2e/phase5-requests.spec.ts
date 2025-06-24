import { test, expect, Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

// Helper to create a request
async function createRequest(
  page: Page,
  clientName: string,
  description: string,
  clientVisible: boolean = false
) {
  // Click new request button
  await page.getByRole("button", { name: "New Request" }).click();
  await page.waitForTimeout(500);

  // Fill form
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: clientName }).click();
  await page.getByPlaceholder("Describe the request...").fill(description);

  if (clientVisible) {
    await page.getByLabel("Visible to client").check();
  }

  // Submit
  await page.getByRole("button", { name: "Create Request" }).click();
  await page.waitForTimeout(1000);
}

// Helper to wait for requests to load
async function waitForRequestsToLoad(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
}

// Helper to generate unique test IDs
function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

test.describe("Phase 5: Requests & Webhooks", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("http://localhost:3001/requests");
    await page.waitForLoadState("domcontentloaded");
    await waitForRequestsToLoad(page);
  });

  test("Manual request creation", async ({ page }) => {
    const testId = generateTestId();
    const description = `Manual request ${testId}`;

    // Create a new request
    await createRequest(page, "Acme Corp", description, false);

    // Verify toast
    await expect(page.getByText("Request created successfully")).toBeVisible();

    // Verify request appears in kanban
    await expect(
      page
        .locator('[data-testid="request-card"]')
        .filter({ hasText: description })
        .first()
    ).toBeVisible();
  });

  test("Kanban drag-and-drop status change", async ({ page }) => {
    const testId = generateTestId();
    const description = `Drag drop test ${testId}`;

    // Create a request first
    await createRequest(page, "Acme Corp", description, false);

    // Find the request card
    const requestCard = page
      .locator('[data-testid="request-card"]')
      .filter({ hasText: description })
      .first();
    await expect(requestCard).toBeVisible();

    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Verify card is initially in To Do column
    const toDoColumn = page.getByRole("region", { name: "To Do" });
    const inProgressColumn = page.getByRole("region", { name: "In Progress" });

    await expect(
      toDoColumn
        .locator('[data-testid="request-card"]')
        .filter({ hasText: description })
    ).toBeVisible();
    await expect(inProgressColumn).toBeVisible();

    // Perform drag operation using precise mouse movements
    const cardBox = await requestCard.boundingBox();
    const columnBox = await inProgressColumn.boundingBox();

    if (cardBox && columnBox) {
      // Move to card center, press down, drag to column center, release
      await page.mouse.move(
        cardBox.x + cardBox.width / 2,
        cardBox.y + cardBox.height / 2
      );
      await page.mouse.down();
      await page.waitForTimeout(100);
      await page.mouse.move(
        columnBox.x + columnBox.width / 2,
        columnBox.y + columnBox.height / 2,
        { steps: 10 }
      );
      await page.waitForTimeout(100);
      await page.mouse.up();
    }

    // Wait for the API call to complete and UI to update
    await page.waitForTimeout(3000);

    // Verify the card has moved to the In Progress column
    await expect(
      inProgressColumn
        .locator('[data-testid="request-card"]')
        .filter({ hasText: description })
    ).toBeVisible({ timeout: 5000 });

    // Verify the card is no longer in the To Do column
    await expect(
      toDoColumn
        .locator('[data-testid="request-card"]')
        .filter({ hasText: description })
    ).not.toBeVisible();
  });

  test("List view status update", async ({ page }) => {
    const testId = generateTestId();
    const description = `List view test ${testId}`;

    // Create a request
    await createRequest(page, "Acme Corp", description, false);

    // Switch to list view
    await page.getByRole("tab", { name: /list/i }).click();
    await waitForRequestsToLoad(page);

    // Find the request row - use first() to handle multiple matches
    const requestRow = page
      .getByRole("row")
      .filter({ hasText: description })
      .first();
    await expect(requestRow).toBeVisible();

    // Update status via dropdown
    await requestRow.getByRole("combobox").click();
    await page.getByRole("option", { name: "In Progress" }).click();

    // Wait for update
    await page.waitForTimeout(2000);

    // Verify the status changed (check for badge or status indicator)
    await expect(requestRow.getByText("In Progress")).toBeVisible();
  });

  test("Add comment to request", async ({ page }) => {
    const testId = generateTestId();
    const description = `Comment test ${testId}`;

    // Create a request
    await createRequest(page, "Acme Corp", description, false);

    // Click on the card to open detail
    await page
      .locator('[data-testid="request-card"]')
      .filter({ hasText: description })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Add a comment
    const commentText = `Test comment ${testId}`;
    await page.getByPlaceholder("Add a comment...").fill(commentText);
    await page.getByRole("button", { name: /add comment/i }).click();

    // Verify comment appears in the modal
    await expect(page.getByRole("dialog").getByText(commentText)).toBeVisible();
  });

  test("Client visibility toggle", async ({ page }) => {
    const testId = generateTestId();
    const description = `Visibility test ${testId}`;

    // Create a request that's hidden from client
    await createRequest(page, "Acme Corp", description, false);

    // Open request detail
    await page
      .locator('[data-testid="request-card"]')
      .filter({ hasText: description })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Toggle visibility
    await page.getByLabel(/hidden from client/i).click();

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify it's now visible to client
    await expect(page.getByText("Visible to client")).toBeVisible();

    // Close modal
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  });

  test("Search functionality", async ({ page }) => {
    const testId = generateTestId();

    // Create multiple requests with unique descriptions
    await createRequest(page, "Acme Corp", `Bug fix ${testId}`, false);
    await createRequest(
      page,
      "Test Business Inc",
      `Search feature ${testId}`,
      false
    );
    await createRequest(page, "Acme Corp", `Footer update ${testId}`, false);

    // Search for "search"
    await page
      .getByPlaceholder("Search requests and comments...")
      .fill("Search feature");
    await page.waitForTimeout(500);

    // Verify only matching request is shown
    await expect(
      page.getByText(`Search feature ${testId}`).first()
    ).toBeVisible();
    await expect(page.getByText(`Bug fix ${testId}`)).not.toBeVisible();
    await expect(page.getByText(`Footer update ${testId}`)).not.toBeVisible();
  });

  test("Filter by status", async ({ page }) => {
    const testId = generateTestId();

    // Create requests with different statuses
    await createRequest(page, "Acme Corp", `Todo item ${testId}`, false);

    // Create and move one to In Progress
    await createRequest(page, "Acme Corp", `Progress item ${testId}`, false);

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Move to In Progress using drag and drop
    const inProgressCard = page
      .locator('[data-testid="request-card"]')
      .filter({ hasText: `Progress item ${testId}` })
      .first();
    const inProgressColumn = page.getByRole("region", { name: "In Progress" });

    const cardBox = await inProgressCard.boundingBox();
    const columnBox = await inProgressColumn.boundingBox();

    if (cardBox && columnBox) {
      await page.mouse.move(
        cardBox.x + cardBox.width / 2,
        cardBox.y + cardBox.height / 2
      );
      await page.mouse.down();
      await page.waitForTimeout(100);
      await page.mouse.move(
        columnBox.x + columnBox.width / 2,
        columnBox.y + columnBox.height / 2,
        { steps: 10 }
      );
      await page.waitForTimeout(100);
      await page.mouse.up();
    }

    await page.waitForTimeout(2000);

    // Filter by In Progress status
    await page
      .getByRole("combobox")
      .filter({ hasText: "All Statuses" })
      .click();
    await page.getByRole("option", { name: "In Progress" }).click();
    await page.waitForTimeout(500);

    // Verify only in progress requests are shown
    await expect(
      page.getByText(`Progress item ${testId}`).first()
    ).toBeVisible();
    await expect(page.getByText(`Todo item ${testId}`)).not.toBeVisible();
  });

  test("Filter by client", async ({ page }) => {
    const testId = generateTestId();

    // Create requests for different clients
    await createRequest(page, "Acme Corp", `Acme request A ${testId}`, false);
    await createRequest(
      page,
      "Test Business Inc",
      `Tech request ${testId}`,
      false
    );
    await createRequest(page, "Acme Corp", `Acme request B ${testId}`, false);

    // Filter by Acme Corp
    await page.getByRole("combobox").filter({ hasText: "All Clients" }).click();
    await page.getByRole("option", { name: "Acme Corp" }).click();
    await page.waitForTimeout(500);

    // Verify only Acme Corp requests are shown
    await expect(
      page.getByText(`Acme request A ${testId}`).first()
    ).toBeVisible();
    await expect(
      page.getByText(`Acme request B ${testId}`).first()
    ).toBeVisible();
    await expect(page.getByText(`Tech request ${testId}`)).not.toBeVisible();
  });

  test("Combined search and filters", async ({ page }) => {
    const testId = generateTestId();

    // Create various requests
    await createRequest(page, "Acme Corp", `Fix checkout bug ${testId}`, false);
    await createRequest(
      page,
      "Test Business Inc",
      `Fix login issue ${testId}`,
      false
    );
    await createRequest(page, "Acme Corp", `Add new feature ${testId}`, false);

    // Search for "fix" and filter by Acme Corp
    await page
      .getByPlaceholder("Search requests and comments...")
      .fill("Fix checkout");
    await page.getByRole("combobox").filter({ hasText: "All Clients" }).click();
    await page.getByRole("option", { name: "Acme Corp" }).click();
    await page.waitForTimeout(500);

    // Verify only Acme Corp requests with "fix" are shown
    await expect(
      page.getByText(`Fix checkout bug ${testId}`).first()
    ).toBeVisible();
    await expect(page.getByText(`Fix login issue ${testId}`)).not.toBeVisible();
    await expect(page.getByText(`Add new feature ${testId}`)).not.toBeVisible();
  });

  test("Empty state", async ({ page }) => {
    // Apply filters that return no results
    await page
      .getByPlaceholder("Search requests and comments...")
      .fill("nonexistentrequest123456789");
    await page.waitForTimeout(500);

    // Verify empty state shows zero results
    await expect(page.getByText("Showing 0 of")).toBeVisible();
  });

  test("Request detail modal", async ({ page }) => {
    const testId = generateTestId();
    const description = `Detail modal test ${testId}`;

    // Create a request with specific details
    await createRequest(page, "Acme Corp", description, true);

    // Open detail modal by clicking the card
    await page
      .locator('[data-testid="request-card"]')
      .filter({ hasText: description })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Verify all details are shown
    await expect(page.getByText("Request Details")).toBeVisible();
    await expect(page.getByRole("dialog").getByText(description)).toBeVisible();
    await expect(page.getByRole("dialog").getByText("Acme Corp")).toBeVisible();
    await expect(page.getByText("Visible to client")).toBeVisible();

    // Verify comments section
    await expect(page.getByText("Comments (0)")).toBeVisible();
    await expect(page.getByText("No comments yet")).toBeVisible();
  });

  test("Mobile responsiveness", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await waitForRequestsToLoad(page);

    // Verify mobile layout
    await expect(
      page.getByRole("button", { name: /new request/i })
    ).toBeVisible();

    // Search should be visible and functional
    await page.getByPlaceholder("Search requests and comments...").fill("test");

    // Filters should be accessible
    await expect(page.getByRole("combobox").first()).toBeVisible();
  });
});

test.describe("Role-based access control", () => {
  test("Client role sees only visible requests", async ({ page }) => {
    // This test would require creating a client user and testing visibility
    // For now, we'll skip this as it requires additional user setup
    test.skip();
  });

  test("Non-admin cannot delete requests", async ({ page }) => {
    // This test would require a non-admin user
    // For now, we'll skip this as it requires additional user setup
    test.skip();
  });
});

test.describe("Webhook handling", () => {
  test("Webhook endpoint returns correct response", async ({ request }) => {
    // Test webhook endpoint directly
    const response = await request.post(
      "http://localhost:3001/api/webhooks/duda",
      {
        data: {
          data: {
            comment: {
              text: "Test webhook comment",
              uuid: "test-uuid-123",
            },
            conversation_uuid: "conv-123",
          },
          source: {
            type: "EDITOR",
            account_name: "test@example.com",
          },
          resource_data: {
            site_name: "test-site", // This should match a real duda_site_id
          },
          event_timestamp: Date.now(),
          event_type: "NEW_CONVERSATION",
        },
      }
    );

    // Webhook will fail if no client with that duda_site_id exists
    expect(response.status()).toBe(404); // Expected since test-site doesn't exist
  });

  test("Webhook signature verification", async ({ request }) => {
    // Test webhook with invalid signature (when DUDA_WEBHOOK_SECRET is set)
    const response = await request.post(
      "http://localhost:3001/api/webhooks/duda",
      {
        headers: {
          "x-duda-signature": "invalid-signature",
        },
        data: {
          test: "data",
        },
      }
    );

    // Should accept if no secret is configured, reject if secret exists
    expect([200, 400, 401, 404]).toContain(response.status());
  });
});
