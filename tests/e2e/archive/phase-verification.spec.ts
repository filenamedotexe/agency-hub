import { test, expect } from "@playwright/test";

test.describe("Phase 1 & 2 Verification", () => {
  test.describe("Phase 1: Authentication", () => {
    test("Login page loads and has correct elements", async ({ page }) => {
      await page.goto("/login");

      // Check for form elements
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Check for text content
      await expect(page.getByText("Sign in to your account")).toBeVisible();
      await expect(page.getByText("create a new account")).toBeVisible();
    });

    test("Signup page loads and has correct elements", async ({ page }) => {
      await page.goto("/signup");

      // Check for form elements
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
      await expect(page.locator('input[name="name"]')).toBeVisible();
      // Check for select trigger instead of native select
      await expect(page.locator('button[role="combobox"]')).toBeVisible();

      // Check for text content
      await expect(page.getByText("Create your account")).toBeVisible();
    });

    test("Can login successfully", async ({ page }) => {
      await page.goto("/login");

      // Fill login form
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "password123");

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await page.waitForURL("/dashboard", { timeout: 10000 });

      // Check dashboard loaded - be more specific with the selector
      await expect(
        page.getByRole("main").getByRole("heading", { name: "Dashboard" })
      ).toBeVisible();
    });

    test("Protected routes redirect to login", async ({ page }) => {
      // Clear cookies to ensure not logged in
      await page.context().clearCookies();

      // Try to access protected route
      await page.goto("/dashboard");

      // Should redirect to login
      await expect(page).toHaveURL("/login");
    });
  });

  test.describe("Phase 2: Client CRUD", () => {
    test("Can access clients page when authenticated", async ({ page }) => {
      await page.goto("/login");

      // Login
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "password123");
      await page.click('button[type="submit"]');

      // Wait for dashboard
      await page.waitForURL("/dashboard");

      // Navigate to clients
      await page.click('a[href="/clients"]');
      await page.waitForURL("/clients");

      // Check page loaded
      await expect(page.getByText("Clients")).toBeVisible();
    });

    test("Can create a new client", async ({ page }) => {
      // Login first
      await page.goto("/login");
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/dashboard");

      // Go to clients page
      await page.goto("/clients");

      // Click new client button
      await page.click('a[href="/clients/new"]');
      await page.waitForURL("/clients/new");

      // Fill form
      await page.fill('input[name="name"]', "Test E2E Client");
      await page.fill('input[name="businessName"]', "E2E Business Inc");
      await page.fill('textarea[name="address"]', "123 E2E Street");
      await page.fill('input[name="dudaSiteId"]', "e2e_site_" + Date.now());

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to clients list
      await page.waitForURL("/clients");

      // Check success message
      await expect(page.getByText("Client created successfully")).toBeVisible();

      // Check client appears in list
      await expect(page.getByText("Test E2E Client")).toBeVisible();
    });

    test("Can view client details", async ({ page }) => {
      // Login first
      await page.goto("/login");
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/dashboard");

      // Go to clients page
      await page.goto("/clients");

      // Click on first client
      const firstClient = page.locator("tbody tr").first();
      await firstClient.locator("a").click();

      // Check detail page loaded
      await expect(page.getByText("Client Details")).toBeVisible();
      await expect(page.getByText("Activity Log")).toBeVisible();
    });

    test("Can search for clients", async ({ page }) => {
      // Login first
      await page.goto("/login");
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/dashboard");

      // Go to clients page
      await page.goto("/clients");

      // Search for a client
      await page.fill('input[placeholder*="Search"]', "Acme");

      // Wait for search results
      await page.waitForTimeout(500);

      // Check filtered results
      await expect(page.getByText("Acme Corporation")).toBeVisible();
    });
  });

  test.describe("Responsive Design", () => {
    test("Mobile layout works correctly", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto("/login");

      // Check mobile layout
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();

      // Login
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "password123");
      await page.click('button[type="submit"]');

      await page.waitForURL("/dashboard");

      // Check mobile navigation (should have menu button)
      await expect(
        page.locator('button[aria-label="Toggle navigation"]')
      ).toBeVisible();
    });

    test("Tablet layout works correctly", async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto("/login");

      // Login
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "password123");
      await page.click('button[type="submit"]');

      await page.waitForURL("/dashboard");

      // Check sidebar is visible
      await expect(page.locator("nav").first()).toBeVisible();
    });
  });

  test.describe("Role-Based Access", () => {
    test("Client role sees client dashboard", async ({ page }) => {
      await page.goto("/login");

      // Login as client
      await page.fill('input[name="email"]', "client@example.com");
      await page.fill('input[name="password"]', "password123");
      await page.click('button[type="submit"]');

      // Should redirect to client dashboard
      await page.waitForURL("/client-dashboard");

      // Check client dashboard loaded
      await expect(page.getByText("Client Dashboard")).toBeVisible();
    });

    test("Admin can access all areas", async ({ page }) => {
      await page.goto("/login");

      // Login as admin
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "password123");
      await page.click('button[type="submit"]');

      await page.waitForURL("/dashboard");

      // Check all menu items are visible
      await expect(page.locator('a[href="/dashboard"]')).toBeVisible();
      await expect(page.locator('a[href="/clients"]')).toBeVisible();
      await expect(page.locator('a[href="/services"]')).toBeVisible();
      await expect(page.locator('a[href="/requests"]')).toBeVisible();
      await expect(page.locator('a[href="/forms"]')).toBeVisible();
      await expect(page.locator('a[href="/content-tools"]')).toBeVisible();
      await expect(page.locator('a[href="/automations"]')).toBeVisible();
      await expect(page.locator('a[href="/settings"]')).toBeVisible();
    });
  });
});
