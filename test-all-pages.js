const { chromium } = require("@playwright/test");

async function testAllPages() {
  console.log("🔍 Testing All Dashboard Pages...\n");

  const browser = await chromium.launch({
    headless: false,
    devtools: false,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];

  // Collect console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore timer warnings
      if (!text.includes("Timer") && !text.includes("WebSocket")) {
        errors.push({ page: page.url(), error: text });
      }
    }
  });

  // Collect page errors
  page.on("pageerror", (error) => {
    errors.push({ page: page.url(), error: error.message });
  });

  const pages = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Clients", path: "/clients" },
    { name: "Services", path: "/services" },
    { name: "Requests", path: "/requests" },
    { name: "Forms", path: "/forms" },
    { name: "Calendar", path: "/calendar" },
    { name: "Content Tools", path: "/content-tools" },
    { name: "Automations", path: "/automations" },
    { name: "Settings", path: "/settings" },
  ];

  try {
    // Login as admin
    console.log("🔐 Logging in as admin...");
    await page.goto("http://localhost:3001/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");
    console.log("✅ Logged in successfully\n");

    // Test each page
    for (const pageInfo of pages) {
      console.log(`📄 Testing ${pageInfo.name} page...`);

      const startTime = Date.now();
      await page.goto(`http://localhost:3001${pageInfo.path}`);
      await page.waitForTimeout(2000); // Wait for page to fully load

      // Check for visible error messages
      const errorCount = await page.locator(".bg-red-50").count();
      const hasLoadingSpinner =
        (await page.locator(".animate-spin").count()) > 0;
      const loadTime = Date.now() - startTime;

      if (errorCount > 0) {
        const errorText = await page
          .locator(".bg-red-50")
          .first()
          .textContent();
        console.log(`   ❌ Error displayed: ${errorText}`);
        errors.push({ page: pageInfo.name, error: `UI Error: ${errorText}` });
      } else if (hasLoadingSpinner) {
        console.log(`   ⚠️  Still showing loading spinner after 2s`);
        errors.push({ page: pageInfo.name, error: "Stuck on loading spinner" });
      } else {
        console.log(`   ✅ Loaded successfully in ${loadTime}ms`);
      }

      // Check for specific content to ensure page loaded
      const hasContent = await page
        .locator("h1, h2, h3")
        .first()
        .isVisible()
        .catch(() => false);
      if (!hasContent) {
        console.log(`   ⚠️  No heading content found`);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 SUMMARY:");
    console.log(`Total pages tested: ${pages.length}`);
    console.log(`Pages with errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log("\n❌ ERRORS FOUND:");
      errors.forEach((e, i) => {
        console.log(`${i + 1}. ${e.page}: ${e.error}`);
      });
    } else {
      console.log("\n✅ All pages loaded successfully!");
    }
  } catch (error) {
    console.error("\n❌ Test Error:", error);
  } finally {
    await browser.close();
  }
}

testAllPages().catch(console.error);
