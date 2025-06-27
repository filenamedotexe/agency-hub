# 🚀 Stripe Setup Guide for Agency Hub (June 2025)

## ✅ Current Status

- ✅ Stripe MCP Server configured in `~/.cursor/mcp.json`
- ✅ Stripe test API keys already in `.env.local`
- ✅ Store feature flags configured
- 🔄 Next: Complete webhook setup and implementation

## 📋 Step-by-Step Setup Guide

### Step 1: ✅ Stripe Account Setup - COMPLETED

Your Stripe test account is already configured with:

- **Account ID**: `acct_1ReP5IDENEDA8swF` (from your API key)
- **Test Mode**: Active and ready
- **Dashboard Access**: https://dashboard.stripe.com/test/dashboard

### Step 2: ✅ MCP Configuration - COMPLETED

Your Stripe MCP is now configured with your test key:

```json
"stripe": {
  "command": "npx @modelcontextprotocol/stripe",
  "env": {
    "STRIPE_API_KEY": "sk_test_51ReP5I..." // ✅ Already configured
  }
}
```

**Action Required**: Restart Cursor to activate the Stripe MCP tools

### Step 3: ✅ Environment Variables - COMPLETED

Your `.env.local` already has all required Stripe configuration:

```env
# ✅ Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ReP5I...
STRIPE_SECRET_KEY=sk_test_51ReP5I...

# ✅ Store Configuration
NEXT_PUBLIC_STORE_ENABLED=true
STRIPE_SUCCESS_URL=http://localhost:3001/store/success
STRIPE_CANCEL_URL=http://localhost:3001/store/cart

# ✅ Business Settings
ENABLE_CONTRACTS=true
INVOICE_PREFIX=INV
INVOICE_STARTING_NUMBER=1000
```

### Step 4: Install Required Dependencies

```bash
# Stripe packages
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
npm install @types/stripe --save-dev

# Additional packages for the store feature
npm install @react-pdf/renderer signature_pad recharts
```

### Step 5: 🔄 Set Up Webhook Testing - REQUIRED

1. **Install Stripe CLI** (if not already installed):

   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows (using scoop)
   scoop install stripe

   # Or download from https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe CLI**:

   ```bash
   stripe login
   ```

3. **Start webhook forwarding** (run in separate terminal):

   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** to `.env.local`:
   ```env
   # Add this line to your .env.local
   STRIPE_WEBHOOK_SECRET=whsec_...  # Copy from stripe listen output
   ```

⚠️ **Note**: The webhook endpoint `/api/webhooks/stripe` needs to be created (see implementation section)

### Step 6: Configure Webhook Events in Dashboard

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Add endpoint (for production later): `https://yourdomain.com/api/webhooks/stripe`
3. Select events to listen for:
   - `checkout.session.completed` ✅
   - `payment_intent.succeeded` ✅
   - `payment_intent.failed` ✅
   - `charge.refunded` ✅
   - `customer.subscription.created` (if using subscriptions)
   - `customer.subscription.deleted` (if using subscriptions)

### Step 7: Database Setup

```bash
# Run the migration for store models
npm run db:generate
npx prisma migrate dev --name add-store-models-with-contracts
npm run db:push
```

## 🧪 Testing Your Integration

### Test Card Numbers

Use these in test mode (no real charges):

| Card Type          | Number                | Use Case                |
| ------------------ | --------------------- | ----------------------- |
| Success            | `4242 4242 4242 4242` | Successful payment      |
| Decline            | `4000 0000 0000 0002` | Card declined           |
| Insufficient Funds | `4000 0000 0000 9995` | Insufficient funds      |
| 3D Secure Required | `4000 0025 0000 3155` | Authentication required |
| Incorrect CVC      | `4000 0000 0000 0127` | Incorrect CVC           |

**For all test cards**: Use any future expiry date and any 3-digit CVC

### Testing Workflow

1. **Start your development server**:

   ```bash
   npm run dev
   ```

2. **In a second terminal, start webhook forwarding**:

   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```

3. **Test a purchase flow**:

   - Navigate to `/store`
   - Add items to cart
   - Proceed to checkout
   - Use test card `4242 4242 4242 4242`
   - Complete purchase
   - Verify webhook received in terminal

4. **Trigger test events manually**:
   ```bash
   stripe trigger payment_intent.succeeded
   stripe trigger checkout.session.completed
   ```

## 🔧 Implementation Status

### ✅ Completed:

- Stripe account with test API keys
- Environment variables configured
- MCP server configured
- Store feature flags enabled

### 🔄 Next Steps Required:

#### 1. Create Webhook Endpoint

Create `/src/app/api/webhooks/stripe/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      // Update order status, provision services
      await handleCheckoutComplete(session);
      break;

    case "payment_intent.succeeded":
      // Handle successful payment
      break;

    case "charge.refunded":
      // Handle refund
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutComplete(session: any) {
  // Implementation based on stripe_store_rollout_master.md
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PROCESSING",
      paymentStatus: "SUCCEEDED",
      stripeSessionId: session.id,
      paidAt: new Date(),
    },
  });
}
```

#### 2. Create Stripe Library File

Create `/src/lib/stripe.ts`:

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});
```

## 🎯 MCP Tools Available

After restarting Cursor, you'll have access to Stripe MCP tools:

- `mcp__stripe__create_payment_intent` - Create payment intents
- `mcp__stripe__list_customers` - List customers
- `mcp__stripe__create_customer` - Create customers
- `mcp__stripe__list_products` - List products
- `mcp__stripe__create_product` - Create products
- `mcp__stripe__create_checkout_session` - Create checkout sessions
- `mcp__stripe__list_invoices` - List invoices
- And more...

## ✅ Setup Progress Checklist

### Completed:

- ✅ Stripe account created and in test mode
- ✅ Test API keys added to `.env.local`
- ✅ MCP configuration updated with test key
- ✅ Store feature flags enabled

### Still Required:

- ☐ Install Stripe dependencies (`npm install stripe @stripe/stripe-js @stripe/react-stripe-js`)
- ☐ Run database migrations for store models
- ☐ Create webhook endpoint at `/api/webhooks/stripe`
- ☐ Add `STRIPE_WEBHOOK_SECRET` to `.env.local`
- ☐ Test webhook endpoint with Stripe CLI
- ☐ Create `/lib/stripe.ts` library file
- ☐ Implement store pages according to rollout plan

## 📝 Quick Implementation Checklist

```bash
# 1. Install dependencies
npm install stripe @stripe/stripe-js @stripe/react-stripe-js @types/stripe
npm install @react-pdf/renderer signature_pad recharts

# 2. Run database migration
npm run db:generate
npx prisma migrate dev --name add-store-models-with-contracts
npm run db:push

# 3. Start webhook forwarding (new terminal)
stripe listen --forward-to localhost:3001/api/webhooks/stripe
# Copy the webhook secret to .env.local

# 4. Test webhook
stripe trigger checkout.session.completed
```

## 🚨 Common Issues & Solutions

### Issue: MCP tools not showing up

**Solution**: Restart Cursor after updating `mcp.json`

### Issue: Webhook signature verification failing

**Solution**: Ensure `STRIPE_WEBHOOK_SECRET` matches the one from `stripe listen`

### Issue: 404 on webhook endpoint

**Solution**: Create `/api/webhooks/stripe/route.ts` file

### Issue: Payments failing in test mode

**Solution**: Ensure using test API keys (start with `sk_test_` and `pk_test_`)

## 📊 What You Can Do in Test Mode

✅ **Full Development Features**:

- Process unlimited test transactions
- Create products, prices, and customers
- Test all checkout flows
- Handle webhooks
- Issue refunds
- Generate invoices
- Test subscriptions and billing cycles
- Simulate various payment scenarios

❌ **Test Mode Limitations**:

- No real money movement
- No actual emails sent (receipts, invoices)
- Test data can be cleared anytime
- Some country-specific features limited

## 🚀 Ready for Production?

When ready to accept real payments, you'll need:

1. **Business Information**: Legal name, address, tax ID
2. **Bank Account**: For receiving payouts
3. **Identity Verification**: Government ID
4. **Live API Keys**: Replace test keys with live ones
5. **Production Webhook URL**: Update endpoint URL

## 📚 Resources & Next Steps

### Key Documentation:

- [Stripe Test Mode Documentation](https://stripe.com/docs/test-mode)
- [Webhook Testing Guide](https://stripe.com/docs/webhooks/test)
- [Agency Hub Store Implementation Plan](./stripe_store_rollout_master.md) - **Full implementation details**

### Implementation Phases (from master rollout):

1. **Phase 1**: Foundation (Database, Cart, UI) - Week 1
2. **Phase 2**: Stripe Integration & Contracts - Week 2
3. **Phase 3**: Order Management & Analytics - Week 3
4. **Phase 4**: Polish & Launch - Week 4

### Your Current Status:

- ✅ Prerequisites complete (Stripe account, API keys, MCP)
- 🎯 Ready to start Phase 1 implementation
- 📄 Follow `stripe_store_rollout_master.md` for detailed steps

## 🚀 Next Action Items

1. **Install dependencies** (see Quick Implementation Checklist above)
2. **Run database migrations** to create store tables
3. **Create webhook endpoint** using the code provided
4. **Start building** Phase 1 components from the master rollout plan

---

**Status**: Your Stripe setup is ~70% complete. The API configuration is done, but you need to implement the webhook endpoint and store components to start processing payments.

---

**Note**: This guide is specifically for test mode development. No real business or bank account needed to start building! 🎉
