# CLAUDE.md

**📁 This documentation has been restructured for better performance and maintainability.**

## Quick Start

For comprehensive guidance on working with this codebase, see the organized documentation in:

**[`cursor/rules/`](./cursor/rules/)**

### Quick Navigation

- **[📋 Overview & Index](./cursor/rules/00-overview.md)** - Start here for navigation to all other docs
- **[🎯 Project Overview](./cursor/rules/01-project-overview.md)** - App purpose, roles, menu structure
- **[⚙️ Tech Stack](./cursor/rules/02-tech-stack.md)** - Frontend, backend, testing technologies
- **[🛠️ Development Commands](./cursor/rules/03-development-commands.md)** - Server startup, testing, deployment
- **[🏗️ Architecture](./cursor/rules/04-architecture.md)** - Database schema, APIs, folder structure
- **[🔒 Security](./cursor/rules/05-security.md)** - Authentication, authorization, middleware
- **[📝 Code Conventions](./cursor/rules/06-code-conventions.md)** - Style, responsive design, state management
- **[🧪 Testing Strategy](./cursor/rules/07-testing-strategy.md)** - E2E, unit testing, server verification
- **[🌿 Git Workflow](./cursor/rules/08-git-workflow.md)** - Branch strategy, push process
- **[✨ Features](./cursor/rules/09-features.md)** - Current features, recent updates
- **[🚀 Deployment Status](./cursor/rules/10-deployment-status.md)** - Production build status, environment setup

## Recent Updates

### 🔧 Logout Functionality Fixes (Latest)

- **Simplified logout flow**: Removed complex error handling that was causing issues
- **Immediate session clearing**: Auth provider now clears session immediately for better UX
- **Background cleanup**: Server-side logout happens asynchronously to prevent UI blocking
- **Added debugging**: Console logs added to track logout button clicks and flow
- **Streamlined API**: Logout endpoint simplified to always return success

## Critical Reminders

⚠️ **ALWAYS verify server responds before testing**: `curl -f http://localhost:3001`

⚠️ **Use editing-branch for development**, merge to main only for releases

⚠️ **Port consistency**: All development on port 3001

---

_This restructure eliminates the 49.1k character performance warning while preserving all information in organized, focused files._
