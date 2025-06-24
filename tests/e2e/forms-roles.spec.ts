import { test, expect } from "@playwright/test";
import {
  loginAsRole,
  navigateWithRole,
  roleCanAccess,
  UserRole,
  TEST_USERS,
} from "./helpers/role-auth";
import { loginAndWaitForAuth, navigateToProtectedPage } from "./helpers/auth";

test.describe("Forms - Role-Based Access", () => {
  const FORMS_PATH = "/forms";

  test("Admin can access all form features", async ({ page }) => {
    // Use proper auth helper
    await loginAndWaitForAuth(page, "admin@example.com", "password123");

    // Navigate to forms with proper helper
    await navigateToProtectedPage(page, FORMS_PATH);
    expect(page.url()).toContain(FORMS_PATH);

    // Verify admin can see create button
    await expect(page.locator("button:has-text('Create Form')")).toBeVisible();

    // Verify admin can see all action buttons if forms exist
    const tableRows = page.locator("tbody tr");
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      // Check first row has all action buttons
      const firstRow = tableRows.first();
      await expect(
        firstRow.locator("button[title='View Details']")
      ).toBeVisible();
      await expect(
        firstRow.locator("button[title='Preview Form']")
      ).toBeVisible();
      await expect(firstRow.locator("button[title='Edit Form']")).toBeVisible();
      await expect(
        firstRow.locator("button[title='Delete Form']")
      ).toBeVisible();
    }
  });

  test("Service Manager can access form features", async ({ page }) => {
    // Use proper auth helper
    await loginAndWaitForAuth(page, "manager@example.com", "password123");

    // Navigate to forms with proper helper
    await navigateToProtectedPage(page, FORMS_PATH);
    expect(page.url()).toContain(FORMS_PATH);

    // Verify service manager can see create button
    await expect(page.locator("button:has-text('Create Form')")).toBeVisible();

    // Verify service manager can see action buttons
    const tableRows = page.locator("tbody tr");
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      await expect(
        firstRow.locator("button[title='View Details']")
      ).toBeVisible();
      await expect(
        firstRow.locator("button[title='Preview Form']")
      ).toBeVisible();
      await expect(firstRow.locator("button[title='Edit Form']")).toBeVisible();
    }
  });

  test("Copywriter cannot access forms page", async ({ page }) => {
    await loginAsRole(page, "COPYWRITER");

    // Try to navigate to forms - should be redirected
    await page.goto(FORMS_PATH);
    await page.waitForLoadState("domcontentloaded");

    // Should be redirected away from forms
    expect(page.url()).not.toContain(FORMS_PATH);

    // Forms menu item should not be visible
    await expect(page.locator("nav >> text='Forms'")).not.toBeVisible();
  });

  test("Editor cannot access forms page", async ({ page }) => {
    await loginAsRole(page, "EDITOR");

    // Try to navigate to forms - should be redirected
    await page.goto(FORMS_PATH);
    await page.waitForLoadState("domcontentloaded");

    // Should be redirected away from forms
    expect(page.url()).not.toContain(FORMS_PATH);

    // Forms menu item should not be visible
    await expect(page.locator("nav >> text='Forms'")).not.toBeVisible();
  });

  test("VA cannot access forms page", async ({ page }) => {
    await loginAsRole(page, "VA");

    // Try to navigate to forms - should be redirected
    await page.goto(FORMS_PATH);
    await page.waitForLoadState("domcontentloaded");

    // Should be redirected away from forms
    expect(page.url()).not.toContain(FORMS_PATH);

    // Forms menu item should not be visible
    await expect(page.locator("nav >> text='Forms'")).not.toBeVisible();
  });

  test("Client can see assigned forms but not create/edit", async ({
    page,
  }) => {
    await loginAsRole(page, "CLIENT");

    // Client has a different forms view
    await page.goto("/client-dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Client should see Forms in their menu
    const formsMenuItem = page.locator("nav >> text='Forms'").first();
    if (await formsMenuItem.isVisible()) {
      await formsMenuItem.click();
      await page.waitForLoadState("domcontentloaded");

      // Client forms page should not have create/edit buttons
      await expect(
        page.locator("button:has-text('Create Form')")
      ).not.toBeVisible();

      // Client should only see forms assigned to them
      const pageTitle = page.locator("h1");
      const titleText = await pageTitle.textContent();
      expect(titleText).toContain("Forms");

      // No admin action buttons should be visible
      await expect(page.locator("button[title='Edit Form']")).not.toBeVisible();
      await expect(
        page.locator("button[title='Delete Form']")
      ).not.toBeVisible();
    }
  });

  test("Role permissions are enforced at API level", async ({ page }) => {
    // Test API access for different roles
    const testCases: {
      role: UserRole;
      canCreate: boolean;
      canEdit: boolean;
    }[] = [
      { role: "ADMIN", canCreate: true, canEdit: true },
      { role: "SERVICE_MANAGER", canCreate: true, canEdit: true },
      { role: "COPYWRITER", canCreate: false, canEdit: false },
      { role: "EDITOR", canCreate: false, canEdit: false },
      { role: "VA", canCreate: false, canEdit: false },
      { role: "CLIENT", canCreate: false, canEdit: false },
    ];

    for (const testCase of testCases) {
      await loginAsRole(page, testCase.role);

      // Test create API access
      const createResponse = await page.request.post("/api/forms", {
        data: {
          name: "Test Form",
          schema: [
            {
              id: "field1",
              type: "text",
              label: "Test",
              name: "test",
              required: false,
            },
          ],
        },
      });

      if (testCase.canCreate) {
        expect([200, 201]).toContain(createResponse.status());
      } else {
        expect([401, 403]).toContain(createResponse.status());
      }
    }
  });
});

test.describe("Forms - Access Control Matrix", () => {
  const accessMatrix = [
    { role: "ADMIN", forms_view: true, forms_create: true, forms_edit: true },
    {
      role: "SERVICE_MANAGER",
      forms_view: true,
      forms_create: true,
      forms_edit: true,
    },
    {
      role: "COPYWRITER",
      forms_view: false,
      forms_create: false,
      forms_edit: false,
    },
    {
      role: "EDITOR",
      forms_view: false,
      forms_create: false,
      forms_edit: false,
    },
    { role: "VA", forms_view: false, forms_create: false, forms_edit: false },
    {
      role: "CLIENT",
      forms_view: false,
      forms_create: false,
      forms_edit: false,
      forms_respond: true,
    },
  ];

  for (const access of accessMatrix) {
    test(`${access.role} has correct form permissions`, async () => {
      // Verify permission matrix matches implementation
      expect(roleCanAccess(access.role as UserRole, "forms_view")).toBe(
        access.forms_view
      );
      expect(roleCanAccess(access.role as UserRole, "forms_create")).toBe(
        access.forms_create
      );
      expect(roleCanAccess(access.role as UserRole, "forms_edit")).toBe(
        access.forms_edit
      );

      if ("forms_respond" in access) {
        expect(roleCanAccess(access.role as UserRole, "forms_respond")).toBe(
          access.forms_respond
        );
      }
    });
  }
});
