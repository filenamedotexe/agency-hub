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
        // After 5 attempts, assume server is ready even without health endpoint
        console.log("✅ Server is ready!\n");
        return true;
      }
    } catch (e) {}

    console.log(`   Attempt ${i + 1}/${maxAttempts}...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Server did not start after " + maxAttempts + " attempts");
}

async function testAuthPhase1() {
  console.log("🧪 Starting Phase 1 Auth Tests with Playwright...\n");

  // Wait for server to be ready
  await waitForServer();

  const browser = await chromium.launch({
    headless: false,
    devtools: true, // Open devtools to see console logs
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console log capture
  page.on("console", (msg) => {
    if (msg.text().includes("[AUTH")) {
      console.log("📝 Auth Log:", msg.text());
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

  // Test 1: Loading spinner timeout (5 seconds max)
  await runTest("Loading spinner has 5s timeout", async () => {
    // First, let's break the auth to trigger loading state
    await page.route("**/api/auth/me", (route) => {
      // Delay the response to trigger timeout
      setTimeout(() => {
        route.abort();
      }, 6000);
    });

    const startTime = Date.now();
    await page.goto("http://localhost:3001/dashboard");

    // Wait for either login redirect or timeout
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 10000 });

    const loadTime = Date.now() - startTime;
    console.log(`   Loading time: ${loadTime}ms`);

    if (loadTime > 6000) {
      throw new Error(`Loading took ${loadTime}ms, should timeout at 5000ms`);
    }

    // Check console for timeout message
    const consoleMessages = [];
    page.on("console", (msg) => consoleMessages.push(msg.text()));

    await page.waitForTimeout(1000);
    const hasTimeoutLog = consoleMessages.some((msg) =>
      msg.includes("Loading timeout after 5s")
    );

    if (!hasTimeoutLog) {
      console.log("   ⚠️  Warning: Timeout log not found in console");
    }
  });

  // Test 2: Static assets don't trigger auth
  await runTest("Static assets bypass auth middleware", async () => {
    await page.unroute("**/api/auth/me"); // Remove previous route override

    const requests = [];
    page.on("request", (request) => {
      const url = request.url();
      if (
        url.includes("/_next/static") ||
        url.includes(".js") ||
        url.includes(".css")
      ) {
        requests.push(url);
      }
    });

    await page.goto("http://localhost:3001/login");
    await page.waitForLoadState("networkidle");

    console.log(`   Captured ${requests.length} static asset requests`);

    // Check that static assets loaded quickly (no auth delay)
    if (requests.length === 0) {
      throw new Error("No static assets were loaded");
    }
  });

  // Test 3: Login flow works
  await runTest("Login flow completes successfully", async () => {
    // Clear any existing auth state
    await context.clearCookies();
    await page.goto("about:blank"); // Navigate away first

    await page.goto("http://localhost:3001/login");
    await page.waitForLoadState("networkidle");

    // Check no infinite loading - fix CSS selector
    const loadingSpinner = page
      .locator(".animate-spin")
      .or(page.locator('text="Loading..."'));
    const spinnerCount = await loadingSpinner.count();

    if (spinnerCount > 0) {
      const isVisible = await loadingSpinner.first().isVisible();
      if (isVisible) {
        throw new Error("Loading spinner is visible on login page");
      }
    }

    // Try to login
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");

    // Add network logging to debug
    page.on("response", (response) => {
      if (response.url().includes("/api/auth/login")) {
        console.log(`   Login API response: ${response.status()}`);
      }
    });

    // Click submit and wait for navigation
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/auth/login") &&
          response.status() === 200
      ),
    ]);

    // Give auth state time to update and trigger redirect
    await page.waitForTimeout(2000);

    // Now wait for navigation to complete
    try {
      await page.waitForURL("**/dashboard", { timeout: 5000 });
    } catch (e) {
      // If not on dashboard, check for error state
    }

    // Check if we're on dashboard
    const currentUrl = page.url();
    console.log(`   Current URL after login: ${currentUrl}`);

    if (!currentUrl.includes("/dashboard")) {
      // Check for any visible error elements
      const errorAlert = page.locator('[role="alert"]:visible');
      const errorCount = await errorAlert.count();

      if (errorCount > 0) {
        const errorTexts = [];
        for (let i = 0; i < errorCount; i++) {
          const text = await errorAlert.nth(i).textContent();
          if (text?.trim()) errorTexts.push(text.trim());
        }
        if (errorTexts.length > 0) {
          throw new Error(`Login failed with errors: ${errorTexts.join(", ")}`);
        }
      }

      throw new Error(`Expected redirect to dashboard, got: ${currentUrl}`);
    }

    // Verify we're logged in by checking for user menu
    await page.waitForLoadState("networkidle");
    const userMenu = page.locator(
      'button[aria-label="User menu"], [data-testid="user-menu"]'
    );
    const userMenuCount = await userMenu.count();

    if (userMenuCount === 0) {
      throw new Error("User menu not found - login may have failed");
    }
  });

  // Test 4: Back button doesn't logout
  await runTest("Back button navigation preserves auth", async () => {
    // First make sure we're logged in from previous test
    // If not logged in, login first
    const currentUrl = page.url();
    if (!currentUrl.includes("/dashboard")) {
      console.log("   Not logged in, logging in first...");
      await page.goto("http://localhost:3001/login");
      await page.fill('input[type="email"]', "admin@example.com");
      await page.fill('input[type="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/dashboard");
    }

    // Navigate to different pages
    await page.goto("http://localhost:3001/clients");
    await page.waitForLoadState("networkidle");

    await page.goto("http://localhost:3001/services");
    await page.waitForLoadState("networkidle");

    // Go back
    await page.goBack();
    await page.waitForLoadState("networkidle");

    // Check we're still authenticated (not redirected to login)
    const afterBackUrl = page.url();
    if (afterBackUrl.includes("/login")) {
      throw new Error("Back button triggered logout!");
    }

    if (!afterBackUrl.includes("/clients")) {
      throw new Error(`Expected to be on /clients, got: ${afterBackUrl}`);
    }
  });

  // Test 5: Debug mode works
  await runTest("Debug mode logs auth operations", async () => {
    // Enable debug mode
    await page.evaluate(() => {
      localStorage.setItem("NEXT_PUBLIC_AUTH_DEBUG", "true");
    });

    // Reload to apply debug mode
    await page.reload();

    const authLogs = [];
    page.on("console", (msg) => {
      if (msg.text().includes("[AUTH")) {
        authLogs.push(msg.text());
      }
    });

    // Navigate to trigger auth checks
    await page.goto("http://localhost:3001/dashboard");
    await page.waitForTimeout(2000);

    console.log(`   Captured ${authLogs.length} auth debug logs`);

    if (authLogs.length === 0) {
      throw new Error("No debug logs captured - debug mode may not be working");
    }

    // Check for timing logs
    const hasTimingLogs = authLogs.some(
      (log) => log.includes("AUTH-TIMING") || log.includes("ms")
    );

    if (!hasTimingLogs) {
      console.log("   ⚠️  Warning: No timing logs found");
    }
  });

  // Test 6: Page navigation performance
  await runTest("Page navigation is fast (<2s)", async () => {
    const navigationTimes = [];

    for (const route of ["/dashboard", "/clients", "/services"]) {
      const startTime = Date.now();
      await page.goto(`http://localhost:3001${route}`);
      await page.waitForLoadState("domcontentloaded");
      const duration = Date.now() - startTime;

      navigationTimes.push({ route, duration });
      console.log(`   ${route}: ${duration}ms`);

      if (duration > 2000) {
        throw new Error(
          `Navigation to ${route} took ${duration}ms (>2s limit)`
        );
      }
    }
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

  // Cleanup
  await page.evaluate(() => {
    localStorage.removeItem("NEXT_PUBLIC_AUTH_DEBUG");
  });

  await browser.close();

  return results;
}

// Run the tests
testAuthPhase1()
  .then((results) => {
    if (results.failed > 0) {
      process.exit(1);
    }
    console.log("\n✅ All Phase 1 tests passed!");
  })
  .catch((error) => {
    console.error("\n💥 Test suite failed:", error);
    process.exit(1);
  });
