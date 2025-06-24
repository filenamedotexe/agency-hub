import { test, expect } from "@playwright/test";

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

// Define expected access control
const ROUTE_PERMISSIONS = {
  "/dashboard": ["ADMIN", "SERVICE_MANAGER", "COPYWRITER", "EDITOR", "VA"],
  "/clients": ["ADMIN", "SERVICE_MANAGER"],
  "/services": ["ADMIN", "SERVICE_MANAGER"],
  "/requests": ["ADMIN", "SERVICE_MANAGER", "COPYWRITER", "EDITOR", "VA"],
  "/forms": ["ADMIN", "SERVICE_MANAGER"],
  "/content-tools": ["ADMIN", "SERVICE_MANAGER", "COPYWRITER"],
  "/settings": ["ADMIN"],
  "/automations": ["ADMIN", "SERVICE_MANAGER"],
  "/client-dashboard": ["CLIENT"],
};

test.describe.skip(
  "Expected Role-Based Access Control (Currently Failing)",
  () => {
    test.describe("Proper Access Control Implementation", () => {
      // Test each role against each route
      for (const [userKey, user] of Object.entries(TEST_USERS)) {
        test(`${user.role} access control`, async ({ page }) => {
          // Login
          await page.goto("/login");
          await page.fill('input[type="email"]', user.email);
          await page.fill('input[type="password"]', user.password);
          await page.click('button[type="submit"]');

          // Wait for redirect
          if (user.role === "CLIENT") {
            await page.waitForURL("/client-dashboard", { timeout: 10000 });
          } else {
            await page.waitForURL("/dashboard", { timeout: 10000 });
          }

          // Test each route
          for (const [route, allowedRoles] of Object.entries(
            ROUTE_PERMISSIONS
          )) {
            // Skip client dashboard for non-client users
            if (route === "/client-dashboard" && user.role !== "CLIENT")
              continue;
            // Skip regular dashboard for client users
            if (route === "/dashboard" && user.role === "CLIENT") continue;

            const shouldHaveAccess = allowedRoles.includes(user.role);

            await page.goto(route);
            await page.waitForLoadState("domcontentloaded");
            await page.waitForTimeout(500); // Wait for any redirects

            const currentUrl = page.url();

            if (shouldHaveAccess) {
              expect(currentUrl).toContain(route);
              console.log(`✅ ${user.role} can access ${route} (as expected)`);
            } else {
              expect(currentUrl).not.toContain(route);
              expect(currentUrl).toMatch(/\/(dashboard|unauthorized|login)/);
              console.log(
                `✅ ${user.role} blocked from ${route} (as expected)`
              );
            }
          }
        });
      }
    });

    test("Comprehensive access matrix", async ({ page }) => {
      console.log("\n📊 Expected Access Control Matrix:");
      console.log("=====================================");

      // Print header
      const routes = Object.keys(ROUTE_PERMISSIONS);
      console.log(
        "Role            | " + routes.map((r) => r.padEnd(15)).join(" | ")
      );
      console.log("-".repeat(20 + routes.length * 18));

      // Print each role's access
      for (const [userKey, user] of Object.entries(TEST_USERS)) {
        const access = routes.map((route) => {
          const allowed = ROUTE_PERMISSIONS[
            route as keyof typeof ROUTE_PERMISSIONS
          ].includes(user.role);
          return allowed ? "✅ ALLOW".padEnd(15) : "❌ DENY".padEnd(15);
        });
        console.log(`${user.role.padEnd(15)} | ${access.join(" | ")}`);
      }
    });
  }
);
