import { test, expect } from "@playwright/test";
import {
  loginAsRole,
  TEST_USERS,
  roleCanAccess,
  waitForAuth,
  logout,
} from "./helpers/role-auth";

// Configure test to run with headed browser and debugging
test.use({
  headless: false,
  slowMo: 1000, // Slow down by 1 second for better debugging visibility
  video: "on-first-retry",
  screenshot: "only-on-failure",
  trace: "on-first-retry",
});

type UserRole =
  | "ADMIN"
  | "SERVICE_MANAGER"
  | "COPYWRITER"
  | "EDITOR"
  | "VA"
  | "CLIENT";

// Helper to wait for page navigation and ensure stability
async function navigateAndWait(page, path: string) {
  console.log(`🧭 Navigating to: ${path}`);
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000); // Additional stability wait
}

// Helper to verify server is running before tests
async function verifyServerRunning() {
  try {
    const response = await fetch("http://localhost:3001");
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    console.log("✅ Server verification successful");
  } catch (error) {
    throw new Error(`❌ Server not running on port 3001: ${error.message}`);
  }
}

// Helper to clear browser state
async function clearBrowserState(page) {
  await page.context().clearCookies();
  await page.context().clearPermissions();
  try {
    await page.evaluate(() => {
      if (typeof localStorage !== "undefined") {
        localStorage.clear();
      }
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.clear();
      }
    });
  } catch (error) {
    // Ignore localStorage errors - not critical for test
    console.log("Storage clear skipped:", error.message);
  }
}

test.describe("🚀 PHASE 6: FORM BUILDER TESTING", () => {
  test.beforeAll(async () => {
    console.log("🔍 Verifying server is running...");
    await verifyServerRunning();
  });

  test.beforeEach(async ({ page }) => {
    console.log("🧹 Clearing browser state...");
    await clearBrowserState(page);
  });

  test.describe("📋 Forms Page Access for Authorized Roles", () => {
    const authorizedRoles: UserRole[] = ["ADMIN", "SERVICE_MANAGER"];

    for (const role of authorizedRoles) {
      test(`${role} can access forms page and see form list`, async ({
        page,
      }) => {
        console.log(`🧪 Testing ${role} forms page access`);

        // Login
        await loginAsRole(page, role);
        await waitForAuth(page);

        // Navigate to forms page
        await navigateAndWait(page, "/forms");

        // Verify we're on the forms page
        expect(page.url()).toContain("/forms");

        // Take screenshot for debugging
        await page.screenshot({
          path: `screenshots/phase6-${role.toLowerCase()}-forms-page.png`,
        });

        // Verify forms page content loads
        await expect(page.locator("h1")).toContainText("Forms", {
          timeout: 10000,
        });

        console.log(`✅ ${role} forms page access completed`);
      });
    }
  });

  test.describe("📝 Form Builder Functionality", () => {
    test("ADMIN can create a new form with fields", async ({ page }) => {
      console.log("🧪 Testing form creation");

      // Login as admin
      await loginAsRole(page, "ADMIN");
      await waitForAuth(page);

      // Navigate to create new form
      await navigateAndWait(page, "/forms/new");

      // Verify we're on the form creation page
      expect(page.url()).toContain("/forms/new");

      // Fill form name
      await page.fill('input[id="name"]', "Test Form Creation");

      // Add a text field
      await page.click("button:has-text('Text')");
      await page.waitForTimeout(500);

      // Verify field was added
      const fields = page.locator('[data-testid="sortable-field"]');
      await expect(fields).toHaveCount(1);

      // Take screenshot
      await page.screenshot({
        path: "screenshots/phase6-form-creation.png",
      });

      console.log("✅ Form creation test completed");
    });
  });
});
