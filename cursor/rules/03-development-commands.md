# Development Commands

## Server Management

### CRITICAL: Proper Server Verification Required

```bash
# Development - PROPER VERIFICATION REQUIRED
pkill -f "next dev"                    # ALWAYS kill existing Next.js processes first
lsof -ti :3001 | xargs kill -9         # Force kill any process using port 3001
PORT=3001 npm run dev &                # Start Next.js dev server on port 3001 in background
sleep 5                                # Wait for server to start
curl -f http://localhost:3001          # VERIFY server actually responds (REQUIRED)
curl -I http://localhost:3001/login    # VERIFY login page loads (REQUIRED)
# If curl commands fail, server is NOT working - check logs
```

### Database Commands

```bash
npm run db:push         # Push Prisma schema to Supabase
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run migrations
npm run db:seed         # Seed test data
npm run db:studio       # Open Prisma Studio
```

## Testing Commands

### E2E Testing

```bash
# VERIFY SERVER BEFORE TESTING
curl -f http://localhost:3001/login     # VERIFY server responds before testing
npm run test:e2e        # Run Playwright tests (headed, port 3001)
npm run test:e2e:ui     # Open Playwright UI mode
```

### Unit Testing

```bash
npm run test            # Run unit tests
npm run test:watch      # Watch mode for unit tests
```

### Comprehensive Testing

```bash
./run-comprehensive-role-tests.sh      # Interactive test suite runner
```

## Quality & Build Commands

```bash
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # Run TypeScript compiler
npm run build           # Build for production
npm run analyze         # Analyze bundle size
```

## Deployment Commands

```bash
vercel --prod           # Deploy to Vercel production
vercel env ls           # List environment variables
vercel logs [URL]       # View deployment logs
```

## Git Workflow Helpers

```bash
npm run git:push        # Push to editing-branch
npm run git:merge-main  # Merge editing-branch to main
npm run git:status      # Show git status and branches
```

## Server Verification Protocol

### NEVER ASSUME SERVER IS RUNNING

Before any development or testing activity, ALWAYS verify the server is actually responding:

```bash
# 1. Kill any existing processes
pkill -f "next dev"
lsof -ti :3001 | xargs kill -9  # Force kill any process using port 3001

# 2. Start server in background
PORT=3001 npm run dev &

# 3. Wait for startup (reduced from 5s to 2s)
sleep 2

# 4. VERIFY server responds (REQUIRED)
curl -f http://localhost:3001
# If this fails, server is NOT working

# 5. VERIFY specific pages load (REQUIRED)
curl -I http://localhost:3001/login
curl -I http://localhost:3001/signup
# If these fail, routing is broken

# 6. Check server logs if verification fails
# Look for actual error messages, not just process existence
```

### Common False Positive Patterns to AVOID

- ❌ `ps aux | grep "next dev"` - only checks process exists, not if it works
- ❌ `lsof -i :3001` - only checks port is bound, not if it responds
- ❌ Assuming server works because command completed
- ❌ Testing without HTTP verification first

### Required Verification Pattern

- ✅ `curl -f http://localhost:3001` - actual HTTP response test
- ✅ Check HTTP status codes
- ✅ Verify specific pages load before testing
- ✅ Read actual error logs when verification fails
