import { test as setup } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // Go to login page
  await page.goto("/login");

  // Fill login form
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL("/dashboard", { timeout: 15000 });

  // Save storage state
  await page.context().storageState({ path: authFile });
});
