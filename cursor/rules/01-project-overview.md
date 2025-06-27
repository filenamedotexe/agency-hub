# Project Overview

## Overview

We are building an app for my agency to manage my clients and the services that we offer them.

## User Roles

### Admin

- All permissions
- Access to settings (webhooks, API keys)
- Full client and service management

### Service Manager

- All permissions except settings like webhooks and API keys
- Can manage clients, services, forms, requests
- Cannot access API key management

### Copywriter

- Services and tasks assigned to them (with client detail page)
- Limited to assigned work

### Editor

- Services and tasks assigned to them (with client detail page)
- Limited to assigned work

### VA (Virtual Assistant)

- Limited permissions for assigned tasks

### Client

- Client Dashboard access only:
  - Forms assigned to the client (To Do, Done)
  - Services for the client & overall service status
  - Tasks that are viewable by clients (toggled by admin/service manager)
  - Store access to purchase additional services
  - Order history and invoices

## Menu Items (Pages)

### Dashboard

- Overview of # of clients, # of services in each status
- Analytics that are valuable but not just there for the sake of it
- Activity Log (all)
- **Realtime Updates**: Dashboard automatically updates when data changes

### Services

- Create/Edit Templates for services that we can assign to clients
- Service Name, attachments, type, status, price
- Service Tasks (default template tasks, but editable)
  - Task name, description, due date, attachments
  - Toggle whether client can view it
  - Internal checklist functionality (never visible to clients)

### Clients

- List View of all clients
- Add new client functionality
- Client Detail Page with:
  - Basic info (Name, Address, Business Name, Duda Site ID)
  - Activity Log for the client
  - Form Responses with dynamic fields
  - Generated content history

### Requests

- Created when comments are made in Duda
- Kanban and List View (By Status: To Do, In Progress, Done)
- **Realtime Updates**: Live updates for new requests and comments
- Request threading with Duda comment integration

### Forms

- Full drag and drop form builder
- Form Settings (webhooks, URL redirects)
- Dynamic Fields from form responses
- Forms can attach to services or directly to clients

### Automations

- Webhook management (Form, General, Content Tool webhooks)
- Webhook testing functionality
- Environment switching (Production/Testing URLs)

### Content Tools

- AI-powered content generation tools
- Configurable fields with dynamic field support
- Custom fields management for admins
- Webhook integration for generated content
- Tools: Blog Writer, Facebook Ad Scripts, Google Ad Writer, SEO Research

### Calendar

- Full calendar system with booking management
- Multi-view support (Month, Week, Day, Agenda)
- Availability settings for team members
- Service-linked bookings
- Client meeting scheduling
- Real-time availability tracking
- **Phase 4 Complete**: All features fully tested and operational

### Store (Phase 1 In Progress)

- Service marketplace for clients to purchase services
- Shopping cart with localStorage/API synchronization
- Stripe checkout integration with test mode
- E-signature contracts for service agreements
- Order history and tracking
- Professional invoice generation (PDF)
- Sales analytics dashboard (Admin only)
- **Current Status**: Foundation phase - implementing cart and service templates

### Settings

- Account Settings
- API Keys (Anthropic, OpenAI, Stripe)
- Team member management (add admins, service managers, etc.)
