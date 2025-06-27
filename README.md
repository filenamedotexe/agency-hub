# Agency Hub

A comprehensive agency management platform built with Next.js, TypeScript, and Supabase.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account (for store feature)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd agency-hub
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` with your actual values.

4. Set up the database:

   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed  # Optional: add test data
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3001`

## 📚 Documentation

For detailed documentation, see the [`cursor/rules/`](./cursor/rules/) directory:

- [Project Overview](./cursor/rules/01-project-overview.md)
- [Tech Stack](./cursor/rules/02-tech-stack.md)
- [Development Commands](./cursor/rules/03-development-commands.md)
- [Architecture](./cursor/rules/04-architecture.md)
- [Security](./cursor/rules/05-security.md)
- [Current Features](./cursor/rules/09-features.md)

## 🎯 Key Features

- **Multi-Role System**: Admin, Service Manager, Copywriter, Editor, VA, and Client roles
- **Client Management**: Comprehensive CRM with service tracking
- **Service Templates**: Reusable service definitions with task management
- **Form Builder**: Drag-and-drop form creation with dynamic fields
- **Content Tools**: AI-powered content generation
- **Calendar System**: Booking management with availability tracking
- **Store (In Progress)**: E-commerce integration with Stripe
- **Real-time Updates**: Live data synchronization
- **Webhook Integration**: External system connectivity

## 🛠️ Development

### Common Commands

```bash
npm run dev         # Start development server on port 3001
npm run build       # Build for production
npm run test        # Run tests with Playwright
npm run db:generate # Generate Prisma client
npm run db:push     # Push schema to database
npm run db:seed     # Seed database with test data
```

### Testing

```bash
npm run test        # Run all tests
npm run test:headed # Run tests with browser UI
npm run test:ui     # Open Playwright test UI
```

## 🚀 Deployment

The app is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy!

## 📦 Tech Stack

- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **ORM**: Prisma
- **Testing**: Playwright, Vitest
- **Payments**: Stripe (in progress)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature-name`
2. Make your changes
3. Test thoroughly
4. Create a pull request

## 📄 License

[Your License Here]

## 🆘 Support

For issues and questions, please check the documentation in [`cursor/rules/`](./cursor/rules/) or create an issue in the repository.
