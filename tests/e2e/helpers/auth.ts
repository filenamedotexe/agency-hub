import { Page } from "@playwright/test";

/**
 * Helper function to login and wait for auth to fully resolve
 * This ensures the loading spinner disappears before proceeding
 */
export async function loginAndWaitForAuth(page: Page) {
  // Navigate to login
  await page.goto("/login");

  // Fill login form
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect away from login
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15000,
  });

  // Wait for the dashboard to fully load first
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");

  // Give auth state time to propagate
  await page.waitForTimeout(2000);
}

/**
 * Navigate to a protected page and wait for it to load
 * This handles the loading spinner that appears during auth checks
 */
export async function navigateToProtectedPage(page: Page, path: string) {
  await page.goto(path);

  // Wait for page to load
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");

  // Verify we're on the correct page (not redirected to login)
  const currentUrl = page.url();
  if (currentUrl.includes("/login")) {
    throw new Error(`Navigation to ${path} failed - redirected to login`);
  }
}
