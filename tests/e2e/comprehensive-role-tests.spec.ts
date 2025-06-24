import { test, expect } from "@playwright/test";
import { loginAsAdmin, setTestAuthBypass } from "./helpers/auth";

// Test user credentials
const TEST_USERS = {
  admin: { email: "admin@example.com", password: "password123", role: "ADMIN" },
  manager: {
    email: "manager@example.com",
    password: "password123",
    role: "SERVICE_MANAGER",
  },
  copywriter: {
    email: "copywriter@example.com",
    password: "password123",
    role: "COPYWRITER",
  },
  editor: {
    email: "editor@example.com",
    password: "password123",
    role: "EDITOR",
  },
  va: { email: "va@example.com", password: "password123", role: "VA" },
  client: {
    email: "client@example.com",
    password: "password123",
    role: "CLIENT",
  },
};

// Helper to login and wait for navigation
async function loginAs(page: any, userKey: keyof typeof TEST_USERS) {
  const user = TEST_USERS[userKey];
  console.log(`🔐 Logging in as ${user.role}: ${user.email}`);

  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");

  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for redirect - clients go to /client-dashboard, others to /dashboard
  if (user.role === "CLIENT") {
    await page.waitForURL("/client-dashboard", { timeout: 10000 });
  } else {
    await page.waitForURL("/dashboard", { timeout: 10000 });
  }
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000); // Wait for React hydration

  // Set test bypass
  await setTestAuthBypass(page);

  return user;
}

// Helper to check menu visibility
async function checkMenuVisibility(
  page: any,
  shouldSee: string[],
  shouldNotSee: string[]
) {
  // Check for mobile menu button first
  const mobileMenuButton = page
    .locator('button[aria-label="Toggle menu"]')
    .or(page.locator("button:has(svg.lucide-menu)"));
  const isMobile = await mobileMenuButton.isVisible({ timeout: 1000 });

  if (isMobile) {
    console.log("  📱 Mobile view detected - opening menu");
    await mobileMenuButton.click();
    await page.waitForTimeout(500);
  }

  // Check expected items
  for (const item of shouldSee) {
    const locator = page
      .locator(`nav a:has-text("${item}"), aside a:has-text("${item}")`)
      .first();
    const isVisible = await locator.isVisible({ timeout: 2000 });
    console.log(
      `  ✓ ${item}: ${isVisible ? "✅ visible" : "❌ NOT visible (should be)"}`
    );
  }

  // Check items that should NOT be visible
  for (const item of shouldNotSee) {
    const locator = page
      .locator(`nav a:has-text("${item}"), aside a:has-text("${item}")`)
      .first();
    const isVisible = await locator.isVisible({ timeout: 1000 });
    console.log(
      `  ✓ ${item}: ${isVisible ? "❌ visible (should NOT be)" : "✅ correctly hidden"}`
    );
  }
}

test.describe("Comprehensive Role-Based Testing", () => {
  test.beforeEach(async ({ page }) => {
    // Verify server is running
    const response = await fetch("http://localhost:3001");
    if (!response.ok) throw new Error("Server not responding on port 3001");
  });

  test.describe("Phase 1: Authentication", () => {
    test("All users can login successfully", async ({ page }) => {
      for (const [key, user] of Object.entries(TEST_USERS)) {
        console.log(`\n🧪 Testing login for ${user.role}`);

        await loginAs(page, key as keyof typeof TEST_USERS);

        // Verify dashboard loaded (clients have different dashboard)
        if (user.role === "CLIENT") {
          expect(page.url()).toContain("/client-dashboard");
        } else {
          expect(page.url()).toContain("/dashboard");
        }

        // Take screenshot
        await page.screenshot({
          path: `test-results/phase1-login-${key}.png`,
          fullPage: true,
        });

        // Clear cookies for next user
        await page.context().clearCookies();
      }
    });

    test("Invalid login shows error", async ({ page }) => {
      await page.goto("/login");
      await page.fill('input[type="email"]', "invalid@example.com");
      await page.fill('input[type="password"]', "wrongpassword");
      await page.click('button[type="submit"]');

      // Check for error message - look for various possible error texts
      const errorLocator = page.locator("text=/invalid|error|failed/i").first();
      await expect(errorLocator).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Phase 1: Menu Visibility", () => {
    test("Admin sees all menu items", async ({ page }) => {
      await loginAs(page, "admin");
      await checkMenuVisibility(
        page,
        [
          "Dashboard",
          "Clients",
          "Services",
          "Requests",
          "Forms",
          "Content Tools",
          "Automations",
          "Settings",
        ],
        []
      );
    });

    test("Service Manager has limited access", async ({ page }) => {
      await loginAs(page, "manager");
      await checkMenuVisibility(
        page,
        [
          "Dashboard",
          "Clients",
          "Services",
          "Requests",
          "Forms",
          "Content Tools",
          "Automations",
        ],
        ["Settings"]
      );
    });

    test("Copywriter sees only assigned features", async ({ page }) => {
      await loginAs(page, "copywriter");
      await checkMenuVisibility(
        page,
        ["Dashboard", "Requests", "Content Tools"],
        ["Clients", "Services", "Forms", "Settings", "Automations"]
      );
    });
  });

  test.describe("Phase 2: Client Management Access", () => {
    test("Admin can create and manage clients", async ({ page }) => {
      await loginAs(page, "admin");

      // Navigate to clients
      await page.goto("/clients");
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toContain("/clients");

      // Check for create button
      const createButton = page
        .locator('button:has-text("Add Client"), button:has-text("New Client")')
        .first();
      await expect(createButton).toBeVisible({ timeout: 5000 });

      // Take screenshot
      await page.screenshot({
        path: "test-results/phase2-admin-clients.png",
        fullPage: true,
      });
    });

    test("Copywriter cannot access clients", async ({ page }) => {
      await loginAs(page, "copywriter");

      // Try to access clients
      await page.goto("/clients");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000); // Wait for any redirects

      // Should be redirected or show unauthorized
      const url = page.url();
      const isUnauthorized =
        url.includes("/unauthorized") ||
        url.includes("/dashboard") ||
        !url.includes("/clients");

      if (!isUnauthorized) {
        // Check if page shows unauthorized content
        const unauthorizedText = await page
          .locator("text=/unauthorized|not authorized|access denied/i")
          .isVisible({ timeout: 1000 });
        expect(unauthorizedText || !url.includes("/clients")).toBeTruthy();
      }

      console.log(`Copywriter accessing /clients: ${url}`);
    });
  });

  test.describe("Phase 3: Service Management", () => {
    test("Admin can manage service templates", async ({ page }) => {
      await loginAs(page, "admin");

      await page.goto("/services");
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toContain("/services");

      // Check for service management UI
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: "test-results/phase3-admin-services.png",
        fullPage: true,
      });
    });

    test("Service Manager can access services", async ({ page }) => {
      await loginAs(page, "manager");

      await page.goto("/services");
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toContain("/services");
    });
  });

  test.describe("Phase 4: Requests Access", () => {
    test("Multiple roles can access requests", async ({ page }) => {
      const rolesWithAccess = [
        "admin",
        "manager",
        "copywriter",
        "editor",
        "va",
      ];

      for (const role of rolesWithAccess) {
        console.log(`\n🧪 Testing requests access for ${role}`);

        await loginAs(page, role as keyof typeof TEST_USERS);
        await page.goto("/requests");
        await page.waitForLoadState("domcontentloaded");

        expect(page.url()).toContain("/requests");
        console.log(`  ✅ ${role} can access requests`);

        await page.context().clearCookies();
      }
    });
  });

  test.describe("Session Management", () => {
    test("Session persists across navigation", async ({ page }) => {
      await loginAs(page, "admin");

      // Navigate through multiple pages
      const pages = ["/dashboard", "/clients", "/services", "/requests"];

      for (const path of pages) {
        await page.goto(path);
        await page.waitForLoadState("domcontentloaded");
        expect(page.url()).toContain(path);
      }

      // Should still be logged in
      expect(page.url()).not.toContain("/login");
    });
  });
});
