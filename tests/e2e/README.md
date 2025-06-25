# Agency Hub E2E Test Suite

This directory contains the consolidated end-to-end test suite for the Agency Hub application.

## Test Organization

Tests are organized into numbered files by feature area:

- **00-test-suite.spec.ts** - Test suite overview and documentation
- **01-authentication.spec.ts** - Authentication, authorization, and role-based access (MCP-enhanced)
- **02-client-management.spec.ts** - Client CRUD operations and dynamic fields
- **03-services-tasks.spec.ts** - Service templates, task management, and checklists
- **04-forms-dynamic-fields.spec.ts** - Form builder and dynamic field generation
- **05-requests-webhooks.spec.ts** - Request management and webhook integration
- **06-content-tools.spec.ts** - AI content generation and tool configuration
- **07-settings.spec.ts** - Settings management (API keys, team, webhooks)
- **08-attachments.spec.ts** - File upload and management system
- **09-visual-regression.spec.ts** - Visual regression testing with MCP screenshots
- **10-accessibility.spec.ts** - WCAG compliance and accessibility testing
- **11-network-monitoring.spec.ts** - API and webhook monitoring with MCP

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npm run test:e2e tests/e2e/01-authentication.spec.ts

# Run tests matching pattern
npm run test:e2e -- --grep "client management"

# Run tests in UI mode
npm run test:e2e:ui

# Run tests in headed mode for debugging
npm run test:e2e -- --headed
```

## Test Data

Tests use predefined test users from `helpers/role-auth.ts`:

- admin@example.com (ADMIN)
- manager@example.com (SERVICE_MANAGER)
- copywriter@example.com (COPYWRITER)
- editor@example.com (EDITOR)
- va@example.com (VA)
- client@example.com (CLIENT)

All test users use password: `password123`

## Key Features Tested

### Recent Updates

- ✅ Enhanced webhook system with Production/Testing URLs
- ✅ Content tool webhook creation inline
- ✅ Settings API Keys data handling fix
- ✅ Content Tools Select component fix
- ✅ Dynamic generated content filtering
- ✅ Task checklist system (internal only)
- ✅ Click-to-copy dynamic fields

### Core Features

- ✅ Role-based access control with secure middleware
- ✅ Client management with form responses
- ✅ Service assignment and task tracking
- ✅ Drag-and-drop form builder
- ✅ Kanban request management
- ✅ AI-powered content generation
- ✅ Comprehensive attachment system
- ✅ Activity logging and audit trails

## Test Patterns

Tests follow consistent patterns for better maintainability:

1. **Setup**: Each test file starts with role-based login
2. **Isolation**: Tests clear state between runs
3. **Assertions**: Use specific selectors and wait for elements
4. **Cleanup**: Tests clean up created data when possible

## Debugging Tips

1. **Server Verification**: Always ensure server is running on port 3001

   ```bash
   curl -f http://localhost:3001
   ```

2. **Visual Debugging**: Run tests in headed mode

   ```bash
   npm run test:e2e -- --headed --slow-mo=1000
   ```

3. **Single Test**: Focus on one test for debugging

   ```bash
   npm run test:e2e -- --grep "specific test name"
   ```

4. **Screenshots**: Tests take screenshots on failure
   - Check `test-results/` directory

## Archive

Old test files have been moved to the `archive/` directory for reference. The new consolidated suite provides better coverage and maintainability.

## Playwright MCP Integration

Our test suite now leverages Playwright MCP (Model Context Protocol) tools for enhanced testing capabilities:

### MCP Tools Available

- **Browser Control**: Navigation, screenshots, viewport management
- **Element Interaction**: Enhanced click, type, and hover actions
- **Accessibility Testing**: Snapshot and verification tools
- **Network Monitoring**: Request/response tracking
- **Visual Testing**: Screenshot comparison and regression testing

### MCP Utilities (helpers/mcp-utils.ts)

```typescript
// Screenshot capture
mcpTakeScreenshot(page, { filename: "test.png" });

// Accessibility verification
mcpVerifyAccessibility(page, { checkLabels: true });

// Network monitoring
mcpMonitorNetworkRequests(page, "/api/");

// Enhanced navigation
mcpNavigateWithMonitoring(page, "/dashboard");

// Toast verification
mcpVerifyToast(page, "Success message");
```

### Benefits of MCP Integration

1. **Better Debugging**: Automatic screenshots on failures
2. **Visual Regression**: Track UI changes over time
3. **Accessibility**: Automated WCAG compliance checking
4. **Network Insights**: Monitor API calls and webhooks
5. **Enhanced Reliability**: Better wait strategies and element interaction

## Maintenance

When adding new features:

1. Add tests to the appropriate numbered file
2. Update this README with new features tested
3. Ensure role-based access is properly tested
4. Test both happy path and error cases
5. Include MCP-enhanced testing for better coverage:
   - Add visual regression snapshots
   - Include accessibility checks
   - Monitor network requests
   - Use enhanced error handling
