const { chromium } = require("@playwright/test");

async function testClientsPage() {
  console.log("🔍 Testing Clients Page for Errors...\n");

  const browser = await chromium.launch({
    headless: false,
    devtools: true, // Open devtools to see console errors
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect all console messages
  const consoleMessages = [];
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });

    if (type === "error") {
      console.log("❌ ERROR:", text);
    } else if (type === "warning") {
      console.log("⚠️  WARNING:", text);
    } else if (text.includes("[AUTH") || text.includes("Error")) {
      console.log("📝", text);
    }
  });

  // Collect network errors
  page.on("requestfailed", (request) => {
    console.log(
      "❌ REQUEST FAILED:",
      request.url(),
      request.failure().errorText
    );
  });

  // Collect page errors
  page.on("pageerror", (error) => {
    console.log("❌ PAGE ERROR:", error.message);
  });

  try {
    // Login as admin
    console.log("1️⃣ Logging in as admin...");
    await page.goto("http://localhost:3001/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");
    console.log("   ✅ Logged in successfully\n");

    // Navigate to clients page
    console.log("2️⃣ Navigating to clients page...");
    await page.goto("http://localhost:3001/clients");

    // Wait for potential errors
    await page.waitForTimeout(3000);

    // Check if error message is displayed
    const errorElement = await page.locator(".bg-red-50").count();
    if (errorElement > 0) {
      const errorText = await page.locator(".bg-red-50 p").textContent();
      console.log("   ❌ Error displayed on page:", errorText);
    }

    // Check if table loaded
    const tableRows = await page.locator("tbody tr").count();
    console.log(`   📊 Table rows found: ${tableRows}`);

    // Check network tab for failed API calls
    const apiResponse = await page.evaluate(() => {
      return fetch(
        "/api/clients?page=1&pageSize=10&sortBy=createdAt&sortOrder=desc",
        {
          credentials: "include",
        }
      )
        .then((res) => ({
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
        }))
        .then(async (res) => {
          if (!res.ok) {
            const text = await fetch(
              "/api/clients?page=1&pageSize=10&sortBy=createdAt&sortOrder=desc",
              {
                credentials: "include",
              }
            ).then((r) => r.text());
            return { ...res, body: text };
          }
          return res;
        });
    });

    console.log("\n3️⃣ API Response:", apiResponse);

    // Check React Query cache
    const reactQueryState = await page.evaluate(() => {
      const queryClient =
        window.__REACT_QUERY_DEVTOOLS_GLOBAL_STORE__?.queryClient;
      if (queryClient) {
        const cache = queryClient.getQueryCache();
        const queries = cache.getAll();
        return queries.map((q) => ({
          queryKey: q.queryKey,
          state: q.state.status,
          error: q.state.error?.message,
        }));
      }
      return null;
    });

    if (reactQueryState) {
      console.log(
        "\n4️⃣ React Query State:",
        JSON.stringify(reactQueryState, null, 2)
      );
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 CONSOLE MESSAGES SUMMARY:");
    const errors = consoleMessages.filter((m) => m.type === "error");
    const warnings = consoleMessages.filter((m) => m.type === "warning");

    console.log(`Errors: ${errors.length}`);
    errors.forEach((e, i) => console.log(`  ${i + 1}. ${e.text}`));

    console.log(`\nWarnings: ${warnings.length}`);
    warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w.text}`));

    // Keep browser open for inspection
    console.log(
      "\n⏸️  Browser will stay open for 10 seconds for inspection..."
    );
    await page.waitForTimeout(10000);
  } catch (error) {
    console.error("\n❌ Test Error:", error);
  } finally {
    await browser.close();
  }
}

testClientsPage().catch(console.error);
