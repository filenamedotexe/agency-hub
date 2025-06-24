import { Page } from "@playwright/test";

/**
 * Setup authenticated state for tests
 * This creates a persistent authentication context that survives page navigations
 */
export async function setupAuth(page: Page) {
  // Navigate to login page
  await page.goto("/login");

  // Fill and submit login form
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');

  // Wait for successful login and dashboard to load
  await page.waitForURL("/dashboard", { timeout: 15000 });

  // CRITICAL: Wait for auth cookies to be set
  await page.waitForTimeout(1000);

  // Store the authentication state
  const cookies = await page.context().cookies();

  // Return cookies so they can be reused
  return cookies;
}
