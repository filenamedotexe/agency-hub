import { config } from "dotenv";
config({ path: ".env.local" });

import { sendEmail, EmailTemplates } from "../src/lib/email";

async function testEmail() {
  console.log("📧 Testing email sending to zwieder22@gmail.com...\n");

  try {
    // Test order confirmation email
    const orderEmail = EmailTemplates.orderConfirmation(
      "TEST-ORDER-123",
      "Test User",
      2500
    );

    const result = await sendEmail({
      to: "zwieder22@gmail.com",
      ...orderEmail,
    });

    console.log("Email send result:", result);

    if (result.success) {
      console.log("✅ Email sent successfully!");
      console.log("Email ID:", result.data?.data?.id);
    } else {
      console.log("❌ Email failed to send");
      console.log("Error:", result.error);
    }
  } catch (error) {
    console.error("Error testing email:", error);
  }
}

testEmail();
