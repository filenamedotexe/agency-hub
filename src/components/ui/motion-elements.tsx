"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// Motion Div component for general animations
export const MotionDiv = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div">
>(({ className, children, ...props }, ref) => {
  return (
    <motion.div ref={ref} className={className} {...props}>
      {children}
    </motion.div>
  );
});

MotionDiv.displayName = "MotionDiv";

// Motion Link component for navigation links
export const MotionLink = React.forwardRef<
  HTMLAnchorElement,
  HTMLMotionProps<"a">
>(({ className, children, ...props }, ref) => {
  return (
    <motion.a
      ref={ref}
      className={cn("transition-colors", className)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 20,
      }}
      {...props}
    >
      {children}
    </motion.a>
  );
});

MotionLink.displayName = "MotionLink";

// Motion Input component with focus animations
export const MotionInput = React.forwardRef<
  HTMLInputElement,
  HTMLMotionProps<"input">
>(({ className, ...props }, ref) => {
  return (
    <motion.input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      whileFocus={{ scale: 1.02 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      {...props}
    />
  );
});

MotionInput.displayName = "MotionInput";

// Motion Badge with hover effect
export const MotionBadge = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div"> & { variant?: string }
>(({ className, children, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        className
      )}
      whileHover={{ scale: 1.1 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 25,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

MotionBadge.displayName = "MotionBadge";

// Motion Icon Button for icon-only buttons
interface MotionIconButtonProps extends HTMLMotionProps<"button"> {
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export const MotionIconButton = React.forwardRef<
  HTMLButtonElement,
  MotionIconButtonProps
>(
  (
    {
      className,
      variant = "ghost",
      size = "icon",
      children,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? motion.span : motion.button;

    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-8 w-8",
    };

    const variantClasses = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline:
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    };

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9, rotate: -5 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 17,
        }}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

MotionIconButton.displayName = "MotionIconButton";

// Animated List Item for lists with stagger effect
export const MotionListItem = React.forwardRef<
  HTMLLIElement,
  HTMLMotionProps<"li"> & { index?: number }
>(({ className, children, index = 0, ...props }, ref) => {
  return (
    <motion.li
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      whileHover={{ x: 5 }}
      {...props}
    >
      {children}
    </motion.li>
  );
});

MotionListItem.displayName = "MotionListItem";

// Floating Action Button with bounce effect
export const MotionFAB = React.forwardRef<
  HTMLButtonElement,
  HTMLMotionProps<"button">
>(({ className, children, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      className={cn(
        "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90",
        className
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
});

MotionFAB.displayName = "MotionFAB";
