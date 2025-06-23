import { test, expect } from "@playwright/test";

test.describe("Test Clients API", () => {
  test("API endpoint should return clients data", async ({ request }) => {
    // First login to get authentication
    const loginResponse = await request.post("/api/auth/login", {
      data: {
        email: "admin@example.com",
        password: "password123",
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    // Now test the clients API
    const response = await request.get("/api/clients");
    const status = response.status();
    console.log("API Response status:", status);

    if (!response.ok()) {
      const text = await response.text();
      console.log("Error response:", text);
    } else {
      const data = await response.json();
      console.log("Success response:", data);
    }

    expect(response.ok()).toBeTruthy();
  });

  test("Direct page navigation should work", async ({ page }) => {
    // Enable console and network logging
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log("Browser error:", msg.text());
      }
    });

    page.on("response", (response) => {
      if (response.status() >= 400) {
        console.log(
          `Failed request: ${response.url()} - Status: ${response.status()}`
        );
      }
    });

    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15000,
    });

    // Now go to clients page
    await page.goto("/clients");

    // Check if we're still on clients page
    await expect(page).toHaveURL("/clients");

    // Wait for any element that should be on the page
    const bodyText = await page.textContent("body");
    console.log("Page body contains:", bodyText?.substring(0, 200));

    // Check for loading state or error state
    const hasLoading = await page.locator("text=Loading").count();
    const hasError = await page.locator("text=Error").count();
    const hasClients = await page.locator("text=Clients").count();

    console.log({
      hasLoading,
      hasError,
      hasClients,
    });
  });
});
