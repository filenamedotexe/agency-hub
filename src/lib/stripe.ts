import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  typescript: true,
});

// Stripe service functions
export class StripeService {
  // Create Stripe Price for a service template
  async createPrice(serviceTemplate: any) {
    const price = await stripe.prices.create({
      currency: serviceTemplate.currency || "usd",
      unit_amount: Math.round(serviceTemplate.price * 100), // Convert to cents
      product_data: {
        name: serviceTemplate.storeTitle || serviceTemplate.name,
        metadata: {
          serviceTemplateId: serviceTemplate.id,
        },
      },
    });

    return price;
  }

  // Create checkout session
  async createCheckoutSession(
    order: any,
    successUrl: string,
    cancelUrl: string
  ) {
    const lineItems = order.items.map((item: any) => ({
      price_data: {
        currency: order.currency,
        unit_amount: Math.round(item.unitPrice * 100),
        product_data: {
          name: item.serviceName,
          metadata: {
            serviceTemplateId: item.serviceTemplateId,
            orderId: order.id,
            orderItemId: item.id,
          },
        },
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: order.client.email,
      client_reference_id: order.id,
      metadata: {
        orderId: order.id,
        clientId: order.clientId,
      },
    });

    return session;
  }

  // Create refund
  async createRefund(paymentIntentId: string, amount?: number) {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial refund support
    });

    return refund;
  }

  // Get customer insights
  async getCustomerMetrics(stripeCustomerId: string) {
    const charges = await stripe.charges.list({
      customer: stripeCustomerId,
      limit: 100,
    });

    const totalSpent = charges.data.reduce(
      (sum, charge) => sum + charge.amount / 100,
      0
    );

    return {
      totalSpent,
      transactionCount: charges.data.length,
      averageOrderValue: totalSpent / charges.data.length,
    };
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string | Buffer, signature: string) {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  }
}

export const stripeService = new StripeService();
