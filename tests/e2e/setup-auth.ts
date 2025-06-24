import { test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../.auth/user.json");

setup("authenticate", async ({ page }) => {
  // Perform authentication steps
  await page.goto("/login");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');

  // Wait for the final URL to ensure that the cookies are actually set
  await page.waitForURL("/dashboard");

  // Save storage state
  await page.context().storageState({ path: authFile });
});
