// Quick test script to verify booking modal functionality
// Run with: node test-booking-modal.js

const { chromium } = require("@playwright/test");

async function testBookingModal() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Login
    console.log("🔐 Logging in...");
    await page.goto("http://localhost:3001/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL("**/dashboard");
    await page.waitForLoadState("networkidle");

    // Navigate to calendar
    console.log("📅 Navigating to calendar...");
    await page.goto("http://localhost:3001/calendar");
    await page.waitForLoadState("networkidle");

    // Wait for loading spinner to disappear
    const loadingSpinner = page.locator('.animate-spin, text="Loading..."');
    try {
      await loadingSpinner.first().waitFor({ state: "hidden", timeout: 10000 });
    } catch {
      console.log("No loading spinner found or already hidden");
    }

    // Click New Booking button
    console.log("📝 Opening booking modal...");
    await page.click('button:has-text("New Booking")');
    await page.waitForTimeout(500); // Wait for modal animation

    // Test date picker
    console.log("📆 Testing date picker...");
    await page.click('button:has-text("Pick a date")');
    await page.waitForTimeout(500);

    // Click on a future date (find the first enabled date button)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayToClick = tomorrow.getDate().toString();

    await page.click(`button:has-text("${dayToClick}"):not([disabled])`);
    console.log("✅ Date selected");

    // Test time selection
    console.log("⏰ Testing time selection...");
    await page.click("text=Start Time");
    await page.waitForTimeout(200);
    await page.click('text="10:00 AM"');

    // Test duration button
    console.log("⏱️ Testing duration button...");
    await page.click('button:has-text("1 hour")');
    await page.waitForTimeout(500);

    // Fill in other fields
    console.log("📝 Filling form fields...");
    await page.fill(
      'input[placeholder*="Strategy Planning Session"]',
      "Test Booking from Script"
    );

    // Select client
    await page.click("text=Choose a client");
    await page.waitForTimeout(200);
    const firstClient = page.locator('[role="option"]').first();
    await firstClient.click();

    // Add description
    await page.fill(
      'textarea[placeholder*="Provide details"]',
      "This is a test booking created by the test script"
    );

    // Submit form
    console.log("💾 Submitting booking...");
    await page.click('button:has-text("Create Booking")');

    // Wait for modal to close
    await page.waitForTimeout(2000);

    // Check if booking appears on calendar
    const newBooking = page.locator('text="Test Booking from Script"');
    const isVisible = await newBooking.isVisible();

    if (isVisible) {
      console.log("✅ SUCCESS: Booking created and visible on calendar!");
    } else {
      console.log("❌ ERROR: Booking not visible on calendar");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

testBookingModal();
