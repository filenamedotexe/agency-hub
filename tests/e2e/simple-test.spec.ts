import { test, expect } from "@playwright/test";

test("can access login page", async ({ page }) => {
  await page.goto("/login");

  // Check if login form elements exist
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();

  // Check if sign in text is present
  await expect(page.locator("text=Sign in to your account")).toBeVisible();
});
