import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components";
import * as React from "react";

interface OrderConfirmationEmailProps {
  orderId: string;
  clientName: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  dashboardUrl: string;
}

export default function OrderConfirmationEmail({
  orderId,
  clientName,
  total,
  items,
  dashboardUrl,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Order #{orderId} confirmed - Agency Hub</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thank you for your order!</Heading>

          <Text style={text}>Hi {clientName},</Text>

          <Text style={text}>
            Your order has been confirmed and we&apos;re getting started on your
            services.
          </Text>

          <Section style={orderSection}>
            <Text style={orderHeader}>Order #{orderId}</Text>

            {items.map((item, index) => (
              <div key={index} style={itemRow}>
                <Text style={itemName}>{item.name}</Text>
                <Text style={itemDetails}>
                  Qty: {item.quantity} × ${(item.price / 100).toFixed(2)}
                </Text>
              </div>
            ))}

            <div style={totalRow}>
              <Text style={totalLabel}>Total</Text>
              <Text style={totalAmount}>${(total / 100).toFixed(2)}</Text>
            </div>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={dashboardUrl}>
              View Order Details
            </Button>
          </Section>

          <Text style={footer}>
            Best regards,
            <br />
            The Agency Hub Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "0 0 20px",
  padding: "0 48px",
};

const text = {
  color: "#555",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 10px",
  padding: "0 48px",
};

const orderSection = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  margin: "20px 48px",
  padding: "24px",
};

const orderHeader = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const itemRow = {
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: "12px",
  marginBottom: "12px",
};

const itemName = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0 0 4px",
};

const itemDetails = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
};

const totalRow = {
  borderTop: "2px solid #e5e7eb",
  marginTop: "16px",
  paddingTop: "16px",
  display: "flex",
  justifyContent: "space-between",
};

const totalLabel = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0",
};

const totalAmount = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0",
};

const buttonSection = {
  padding: "20px 48px",
};

const button = {
  backgroundColor: "#000",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "40px 0 0",
  padding: "0 48px",
};
