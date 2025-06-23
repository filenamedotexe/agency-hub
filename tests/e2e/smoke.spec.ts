import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("app loads successfully", async ({ page }) => {
    await page.goto("/");

    // Check that the page loads
    await expect(page).toHaveTitle(/Agency Hub/);

    // Check that main heading is visible
    await expect(
      page.getByRole("heading", { name: "Agency Hub" })
    ).toBeVisible();

    // Check that welcome text is visible
    await expect(page.getByText("Welcome to Agency Hub")).toBeVisible();
  });

  test("app is responsive on mobile", async ({ page, viewport }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    // Check that content is still visible on mobile
    await expect(
      page.getByRole("heading", { name: "Agency Hub" })
    ).toBeVisible();

    // Verify no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = viewport?.width || 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });
});
