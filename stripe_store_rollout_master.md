# 🛍️ Stripe Store Feature - Master Implementation Plan

## 📋 Table of Contents

1. [Overview & Goals](#overview--goals)
2. [Prerequisites & Setup](#prerequisites--setup)
3. [Database Schema Updates](#database-schema-updates)
4. [Implementation Phases](#implementation-phases)
5. [Detailed Implementation Steps](#detailed-implementation-steps)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Checklist](#deployment-checklist)
8. [Post-Launch Monitoring](#post-launch-monitoring)

## 🎯 Overview & Goals

### Feature Description

Add a Store/Shop feature to Agency Hub that allows clients to purchase services à la carte using Stripe payments. Services purchased through the store will automatically be provisioned to the client's account with proper contracts, invoicing, and business intelligence.

### Key Goals

- Enable self-service purchasing for clients
- Automate service provisioning after payment
- Protect agency with e-signature contracts
- Track client lifetime value and revenue metrics
- Provide professional invoicing
- Create new revenue stream through impulse purchases
- Maintain existing service management workflow

### Success Metrics

- Store conversion rate (visitors → purchases)
- Average order value
- Client lifetime value growth
- Time saved on manual service assignment
- Contract signature rate
- Payment success rate
- Revenue trends

## 🔧 Prerequisites & Setup

### 1. **Stripe Account Setup**

```bash
# Required Stripe configurations
1. Create Stripe account at https://stripe.com
2. Get API keys from Dashboard → Developers → API keys
   - Publishable key: pk_test_... (for frontend)
   - Secret key: sk_test_... (for backend)
3. Set up webhook endpoint
4. Configure webhook events (see webhook section)
```

### 2. **Environment Variables**

```env
# Add to .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STORE_ENABLED=true
STRIPE_SUCCESS_URL=http://localhost:3001/store/success
STRIPE_CANCEL_URL=http://localhost:3001/store/cart

# New additions
ENABLE_CONTRACTS=true
INVOICE_PREFIX=INV
INVOICE_STARTING_NUMBER=1000
```

### 3. **Dependencies to Install**

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
npm install @types/stripe --save-dev
npm install @react-pdf/renderer  # For invoice generation
npm install signature_pad       # For e-signatures
npm install recharts            # For analytics dashboard
```

### 4. **MCP Setup (Stripe MCP)**

```bash
# Install MCP CLI if not already installed
npm install -g @modelcontextprotocol/cli

# Configure Stripe MCP
mcp config add stripe
# Follow prompts to add Stripe API key
```

## 🗄️ Database Schema Updates

### 1. **Update Prisma Schema**

```prisma
// Add to schema.prisma

// Update existing ServiceTemplate model
model ServiceTemplate {
  // ... existing fields ...

  // Store-specific fields
  isPurchasable    Boolean   @default(false)
  price            Decimal?  @db.Decimal(10, 2)
  currency         String    @default("USD")
  stripePriceId    String?   @unique
  storeTitle       String?
  storeDescription String?   @db.Text
  storeImages      Json?     // Array of image URLs
  maxQuantity      Int       @default(1)
  sortOrder        Int       @default(0)

  // Contract requirements
  requiresContract Boolean   @default(false)
  contractTemplate String?   @db.Text

  // Relations
  cartItems        CartItem[]
  orderItems       OrderItem[]

  @@index([isPurchasable, sortOrder])
}

// Update Client model for LTV tracking
model Client {
  // ... existing fields ...

  // Business metrics
  lifetimeValue    Decimal   @default(0) @db.Decimal(10, 2)
  totalOrders      Int       @default(0)
  lastOrderDate    DateTime?
  firstOrderDate   DateTime?

  // Relations
  carts            Cart[]
  orders           Order[]

  @@index([lifetimeValue])
}

model Cart {
  id          String     @id @default(uuid())
  clientId    String     @unique
  items       CartItem[]
  expiresAt   DateTime
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  client      Client     @relation(fields: [clientId], references: [id])

  @@map("carts")
}

model CartItem {
  id                String          @id @default(uuid())
  cartId            String
  serviceTemplateId String
  quantity          Int             @default(1)
  addedAt           DateTime        @default(now())

  cart              Cart            @relation(fields: [cartId], references: [id], onDelete: Cascade)
  serviceTemplate   ServiceTemplate @relation(fields: [serviceTemplateId], references: [id])

  @@unique([cartId, serviceTemplateId])
  @@map("cart_items")
}

model Order {
  id                    String        @id @default(uuid())
  orderNumber           String        @unique @default(cuid())
  clientId              String
  status                OrderStatus   @default(PENDING)
  subtotal              Decimal       @db.Decimal(10, 2)
  tax                   Decimal       @default(0) @db.Decimal(10, 2)
  total                 Decimal       @db.Decimal(10, 2)
  currency              String        @default("USD")
  stripePaymentIntentId String?       @unique
  stripeSessionId       String?       @unique
  paymentMethod         String?
  paymentStatus         PaymentStatus @default(PENDING)
  metadata              Json?
  notes                 String?       // Special instructions from checkout
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt
  paidAt                DateTime?
  completedAt           DateTime?

  client                Client        @relation(fields: [clientId], references: [id])
  items                 OrderItem[]
  contract              ServiceContract?
  invoice               Invoice?
  timeline              OrderTimeline[]

  @@index([clientId])
  @@index([status])
  @@index([createdAt])
  @@map("orders")
}

model OrderItem {
  id                String          @id @default(uuid())
  orderId           String
  serviceTemplateId String
  serviceName       String          // Snapshot of name at purchase time
  quantity          Int             @default(1)
  unitPrice         Decimal         @db.Decimal(10, 2)
  total             Decimal         @db.Decimal(10, 2)
  metadata          Json?
  serviceId         String?         // Created service reference

  order             Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  serviceTemplate   ServiceTemplate @relation(fields: [serviceTemplateId], references: [id])
  service           Service?        @relation(fields: [serviceId], references: [id])

  @@map("order_items")
}

// Service Contract with E-Signature
model ServiceContract {
  id                String    @id @default(uuid())
  orderId           String    @unique
  templateContent   String    @db.Text
  signedAt          DateTime?
  signatureData     Json?     // Canvas signature data
  signedByName      String?
  signedByEmail     String?
  ipAddress         String?
  userAgent         String?

  order             Order     @relation(fields: [orderId], references: [id])

  @@map("service_contracts")
}

// Professional Invoicing
model Invoice {
  id          String    @id @default(uuid())
  number      String    @unique // INV-2024-0001
  orderId     String    @unique
  pdfUrl      String?
  sentAt      DateTime?
  dueDate     DateTime?

  order       Order     @relation(fields: [orderId], references: [id])

  @@index([number])
  @@map("invoices")
}

// Order Status Timeline
model OrderTimeline {
  id          String    @id @default(uuid())
  orderId     String
  status      String
  title       String
  description String?
  completedAt DateTime?
  createdAt   DateTime  @default(now())

  order       Order     @relation(fields: [orderId], references: [id])

  @@map("order_timeline")
}

// Analytics for Revenue Dashboard
model SalesMetrics {
  id              String   @id @default(uuid())
  date            DateTime @db.Date
  revenue         Decimal  @db.Decimal(10, 2)
  orderCount      Int
  newCustomers    Int
  avgOrderValue   Decimal  @db.Decimal(10, 2)
  refundAmount    Decimal  @default(0) @db.Decimal(10, 2)
  contractsSigned Int      @default(0)

  @@unique([date])
  @@index([date])
  @@map("sales_metrics")
}

// Add to existing Service model
model Service {
  // ... existing fields ...
  orderItem         OrderItem?
}

enum OrderStatus {
  PENDING
  AWAITING_CONTRACT
  PROCESSING
  COMPLETED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  CANCELLED
  REFUNDED
}
```

### 2. **Run Migrations**

```bash
# Generate Prisma client
npm run db:generate

# Create migration
npx prisma migrate dev --name add-store-models-with-contracts

# Push to database
npm run db:push
```

## 📊 Implementation Phases

### Phase 1: Foundation (Week 1) ✅

- ✅ Database schema updates
- ✅ Basic store page UI
- ✅ Service template store settings
- ✅ Cart functionality (localStorage + API)
- ✅ "My Services" dashboard widget

### Phase 2: Stripe Integration & Contracts (Week 2) ✅

- ✅ Stripe checkout flow
- ✅ Payment processing
- ✅ Webhook handling
- ✅ Order creation
- ✅ E-signature contract system
- ✅ Service access blocking until signed

### Phase 3: Order Management & Analytics (Week 3) ✅

- ✅ Order history page with timeline
- ✅ Admin order management
- ✅ Service auto-provisioning
- ✅ Email notifications
- ✅ Invoice generation
- ✅ Sales analytics dashboard
- ✅ Client LTV tracking

### Phase 4: Polish & Launch (Week 4)

- UI/UX improvements
- Refund management UI
- Testing & bug fixes
- Documentation
- Gradual rollout

## 🚀 Detailed Implementation Steps

### Phase 1: Foundation

#### 1.1 **Update Service Templates Admin UI**

```typescript
// src/app/(dashboard)/settings/service-templates/components/service-template-form.tsx
// Add store settings fields to existing form

const storeSettingsSchema = z.object({
  isPurchasable: z.boolean().default(false),
  price: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  storeTitle: z.string().optional(),
  storeDescription: z.string().optional(),
  storeImages: z.array(z.string().url()).optional(),
  maxQuantity: z.number().min(1).default(1),
  requiresContract: z.boolean().default(false),
  contractTemplate: z.string().optional(),
});

// Add to form:
<div className="space-y-4">
  <h3 className="text-lg font-medium">Store Settings</h3>

  <FormField
    control={form.control}
    name="isPurchasable"
    render={({ field }) => (
      <FormItem className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <FormLabel>Available in Store</FormLabel>
          <FormDescription>
            Allow clients to purchase this service directly
          </FormDescription>
        </div>
        <FormControl>
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        </FormControl>
      </FormItem>
    )}
  />

  {watchIsPurchasable && (
    <>
      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Price</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="99.99"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="requiresContract"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel>Require Contract Signature</FormLabel>
              <FormDescription>
                Client must sign service agreement before access
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {watchRequiresContract && (
        <FormField
          control={form.control}
          name="contractTemplate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contract Template</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your service agreement terms..."
                  className="min-h-[200px] font-mono text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Use {{clientName}}, {{serviceName}}, {{price}} for dynamic fields
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="storeDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Store Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Detailed description for store listing..."
                {...field}
              />
            </FormControl>
            <FormDescription>
              This will be shown on the store product page
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )}
</div>
```

#### 1.2 **Create "My Services" Dashboard Widget**

```typescript
// src/components/dashboard/my-services-widget.tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowRight, Package, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export function MyServicesWidget() {
  const { data: services, isLoading } = useQuery({
    queryKey: ['my-active-services'],
    queryFn: async () => {
      const response = await fetch('/api/client/services?status=active');
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!services?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No active services yet</p>
          <Button asChild>
            <Link href="/store">Browse Services</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>My Active Services</span>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/services">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {services.slice(0, 3).map((service: any) => (
            <div key={service.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-gray-600">
                    {service.completedTasks}/{service.totalTasks} tasks completed
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/services/${service.id}`}>View</Link>
                </Button>
              </div>
              <Progress
                value={(service.completedTasks / service.totalTasks) * 100}
                className="h-2"
              />
              {service.nextMilestone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Next: {service.nextMilestone.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 1.3 **Create Store Page Structure**

```
/src/app/(dashboard)/store/
  ├── page.tsx                    // Store homepage with service grid
  ├── [serviceTemplateId]/
  │   └── page.tsx               // Service detail page
  ├── cart/
  │   └── page.tsx               // Shopping cart
  ├── checkout/
  │   └── page.tsx               // Checkout flow
  ├── success/
  │   └── page.tsx               // Success page with contract flow
  ├── orders/
  │   ├── page.tsx               // Order history
  │   └── [orderId]/
  │       └── page.tsx           // Order detail with timeline
  └── components/
      ├── store-header.tsx       // Cart icon, search
      ├── service-card.tsx       // Product card
      ├── add-to-cart-button.tsx // Add to cart functionality
      ├── cart-sidebar.tsx       // Slide-out cart
      ├── cart-provider.tsx      // Cart context
      └── order-timeline.tsx     // Visual order status
```

#### 1.4 **Create Cart Context & Provider**

```typescript
// src/contexts/cart-context.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

interface CartItem {
  serviceTemplateId: string;
  quantity: number;
  serviceTemplate: {
    id: string;
    name: string;
    price: number;
    storeTitle?: string;
    maxQuantity: number;
  };
}

interface CartContextType {
  items: CartItem[];
  addToCart: (serviceTemplateId: string, quantity?: number) => Promise<void>;
  removeFromCart: (serviceTemplateId: string) => void;
  updateQuantity: (serviceTemplateId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage or API
  useEffect(() => {
    if (user?.role === 'CLIENT') {
      loadCart();
    }
  }, [user]);

  const loadCart = async () => {
    // Try localStorage first for immediate load
    const localCart = localStorage.getItem('cart');
    if (localCart) {
      setItems(JSON.parse(localCart));
    }

    // Then sync with API
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        localStorage.setItem('cart', JSON.stringify(data.items || []));
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (serviceTemplateId: string, quantity = 1) => {
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceTemplateId, quantity }),
      });

      if (!response.ok) throw new Error('Failed to add to cart');

      const updatedCart = await response.json();
      setItems(updatedCart.items);
      localStorage.setItem('cart', JSON.stringify(updatedCart.items));
      toast.success('Added to cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const removeFromCart = async (serviceTemplateId: string) => {
    try {
      const response = await fetch(`/api/cart/items/${serviceTemplateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove from cart');

      const updatedCart = await response.json();
      setItems(updatedCart.items);
      localStorage.setItem('cart', JSON.stringify(updatedCart.items));
    } catch (error) {
      toast.error('Failed to remove from cart');
    }
  };

  const updateQuantity = async (serviceTemplateId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(serviceTemplateId);
      return;
    }

    try {
      const response = await fetch(`/api/cart/items/${serviceTemplateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) throw new Error('Failed to update quantity');

      const updatedCart = await response.json();
      setItems(updatedCart.items);
      localStorage.setItem('cart', JSON.stringify(updatedCart.items));
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to clear cart');

      setItems([]);
      localStorage.removeItem('cart');
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) =>
      sum + (item.serviceTemplate.price * item.quantity), 0
    );
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      isLoading,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
```

### Phase 2: Stripe Integration & Contracts

#### 2.1 **Create Stripe Service with MCP**

```typescript
// src/lib/stripe.ts
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
        description: serviceTemplate.storeDescription,
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
```

#### 2.2 **Create Contract Signature Component**

```typescript
// src/components/store/contract-signature.tsx
"use client";

import { useRef, useState } from 'react';
import SignaturePad from 'signature_pad';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ContractSignatureProps {
  contractContent: string;
  orderId: string;
  onComplete: () => void;
}

export function ContractSignature({
  contractContent,
  orderId,
  onComplete
}: ContractSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const pad = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
      });
      setSignaturePad(pad);

      // Resize canvas
      const resizeCanvas = () => {
        const canvas = canvasRef.current!;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d')!.scale(ratio, ratio);
        pad.clear();
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        pad.off();
      };
    }
  }, []);

  const clearSignature = () => {
    signaturePad?.clear();
  };

  const submitSignature = async () => {
    if (!signaturePad || signaturePad.isEmpty()) {
      toast.error('Please provide your signature');
      return;
    }

    if (!fullName || !email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSigning(true);

    try {
      const signatureData = signaturePad.toDataURL();

      const response = await fetch(`/api/contracts/${orderId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureData,
          fullName,
          email,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit signature');

      toast.success('Contract signed successfully!');
      onComplete();
    } catch (error) {
      toast.error('Failed to sign contract');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Agreement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-h-96 overflow-y-auto mb-6 p-4 bg-gray-50 rounded">
            <div dangerouslySetInnerHTML={{ __html: contractContent }} />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Signature</Label>
              <div className="border rounded-md p-2 bg-white">
                <canvas
                  ref={canvasRef}
                  className="w-full h-32 border rounded"
                  style={{ touchAction: 'none' }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSignature}
                className="mt-2"
              >
                Clear Signature
              </Button>
            </div>

            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                By signing, you agree to the terms of this service agreement
              </p>
              <Button
                onClick={submitSignature}
                disabled={isSigning}
              >
                {isSigning ? 'Signing...' : 'Sign & Continue'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 2.3 **Create Success Page with Contract Flow**

```typescript
// src/app/(dashboard)/store/success/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, FileText } from 'lucide-react';
import { ContractSignature } from '../components/contract-signature';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error('Failed to fetch order');
      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContractComplete = () => {
    router.push('/services');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Order not found</p>
      </div>
    );
  }

  // Check if any services require contract
  const requiresContract = order.items.some((item: any) =>
    item.serviceTemplate.requiresContract
  );

  if (requiresContract && !order.contract?.signedAt) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-gray-600">
            Please sign the service agreement to activate your services
          </p>
        </div>

        <ContractSignature
          contractContent={order.items[0].serviceTemplate.contractTemplate}
          orderId={order.id}
          onComplete={handleContractComplete}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-3xl font-bold mb-2">Order Complete!</h1>
      <p className="text-gray-600 mb-8">
        Your order #{order.orderNumber} has been confirmed and your services are being set up.
      </p>

      <div className="space-y-4">
        <Button asChild>
          <Link href="/services">View Your Services</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/store/orders">View Order History</Link>
        </Button>
      </div>
    </div>
  );
}
```

### Phase 3: Order Management & Analytics

#### 3.1 **Order Timeline Component**

```typescript
// src/components/store/order-timeline.tsx
"use client";

import { CheckCircle, Circle, Clock, CreditCard, FileText, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  completedAt?: string;
  status: 'completed' | 'current' | 'upcoming';
  icon: 'payment' | 'contract' | 'setup' | 'active' | 'delivered';
}

interface OrderTimelineProps {
  items: TimelineItem[];
}

export function OrderTimeline({ items }: OrderTimelineProps) {
  const getIcon = (type: string, status: string) => {
    const iconProps = {
      className: cn(
        "h-5 w-5",
        status === 'completed' ? 'text-green-600' :
        status === 'current' ? 'text-blue-600' :
        'text-gray-400'
      )
    };

    switch (type) {
      case 'payment':
        return <CreditCard {...iconProps} />;
      case 'contract':
        return <FileText {...iconProps} />;
      case 'setup':
        return <Clock {...iconProps} />;
      case 'active':
        return <Package {...iconProps} />;
      default:
        return <Circle {...iconProps} />;
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {items.map((item, idx) => (
          <li key={item.id}>
            <div className="relative pb-8">
              {idx !== items.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white",
                      item.status === 'completed' ? 'bg-green-500' :
                      item.status === 'current' ? 'bg-blue-500' :
                      'bg-gray-300'
                    )}
                  >
                    {item.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      getIcon(item.icon, item.status)
                    )}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className={cn(
                      "text-sm",
                      item.status === 'completed' ? 'text-gray-900' : 'text-gray-500'
                    )}>
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-sm text-gray-500">{item.description}</p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    {item.completedAt && (
                      <time dateTime={item.completedAt}>
                        {new Date(item.completedAt).toLocaleDateString()}
                      </time>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### 3.2 **Sales Analytics Dashboard**

```typescript
// src/app/(dashboard)/admin/sales/page.tsx
"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { ArrowUp, ArrowDown, DollarSign, Users, Package, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function SalesAnalyticsPage() {
  const [dateRange, setDateRange] = useState('30'); // days

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['sales-metrics', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/analytics/sales?days=${dateRange}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
  });

  const { data: topClients } = useQuery({
    queryKey: ['top-clients-ltv'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics/top-clients');
      if (!response.ok) throw new Error('Failed to fetch top clients');
      return response.json();
    },
  });

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Analytics</h1>
        <p className="text-gray-600">Track revenue, orders, and client metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.totalRevenue || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.revenueChange > 0 ? (
                <span className="text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3" />
                  {metrics.revenueChange}% from last period
                </span>
              ) : (
                <span className="text-red-600 flex items-center">
                  <ArrowDown className="h-3 w-3" />
                  {Math.abs(metrics?.revenueChange || 0)}% from last period
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg order value: ${metrics?.avgOrderValue || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.newCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">
              This {dateRange === '30' ? 'month' : 'period'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refund Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.refundRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              ${metrics?.refundAmount || 0} refunded
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="services">Top Services</TabsTrigger>
          <TabsTrigger value="clients">Top Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={metrics?.revenueChart || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => `$${value}`}
                    labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Services by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={metrics?.topServices || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${value}`} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Clients by Lifetime Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClients?.map((client: any, index: number) => (
                  <div key={client.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-gray-400">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{client.businessName}</p>
                        <p className="text-sm text-gray-600">
                          {client.totalOrders} orders • First order {format(new Date(client.firstOrderDate), 'MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${client.lifetimeValue}</p>
                      <p className="text-sm text-gray-600">
                        Avg ${(client.lifetimeValue / client.totalOrders).toFixed(2)}/order
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### 3.3 **Invoice Generation Service**

```typescript
// src/lib/services/invoice-service.ts
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/storage';

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  invoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  section: {
    marginBottom: 20,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  col1: { width: '50%' },
  col2: { width: '20%' },
  col3: { width: '15%' },
  col4: { width: '15%' },
  total: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#333',
  },
});

interface InvoiceData {
  order: any;
  invoiceNumber: string;
}

const InvoiceDocument = ({ order, invoiceNumber }: InvoiceData) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>INVOICE</Text>
      </View>

      <View style={styles.invoiceInfo}>
        <View>
          <Text>Invoice #: {invoiceNumber}</Text>
          <Text>Date: {new Date().toLocaleDateString()}</Text>
          <Text>Due Date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</Text>
        </View>
        <View>
          <Text>{order.client.businessName}</Text>
          <Text>{order.client.name}</Text>
          <Text>{order.client.email}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.col1}>Service</Text>
          <Text style={styles.col2}>Quantity</Text>
          <Text style={styles.col3}>Price</Text>
          <Text style={styles.col4}>Total</Text>
        </View>

        {order.items.map((item: any) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.col1}>{item.serviceName}</Text>
            <Text style={styles.col2}>{item.quantity}</Text>
            <Text style={styles.col3}>${item.unitPrice}</Text>
            <Text style={styles.col4}>${item.total}</Text>
          </View>
        ))}
      </View>

      <View style={styles.total}>
        <View style={styles.tableRow}>
          <Text style={styles.col1}>Subtotal</Text>
          <Text style={styles.col4}>${order.subtotal}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.col1}>Tax</Text>
          <Text style={styles.col4}>${order.tax}</Text>
        </View>
        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
          <Text style={[styles.col1, { fontSize: 18, fontWeight: 'bold' }]}>Total</Text>
          <Text style={[styles.col4, { fontSize: 18, fontWeight: 'bold' }]}>${order.total}</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export class InvoiceService {
  async generateInvoice(orderId: string) {
    // Get order with all details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        items: true,
        invoice: true,
      },
    });

    if (!order) throw new Error('Order not found');
    if (order.invoice) return order.invoice; // Already generated

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { number: 'desc' },
    });

    const invoiceNumber = this.generateInvoiceNumber(lastInvoice?.number);

    // Generate PDF
    const invoiceDoc = <InvoiceDocument order={order} invoiceNumber={invoiceNumber} />;
    const pdfBlob = await pdf(invoiceDoc).toBlob();

    // Upload to storage
    const fileName = `invoices/${invoiceNumber}.pdf`;
    const { url } = await uploadFile(pdfBlob, fileName);

    // Create invoice record
    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        orderId: orderId,
        pdfUrl: url,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return invoice;
  }

  private generateInvoiceNumber(lastNumber?: string): string {
    const prefix = process.env.INVOICE_PREFIX || 'INV';
    const year = new Date().getFullYear();

    if (!lastNumber) {
      const startingNumber = process.env.INVOICE_STARTING_NUMBER || '1000';
      return `${prefix}-${year}-${startingNumber}`;
    }

    const parts = lastNumber.split('-');
    const lastYear = parseInt(parts[1]);
    const lastSequence = parseInt(parts[2]);

    if (lastYear < year) {
      return `${prefix}-${year}-${process.env.INVOICE_STARTING_NUMBER || '1000'}`;
    }

    return `${prefix}-${year}-${(lastSequence + 1).toString().padStart(4, '0')}`;
  }

  async sendInvoice(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        order: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!invoice) throw new Error('Invoice not found');

    // Send email with invoice attachment
    // await emailService.sendInvoice(invoice);

    // Update sent timestamp
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { sentAt: new Date() },
    });
  }
}
```

### Phase 4: Polish & Launch

#### 4.1 **Refund Management UI**

```typescript
// src/app/(dashboard)/admin/orders/[orderId]/refund/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

export default function RefundPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const [refundType, setRefundType] = useState('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRefund = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a refund reason');
      return;
    }

    if (refundType === 'partial' && !partialAmount) {
      toast.error('Please enter the refund amount');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/orders/${params.orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: refundType,
          amount: refundType === 'partial' ? parseFloat(partialAmount) : undefined,
          reason,
        }),
      });

      if (!response.ok) throw new Error('Failed to process refund');

      toast.success('Refund processed successfully');
      router.push(`/admin/orders/${params.orderId}`);
    } catch (error) {
      toast.error('Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Process Refund</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Refund Type</Label>
            <RadioGroup value={refundType} onValueChange={setRefundType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full">Full Refund</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial">Partial Refund</Label>
              </div>
            </RadioGroup>
          </div>

          {refundType === 'partial' && (
            <div>
              <Label htmlFor="amount">Refund Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="reason">Refund Reason</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for the refund..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefund}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Process Refund'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 4.2 **Update Navigation**

```typescript
// Add to dashboard layout navigation items based on role

const getNavigationItems = (role: UserRole) => {
  const items = [
    // ... existing items
  ];

  if (role === "CLIENT") {
    items.push({
      name: "Store",
      href: "/store",
      icon: ShoppingBag,
      badge: cartItemCount, // Optional: show cart count
    });
  }

  if (role === "ADMIN") {
    items.push({
      name: "Sales Analytics",
      href: "/admin/sales",
      icon: TrendingUp,
    });
  }

  return items;
};
```

## 🧪 Testing Strategy

### 1. **Unit Tests**

```typescript
// src/__tests__/services/invoice-service.test.ts
import { InvoiceService } from "@/lib/services/invoice-service";

describe("InvoiceService", () => {
  it("should generate sequential invoice numbers", async () => {
    const service = new InvoiceService();
    // Test invoice number generation
  });

  it("should generate PDF correctly", async () => {
    // Test PDF generation
  });
});
```

### 2. **E2E Tests**

```typescript
// tests/store/purchase-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Store Purchase Flow with Contract", () => {
  test("should complete purchase and sign contract", async ({ page }) => {
    // Login as client
    await page.goto("/login");
    // ... login steps

    // Browse store
    await page.goto("/store");
    await expect(page.locator("h1")).toContainText("Store");

    // Add to cart
    await page.click('button:has-text("Add to Cart"):first');
    await expect(page.locator(".cart-count")).toContainText("1");

    // Checkout
    await page.goto("/store/cart");
    await page.click('button:has-text("Checkout")');

    // Complete Stripe checkout
    // ... Stripe test card details

    // Sign contract
    await expect(page).toHaveURL(/\/store\/success/);
    await page.fill('input[placeholder="John Doe"]', "Test User");
    await page.fill('input[type="email"]', "test@example.com");

    // Draw signature
    const canvas = await page.locator("canvas");
    await canvas.click({ position: { x: 50, y: 50 } });

    await page.click('button:has-text("Sign & Continue")');

    // Verify service access
    await expect(page).toHaveURL(/\/services/);
  });
});
```

### 3. **Stripe Testing**

```bash
# Test webhook locally
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger charge.refunded

# Test cards
4242 4242 4242 4242 - Success
4000 0000 0000 0002 - Decline
```

## 📋 Deployment Checklist

### Pre-Launch

- [ ] Database migrations applied
- [ ] Environment variables set in production
- [ ] Stripe webhook endpoint configured
- [ ] SSL certificate active (required for Stripe)
- [ ] Email templates tested
- [ ] Role permissions verified
- [ ] Invoice number sequence configured
- [ ] Contract templates reviewed by legal

### Launch Day

- [ ] Enable feature flag: `NEXT_PUBLIC_STORE_ENABLED=true`
- [ ] Monitor error logs
- [ ] Test purchase flow with real payment
- [ ] Verify webhook processing
- [ ] Check email delivery
- [ ] Test contract signing flow
- [ ] Verify invoice generation

### Post-Launch

- [ ] Monitor conversion rates
- [ ] Track failed payments
- [ ] Review contract signature rate
- [ ] Check refund requests
- [ ] Analyze client LTV growth
- [ ] Gather user feedback
- [ ] Optimize based on usage patterns

## 📊 Post-Launch Monitoring

### Key Metrics to Track

1. **Business Metrics**

   - Store conversion rate
   - Average order value
   - Client lifetime value
   - Cart abandonment rate
   - Contract signature rate
   - Service activation rate
   - Refund rate

2. **Technical Metrics**

   - Payment success rate
   - Webhook processing time
   - Invoice generation success
   - Page load times
   - Error rates

3. **User Experience**
   - Time to checkout
   - Time to contract signature
   - Support tickets related to store
   - User satisfaction scores

### Analytics Implementation

```typescript
// Track key events
trackEvent("store_viewed", { userId, source });
trackEvent("add_to_cart", { serviceId, price });
trackEvent("checkout_started", { cartValue, itemCount });
trackEvent("purchase_completed", { orderId, total, contractRequired });
trackEvent("contract_signed", { orderId, timeToSign });
trackEvent("invoice_generated", { orderId, invoiceNumber });
trackEvent("refund_processed", { orderId, amount, reason });
```

## 🚀 Future Enhancements

### Phase 5: Advanced Features

- **Subscriptions**: Recurring payments for ongoing services
- **Bundles**: Package multiple services with discounts
- **Client Portal**: Self-service invoice downloads and order management
- **Automated Dunning**: Follow up on failed payments

### Phase 6: Optimization

- **Dynamic Pricing**: A/B test pricing strategies
- **Abandoned Cart Recovery**: Automated email campaigns
- **Loyalty Program**: Rewards for repeat customers
- **Referral System**: Incentivize client referrals
- **Advanced Analytics**: Cohort analysis and predictive LTV

## 📚 Additional Resources

### Documentation

- [Stripe Checkout Documentation](https://stripe.com/docs/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [React PDF Documentation](https://react-pdf.org/)
- [Signature Pad Documentation](https://github.com/szimek/signature_pad)

### Support Contacts

- Technical Lead: [your-email]
- Stripe Support: support@stripe.com
- Legal Team: [legal-contact] (for contract templates)

---

**Note**: This master plan includes all business-critical features while maintaining simplicity. Each enhancement directly contributes to revenue growth, legal protection, or operational efficiency.
