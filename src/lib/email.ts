import { Resend } from "resend";

let resend: Resend;

function getResendClient() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[EMAIL] RESEND_API_KEY not found, emails will not be sent");
      return null;
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  react?: React.ReactElement;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const resendClient = getResendClient();
    if (!resendClient) {
      console.log("[EMAIL] Skipping email send - no API key configured");
      return { success: false, error: "No API key configured" };
    }

    const { to, subject, react, html, text, from, replyTo } = options;

    const data = await resendClient.emails.send({
      from:
        from ||
        process.env.EMAIL_FROM ||
        "Agency Hub <notifications@agencyhub.com>",
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      html,
      text,
      replyTo,
    });

    console.log("[EMAIL] Sent successfully:", {
      to,
      subject,
      id: data.data?.id,
    });
    return { success: true, data };
  } catch (error) {
    console.error("[EMAIL] Failed to send:", error);
    return { success: false, error };
  }
}

// Email templates
export const EmailTemplates = {
  orderConfirmation: (orderId: string, clientName: string, total: number) => ({
    subject: `Order Confirmation #${orderId}`,
    html: `
      <h1>Thank you for your order!</h1>
      <p>Hi ${clientName},</p>
      <p>Your order #${orderId} has been confirmed.</p>
      <p><strong>Total: $${(total / 100).toFixed(2)}</strong></p>
      <p>You can view your order details in your dashboard.</p>
      <p>Best regards,<br>Agency Hub Team</p>
    `,
  }),

  contractReady: (
    orderId: string,
    clientName: string,
    serviceName: string
  ) => ({
    subject: `Contract Ready for Signing - ${serviceName}`,
    html: `
      <h1>Your contract is ready!</h1>
      <p>Hi ${clientName},</p>
      <p>The contract for your ${serviceName} purchase (Order #${orderId}) is ready for signing.</p>
      <p>Please log in to your dashboard to review and sign the contract.</p>
      <p>Best regards,<br>Agency Hub Team</p>
    `,
  }),

  contractSigned: (
    orderId: string,
    clientName: string,
    serviceName: string
  ) => ({
    subject: `Contract Signed - ${serviceName}`,
    html: `
      <h1>Contract successfully signed!</h1>
      <p>Hi ${clientName},</p>
      <p>Thank you for signing the contract for ${serviceName} (Order #${orderId}).</p>
      <p>Your service is being provisioned and will be available shortly.</p>
      <p>Best regards,<br>Agency Hub Team</p>
    `,
  }),

  serviceProvisioned: (
    orderId: string,
    clientName: string,
    serviceName: string
  ) => ({
    subject: `Service Activated - ${serviceName}`,
    html: `
      <h1>Your service is now active!</h1>
      <p>Hi ${clientName},</p>
      <p>Great news! Your ${serviceName} service (Order #${orderId}) has been activated.</p>
      <p>You can now access and manage your service from your dashboard.</p>
      <p>Best regards,<br>Agency Hub Team</p>
    `,
  }),

  invoiceGenerated: (
    invoiceNumber: string,
    clientName: string,
    total: number
  ) => ({
    subject: `Invoice ${invoiceNumber} Available`,
    html: `
      <h1>Your invoice is ready</h1>
      <p>Hi ${clientName},</p>
      <p>Invoice ${invoiceNumber} for $${(total / 100).toFixed(2)} has been generated.</p>
      <p>You can download it from your dashboard.</p>
      <p>Best regards,<br>Agency Hub Team</p>
    `,
  }),

  refundProcessed: (orderId: string, clientName: string, amount: number) => ({
    subject: `Refund Processed - Order #${orderId}`,
    html: `
      <h1>Refund processed</h1>
      <p>Hi ${clientName},</p>
      <p>Your refund of $${(amount / 100).toFixed(2)} for Order #${orderId} has been processed.</p>
      <p>The funds should appear in your account within 5-10 business days.</p>
      <p>Best regards,<br>Agency Hub Team</p>
    `,
  }),

  adminOrderNotification: (
    orderId: string,
    clientName: string,
    total: number,
    items: string[]
  ) => ({
    subject: `New Order #${orderId} - $${(total / 100).toFixed(2)}`,
    html: `
      <h1>New order received!</h1>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Customer:</strong> ${clientName}</p>
      <p><strong>Total:</strong> $${(total / 100).toFixed(2)}</p>
      <p><strong>Items:</strong></p>
      <ul>
        ${items.map((item) => `<li>${item}</li>`).join("")}
      </ul>
      <p>View details in the admin dashboard.</p>
    `,
  }),
};
