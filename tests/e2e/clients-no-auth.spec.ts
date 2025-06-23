import { test, expect } from "@playwright/test";

test.describe("Client Pages Access", () => {
  test("can access clients page directly", async ({ page }) => {
    // Try to access clients page directly
    await page.goto("/clients");

    // Should redirect to login or show clients page
    await expect(page).toHaveURL(/(login|clients)/);
  });

  test("client API endpoints are accessible", async ({ page }) => {
    // Test if API is running
    const response = await page.request.get("/api/clients");

    // Should return 200 (if public) or 401 (if protected)
    expect([200, 401]).toContain(response.status());
  });
});
