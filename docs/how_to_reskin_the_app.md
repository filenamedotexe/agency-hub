# How to Reskin the Agency Hub App

This guide explains how to completely transform the visual appearance of the Agency Hub application, from simple color changes to advanced animations and modern UI effects.

## Quick Start: Basic Reskinning

### 1. Color Theme Changes

The entire color system is centralized in `tailwind.config.ts`. To change colors:

```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        // Secondary colors
        secondary: {
          50: "#f8fafc",
          500: "#64748b",
          700: "#334155",
        },
        // Semantic colors
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
};
```

### 2. Typography System

Update fonts globally:

```javascript
// tailwind.config.ts
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  display: ['Cal Sans', 'Inter', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

### 3. Spacing & Layout

Modify spacing scale for different visual density:

```javascript
// tailwind.config.ts
spacing: {
  // Tighter spacing for compact design
  'xs': '0.25rem',
  'sm': '0.5rem',
  'md': '1rem',
  'lg': '1.5rem',
  'xl': '2rem',
}
```

## Advanced Reskinning

### Component-Level Theming

All shadcn/ui components use CSS variables defined in `globals.css`:

```css
/* src/app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode variables */
  }
}
```

### Adding Animations

#### 1. Install Animation Libraries

```bash
npm install framer-motion
npm install @react-spring/web
npm install lottie-react
```

#### 2. Page Transitions

```tsx
// src/components/layouts/PageTransition.tsx
import { motion } from "framer-motion";

export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

#### 3. Micro-interactions

```tsx
// Button hover effects
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400 }}
>
  Click me
</motion.button>
```

#### 4. Scroll Animations

```tsx
// Reveal on scroll
import { useInView } from "framer-motion";

export function RevealOnScroll({ children }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
}
```

## Modern UI Effects

### Glassmorphism

```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}
```

### Gradient Backgrounds

```css
.gradient-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.animated-gradient {
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
```

### Neumorphism

```css
.neumorphic {
  background: #e0e0e0;
  border-radius: 20px;
  box-shadow:
    20px 20px 60px #bebebe,
    -20px -20px 60px #ffffff;
}
```

### 3D Transforms

```css
.card-3d {
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.card-3d:hover {
  transform: rotateY(180deg);
}
```

## What to Provide for Custom Reskinning

### 1. Visual References

- **Screenshots/Links**: Websites or apps with desired look
- **Dribbble/Behance**: Specific design shots
- **Figma/Sketch files**: If available
- **Mood boards**: Color palettes, typography examples

### 2. Animation References

- **Video examples**: Screen recordings of desired interactions
- **Prototype links**: Figma/Framer prototypes
- **Animation descriptions**: "Smooth fade-in on scroll", "Bouncy button press"

### 3. Brand Guidelines

- **Logo files**: SVG format preferred
- **Brand colors**: Hex codes or color system
- **Typography**: Font names and usage rules
- **Tone**: Professional, playful, minimal, bold, etc.

### 4. Specific Requirements

```markdown
Example brief:

- Primary color: #5B21B6
- Font: Sora for headings, Inter for body
- Border radius: 12px for cards, 8px for buttons
- Animations: Subtle fade-ins, smooth hover states
- Style: Modern, clean, with gradient accents
- Special effects: Glassmorphism on modals
```

## Implementation Approach

### Phase 1: Core Theme (1-2 days)

1. Update Tailwind config with new colors
2. Update CSS variables for shadcn/ui
3. Install and configure new fonts
4. Update spacing and border radius

### Phase 2: Component Updates (2-3 days)

1. Update button styles and states
2. Redesign cards and modals
3. Update navigation appearance
4. Enhance form inputs

### Phase 3: Animations (2-3 days)

1. Add page transitions
2. Implement scroll animations
3. Add micro-interactions
4. Create loading states

### Phase 4: Polish (1-2 days)

1. Add special effects (gradients, shadows)
2. Ensure mobile responsiveness
3. Performance optimization
4. Cross-browser testing

## Performance Considerations

### Animation Performance

- Use `transform` and `opacity` for animations (GPU accelerated)
- Avoid animating `width`, `height`, or `position`
- Use `will-change` sparingly
- Implement `prefers-reduced-motion` support

### Bundle Size

- Tree-shake unused animations
- Lazy load animation libraries
- Use CSS animations for simple effects
- Optimize image assets

## Examples of Modern UI Patterns

### 1. Bento Grid Layout

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.bento-item:first-child {
  grid-column: span 2;
  grid-row: span 2;
}
```

### 2. Floating Labels

```css
.floating-label {
  transition: all 0.2s ease-out;
}

input:focus + .floating-label,
input:not(:placeholder-shown) + .floating-label {
  transform: translateY(-1.5rem) scale(0.85);
  color: var(--primary);
}
```

### 3. Skeleton Loading

```css
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

## Tools & Resources

### Design Tools

- **Figma**: Component design and prototyping
- **Tailwind UI**: Premium component examples
- **Heroicons**: Icon library
- **Radix UI Icons**: Alternative icon set

### Animation Tools

- **Framer Motion**: React animation library
- **React Spring**: Physics-based animations
- **Lottie**: After Effects animations
- **GSAP**: Advanced animation sequences

### Inspiration Sources

- **Awwwards**: Cutting-edge web design
- **Dribbble**: UI design shots
- **Behance**: Complete design projects
- **Collect UI**: UI element examples

## Testing Your Reskin

### Visual Regression Testing

```bash
# Add to your testing suite
npm install @playwright/test

# Create visual tests
test('visual regression - dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png');
});
```

### Accessibility Testing

- Ensure color contrast meets WCAG standards
- Test animations with prefers-reduced-motion
- Verify focus states are visible
- Test with screen readers

### Performance Testing

- Measure First Contentful Paint
- Check Cumulative Layout Shift
- Monitor animation frame rates
- Test on low-end devices

## Maintenance

### Theme Switching

Implement a theme provider for easy switching:

```tsx
// src/providers/ThemeProvider.tsx
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={theme}>{children}</div>
    </ThemeContext.Provider>
  );
}
```

### Version Control

- Create a branch for each major visual update
- Document color/font changes in commits
- Keep before/after screenshots
- Tag releases with visual version numbers

This guide provides everything needed to completely transform the Agency Hub's visual appearance while maintaining its functionality and performance.
