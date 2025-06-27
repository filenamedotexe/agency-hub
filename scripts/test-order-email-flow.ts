import { config } from "dotenv";
config({ path: ".env.local" });

import { sendEmail, EmailTemplates } from "../src/lib/email";
import OrderConfirmationEmail from "../src/components/emails/order-confirmation";

async function testOrderEmailFlow() {
  console.log(
    "📧 Testing complete order email flow for zwieder22@gmail.com...\n"
  );

  const orderId = "TEST-" + Date.now();
  const clientEmail = "zwieder22@gmail.com";
  const clientName = "Test User";
  const orderTotal = 2500;
  const serviceName = "Professional Website Development";

  try {
    // 1. Order Confirmation Email
    console.log("1️⃣ Sending order confirmation email...");
    const orderConfirmation = await sendEmail({
      to: clientEmail,
      subject: `Order Confirmation #${orderId}`,
      react: OrderConfirmationEmail({
        orderId,
        clientName,
        total: orderTotal,
        items: [
          {
            name: serviceName,
            quantity: 1,
            price: orderTotal,
          },
        ],
        dashboardUrl: "http://localhost:3001/store/orders/" + orderId,
      }),
    });

    if (orderConfirmation.success) {
      console.log(
        "✅ Order confirmation sent:",
        orderConfirmation.data?.data?.id
      );
    } else {
      console.log("❌ Failed:", orderConfirmation.error);
    }

    // 2. Admin Notification
    console.log("\n2️⃣ Sending admin notification email...");
    const adminEmail = EmailTemplates.adminOrderNotification(
      orderId,
      clientName,
      orderTotal,
      [serviceName + " (1x)"]
    );

    const adminNotification = await sendEmail({
      to: process.env.ADMIN_EMAIL || "admin@example.com",
      ...adminEmail,
    });

    if (adminNotification.success) {
      console.log(
        "✅ Admin notification sent:",
        adminNotification.data?.data?.id
      );
    } else {
      console.log("❌ Failed:", adminNotification.error);
    }

    // 3. Contract Ready Email
    console.log("\n3️⃣ Sending contract ready email...");
    const contractEmail = EmailTemplates.contractReady(
      orderId,
      clientName,
      serviceName
    );

    const contractNotification = await sendEmail({
      to: clientEmail,
      ...contractEmail,
    });

    if (contractNotification.success) {
      console.log(
        "✅ Contract ready email sent:",
        contractNotification.data?.data?.id
      );
    } else {
      console.log("❌ Failed:", contractNotification.error);
    }

    // 4. Contract Signed Email
    console.log("\n4️⃣ Sending contract signed email...");
    const signedEmail = EmailTemplates.contractSigned(
      orderId,
      clientName,
      serviceName
    );

    const signedNotification = await sendEmail({
      to: clientEmail,
      ...signedEmail,
    });

    if (signedNotification.success) {
      console.log(
        "✅ Contract signed email sent:",
        signedNotification.data?.data?.id
      );
    } else {
      console.log("❌ Failed:", signedNotification.error);
    }

    // 5. Service Provisioned Email
    console.log("\n5️⃣ Sending service provisioned email...");
    const provisionedEmail = EmailTemplates.serviceProvisioned(
      orderId,
      clientName,
      serviceName
    );

    const provisionedNotification = await sendEmail({
      to: clientEmail,
      ...provisionedEmail,
    });

    if (provisionedNotification.success) {
      console.log(
        "✅ Service provisioned email sent:",
        provisionedNotification.data?.data?.id
      );
    } else {
      console.log("❌ Failed:", provisionedNotification.error);
    }

    // 6. Invoice Email
    console.log("\n6️⃣ Sending invoice email...");
    const invoiceEmail = EmailTemplates.invoiceGenerated(
      "INV-2025-" + Date.now().toString().slice(-6),
      clientName,
      orderTotal
    );

    const invoiceNotification = await sendEmail({
      to: clientEmail,
      ...invoiceEmail,
    });

    if (invoiceNotification.success) {
      console.log("✅ Invoice email sent:", invoiceNotification.data?.data?.id);
    } else {
      console.log("❌ Failed:", invoiceNotification.error);
    }

    console.log("\n✅ All emails sent to zwieder22@gmail.com!");
    console.log("📬 Please check the inbox for all 5 customer emails");
    console.log(
      "📬 Admin notification sent to:",
      process.env.ADMIN_EMAIL || "admin@example.com"
    );
  } catch (error) {
    console.error("Error in email flow:", error);
  }
}

testOrderEmailFlow();
