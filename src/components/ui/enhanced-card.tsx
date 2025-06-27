"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

interface EnhancedCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  expandable?: boolean;
  className?: string;
  icon?: React.ReactNode;
  iconColor?: string;
}

export function EnhancedCard({
  children,
  onClick,
  expandable = false,
  className,
  icon,
  iconColor,
}: EnhancedCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-lg border bg-white shadow-sm transition-shadow",
        "hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {icon && (
        <div className={cn("absolute right-4 top-4", iconColor)}>{icon}</div>
      )}
      {children}

      {expandable && (
        <motion.div
          initial={false}
          animate={{ height: expanded ? "auto" : 0 }}
          className="overflow-hidden"
        >
          <div className="border-t p-6 pt-0">{/* Expanded content */}</div>
        </motion.div>
      )}
    </motion.div>
  );
}
