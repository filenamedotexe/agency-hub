import { test, expect } from "@playwright/test";

test.describe("Check User Role", () => {
  test("Check copywriter role in database", async ({ page }) => {
    // Login as copywriter
    await page.goto("/login");
    await page.fill('input[type="email"]', "copywriter@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.waitForURL("/dashboard", { timeout: 10000 });

    // Call debug endpoint
    const response = await page.evaluate(async () => {
      const res = await fetch("/api/debug/role");
      return res.json();
    });

    console.log("\n🔍 User Role Check:");
    console.log("Auth User:", response.authUser);
    console.log("DB User:", response.dbUser);

    if (response.dbUser?.role !== "COPYWRITER") {
      console.log(
        `\n❌ PROBLEM: User role is ${response.dbUser?.role}, not COPYWRITER!`
      );
    } else {
      console.log("\n✅ User role is correctly set to COPYWRITER");
    }
  });
});
