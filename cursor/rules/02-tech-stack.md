# Tech Stack

## Frontend

- **Next.js 14+** (App Router) - Server components, API routes, excellent DX
- **TypeScript** - Type safety throughout the codebase
- **Tailwind CSS v3 + shadcn/ui** - Rapid UI development with consistent design
  - Note: Must use Tailwind CSS v3 (not v4) for compatibility
- **React Hook Form + Zod** - Form handling with runtime validation
- **TanStack Query** - Server state management, caching, optimistic updates
- **React DnD Kit** - Drag-and-drop for form builder and Kanban
- **Recharts** - Analytics dashboards
- **@radix-ui/react-tooltip** - Enhanced tooltips for improved UX and ngrok setup guidance
- **Stripe** - Payment processing and subscription management
- **@stripe/stripe-js** - Stripe JavaScript SDK for frontend
- **@stripe/react-stripe-js** - React components for Stripe integration
- **@react-pdf/renderer** - PDF generation for invoices
- **signature_pad** - Canvas-based e-signature capture

## UI Components Library

The application includes a comprehensive set of UI components based on shadcn/ui:

### Core Components

- **Button**: Multiple variants (default, destructive, outline, secondary, ghost, link) with size options
- **Card**: Flexible card components with header, content, description, title sections
- **Dialog**: Modal dialogs with proper focus management and accessibility
- **Input**: Form inputs with proper styling and validation states
- **Label**: Accessible form labels
- **Textarea**: Multi-line text inputs
- **Select**: Dropdown selects with search and keyboard navigation
- **Switch**: Toggle switches for boolean states
- **Tabs**: Tabbed interfaces with proper ARIA support
- **Badge**: Status indicators and labels
- **Progress**: Progress bars for loading states
- **Skeleton**: Loading placeholders
- **Separator**: Visual dividers

### Enhanced Components

- **Tooltip**: Interactive tooltips with positioning and animation
- **DynamicField**: Click-to-copy dynamic field components with visual feedback
- **AttachmentList**: File management with preview and download capabilities
- **FileUpload**: Drag-and-drop file upload with progress tracking
- **EmptyState**: Contextual empty states with guidance
- **Toast/Toaster**: Notification system using Sonner for better UX

### Form Components

- **Checkbox**: Styled checkboxes with indeterminate state support
- **RadioGroup**: Radio button groups with proper accessibility
- **Form**: React Hook Form integration with validation
- **AlertDialog**: Confirmation dialogs for destructive actions
- **Accordion**: Collapsible content sections

### Data Display

- **Table**: Responsive tables with sorting and filtering
- **ScrollArea**: Custom scrollbars with smooth scrolling
- **Alert**: Status messages and notifications
- **DropdownMenu**: Context menus and action dropdowns

## Backend & Database

- **Supabase**
  - PostgreSQL with Row Level Security (RLS)
  - Realtime subscriptions for live updates
  - Storage for file attachments
  - Edge Functions for webhooks
  - Built-in Auth with role management
- **Prisma** - Type-safe ORM

## Testing & Quality

- **Playwright** - E2E testing with headed browser (Next.js on port 3001, Chrome-only for development)
- **Vitest** - Unit and integration testing (not Vite - this is for Next.js)
- **React Testing Library** - Component testing
- **MSW** - API mocking for tests
- **ESLint + Prettier** - Code quality and formatting
