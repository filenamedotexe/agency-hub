# Agency Hub - Overview & Index

This file provides guidance to Claude Code when working with this agency management application.

## Quick Navigation

- **[Project Overview](./01-project-overview.md)** - App purpose, roles, menu structure
- **[Tech Stack](./02-tech-stack.md)** - Frontend, backend, testing technologies
- **[Development Commands](./03-development-commands.md)** - Server startup, testing, deployment
- **[Architecture](./04-architecture.md)** - Database schema, APIs, folder structure
- **[Security](./05-security.md)** - Authentication, authorization, middleware
- **[Code Conventions](./06-code-conventions.md)** - Style, responsive design, state management
- **[Testing Strategy](./07-testing-strategy.md)** - E2E, unit testing, server verification
- **[Git Workflow](./08-git-workflow.md)** - Branch strategy, push process
- **[Features](./09-features.md)** - Current features, recent updates
- **[Deployment Status](./10-deployment-status.md)** - Production build status, environment setup

## Current Status Summary

- **Production**: ✅ Deployed and working on Vercel
- **Development**: ✅ Running on localhost:3001
- **Build Status**: ✅ All TypeScript and ESLint errors resolved
- **Testing**: ✅ Comprehensive E2E test suite with Playwright

## Critical Reminders

⚠️ **ALWAYS verify server responds before testing**: `curl -f http://localhost:3001`

⚠️ **Use editing-branch for development**, merge to main only for releases

⚠️ **Port consistency**: All development on port 3001
