import { Page } from "@playwright/test";

/**
 * Set test authentication bypass cookie
 * This allows tests to bypass the complex Supabase auth flow
 */
export async function setTestAuthBypass(page: Page) {
  await page.context().addCookies([
    {
      name: "test-auth-bypass",
      value: "true",
      domain: "localhost",
      path: "/",
    },
  ]);
}

/**
 * Login helper that actually performs the login flow
 * and then sets the test bypass for subsequent navigation
 */
export async function loginAsAdmin(page: Page) {
  // Step 1: Perform actual login
  await page.goto("/login");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');

  // Wait for successful login redirect
  await page.waitForURL("/dashboard");

  // Step 2: Set test bypass cookie for subsequent navigation
  await setTestAuthBypass(page);

  console.log("✅ Login complete with test bypass enabled");
}

/**
 * Simple navigation helper - just go to the page
 * Assumes test bypass cookie is already set
 */
export async function navigateToProtectedPage(page: Page, path: string) {
  await page.goto(path);

  // Verify we're not redirected to login
  const currentUrl = page.url();
  if (currentUrl.includes("/login")) {
    throw new Error(`Navigation to ${path} failed - redirected to login`);
  }
}
