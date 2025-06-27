"use client";

import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const rotate = useTransform(y, [0, threshold], [0, 360]);
  const opacity = useTransform(y, [0, threshold], [0, 1]);

  const handleDragEnd = useCallback(
    async (event: any, info: PanInfo) => {
      if (info.offset.y > threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
    },
    [threshold, isRefreshing, onRefresh]
  );

  // Only enable on mobile devices
  if (typeof window !== "undefined" && window.innerWidth > 768) {
    return <>{children}</>;
  }

  return (
    <motion.div
      ref={containerRef}
      drag="y"
      dragConstraints={{ top: 0, bottom: threshold * 2 }}
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
      style={{ y }}
      className="relative"
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute -top-12 left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-lg"
        style={{ opacity, y }}
      >
        <motion.div style={{ rotate }}>
          <RefreshCw
            className={`h-5 w-5 ${
              isRefreshing ? "animate-spin text-blue-500" : "text-gray-500"
            }`}
          />
        </motion.div>
      </motion.div>

      {/* Content */}
      <div className="relative">{children}</div>
    </motion.div>
  );
}
