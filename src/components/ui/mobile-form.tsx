import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Input } from "./input";
import { useState } from "react";

interface FloatingLabelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FloatingLabelInput({
  label,
  error,
  className,
  ...props
}: FloatingLabelInputProps) {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        className={cn("pb-2 pt-6", error && "border-red-500", className)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          setHasValue(!!e.target.value);
        }}
        onChange={(e) => {
          props.onChange?.(e);
          setHasValue(!!e.target.value);
        }}
      />
      <Label
        className={cn(
          "pointer-events-none absolute left-3 transition-all duration-200",
          focused || hasValue
            ? "top-2 text-xs text-gray-600"
            : "top-4 text-base text-gray-500"
        )}
      >
        {label}
      </Label>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
