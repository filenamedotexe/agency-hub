import { Page, expect } from "@playwright/test";

export type UserRole =
  | "ADMIN"
  | "SERVICE_MANAGER"
  | "COPYWRITER"
  | "EDITOR"
  | "VA"
  | "CLIENT";

interface TestUser {
  email: string;
  password: string;
  role: UserRole;
  name: string;
}

// Test users for each role
export const TEST_USERS: Record<UserRole, TestUser> = {
  ADMIN: {
    email: "admin@example.com",
    password: "password123",
    role: "ADMIN",
    name: "Admin User",
  },
  SERVICE_MANAGER: {
    email: "manager@example.com",
    password: "password123",
    role: "SERVICE_MANAGER",
    name: "Service Manager",
  },
  COPYWRITER: {
    email: "copywriter@example.com",
    password: "password123",
    role: "COPYWRITER",
    name: "Copywriter User",
  },
  EDITOR: {
    email: "editor@example.com",
    password: "password123",
    role: "EDITOR",
    name: "Editor User",
  },
  VA: {
    email: "va@example.com",
    password: "password123",
    role: "VA",
    name: "Virtual Assistant",
  },
  CLIENT: {
    email: "client@example.com",
    password: "password123",
    role: "CLIENT",
    name: "Test Client",
  },
};

/**
 * Login as a specific role with real authentication
 */
export async function loginAsRole(page: Page, role: UserRole) {
  const user = TEST_USERS[role];

  console.log(`🔐 Logging in as ${role}: ${user.email}`);

  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");

  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for successful login redirect
  await page.waitForURL("/dashboard", { timeout: 10000 });
  await page.waitForLoadState("networkidle");

  console.log(`✅ Login complete for ${role} with real authentication`);
}

/**
 * Navigate to a protected page with role-specific access checks
 */
export async function navigateWithRole(
  page: Page,
  path: string,
  expectedAccess: boolean = true
) {
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");

  const currentUrl = page.url();

  if (expectedAccess) {
    // Should have access
    if (currentUrl.includes("/login") || currentUrl.includes("/unauthorized")) {
      throw new Error(
        `Navigation to ${path} failed - user should have access but was redirected`
      );
    }
  } else {
    // Should NOT have access
    if (
      !currentUrl.includes("/login") &&
      !currentUrl.includes("/unauthorized")
    ) {
      throw new Error(
        `Navigation to ${path} succeeded - user should NOT have access`
      );
    }
  }
}

/**
 * Check if a role has access to a specific feature
 */
export function roleCanAccess(role: UserRole, feature: string): boolean {
  const permissions: Record<string, UserRole[]> = {
    // Dashboard - all roles
    dashboard: [
      "ADMIN",
      "SERVICE_MANAGER",
      "COPYWRITER",
      "EDITOR",
      "VA",
      "CLIENT",
    ],

    // Clients - all except CLIENT role
    clients_view: ["ADMIN", "SERVICE_MANAGER", "COPYWRITER", "EDITOR", "VA"],
    clients_create: ["ADMIN", "SERVICE_MANAGER"],
    clients_edit: ["ADMIN", "SERVICE_MANAGER"],
    clients_delete: ["ADMIN"],

    // Services - role-based access
    services_view: ["ADMIN", "SERVICE_MANAGER", "COPYWRITER", "EDITOR", "VA"],
    services_create: ["ADMIN", "SERVICE_MANAGER"],
    services_edit: ["ADMIN", "SERVICE_MANAGER"],
    services_delete: ["ADMIN", "SERVICE_MANAGER"],
    services_assign: ["ADMIN", "SERVICE_MANAGER"],

    // Tasks - assigned users can view/edit their tasks
    tasks_view_all: ["ADMIN", "SERVICE_MANAGER"],
    tasks_view_assigned: ["COPYWRITER", "EDITOR", "VA"],
    tasks_create: ["ADMIN", "SERVICE_MANAGER"],
    tasks_edit_all: ["ADMIN", "SERVICE_MANAGER"],
    tasks_edit_assigned: ["COPYWRITER", "EDITOR", "VA"],

    // Requests
    requests_view: ["ADMIN", "SERVICE_MANAGER", "COPYWRITER", "EDITOR", "VA"],
    requests_create: ["ADMIN", "SERVICE_MANAGER"],
    requests_edit: ["ADMIN", "SERVICE_MANAGER"],

    // Forms
    forms_view: ["ADMIN", "SERVICE_MANAGER"],
    forms_create: ["ADMIN", "SERVICE_MANAGER"],
    forms_edit: ["ADMIN", "SERVICE_MANAGER"],
    forms_respond: ["CLIENT"],

    // Settings
    settings_view: ["ADMIN"],
    settings_webhooks: ["ADMIN"],
    settings_api_keys: ["ADMIN"],
    settings_users: ["ADMIN"],

    // Client-specific features
    client_dashboard: ["CLIENT"],
    client_forms: ["CLIENT"],
    client_services: ["CLIENT"],
  };

  return permissions[feature]?.includes(role) || false;
}

/**
 * Wait for auth to be fully loaded
 */
export async function waitForAuth(page: Page) {
  // Wait for any auth-related loading to complete
  await page.waitForLoadState("networkidle");

  // Additional wait for React hydration
  await page.waitForTimeout(1000);
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  // Click user menu or logout button
  const userMenu = page.locator('[data-testid="user-menu"]');
  const logoutButton = page.locator('button:has-text("Logout")');

  if (await userMenu.isVisible()) {
    await userMenu.click();
    await page.waitForTimeout(500);
  }

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    // Fallback: navigate to logout endpoint
    await page.goto("/api/auth/logout");
  }

  // Wait for redirect to login
  await page.waitForURL("/login");
}

/**
 * Get visible menu items for a role
 */
export function getVisibleMenuItems(role: UserRole): string[] {
  const menuItems: Record<UserRole, string[]> = {
    ADMIN: [
      "Dashboard",
      "Clients",
      "Services",
      "Requests",
      "Forms",
      "Automations",
      "Content Tools",
      "Settings",
    ],
    SERVICE_MANAGER: [
      "Dashboard",
      "Clients",
      "Services",
      "Requests",
      "Forms",
      "Automations",
      "Content Tools",
    ],
    COPYWRITER: ["Dashboard", "Services", "Tasks", "Content Tools"],
    EDITOR: ["Dashboard", "Services", "Tasks"],
    VA: ["Dashboard", "Services", "Tasks", "Clients"],
    CLIENT: ["Dashboard", "My Services", "Forms", "Requests"],
  };

  return menuItems[role] || [];
}

/**
 * Verify role-based UI elements
 */
export async function verifyRoleUI(page: Page, role: UserRole) {
  const visibleItems = getVisibleMenuItems(role);

  for (const item of visibleItems) {
    const menuItem = page.locator(`nav >> text="${item}"`).first();
    await expect(menuItem).toBeVisible({ timeout: 5000 });
  }

  // Verify restricted items are NOT visible
  const allItems = [
    "Dashboard",
    "Clients",
    "Services",
    "Requests",
    "Forms",
    "Automations",
    "Content Tools",
    "Settings",
  ];
  const restrictedItems = allItems.filter(
    (item) => !visibleItems.includes(item)
  );

  for (const item of restrictedItems) {
    const menuItem = page.locator(`nav >> text="${item}"`).first();
    await expect(menuItem).not.toBeVisible();
  }
}

// Re-export original helpers for compatibility
export { navigateToProtectedPage } from "./auth";
