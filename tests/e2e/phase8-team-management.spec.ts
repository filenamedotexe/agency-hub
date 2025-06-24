import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers/role-auth";

test.describe("Phase 8: Team Management", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("E2E: Add/remove team members with roles", async ({ page }) => {
    // Navigate to settings
    await page.goto("/settings");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    // Click on Team Members tab
    await page.locator('button:has-text("Team Members")').click();

    // Wait for team section to load
    await page.waitForSelector('text="Team Members"', { state: "visible" });

    // Count existing team members
    const initialCount = await page
      .locator('[data-testid="team-member-row"]')
      .count();

    // Add a new team member
    await page.locator('button:has-text("Add Team Member")').click();

    // Wait for dialog
    await page.waitForSelector('[role="dialog"]', { state: "visible" });

    // Fill in team member details
    const testEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', testEmail);

    // Select role
    await page.locator('button[role="combobox"]').click();
    await page.locator('[role="option"]:has-text("Copywriter")').click();

    // Save
    await page.locator('button:has-text("Add Member")').click();

    // Verify success
    await expect(
      page.locator('text="Team member added successfully"')
    ).toBeVisible();

    // Verify the team member appears in the list
    await expect(page.locator(`text="${testEmail}"`)).toBeVisible();
    await expect(page.locator('[data-testid="team-member-row"]')).toHaveCount(
      initialCount + 1
    );

    // Test role update
    await page
      .locator(
        `[data-testid="team-member-row"]:has-text("${testEmail}") button[aria-label="Edit"]`
      )
      .click();

    // Wait for edit dialog
    await page.waitForSelector('[role="dialog"]:has-text("Edit Team Member")', {
      state: "visible",
    });

    // Change role
    await page.locator('button[role="combobox"]').click();
    await page.locator('[role="option"]:has-text("Editor")').click();

    // Update
    await page.locator('button:has-text("Update Role")').click();

    // Verify update success
    await expect(
      page.locator('text="Team member updated successfully"')
    ).toBeVisible();

    // Verify role changed
    await expect(
      page.locator(
        `[data-testid="team-member-row"]:has-text("${testEmail}") [data-testid="role-badge"]:has-text("Editor")`
      )
    ).toBeVisible();

    // Test deletion
    await page
      .locator(
        `[data-testid="team-member-row"]:has-text("${testEmail}") button[aria-label="Delete"]`
      )
      .click();

    // Confirm deletion
    await page.locator('button:has-text("Remove Member")').click();

    // Verify deletion success
    await expect(
      page.locator('text="Team member removed successfully"')
    ).toBeVisible();

    // Verify team member is gone
    await expect(page.locator(`text="${testEmail}"`)).not.toBeVisible();
    await expect(page.locator('[data-testid="team-member-row"]')).toHaveCount(
      initialCount
    );
  });

  test("E2E: Role-based permissions", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click on Team Members tab
    await page.locator('button:has-text("Team Members")').click();

    // Verify different roles are available
    await page.locator('button:has-text("Add Team Member")').click();
    await page.waitForSelector('[role="dialog"]', { state: "visible" });

    // Open role selector
    await page.locator('button[role="combobox"]').click();

    // Verify all roles are present
    const roles = [
      "Admin",
      "Service Manager",
      "Copywriter",
      "Editor",
      "Virtual Assistant",
    ];
    for (const role of roles) {
      await expect(
        page.locator(`[role="option"]:has-text("${role}")`)
      ).toBeVisible();
    }

    // Close dialog
    await page.keyboard.press("Escape");
  });
});
