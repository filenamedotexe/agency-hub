"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  disabled?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function QuickActions({
  actions,
  columns = 4,
  className,
}: QuickActionsProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  const variantStyles = {
    default: "bg-white hover:bg-gray-50 text-gray-600",
    primary: "bg-blue-50 hover:bg-blue-100 text-blue-600",
    success: "bg-green-50 hover:bg-green-100 text-green-600",
    warning: "bg-yellow-50 hover:bg-yellow-100 text-yellow-600",
    danger: "bg-red-50 hover:bg-red-100 text-red-600",
  };

  return (
    <div className={cn(`grid ${gridCols[columns]} gap-3`, className)}>
      {actions.map((action) => (
        <motion.button
          key={action.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          disabled={action.disabled}
          className={cn(
            "rounded-lg border p-4 transition-all duration-200",
            "flex flex-col items-center justify-center gap-2",
            "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            variantStyles[action.variant || "default"],
            action.disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <action.icon className="h-6 w-6" />
          <span className="text-sm font-medium">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
