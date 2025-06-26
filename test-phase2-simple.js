const { chromium } = require("@playwright/test");

async function testOptimizedMiddleware() {
  console.log("🚀 Testing Optimized Middleware...\n");

  const browser = await chromium.launch({
    headless: false,
    devtools: false,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor console for our new middleware logs
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("[MW-OPT]") || text.includes("[CACHE")) {
      console.log("📝", text);
    }
  });

  console.log("1️⃣ Testing Login...");
  await page.goto("http://localhost:3001/login");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');

  await page.waitForTimeout(2000);
  console.log(`   Current URL: ${page.url()}`);

  console.log("\n2️⃣ Testing Navigation (should use cache)...");
  const routes = ["/dashboard", "/clients", "/services"];

  for (const route of routes) {
    const start = Date.now();
    await page.goto(`http://localhost:3001${route}`);
    await page.waitForLoadState("domcontentloaded");
    const duration = Date.now() - start;
    console.log(`   ${route}: ${duration}ms`);
  }

  console.log("\n3️⃣ Checking Dashboard Content...");
  // Wait for dashboard to load
  const hasLoading = await page
    .locator('.animate-spin, text="Loading..."')
    .count();
  console.log(`   Loading indicators: ${hasLoading}`);

  if (hasLoading > 0) {
    console.log("   Waiting for content...");
    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 10000 })
      .catch(() => {});
    await page
      .waitForSelector('text="Loading..."', { state: "hidden", timeout: 10000 })
      .catch(() => {});
  }

  // Check if dashboard content loaded
  const dashboardTitle = await page.locator('h1:has-text("Dashboard")').count();
  console.log(`   Dashboard title found: ${dashboardTitle > 0 ? "Yes" : "No"}`);

  await page.screenshot({ path: "optimized-dashboard.png" });

  await page.waitForTimeout(2000);
  await browser.close();

  console.log("\n✅ Test complete! Check console for [MW-OPT] logs.");
}

testOptimizedMiddleware().catch(console.error);
