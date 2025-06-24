import { test, expect } from "@playwright/test";

test.describe("Client CRUD with Mocked Auth", () => {
  test("Create client with mocked auth", async ({ page }) => {
    // Mock the auth API response
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "test-user-id",
            email: "admin@example.com",
            role: "ADMIN",
            profileData: {},
          },
        }),
      });
    });

    // Mock Supabase auth.getUser response
    await page.addInitScript(() => {
      // Override fetch to intercept Supabase calls
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const [url] = args;

        // Mock Supabase auth endpoints
        if (typeof url === "string" && url.includes("auth/v1/user")) {
          return new Response(
            JSON.stringify({
              user: {
                id: "test-user-id",
                email: "admin@example.com",
                role: "ADMIN",
                user_metadata: { role: "ADMIN" },
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        return originalFetch(...args);
      };
    });

    // Set auth cookie
    await page.context().addCookies([
      {
        name: "sb-rznvmbxhfnyqcyanxptq-auth-token",
        value: "mock-token",
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    // Now navigate directly to clients page
    await page.goto("/clients");

    // Wait for content to load (no more infinite spinner!)
    await page.waitForSelector("h1", { timeout: 5000 });
    expect(page.url()).toContain("/clients");

    // Navigate to new client page
    await page.goto("/clients/new");
    await page.waitForSelector('input[placeholder="John Doe"]', {
      timeout: 5000,
    });

    // Fill the form
    await page.fill('input[placeholder="John Doe"]', "Test Client");
    await page.fill('input[placeholder="Acme Corporation"]', "Test Business");

    // Mock the API response for creating a client
    await page.route("**/api/clients", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "new-client-id",
            name: "Test Client",
            businessName: "Test Business",
          }),
        });
      }
    });

    // Submit the form
    await page.click('button[type="submit"]');

    // Should redirect to clients list
    await page.waitForURL("/clients", { timeout: 10000 });
    expect(page.url()).toContain("/clients");
  });
});
