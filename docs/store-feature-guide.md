# 🛍️ Store Feature Guide

## Overview

The Agency Hub Store feature enables clients to browse and purchase services directly through a self-service portal. This guide covers setup, configuration, and usage of the store functionality.

## Table of Contents

1. [Features](#features)
2. [Setup & Configuration](#setup--configuration)
3. [Admin Guide](#admin-guide)
4. [Client Experience](#client-experience)
5. [Technical Implementation](#technical-implementation)
6. [Troubleshooting](#troubleshooting)

## Features

### Core Functionality

- **Service Catalog**: Browse available services with rich descriptions and pricing
- **Shopping Cart**: Add multiple services with quantity management
- **Secure Checkout**: Stripe-powered payment processing
- **Contract Management**: E-signature requirements for protected services
- **Order History**: Complete order tracking with status timeline
- **Sales Analytics**: Revenue dashboards and business metrics
- **Refund Management**: Full and partial refund processing

### Business Benefits

- **Increased Revenue**: Enable 24/7 self-service purchasing
- **Reduced Admin Work**: Automated service provisioning
- **Legal Protection**: Built-in contract requirements
- **Customer Insights**: Track lifetime value and purchase patterns
- **Professional Experience**: Modern e-commerce interface

## Setup & Configuration

### 1. Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Store Configuration
NEXT_PUBLIC_STORE_ENABLED=true
STRIPE_SUCCESS_URL=http://localhost:3001/store/success
STRIPE_CANCEL_URL=http://localhost:3001/store/cart

# Feature Flags
ENABLE_CONTRACTS=true

# Invoice Settings
INVOICE_PREFIX=INV
INVOICE_STARTING_NUMBER=1000
```

### 2. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from Dashboard → Developers → API keys
3. Configure webhook endpoint:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`

### 3. Database Setup

Run the migrations to create store-related tables:

```bash
npm run db:push
```

## Admin Guide

### Making Services Purchasable

1. Navigate to **Settings → Service Templates**
2. Edit a service template
3. Enable **"Available in Store"** toggle
4. Configure:
   - **Price**: Set the service price
   - **Store Title**: Customer-facing name
   - **Store Description**: Detailed description for store listing
   - **Max Quantity**: Limit per order
   - **Requires Contract**: Toggle if e-signature needed
   - **Contract Template**: Add agreement terms if contract required

### Managing Orders

1. Go to **Admin → Orders** to view all orders
2. Click any order to see:
   - Order timeline with status updates
   - Customer information
   - Payment details
   - Service provisioning status

### Processing Refunds

1. Open an order from the Orders dashboard
2. Click **"Process Refund"**
3. Choose refund type:
   - **Full Refund**: Returns entire payment
   - **Partial Refund**: Specify custom amount
4. Provide refund reason
5. Submit to process through Stripe

### Sales Analytics

Access comprehensive metrics at **Admin → Sales Analytics**:

- **Revenue Trends**: Daily/weekly/monthly charts
- **Top Services**: Best-selling services by revenue
- **Top Clients**: Clients ranked by lifetime value
- **Key Metrics**:
  - Total revenue
  - Order count
  - New customers
  - Average order value
  - Refund rate

## Client Experience

### Shopping Flow

1. **Browse Services**: Clients access the store at `/store`
2. **Search & Filter**: Find services by name, type, or price
3. **Add to Cart**: Select quantities and build their order
4. **Checkout**: Secure payment via Stripe
5. **Contract Signing**: E-signature if required
6. **Service Access**: Automatic provisioning upon completion

### Cart Management

- Items persist between sessions
- Quantity limits enforced
- Real-time price calculations
- Clear pricing display

### Order History

Clients can view their orders at `/store/orders` with:

- Order status timeline
- Payment receipts
- Contract copies
- Service activation status

## Technical Implementation

### Database Schema

Key models added for store functionality:

```prisma
// Service Template (extended)
model ServiceTemplate {
  isPurchasable    Boolean
  price            Decimal?
  stripePriceId    String?
  requiresContract Boolean
  contractTemplate String?
  // ... other fields
}

// Shopping Cart
model Cart {
  clientId String @unique
  items    CartItem[]
  expiresAt DateTime
}

// Orders
model Order {
  orderNumber    String @unique
  status         OrderStatus
  paymentStatus  PaymentStatus
  stripePaymentIntentId String?
  // ... other fields
}

// Contracts
model ServiceContract {
  orderId       String @unique
  signedAt      DateTime?
  signatureData Json?
}

// Analytics
model SalesMetrics {
  date          DateTime @unique
  revenue       Decimal
  orderCount    Int
  newCustomers  Int
}
```

### API Endpoints

```
# Store
GET  /api/store/services        # List purchasable services
POST /api/checkout             # Create Stripe checkout session

# Cart
GET    /api/cart               # Get current cart
POST   /api/cart/items         # Add item to cart
PATCH  /api/cart/items/:id     # Update quantity
DELETE /api/cart/items/:id     # Remove item
DELETE /api/cart               # Clear cart

# Orders
GET  /api/orders               # List client orders
GET  /api/orders/:id           # Order details
POST /api/admin/orders/:id/refund  # Process refund

# Contracts
POST /api/contracts/:orderId/sign  # Submit e-signature

# Analytics
GET /api/admin/analytics/sales     # Sales metrics
GET /api/admin/analytics/top-clients  # Client rankings
```

### Key Components

- `CartProvider`: Global cart state management
- `ServiceCard`: Product display component
- `ContractSignature`: E-signature capture
- `OrderTimeline`: Visual status tracking
- `SalesAnalytics`: Revenue dashboards

### Stripe Integration

Payment flow:

1. Create checkout session with line items
2. Redirect to Stripe hosted checkout
3. Handle webhook for payment confirmation
4. Create order and provision services
5. Send confirmation emails

## Troubleshooting

### Common Issues

**Cart not persisting**

- Check localStorage is enabled
- Verify cart API endpoints are working
- Ensure user is logged in as client

**Checkout fails**

- Verify Stripe keys are correct
- Check webhook configuration
- Ensure products have valid prices

**Contract signature not saving**

- Check canvas rendering
- Verify signature pad library loaded
- Test API endpoint directly

**Orders not showing**

- Confirm webhook is receiving events
- Check order creation in database
- Verify client associations

### Testing

Run the comprehensive test suite:

```bash
npm run test:e2e tests/store/purchase-flow.spec.ts
```

Test scenarios covered:

- Browse and search services
- Cart management
- Checkout flow
- Contract signing
- Order history
- Admin refunds
- Sales analytics

### Monitoring

Key metrics to track:

- Cart abandonment rate
- Checkout conversion rate
- Payment success rate
- Contract signature rate
- Average order value
- Refund rate

## Best Practices

1. **Service Descriptions**: Write clear, benefit-focused descriptions
2. **Pricing**: Set competitive prices with round numbers
3. **Contracts**: Keep agreements concise and readable
4. **Images**: Add service images when available (future feature)
5. **Categories**: Organize services logically
6. **Testing**: Always test full purchase flow after changes

## Future Enhancements

Planned improvements:

- Subscription/recurring payments
- Service bundles with discounts
- Promotional codes
- Abandoned cart recovery
- Multi-currency support
- Customer reviews
- Wishlist functionality

---

For technical support or feature requests, please contact the development team.
