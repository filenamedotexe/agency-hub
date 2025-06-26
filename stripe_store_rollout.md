# 🛍️ Stripe Store Feature - Complete Implementation Guide

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

Add a Store/Shop feature to Agency Hub that allows clients to purchase services à la carte using Stripe payments. Services purchased through the store will automatically be provisioned to the client's account.

### Key Goals

- Enable self-service purchasing for clients
- Automate service provisioning after payment
- Reduce manual service assignment overhead
- Create new revenue stream through impulse purchases
- Maintain existing service management workflow

### Success Metrics

- Store conversion rate (visitors → purchases)
- Average order value
- Time saved on manual service assignment
- Client satisfaction scores
- Payment success rate

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
```

### 3. **Dependencies to Install**

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
npm install @types/stripe --save-dev
```

### 4. **MCP Setup (if using Stripe MCP)**

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
  isPurchasable   Boolean   @default(false)
  price           Decimal?  @db.Decimal(10, 2)
  currency        String    @default("USD")
  stripePriceId   String?   @unique
  storeTitle      String?
  storeDescription String?  @db.Text
  storeImages     Json?     // Array of image URLs
  maxQuantity     Int       @default(1)
  sortOrder       Int       @default(0)

  // Relations
  cartItems       CartItem[]
  orderItems      OrderItem[]

  @@index([isPurchasable, sortOrder])
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
  notes                 String?
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt
  paidAt                DateTime?

  client                Client        @relation(fields: [clientId], references: [id])
  items                 OrderItem[]

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

// Add to existing Service model
model Service {
  // ... existing fields ...
  orderItem         OrderItem?
}

enum OrderStatus {
  PENDING
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
npx prisma migrate dev --name add-store-models

# Push to database
npm run db:push
```

## 📊 Implementation Phases

### Phase 1: Foundation (Week 1)

- Database schema updates
- Basic store page UI
- Service template store settings
- Cart functionality (localStorage)

### Phase 2: Stripe Integration (Week 2)

- Stripe checkout flow
- Payment processing
- Webhook handling
- Order creation

### Phase 3: Order Management (Week 3)

- Order history page
- Admin order management
- Service auto-provisioning
- Email notifications

### Phase 4: Polish & Launch (Week 4)

- UI/UX improvements
- Testing & bug fixes
- Documentation
- Gradual rollout

## 🚀 Detailed Implementation Steps

### Phase 1: Foundation

#### 1.1 **Update Service Templates Admin UI**

```typescript
// src/app/(dashboard)/admin/service-templates/components/service-template-form.tsx
// Add store settings fields to existing form

const storeSettingsSchema = z.object({
  isPurchasable: z.boolean().default(false),
  price: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  storeTitle: z.string().optional(),
  storeDescription: z.string().optional(),
  storeImages: z.array(z.string().url()).optional(),
  maxQuantity: z.number().min(1).default(1),
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

#### 1.2 **Create Store Page Structure**

```
/src/app/(dashboard)/store/
  ├── page.tsx                    // Store homepage with service grid
  ├── [serviceTemplateId]/
  │   └── page.tsx               // Service detail page
  ├── cart/
  │   └── page.tsx               // Shopping cart
  ├── checkout/
  │   └── page.tsx               // Checkout flow
  ├── orders/
  │   └── page.tsx               // Order history
  └── components/
      ├── store-header.tsx       // Cart icon, search
      ├── service-card.tsx       // Product card
      ├── add-to-cart-button.tsx // Add to cart functionality
      ├── cart-sidebar.tsx       // Slide-out cart
      └── cart-provider.tsx      // Cart context
```

#### 1.3 **Create Cart Context & Provider**

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

  // ... other cart methods

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

#### 1.4 **Create Store Homepage**

```typescript
// src/app/(dashboard)/store/page.tsx
"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StoreHeader } from './components/store-header';
import { ServiceCard } from './components/service-card';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

export default function StorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ['store-services', searchQuery, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await fetch(`/api/store/services?${params}`);
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : services?.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No services available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services?.map((service: any) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Phase 2: Stripe Integration

#### 2.1 **Create Stripe Service**

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

#### 2.2 **Create Checkout API Route**

```typescript
// src/app/api/store/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripeService } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      serviceTemplateId: z.string(),
      quantity: z.number().min(1),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { items } = checkoutSchema.parse(body);

    // Get client
    const client = await prisma.client.findFirst({
      where: {
        // Add your client lookup logic based on session
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch service templates with prices
    const serviceTemplates = await prisma.serviceTemplate.findMany({
      where: {
        id: { in: items.map((item) => item.serviceTemplateId) },
        isPurchasable: true,
      },
    });

    // Calculate totals
    let subtotal = 0;
    const orderItems = items.map((item) => {
      const template = serviceTemplates.find(
        (t) => t.id === item.serviceTemplateId
      );
      if (!template || !template.price) {
        throw new Error(
          `Service ${item.serviceTemplateId} not found or not purchasable`
        );
      }

      const itemTotal = Number(template.price) * item.quantity;
      subtotal += itemTotal;

      return {
        serviceTemplateId: template.id,
        serviceName: template.storeTitle || template.name,
        quantity: item.quantity,
        unitPrice: Number(template.price),
        total: itemTotal,
      };
    });

    // Create order
    const order = await prisma.order.create({
      data: {
        clientId: client.id,
        status: "PENDING",
        subtotal,
        total: subtotal, // Add tax calculation if needed
        currency: "USD",
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
        client: true,
      },
    });

    // Create Stripe checkout session
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/store/success?orderId=${order.id}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/store/cart`;

    const checkoutSession = await stripeService.createCheckoutSession(
      order,
      successUrl,
      cancelUrl
    );

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    // Clear cart
    await prisma.cart.deleteMany({
      where: { clientId: client.id },
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
```

#### 2.3 **Create Webhook Handler**

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripeService } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { ServiceProvisioningService } from "@/lib/services/service-provisioning";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature") as string;

  let event;

  try {
    event = stripeService.verifyWebhookSignature(body, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleCheckoutComplete(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: any) {
  const orderId = session.client_reference_id;

  if (!orderId) {
    console.error("No order ID in checkout session");
    return;
  }

  // Update order status
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PROCESSING",
      paymentStatus: "SUCCEEDED",
      stripePaymentIntentId: session.payment_intent,
      paymentMethod: session.payment_method_types[0],
      paidAt: new Date(),
    },
    include: {
      items: {
        include: {
          serviceTemplate: true,
        },
      },
      client: true,
    },
  });

  // Provision services
  const provisioningService = new ServiceProvisioningService();

  for (const item of order.items) {
    try {
      const service = await provisioningService.createServiceFromPurchase(
        item.serviceTemplateId,
        order.clientId,
        item.id
      );

      // Update order item with created service
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { serviceId: service.id },
      });
    } catch (error) {
      console.error(`Failed to provision service for item ${item.id}:`, error);
      // Consider adding error handling/retry logic
    }
  }

  // Update order to completed
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "COMPLETED" },
  });

  // Send confirmation email
  // await emailService.sendOrderConfirmation(order);
}
```

### Phase 3: Order Management

#### 3.1 **Service Provisioning Service**

```typescript
// src/lib/services/service-provisioning.ts
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

export class ServiceProvisioningService {
  async createServiceFromPurchase(
    serviceTemplateId: string,
    clientId: string,
    orderItemId: string
  ) {
    // Get service template
    const template = await prisma.serviceTemplate.findUnique({
      where: { id: serviceTemplateId },
    });

    if (!template) {
      throw new Error("Service template not found");
    }

    // Create service instance
    const service = await prisma.service.create({
      data: {
        templateId: serviceTemplateId,
        clientId: clientId,
        status: "TO_DO",
        tasks: {
          create: (template.defaultTasks as any[]).map((task: any) => ({
            name: task.name,
            description: task.description,
            dueDate: task.dueInDays
              ? new Date(Date.now() + task.dueInDays * 24 * 60 * 60 * 1000)
              : null,
            clientVisible: task.clientVisible || false,
            status: "TO_DO",
            metadata: task.metadata || {},
          })),
        },
      },
      include: {
        template: true,
        tasks: true,
      },
    });

    // Log activity
    await logActivity({
      userId: "system", // Or use a system user ID
      action: "service.created.purchase",
      entityType: "service",
      entityId: service.id,
      clientId: clientId,
      metadata: {
        orderItemId,
        serviceTemplateId,
        source: "store_purchase",
      },
    });

    // Send notification to service managers
    // await notificationService.notifyNewService(service);

    return service;
  }

  async handleRefund(orderId: string) {
    // Get order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "REFUNDED",
        paymentStatus: "REFUNDED",
      },
    });

    // Handle services created from this order
    for (const item of order.items) {
      if (item.serviceId && item.service) {
        // Option 1: Cancel the service
        await prisma.service.update({
          where: { id: item.serviceId },
          data: { status: "CANCELLED" },
        });

        // Option 2: Delete the service (if no work has been done)
        // await prisma.service.delete({
        //   where: { id: item.serviceId },
        // });
      }
    }
  }
}
```

#### 3.2 **Order History Page**

```typescript
// src/app/(dashboard)/store/orders/page.tsx
"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Calendar, DollarSign } from 'lucide-react';

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const response = await fetch('/api/store/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
  });

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'secondary',
      PROCESSING: 'default',
      COMPLETED: 'success',
      CANCELLED: 'destructive',
      REFUNDED: 'warning',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
        <p className="mt-1 text-sm text-gray-600">
          View your past purchases and their status
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : orders?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900">No orders yet</p>
            <p className="text-sm text-gray-600 mt-1">
              Visit the store to make your first purchase
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders?.map((order: any) => (
            <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      Order #{order.orderNumber}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(order.createdAt), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${order.total}
                      </span>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span>{item.serviceName}</span>
                      <span className="text-gray-600">
                        {item.quantity} × ${item.unitPrice}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Phase 4: Polish & Launch

#### 4.1 **Add Store to Navigation**

```typescript
// src/components/navigation/sidebar.tsx
// Add to navigation items based on role

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

  return items;
};
```

#### 4.2 **Email Templates**

```typescript
// src/lib/email/templates/order-confirmation.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export function OrderConfirmationEmail({ order }: { order: any }) {
  const previewText = `Order #${order.orderNumber} confirmed`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Order Confirmed!</Heading>

          <Text style={text}>
            Thank you for your purchase. Your order #{order.orderNumber} has been confirmed
            and your services are being set up.
          </Text>

          <Section style={orderDetails}>
            <Heading as="h2" style={h2}>Order Details</Heading>
            {order.items.map((item: any) => (
              <div key={item.id} style={orderItem}>
                <Text style={itemName}>{item.serviceName}</Text>
                <Text style={itemPrice}>
                  {item.quantity} × ${item.unitPrice} = ${item.total}
                </Text>
              </div>
            ))}

            <div style={totalRow}>
              <Text style={totalLabel}>Total:</Text>
              <Text style={totalAmount}>${order.total}</Text>
            </div>
          </Section>

          <Section style={ctaSection}>
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/services`} style={button}>
              View Your Services
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

## 🧪 Testing Strategy

### 1. **Unit Tests**

```typescript
// src/__tests__/services/service-provisioning.test.ts
import { ServiceProvisioningService } from "@/lib/services/service-provisioning";
import { prisma } from "@/lib/prisma";

describe("ServiceProvisioningService", () => {
  it("should create service from purchase", async () => {
    // Test service creation logic
  });

  it("should handle refunds correctly", async () => {
    // Test refund handling
  });
});
```

### 2. **E2E Tests**

```typescript
// tests/store/purchase-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Store Purchase Flow", () => {
  test("should complete purchase successfully", async ({ page }) => {
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

    // Verify success
    await expect(page).toHaveURL(/\/store\/success/);
    await expect(page.locator("h1")).toContainText("Order Confirmed");
  });
});
```

### 3. **Stripe Testing**

```bash
# Test webhook locally
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded

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

### Launch Day

- [ ] Enable feature flag: `NEXT_PUBLIC_STORE_ENABLED=true`
- [ ] Monitor error logs
- [ ] Test purchase flow with real payment
- [ ] Verify webhook processing
- [ ] Check email delivery

### Post-Launch

- [ ] Monitor conversion rates
- [ ] Track failed payments
- [ ] Gather user feedback
- [ ] Optimize based on usage patterns

## 📊 Post-Launch Monitoring

### Key Metrics to Track

1. **Business Metrics**

   - Store conversion rate
   - Average order value
   - Cart abandonment rate
   - Service activation rate

2. **Technical Metrics**

   - Payment success rate
   - Webhook processing time
   - Page load times
   - Error rates

3. **User Experience**
   - Time to checkout
   - Support tickets related to store
   - User satisfaction scores

### Monitoring Setup

```typescript
// src/lib/monitoring/store-metrics.ts
export async function trackStoreEvent(event: string, data: any) {
  // Send to analytics service
  await analytics.track({
    event,
    properties: {
      ...data,
      timestamp: new Date().toISOString(),
    },
  });
}

// Usage:
trackStoreEvent("add_to_cart", {
  serviceTemplateId,
  price,
  userId,
});
```

## 🚀 Future Enhancements

### Phase 5: Advanced Features

- **Subscriptions**: Recurring payments for ongoing services
- **Bundles**: Package multiple services with discounts
- **Coupons**: Promotional codes and discounts
- **Wishlists**: Save services for later
- **Reviews**: Client feedback on purchased services

### Phase 6: Optimization

- **Recommendations**: AI-powered service suggestions
- **A/B Testing**: Optimize conversion rates
- **Mobile App**: Native shopping experience
- **Multi-currency**: International pricing
- **Tax Handling**: Automated tax calculations

## 📚 Additional Resources

### Documentation

- [Stripe Checkout Documentation](https://stripe.com/docs/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Next.js Commerce](https://github.com/vercel/commerce)

### Support Contacts

- Technical Lead: [your-email]
- Stripe Support: support@stripe.com
- Internal Wiki: [link-to-wiki]

---

**Note**: This guide is a living document. Update it as you implement and learn from the rollout process.
