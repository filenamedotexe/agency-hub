"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

interface EnhancedCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  expandable?: boolean;
  className?: string;
}

export function EnhancedCard({
  children,
  onClick,
  expandable = false,
  className,
}: EnhancedCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "rounded-lg border bg-white shadow-sm transition-shadow",
        "hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <motion.div layout="position" className="p-6">
        {children}
      </motion.div>

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
