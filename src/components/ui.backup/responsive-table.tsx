import React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResponsiveTableContainer({
  children,
  className,
}: ResponsiveTableProps) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
