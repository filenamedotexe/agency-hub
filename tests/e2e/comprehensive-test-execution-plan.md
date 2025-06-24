# Comprehensive Test Execution Plan - Phases 1-5 Role Testing

## Overview

This document provides a comprehensive testing strategy for all user roles across phases 1-5 of the Agency Hub application using Playwright with headed browser execution and debugging capabilities.

## Test Coverage

### Phases Covered

- **Phase 1**: Authentication Foundation
- **Phase 2**: Basic CRUD - Clients Module
- **Phase 2B**: UI/UX Polish & Design System
- **Phase 3**: Services & Tasks
- **Phase 4**: File Attachments
- **Phase 5**: Requests & Webhooks

### Roles Tested

- **ADMIN**: Full system access
- **SERVICE_MANAGER**: All permissions except settings
- **COPYWRITER**: Limited to assigned services/tasks
- **EDITOR**: Limited to assigned services/tasks
- **VA**: Basic access permissions
- **CLIENT**: Client dashboard only

## Test Files Structure

```
tests/e2e/
├── comprehensive-phases-1-5-role-testing-suite.spec.ts      # Main comprehensive test suite
├── comprehensive-debugging-role-test-suite.spec.ts          # Debug-focused test suite
├── helpers/
│   └── role-auth.ts                                         # Role authentication helpers
└── screenshots/                                             # Auto-generated screenshots
```

## Pre-Test Setup

### 1. Server Verification

```bash
# CRITICAL: Always verify server is running before tests
curl -f http://localhost:3001
curl -f http://localhost:3001/login
curl -f http://localhost:3001/api/health

# If server not running, start it:
pkill -f "next dev"
PORT=3001 npm run dev &
sleep 5
curl -f http://localhost:3001  # Verify it responds
```

### 2. Test Data Setup

Ensure test users exist in database for each role:

- admin@example.com (ADMIN)
- manager@example.com (SERVICE_MANAGER)
- copywriter@example.com (COPYWRITER)
- editor@example.com (EDITOR)
- va@example.com (VA)
- client@example.com (CLIENT)

### 3. Browser Configuration

Tests are configured for headed browser execution with:

- 2-second slowMo for visibility
- Full video recording
- Screenshot capture on every action
- Network request tracing
- Error screenshots

## Test Execution Commands

### Run All Comprehensive Tests

```bash
# Run main comprehensive test suite
npx playwright test comprehensive-phases-1-5-role-testing-suite.spec.ts --headed

# Run debugging-focused test suite
npx playwright test comprehensive-debugging-role-test-suite.spec.ts --headed

# Run both suites
npx playwright test comprehensive-phases-1-5-role-testing-suite.spec.ts comprehensive-debugging-role-test-suite.spec.ts --headed
```

### Run Specific Phase Tests

```bash
# Phase 1: Authentication only
npx playwright test comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "PHASE 1"

# Phase 2: Clients Module only
npx playwright test comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "PHASE 2"

# Phase 3: Services & Tasks only
npx playwright test comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "PHASE 3"

# Phase 4: File Attachments only
npx playwright test comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "PHASE 4"

# Phase 5: Requests & Webhooks only
npx playwright test comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "PHASE 5"
```

### Run Role-Specific Tests

```bash
# Test specific role across all phases
npx playwright test comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "ADMIN"
npx playwright test comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "SERVICE_MANAGER"
npx playwright test comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "CLIENT"
```

### Debug Mode Execution

```bash
# Run with Playwright Inspector for step-by-step debugging
npx playwright test comprehensive-debugging-role-test-suite.spec.ts --debug

# Run with UI mode for interactive debugging
npx playwright test --ui comprehensive-debugging-role-test-suite.spec.ts
```

## Test Categories by Phase

### Phase 1: Authentication Foundation

- **Login/Logout Flow**: Test authentication for all 6 roles
- **Route Protection**: Verify role-based access control
- **Session Management**: Test session persistence and expiry
- **Security**: Test unauthorized access attempts

**Key Test Scenarios:**

- Each role can login successfully
- Each role lands on correct dashboard
- Protected routes deny unauthorized access
- Logout redirects to login page
- Session persistence across page refreshes

### Phase 2: Clients Module

- **CRUD Operations**: Full client lifecycle testing
- **Permission Testing**: Role-based operation access
- **Data Validation**: Form validation and error handling
- **Search/Filter**: Client list functionality

**Key Test Scenarios:**

- ADMIN can create, read, update, delete clients
- SERVICE_MANAGER can create and edit clients
- COPYWRITER/EDITOR/VA can only view clients
- CLIENT role cannot access clients module
- Form validation prevents invalid data
- Search and filter work correctly

### Phase 2B: UI/UX Polish & Design System

- **Responsive Design**: Multi-viewport testing
- **Visual Regression**: Screenshot comparisons
- **Loading States**: Skeleton and spinner testing
- **Accessibility**: Keyboard navigation and ARIA

**Key Test Scenarios:**

- Pages render correctly on desktop (1280x720)
- Mobile layout works properly (375x667)
- Tablet layout functions correctly (768x1024)
- Loading states display appropriately
- Interactive elements meet accessibility standards

### Phase 3: Services & Tasks

- **Service Templates**: CRUD operations for templates
- **Service Assignment**: Client-service relationships
- **Task Management**: Task lifecycle and permissions
- **Status Workflows**: Task and service status changes

**Key Test Scenarios:**

- ADMIN/SERVICE_MANAGER can create service templates
- Services can be assigned to clients
- Tasks can be created and managed within services
- COPYWRITER/EDITOR can only manage assigned tasks
- Client visibility toggles work correctly

### Phase 4: File Attachments

- **File Upload**: Multi-file upload functionality
- **File Management**: View, download, delete operations
- **Permission Control**: Role-based file access
- **Validation**: File type and size restrictions

**Key Test Scenarios:**

- All roles (except CLIENT) can upload files
- File type validation prevents invalid uploads
- File size limits are enforced
- Uploaded files display correctly
- Download functionality works across roles

### Phase 5: Requests & Webhooks

- **Request Management**: CRUD operations for requests
- **Kanban Interface**: Drag-and-drop functionality
- **List View**: Sorting and filtering
- **Webhook Configuration**: ADMIN webhook setup

**Key Test Scenarios:**

- ADMIN/SERVICE_MANAGER can create and manage requests
- Kanban drag-and-drop changes request status
- Mobile Kanban works with touch interactions
- List view provides proper sorting/filtering
- Webhook configuration accessible to ADMIN only

## Cross-Phase Integration Tests

### Complete Workflow Testing

- **End-to-End Workflows**: Full business process testing
- **Data Consistency**: Cross-module data integrity
- **Performance**: Page load and interaction timing
- **Error Handling**: Network failures and edge cases

**Key Integration Scenarios:**

- Create client → Assign service → Manage tasks → Upload files → Handle requests
- Data changes in one module reflect correctly in others
- Performance meets acceptable thresholds (<5s page loads)
- Error states handled gracefully with user feedback

## Debugging Features

### Enhanced Logging

- Timestamped console output
- Network request tracking
- Performance timing
- Element visibility checks
- User action confirmation

### Visual Debugging

- Step-by-step screenshots
- Error state captures
- Form state documentation
- Navigation flow images
- Responsive layout verification

### Error Handling

- Detailed error messages
- Stack trace capture
- Network failure simulation
- Browser state documentation
- Recovery attempt logging

## Expected Test Results

### Success Criteria

- All authentication flows complete successfully
- Role-based permissions enforced correctly
- CRUD operations work for authorized roles
- UI components render properly across viewports
- File operations complete without errors
- Integration workflows execute end-to-end

### Common Issues to Watch For

- Loading spinner timeout issues (adjust wait times)
- React Server Component (RSC) request failures (expected in tests)
- Network request race conditions
- Mobile viewport rendering delays
- Authentication session persistence

## Post-Test Analysis

### Generated Artifacts

- **Screenshots**: `tests/screenshots/` - Step-by-step visual documentation
- **Videos**: Playwright video recordings of failed tests
- **Traces**: Detailed execution traces for debugging
- **Console Logs**: Timestamped debug output
- **Performance Data**: Page load timing and metrics

### Test Report Review

1. Check all role-based access controls function correctly
2. Verify CRUD operations work per role permissions
3. Confirm responsive design across all viewports
4. Validate cross-phase integration workflows
5. Review performance metrics for acceptable thresholds
6. Document any failing tests with screenshots/videos

## Maintenance and Updates

### Regular Updates Needed

- Update test user credentials if changed
- Modify role permissions if business rules change
- Add new test scenarios for new features
- Update UI selectors if interface changes
- Adjust timeout values based on performance

### Test Suite Evolution

- Add new phases as they are developed
- Expand role definitions as system grows
- Include new UI components in design system tests
- Enhance integration scenarios as workflows expand
- Improve debugging capabilities based on common issues

## Running Tests in CI/CD

For automated execution in CI/CD pipelines:

```bash
# Headless mode for CI
npx playwright test comprehensive-phases-1-5-role-testing-suite.spec.ts

# With HTML report
npx playwright test comprehensive-phases-1-5-role-testing-suite.spec.ts --reporter=html

# Specific browser testing
npx playwright test comprehensive-phases-1-5-role-testing-suite.spec.ts --project=chromium
```

This comprehensive test suite ensures thorough validation of all role-based functionality across all phases of the Agency Hub application.
