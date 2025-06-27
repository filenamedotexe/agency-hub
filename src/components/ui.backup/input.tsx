import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-base transition-all duration-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-700 placeholder:text-gray-400 hover:border-gray-400 focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
