"use client";

import {
  CheckCircle,
  Circle,
  Clock,
  CreditCard,
  FileText,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  completedAt?: string;
  status: "completed" | "current" | "upcoming";
  icon: "payment" | "contract" | "setup" | "active" | "delivered";
}

interface OrderTimelineProps {
  items: TimelineItem[];
}

export function OrderTimeline({ items }: OrderTimelineProps) {
  const getIcon = (type: string, status: string) => {
    const iconProps = {
      className: cn(
        "h-5 w-5",
        status === "completed"
          ? "text-green-600"
          : status === "current"
            ? "text-blue-600"
            : "text-gray-400"
      ),
    };

    switch (type) {
      case "payment":
        return <CreditCard {...iconProps} />;
      case "contract":
        return <FileText {...iconProps} />;
      case "setup":
        return <Clock {...iconProps} />;
      case "active":
        return <Package {...iconProps} />;
      default:
        return <Circle {...iconProps} />;
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {items.map((item, idx) => (
          <li key={item.id}>
            <div className="relative pb-8">
              {idx !== items.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white",
                      item.status === "completed"
                        ? "bg-green-500"
                        : item.status === "current"
                          ? "bg-blue-500"
                          : "bg-gray-300"
                    )}
                  >
                    {item.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      getIcon(item.icon, item.status)
                    )}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p
                      className={cn(
                        "text-sm",
                        item.status === "completed"
                          ? "text-gray-900"
                          : "text-gray-500"
                      )}
                    >
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-sm text-gray-500">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    {item.completedAt && (
                      <time dateTime={item.completedAt}>
                        {new Date(item.completedAt).toLocaleDateString()}
                      </time>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
