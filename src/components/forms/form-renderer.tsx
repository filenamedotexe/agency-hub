"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormField } from "@/types/forms";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

interface FormRendererProps {
  form: Form;
  onSubmit: (data: Record<string, any>) => void;
  isPreview?: boolean;
  className?: string;
}

export function FormRenderer({
  form,
  onSubmit,
  isPreview = false,
  className,
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required) {
      if (!value) {
        return `${field.label} is required`;
      }

      // For list fields, check if array is empty or has only empty strings
      if (field.type === "list" && Array.isArray(value)) {
        const hasNonEmptyItem = value.some(
          (item) => item && item.trim() !== ""
        );
        if (!hasNonEmptyItem) {
          return `${field.label} must have at least one item`;
        }
      }
    }

    if (field.validation) {
      const { min, max, minLength, maxLength, pattern } = field.validation;

      if (field.type === "number") {
        const numValue = parseFloat(value);
        if (min !== undefined && numValue < min) {
          return `${field.label} must be at least ${min}`;
        }
        if (max !== undefined && numValue > max) {
          return `${field.label} must be at most ${max}`;
        }
      }

      if (["text", "textarea", "email", "tel"].includes(field.type)) {
        const strValue = String(value);
        if (minLength !== undefined && strValue.length < minLength) {
          return `${field.label} must be at least ${minLength} characters`;
        }
        if (maxLength !== undefined && strValue.length > maxLength) {
          return `${field.label} must be at most ${maxLength} characters`;
        }
        if (pattern) {
          const regex = new RegExp(pattern);
          if (!regex.test(strValue)) {
            return `${field.label} format is invalid`;
          }
        }
      }
    }

    if (field.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Please enter a valid email address";
      }
    }

    return null;
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData({ ...formData, [fieldName]: value });
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    form.schema.forEach((field) => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Format data for submission
      const submissionData: Record<string, any> = {};
      form.schema.forEach((field) => {
        if (formData[field.name] !== undefined) {
          let value = formData[field.name];

          // For list fields, filter out empty strings
          if (field.type === "list" && Array.isArray(value)) {
            value = value.filter((item) => item && item.trim() !== "");
          }

          submissionData[field.name] = {
            value: value,
            type: field.type,
            label: field.label,
          };
        }
      });

      await onSubmit(submissionData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldDescription = (description?: string) => {
    if (!description) return null;
    return <p className="text-sm text-muted-foreground">{description}</p>;
  };

  const renderField = (field: FormField) => {
    const error = errors[field.name];
    const value = formData[field.name] || "";

    switch (field.type) {
      case "text":
      case "email":
      case "tel":
      case "number":
      case "date":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && (
                <span className="ml-1 text-destructive">*</span>
              )}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={cn(error && "border-destructive")}
              aria-invalid={!!error}
              aria-describedby={error ? `${field.id}-error` : undefined}
            />
            {renderFieldDescription(field.description)}
            {error && (
              <p id={`${field.id}-error`} className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && (
                <span className="ml-1 text-destructive">*</span>
              )}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={cn(error && "border-destructive")}
              rows={4}
              aria-invalid={!!error}
              aria-describedby={error ? `${field.id}-error` : undefined}
            />
            {renderFieldDescription(field.description)}
            {error && (
              <p id={`${field.id}-error`} className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        );

      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && (
                <span className="ml-1 text-destructive">*</span>
              )}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleFieldChange(field.name, val)}
            >
              <SelectTrigger
                id={field.id}
                className={cn(error && "border-destructive")}
                aria-invalid={!!error}
                aria-describedby={error ? `${field.id}-error` : undefined}
              >
                <SelectValue
                  placeholder={field.placeholder || "Select an option"}
                />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderFieldDescription(field.description)}
            {error && (
              <p id={`${field.id}-error`} className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        );

      case "radio":
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && (
                <span className="ml-1 text-destructive">*</span>
              )}
            </Label>
            <RadioGroup
              value={value}
              onValueChange={(val) => handleFieldChange(field.name, val)}
              aria-invalid={!!error}
              aria-describedby={error ? `${field.id}-error` : undefined}
            >
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`${field.id}-${option.value}`}
                  />
                  <Label
                    htmlFor={`${field.id}-${option.value}`}
                    className="cursor-pointer font-normal"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {renderFieldDescription(field.description)}
            {error && (
              <p id={`${field.id}-error`} className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        );

      case "checkbox":
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={value === true}
                onCheckedChange={(checked: boolean) =>
                  handleFieldChange(field.name, checked)
                }
                aria-invalid={!!error}
                aria-describedby={error ? `${field.id}-error` : undefined}
              />
              <Label htmlFor={field.id} className="cursor-pointer font-normal">
                {field.label}
                {field.required && (
                  <span className="ml-1 text-destructive">*</span>
                )}
              </Label>
            </div>
            {renderFieldDescription(field.description)}
            {error && (
              <p id={`${field.id}-error`} className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        );

      case "file":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && (
                <span className="ml-1 text-destructive">*</span>
              )}
            </Label>
            <Input
              id={field.id}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFieldChange(field.name, file.name); // In preview, just store filename
                }
              }}
              className={cn(error && "border-destructive")}
              aria-invalid={!!error}
              aria-describedby={error ? `${field.id}-error` : undefined}
            />
            {renderFieldDescription(field.description)}
            {error && (
              <p id={`${field.id}-error`} className="text-sm text-destructive">
                {error}
              </p>
            )}
            {isPreview && (
              <p className="text-xs text-muted-foreground">
                File uploads are simulated in preview mode
              </p>
            )}
          </div>
        );

      case "list":
        const listItems = Array.isArray(value) ? value : [];

        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && (
                <span className="ml-1 text-destructive">*</span>
              )}
            </Label>

            <div className="space-y-2">
              {listItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newItems = [...listItems];
                      newItems[index] = e.target.value;
                      handleFieldChange(field.name, newItems);
                    }}
                    placeholder={field.placeholder || "Enter item"}
                    className={cn(error && "border-destructive")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newItems = listItems.filter((_, i) => i !== index);
                      handleFieldChange(field.name, newItems);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  handleFieldChange(field.name, [...listItems, ""]);
                }}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add another item
              </Button>
            </div>

            {renderFieldDescription(field.description)}
            {error && (
              <p id={`${field.id}-error`} className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {form.schema.map((field) => renderField(field))}

      <div className="pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting
            ? "Submitting..."
            : form.settings?.submitButtonText || "Submit"}
        </Button>
        {isPreview && (
          <p className="mt-2 text-xs text-muted-foreground">
            This is a test submission - no data will be saved
          </p>
        )}
      </div>
    </form>
  );
}
