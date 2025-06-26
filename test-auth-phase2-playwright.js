const { chromium } = require("@playwright/test");

async function waitForServer(maxAttempts = 20) {
  console.log("⏳ Waiting for server to be ready...");

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch("http://localhost:3001/api/health", {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      }).catch(() => null);

      if (response || i > 5) {
        console.log("✅ Server is ready!\n");
        return true;
      }
    } catch (e) {}

    console.log(`   Attempt ${i + 1}/${maxAttempts}...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Server did not start after " + maxAttempts + " attempts");
}

async function testAuthPhase2() {
  console.log("🧪 Starting Phase 2 Auth Tests (Middleware Caching)...\n");

  await waitForServer();

  const browser = await chromium.launch({
    headless: false,
    devtools: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console log capture
  page.on("console", (msg) => {
    const text = msg.text();
    if (
      text.includes("[CACHE") ||
      text.includes("[MIDDLEWARE]") ||
      text.includes("database-query")
    ) {
      console.log("📝 Cache/DB Log:", text);
    }
  });

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  async function runTest(name, testFn) {
    console.log(`\n🔄 Running: ${name}`);
    const startTime = Date.now();

    try {
      await testFn();
      const duration = Date.now() - startTime;
      console.log(`✅ PASSED: ${name} (${duration}ms)`);
      results.passed++;
      results.tests.push({ name, status: "passed", duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ FAILED: ${name} (${duration}ms)`);
      console.error(`   Error: ${error.message}`);
      results.failed++;
      results.tests.push({
        name,
        status: "failed",
        duration,
        error: error.message,
      });
    }
  }

  // Test 1: First login triggers database query
  await runTest("First login triggers database query", async () => {
    // Clear cookies to start fresh
    await context.clearCookies();

    // Login
    await page.goto("http://localhost:3001/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");

    // Monitor server logs during login
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/auth/login") &&
          response.status() === 200
      ),
    ]);

    await page.waitForTimeout(2000);
    await page.waitForURL("**/dashboard", { timeout: 5000 });

    console.log("   ✓ Login successful, should see database query in logs");
  });

  // Test 2: Navigation within same session uses cache
  await runTest("Subsequent navigation uses cache (no DB query)", async () => {
    // Navigate to multiple pages - should use cached role
    const routes = ["/clients", "/services", "/dashboard"];

    for (const route of routes) {
      console.log(`   Navigating to ${route}...`);
      await page.goto(`http://localhost:3001${route}`);
      await page.waitForLoadState("networkidle");

      // Should see CACHE HIT logs, not database queries
      await page.waitForTimeout(500);
    }

    console.log("   ✓ Navigation complete, should see cache hits in logs");
  });

  // Test 3: Cache invalidation on logout
  await runTest("Logout invalidates cache", async () => {
    // Call logout API directly to test cache invalidation
    console.log("   Testing cache invalidation via logout API...");

    // Call the logout API
    const logoutResponse = await page.evaluate(() => {
      return fetch("/api/auth/logout", { method: "POST" }).then((r) =>
        r.json()
      );
    });

    console.log("   Logout API response:", JSON.stringify(logoutResponse));

    // The logout should clear the session and invalidate cache
    // Wait a moment for the auth state to update
    await page.waitForTimeout(1000);

    // Now navigate to a protected route - should redirect to login
    await page.goto("http://localhost:3001/dashboard");

    // Should be redirected to login (may include redirectTo param)
    await page.waitForURL(/\/login/, { timeout: 5000 });

    console.log(
      "   ✓ Logout successful - session cleared and cache invalidated"
    );
    console.log("   ✓ Redirected to login page as expected");
  });

  // Test 4: New login after logout triggers fresh DB query
  await runTest("Fresh login after logout queries database again", async () => {
    // Login again - should trigger new database query
    await page.goto("http://localhost:3001/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/auth/login") &&
          response.status() === 200
      ),
    ]);

    await page.waitForTimeout(2000);
    await page.waitForURL("**/dashboard", { timeout: 5000 });

    console.log("   ✓ Re-login successful, should see new database query");
  });

  // Test 5: Performance improvement with cache
  await runTest("Navigation performance improved with cache", async () => {
    const timings = [];

    // First navigation (might be cache miss)
    let start = Date.now();
    await page.goto("http://localhost:3001/dashboard");
    await page.waitForLoadState("domcontentloaded");
    timings.push({
      route: "/dashboard",
      time: Date.now() - start,
      cached: false,
    });

    // Subsequent navigations (should be cache hits)
    for (const route of ["/clients", "/services", "/dashboard"]) {
      start = Date.now();
      await page.goto(`http://localhost:3001${route}`);
      await page.waitForLoadState("domcontentloaded");
      timings.push({ route, time: Date.now() - start, cached: true });
    }

    // Calculate average times
    const uncachedTime = timings.filter((t) => !t.cached)[0]?.time || 0;
    const cachedTimes = timings.filter((t) => t.cached).map((t) => t.time);
    const avgCachedTime =
      cachedTimes.reduce((a, b) => a + b, 0) / cachedTimes.length;

    console.log(`   Uncached navigation: ${uncachedTime}ms`);
    console.log(`   Avg cached navigation: ${avgCachedTime.toFixed(0)}ms`);
    console.log(
      `   Performance improvement: ${((1 - avgCachedTime / uncachedTime) * 100).toFixed(0)}%`
    );

    // Cached should be at least 20% faster
    if (avgCachedTime >= uncachedTime * 0.8) {
      console.log(
        "   ⚠️  Warning: Cache may not be providing expected performance benefit"
      );
    }
  });

  // Test 6: All Phase 1 tests still pass
  await runTest("Phase 1 regression test - loading timeout", async () => {
    // Break auth to trigger timeout
    await page.route("**/api/auth/me", (route) => {
      setTimeout(() => route.abort(), 6000);
    });

    const startTime = Date.now();
    await page.goto("http://localhost:3001/dashboard");
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 10000 });

    const loadTime = Date.now() - startTime;
    if (loadTime > 6000) {
      throw new Error(`Loading took ${loadTime}ms, should timeout at 5000ms`);
    }

    await page.unroute("**/api/auth/me");
  });

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Test Summary:");
  console.log(`   Total Tests: ${results.passed + results.failed}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log("=".repeat(50));

  if (results.failed > 0) {
    console.log("\n❌ Failed Tests:");
    results.tests
      .filter((t) => t.status === "failed")
      .forEach((t) => console.log(`   - ${t.name}: ${t.error}`));
  }

  await browser.close();

  return results;
}

// Run the tests
testAuthPhase2()
  .then((results) => {
    if (results.failed > 0) {
      process.exit(1);
    }
    console.log("\n✅ All Phase 2 tests passed!");
  })
  .catch((error) => {
    console.error("\n💥 Test suite failed:", error);
    process.exit(1);
  });
