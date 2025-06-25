# Code Conventions

## Code Style

- Use named exports for components
- Collocate related files (component + test + styles)
- Prefix server components with 'Server' when needed
- Use absolute imports from '@/'

## Responsive Design Requirements

### Mobile-First Approach

- **Design for mobile (320px) then scale up**
- **Breakpoints**: sm:640px, md:768px, lg:1024px, xl:1280px, 2xl:1536px

### Touch Interactions

- Pull-to-refresh on list views
- Swipe actions on mobile (e.g., swipe to delete/archive)
- Touch-friendly tap targets (min 44x44px)

### Mobile Optimizations

- Drawer navigation on mobile
- Bottom sheet modals
- Optimized images with lazy loading
- Reduced data fetching on mobile

### Viewport Testing

Test on iPhone SE (375px) to iPad Pro (1024px)

## State Management

- **Server state**: TanStack Query
- **Client state**: React hooks (useState, useReducer)
- **Form state**: React Hook Form
- **Global state**: Zustand (if needed)

## Design System Implementation

- **Color System**: Custom gray scale and brand colors defined in CSS variables and Tailwind config
- **Typography**: Consistent scale with responsive adjustments for mobile
- **Components**: All shadcn/ui components customized to match design system
- **Spacing**: 4px grid system throughout
- **Important**: Must use Tailwind CSS v3 (not v4) for proper compilation

## Error Handling

- Use error boundaries for UI errors
- Consistent error response format
- User-friendly error messages
- Log errors to monitoring service

## File Naming Conventions

### Components

- PascalCase for component files: `UserProfile.tsx`
- kebab-case for non-component files: `user-utils.ts`
- Colocation: Keep tests and styles near components

### API Routes

- kebab-case for route segments: `/api/user-settings`
- RESTful naming conventions
- Clear endpoint purposes

### Database/Types

- camelCase for TypeScript interfaces
- snake_case for database columns
- Clear, descriptive names

## Import Organization

```typescript
// 1. React and Next.js imports
import React from "react";
import { NextRequest } from "next/server";

// 2. Third-party libraries
import { z } from "zod";
import { Button } from "@/components/ui/button";

// 3. Internal utilities and services
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";

// 4. Types and interfaces
import type { User } from "@/types/user";

// 5. Relative imports (avoid when possible)
import "./styles.css";
```

## Component Structure

```typescript
// 1. Imports (organized as above)

// 2. Types and interfaces
interface ComponentProps {
  // ...
}

// 3. Component implementation
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 4. Hooks (in order of dependency)
  const [state, setState] = useState()
  const query = useQuery(...)

  // 5. Event handlers
  const handleClick = useCallback(() => {
    // ...
  }, [dependencies])

  // 6. Render
  return (
    // JSX
  )
}

// 7. Default export (if needed)
export default ComponentName
```
