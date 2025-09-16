# Spike Style Guide

> Comprehensive design system and style guide for the Spike academic management platform

## 🎨 Design Philosophy

### Core Principles
- **Hebrew/RTL First**: All design decisions prioritize Hebrew readability and RTL layout
- **Academic Context**: Tailored for Israeli university students (BGU focus)
- **Accessibility**: WCAG AA+ compliant with high contrast and keyboard navigation
- **Performance**: Optimized for fast load times and smooth interactions
- **Consistency**: Unified design language across all components

## 🎯 Color System

### Brand Colors
```css
/* Primary Blue Scale */
--primary: hsl(222.2, 47.4%, 11.2%);
--primary-foreground: hsl(210, 40%, 98%);

/* Extended Blue Palette */
--blue-50: #eff6ff;
--blue-100: #dbeafe;
--blue-200: #bfdbfe;
--blue-300: #93c5fd;
--blue-400: #60a5fa;
--blue-500: #3b82f6;  /* Main brand blue */
--blue-600: #2563eb;
--blue-700: #1d4ed8;
--blue-800: #1e40af;
--blue-900: #1e3a8a;
```

### Semantic Colors
```css
/* Status Colors */
--success: hsl(142, 76%, 36%);
--warning: hsl(38, 92%, 50%);
--error: hsl(0, 84%, 60%);
--destructive: hsl(0, 84%, 60%);

/* Neutral Colors */
--background: hsl(0, 0%, 100%);
--foreground: hsl(222.2, 84%, 4.9%);
--muted: hsl(210, 40%, 96.1%);
--muted-foreground: hsl(215.4, 16.3%, 46.9%);
--border: hsl(214.3, 31.8%, 91.4%);
```

### Dark Mode Colors
```css
/* Dark Theme */
.dark {
  --background: hsl(222.2, 84%, 4.9%);
  --foreground: hsl(210, 40%, 98%);
  --primary: hsl(210, 40%, 98%);
  --primary-foreground: hsl(222.2, 47.4%, 11.2%);
  --muted: hsl(217.2, 32.6%, 17.5%);
  --muted-foreground: hsl(215, 20.2%, 65.1%);
  --border: hsl(217.2, 32.6%, 17.5%);
}
```

### Chart Colors
```css
--chart-1: hsl(12, 76%, 61%);
--chart-2: hsl(173, 58%, 39%);
--chart-3: hsl(197, 37%, 24%);
--chart-4: hsl(43, 74%, 66%);
--chart-5: hsl(27, 87%, 67%);
```

## 📝 Typography

### Font Stack
```css
/* Hebrew-optimized font stack */
--font-primary: var(--font-heebo), 'Assistant', 'Inter', system-ui, sans-serif;
--font-brand: 'Poppins', var(--font-heebo), sans-serif;

/* Directional font loading */
[dir="rtl"] {
  font-family: var(--font-heebo), 'Assistant', system-ui, sans-serif;
}

[dir="ltr"] {
  font-family: var(--font-heebo), 'Inter', 'Assistant', system-ui, sans-serif;
}
```

### Type Scale
```css
/* Headings */
.text-7xl { font-size: 4.5rem; line-height: 1; }
.text-6xl { font-size: 3.75rem; line-height: 1; }
.text-5xl { font-size: 3rem; line-height: 1; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }

/* Body */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
```

### Font Weights
```css
.font-thin { font-weight: 100; }
.font-light { font-weight: 300; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
```

## 📏 Spacing System

### Base Scale
```css
/* Spacing values in rem */
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-18: 4.5rem;   /* 72px - Custom */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */
--space-88: 22rem;    /* 352px - Custom */
```

### Border Radius
```css
--radius: 0.5rem;           /* Default */
--radius-sm: calc(var(--radius) - 4px);
--radius-md: calc(var(--radius) - 2px);
--radius-lg: var(--radius);
--radius-xl: 0.75rem;       /* 12px */
--radius-2xl: 1rem;         /* 16px */
--radius-3xl: 1.5rem;       /* 24px */
--radius-full: 9999px;      /* Pills */
```

## 🧩 Component Patterns

### Button Variants
```typescript
// Size variants
size: {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
}

// Style variants
variant: {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-background hover:bg-accent",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
}
```

### Card Structure
```jsx
<Card className="rounded-lg border bg-card shadow-sm">
  <CardHeader>
    <CardTitle>כותרת</CardTitle>
    <CardDescription>תיאור</CardDescription>
  </CardHeader>
  <CardContent>תוכן</CardContent>
  <CardFooter>פעולות</CardFooter>
</Card>
```

### Form Controls
```css
/* Input base styles */
.input {
  @apply flex h-10 w-full rounded-md border border-input
         bg-background px-3 py-2 text-sm ring-offset-background
         file:border-0 file:bg-transparent file:text-sm file:font-medium
         placeholder:text-muted-foreground
         focus-visible:outline-none focus-visible:ring-2
         focus-visible:ring-ring focus-visible:ring-offset-2
         disabled:cursor-not-allowed disabled:opacity-50;
}

/* Hebrew/RTL forms */
[dir="rtl"] .input {
  text-align: right;
}
```

## 🌍 Hebrew/RTL Guidelines

### CSS Logical Properties
```css
/* NEVER use physical properties */
/* ❌ margin-left, margin-right, padding-left, padding-right */
/* ❌ left, right, text-align: left/right */

/* ALWAYS use logical properties */
/* ✅ margin-inline-start, margin-inline-end */
/* ✅ padding-inline-start, padding-inline-end */
/* ✅ inset-inline-start, inset-inline-end */
/* ✅ text-align: start/end */
```

### RTL Layout Patterns
```jsx
// Component with RTL support
<div className="flex flex-row-reverse gap-4">
  <span>ראשון</span>
  <span>שני</span>
  <span>שלישי</span>
</div>

// Form with Hebrew labels
<label className="text-right block text-sm font-medium">
  שם מלא
  <input className="mt-1 text-right" placeholder="הכנס שם מלא" />
</label>
```

### Hebrew Content Guidelines
- Use Hebrew typography fonts (Heebo, Assistant)
- Right-align all Hebrew text by default
- Use Hebrew academic terminology consistently
- Test with actual Hebrew content, not Lorem Ipsum

## ✨ Animation & Motion

### Animation Presets
```css
/* Fade animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide animations */
@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideDown {
  from { transform: translateY(-30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Scale animations */
@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

### Motion Timing
```css
/* Duration */
--duration-fast: 200ms;
--duration-normal: 300ms;
--duration-slow: 500ms;

/* Easing */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### Framer Motion Patterns
```jsx
// Entrance animation
initial={{ opacity: 0, y: 30 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}

// Scroll-triggered
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, amount: 0.3 }}

// Staggered list
transition={{ delay: index * 0.1 }}
```

## 🎭 Shadow System

```css
/* Elevation scale */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

/* Custom soft shadows */
--shadow-soft: 0 2px 15px -3px rgba(0, 0, 0, 0.07),
               0 10px 20px -2px rgba(0, 0, 0, 0.04);
--shadow-medium: 0 4px 25px -5px rgba(0, 0, 0, 0.1),
                 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-large: 0 10px 40px -10px rgba(0, 0, 0, 0.15),
                0 2px 10px -2px rgba(0, 0, 0, 0.05);
```

## 🔧 Utility Helpers

### Class Name Utility
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Common Patterns
```jsx
// Conditional classes
className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes"
)}

// Variant classes with CVA
const buttonVariants = cva(
  "base-button-classes",
  {
    variants: {
      variant: { /* ... */ },
      size: { /* ... */ }
    }
  }
)
```

## 📱 Responsive Design

### Breakpoints
```css
/* Tailwind default breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X Extra large devices */
```

### Mobile-First Approach
```jsx
// Base mobile styles, then add larger screen modifications
<div className="text-sm md:text-base lg:text-lg">
  תוכן רספונסיבי
</div>

// Hebrew mobile patterns
<div className="px-4 md:px-6 lg:px-8">
  <h1 className="text-2xl md:text-4xl font-bold text-right">
    כותרת ראשית
  </h1>
</div>
```

## 🎪 Special Elements

### Background Patterns
```css
/* Grid overlay */
background-image: linear-gradient(
  to right,
  #80808012 1px,
  transparent 1px
);

/* Gradient backgrounds */
background: linear-gradient(
  135deg,
  var(--blue-500) 0%,
  var(--blue-700) 100%
);
```

### Particle Effects
```jsx
// Floating animation
animate={{
  y: [0, -10, 0],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: "easeInOut"
  }
}}
```

## 📋 Best Practices

### Component Development
1. **Use Radix UI primitives** for accessibility
2. **Forward refs** for proper component composition
3. **CVA for variants** to manage component states
4. **Logical properties** for RTL support
5. **Semantic HTML** for better accessibility

### Performance Guidelines
1. **Lazy load** heavy components
2. **Use CSS animations** over JavaScript when possible
3. **Optimize font loading** with next/font
4. **Minimize bundle size** with tree-shaking
5. **Code split** by route

### Accessibility Standards
1. **WCAG AA compliance** for color contrast (4.5:1 minimum)
2. **Focus indicators** on all interactive elements
3. **Keyboard navigation** support
4. **ARIA labels** in Hebrew
5. **Screen reader** compatibility

### Hebrew/RTL Checklist
- [ ] All text uses logical CSS properties
- [ ] Forms are right-aligned
- [ ] Icons flip appropriately in RTL
- [ ] Numbers remain LTR within RTL text
- [ ] Hebrew fonts load before Latin fonts
- [ ] Placeholders are in Hebrew
- [ ] Date formats follow Israeli conventions (DD/MM/YYYY)

## 🚀 Implementation Examples

### Complete Button Component
```tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### Hebrew Form Field
```tsx
const FormField = ({ label, placeholder, error }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-right">
      {label}
    </label>
    <input
      className={cn(
        "w-full rounded-md border px-3 py-2 text-right",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-primary",
        error && "border-destructive focus:ring-destructive"
      )}
      placeholder={placeholder}
      dir="rtl"
    />
    {error && (
      <p className="text-sm text-destructive text-right">{error}</p>
    )}
  </div>
)
```

---

*This style guide is a living document and should be updated as the design system evolves.*