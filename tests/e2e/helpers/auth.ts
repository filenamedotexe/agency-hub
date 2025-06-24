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
 * Login and wait for auth to be fully loaded
 */
export async function loginAndWaitForAuth(
  page: Page,
  email: string = "admin@example.com",
  password: string = "password123"
) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for successful login redirect
  await page.waitForURL("/dashboard");

  // CRITICAL: Wait for auth context to be fully loaded
  await page.waitForLoadState("networkidle");

  // Wait for any loading states to clear
  const loadingIndicators = page.locator(".animate-spin, text='Loading...'");
  try {
    await loadingIndicators
      .first()
      .waitFor({ state: "hidden", timeout: 10000 });
  } catch {
    // Loading might have already finished
  }

  // Additional wait for React hydration
  await page.waitForTimeout(1000);

  console.log(`✅ Login complete for ${email} with auth fully loaded`);
}

/**
 * Navigate to protected page with proper loading handling
 */
export async function navigateToProtectedPage(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");

  // Verify we're not redirected to login
  const currentUrl = page.url();
  if (currentUrl.includes("/login")) {
    throw new Error(`Navigation to ${path} failed - redirected to login`);
  }

  // Wait for any page-specific loading to finish
  const loadingText = page.locator(
    "text='Loading forms...', text='Loading...', .animate-spin"
  );
  try {
    await loadingText.first().waitFor({ state: "hidden", timeout: 10000 });
  } catch {
    // Loading might have already finished or not exist
  }

  // Small wait for final render
  await page.waitForTimeout(500);
}
