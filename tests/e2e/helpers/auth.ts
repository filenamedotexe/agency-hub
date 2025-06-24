import { Page } from "@playwright/test";

/**
 * Login as admin user with real authentication
 */
export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');

  // Wait for successful login redirect
  await page.waitForURL("/dashboard");

  console.log("✅ Admin login complete with real authentication");
}

/**
 * Login as any user with real authentication
 */
export async function loginAsUser(
  page: Page,
  email: string,
  password: string = "password123"
) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for successful login redirect
  await page.waitForURL("/dashboard");

  console.log(`✅ Login complete for ${email} with real authentication`);
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
