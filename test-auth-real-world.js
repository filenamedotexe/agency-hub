const { chromium } = require("@playwright/test");

async function testRealWorldAuth() {
  console.log("🌍 Testing Real-World Auth Experience...\n");

  const browser = await chromium.launch({
    headless: false,
    devtools: false,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("1️⃣ Fresh Login Test...");
  await context.clearCookies();
  await page.goto("http://localhost:3001/login");

  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");

  const loginStart = Date.now();
  await page.click('button[type="submit"]');

  // Wait for dashboard to load
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  const loginTime = Date.now() - loginStart;
  console.log(`   Login -> Dashboard: ${loginTime}ms`);

  // Check if dashboard is stuck on loading
  await page.waitForTimeout(2000);
  const hasSpinner = await page.locator(".animate-spin").count();
  const hasLoadingText = await page.locator('text="Loading..."').count();

  console.log(
    `   Loading indicators: ${hasSpinner} spinners, ${hasLoadingText} loading texts`
  );

  if (hasSpinner > 0 || hasLoadingText > 0) {
    console.log("   ⚠️  Dashboard stuck on loading!");

    // Wait up to 10 seconds for content
    try {
      await page.waitForSelector('h1:has-text("Dashboard")', {
        timeout: 10000,
      });
      await page.waitForSelector(".text-2xl.font-bold", { timeout: 5000 });
      console.log("   ✅ Dashboard content eventually loaded");
    } catch (e) {
      console.log("   ❌ Dashboard content never loaded!");
      await page.screenshot({ path: "dashboard-stuck.png" });
    }
  } else {
    console.log("   ✅ Dashboard loaded without loading state");
  }

  console.log("\n2️⃣ Navigation Performance (with caching)...");
  const routes = [
    { path: "/clients", name: "Clients" },
    { path: "/services", name: "Services" },
    { path: "/calendar", name: "Calendar" },
    { path: "/dashboard", name: "Dashboard (return)" },
  ];

  for (const route of routes) {
    const navStart = Date.now();
    await page.goto(`http://localhost:3001${route.path}`);
    await page.waitForLoadState("domcontentloaded");
    const navTime = Date.now() - navStart;

    // Check for loading states
    const hasLoading =
      (await page.locator(".animate-spin").count()) +
      (await page.locator('text="Loading..."').count());
    console.log(
      `   ${route.name}: ${navTime}ms ${hasLoading > 0 ? "(has loading state)" : ""}`
    );
  }

  console.log("\n3️⃣ API Authentication Test...");
  // Test if dashboard stats API works
  const apiResponse = await page.evaluate(() => {
    return fetch("/api/dashboard/stats", { credentials: "include" })
      .then((r) => ({ ok: r.ok, status: r.status }))
      .catch((e) => ({ error: e.message }));
  });
  console.log(`   Dashboard stats API: ${JSON.stringify(apiResponse)}`);

  console.log("\n4️⃣ Back Button Test...");
  await page.goBack(); // Should go to calendar
  await page.waitForTimeout(1000);
  const afterBack = page.url();
  console.log(
    `   After back button: ${afterBack.includes("login") ? "❌ Logged out!" : "✅ Still authenticated"}`
  );

  console.log("\n5️⃣ Server Logs Check...");
  console.log("   Check terminal for [MW] logs showing cache hits/misses");

  await page.waitForTimeout(2000);
  await browser.close();

  console.log("\n✅ Test complete!");
}

testRealWorldAuth().catch(console.error);
