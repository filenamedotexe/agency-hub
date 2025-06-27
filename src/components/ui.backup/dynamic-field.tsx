import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DynamicFieldProps {
  field: string;
  className?: string;
  showCopyIcon?: boolean;
  variant?: "inline" | "badge" | "code";
}

export function DynamicField({
  field,
  className = "",
  showCopyIcon = false,
  variant = "code",
}: DynamicFieldProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(field);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const baseClasses = "cursor-pointer transition-colors";

  const variantClasses = {
    inline: "hover:bg-muted-foreground/10 px-1 rounded",
    badge:
      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors",
    code: "font-mono text-sm bg-muted px-2 py-1 rounded hover:bg-muted-foreground/20",
  };

  if (variant === "badge" && showCopyIcon) {
    return (
      <span
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        onClick={copyToClipboard}
        title="Click to copy"
      >
        {field}
        <Copy className="ml-1 h-3 w-3" />
      </span>
    );
  }

  return (
    <code
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={copyToClipboard}
      title="Click to copy"
    >
      {field}
    </code>
  );
}

interface DynamicTextProps {
  children: string;
  className?: string;
  variant?: "inline" | "badge" | "code";
}

// Component that automatically detects and renders dynamic fields in text
export function DynamicText({
  children,
  className = "",
  variant = "inline",
}: DynamicTextProps) {
  const dynamicFieldRegex = /\{\{([^}]+)\}\}/g;

  const parts = children.split(dynamicFieldRegex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isDynamicField = index % 2 === 1; // Every odd index is a dynamic field

        if (isDynamicField) {
          return (
            <DynamicField key={index} field={`{{${part}}}`} variant={variant} />
          );
        }

        return part;
      })}
    </span>
  );
}
