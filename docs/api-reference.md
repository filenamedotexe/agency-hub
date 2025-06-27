# API Reference

## Overview

Agency Hub provides a comprehensive REST API for managing clients, services, forms, and more. All API endpoints are prefixed with `/api` and require authentication unless otherwise specified.

## Authentication

Most endpoints require authentication via Supabase session cookies. The middleware automatically validates sessions and enforces role-based access control.

### Headers

```
Cookie: [Supabase auth cookies]
Content-Type: application/json
```

## Core APIs

### Clients

#### GET /api/clients

Get paginated list of clients

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search term for filtering

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Client Name",
      "email": "client@example.com",
      "businessName": "Business Inc",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

#### GET /api/clients/[id]

Get single client by ID

#### POST /api/clients

Create new client

**Request Body:**

```json
{
  "name": "Client Name",
  "email": "client@example.com",
  "businessName": "Business Inc",
  "dudaSiteId": "optional-site-id"
}
```

#### PUT /api/clients/[id]

Update client

#### DELETE /api/clients/[id]

Delete client

### Services

#### GET /api/services

Get all services

**Query Parameters:**

- `clientId` (string): Filter by client
- `status` (string): Filter by status (PENDING, IN_PROGRESS, COMPLETED)

#### GET /api/services/[id]

Get single service with tasks

#### POST /api/services

Create service from template

**Request Body:**

```json
{
  "clientId": "uuid",
  "serviceTemplateId": "uuid",
  "customizations": {
    "name": "Custom Service Name"
  }
}
```

#### PATCH /api/services/[id]/status

Update service status

**Request Body:**

```json
{
  "status": "IN_PROGRESS"
}
```

### Tasks

#### GET /api/tasks

Get tasks (filtered by user role)

#### PATCH /api/tasks/[id]

Update task

**Request Body:**

```json
{
  "status": "COMPLETED",
  "checklist": [
    {
      "id": "uuid",
      "text": "Checklist item",
      "completed": true
    }
  ]
}
```

### Forms

#### GET /api/forms

Get all forms

#### GET /api/forms/[id]

Get form with fields

#### POST /api/forms

Create new form

**Request Body:**

```json
{
  "name": "Contact Form",
  "description": "Customer contact form",
  "fields": [],
  "settings": {
    "webhook": "https://example.com/webhook",
    "redirectUrl": "/thank-you"
  }
}
```

#### POST /api/forms/[id]/submit

Submit form response

**Request Body:**

```json
{
  "responses": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

### Content Tools

#### GET /api/content-tools

Get all content tools

#### GET /api/content-tools/[id]

Get single content tool with fields

#### POST /api/content-tools/[id]/generate

Generate content using AI

**Request Body:**

```json
{
  "variables": {
    "businessName": "Example Inc",
    "targetAudience": "Small businesses"
  },
  "clientId": "uuid"
}
```

### Bookings

#### GET /api/bookings

Get bookings

**Query Parameters:**

- `start` (string): Start date (ISO 8601)
- `end` (string): End date (ISO 8601)

#### POST /api/bookings

Create new booking

**Request Body:**

```json
{
  "title": "Strategy Session",
  "start": "2024-01-01T10:00:00Z",
  "end": "2024-01-01T11:00:00Z",
  "clientId": "uuid",
  "serviceId": "uuid",
  "description": "Initial consultation"
}
```

## Store APIs (Stripe Integration)

### Cart

#### GET /api/cart

Get current user's cart

#### POST /api/cart/items

Add item to cart

**Request Body:**

```json
{
  "serviceTemplateId": "uuid",
  "quantity": 1
}
```

#### DELETE /api/cart/items/[serviceTemplateId]

Remove item from cart

#### PATCH /api/cart/items/[serviceTemplateId]

Update item quantity

**Request Body:**

```json
{
  "quantity": 2
}
```

### Checkout

#### POST /api/checkout/session

Create Stripe checkout session

**Request Body:**

```json
{
  "successUrl": "/store/success",
  "cancelUrl": "/store/cart"
}
```

### Orders

#### GET /api/orders

Get user's orders

#### GET /api/orders/[id]

Get order details with timeline

### Contracts

#### POST /api/contracts/[orderId]/sign

Sign service contract

**Request Body:**

```json
{
  "signatureData": "data:image/png;base64,...",
  "fullName": "John Doe",
  "email": "john@example.com",
  "userAgent": "Mozilla/5.0..."
}
```

## Webhook APIs

### Stripe Webhook

#### POST /api/webhooks/stripe

Handle Stripe webhook events

**Headers:**

```
stripe-signature: [Stripe signature]
```

### Duda Webhook

#### POST /api/webhooks/duda

Handle Duda site comments

**Request Body:**

```json
{
  "action": "comment_added",
  "site_name": "site-id",
  "comment": {
    "content": "Comment text",
    "author": "Author Name"
  }
}
```

### Test Webhook

#### POST /api/test-webhook

Test webhook endpoint functionality

**Request Body:**

```json
{
  "url": "https://example.com/webhook",
  "payload": {},
  "isProduction": true
}
```

## Admin APIs

### Analytics

#### GET /api/admin/analytics/sales

Get sales metrics

**Query Parameters:**

- `days` (number): Number of days to include (default: 30)

#### GET /api/admin/analytics/top-clients

Get top clients by lifetime value

### User Management

#### GET /api/admin/users

Get all users

#### POST /api/admin/users

Create new user

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "role": "COPYWRITER",
  "profile": {
    "name": "User Name"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Currently, there is no rate limiting implemented. This is planned for future releases.

## Pagination

Endpoints that return lists support pagination:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Filtering & Sorting

Many endpoints support filtering via query parameters:

- `status` - Filter by status
- `clientId` - Filter by client
- `search` - Text search
- `startDate` / `endDate` - Date range filtering

Sorting is available on some endpoints:

- `sort` - Field to sort by
- `order` - Sort order (asc/desc)
