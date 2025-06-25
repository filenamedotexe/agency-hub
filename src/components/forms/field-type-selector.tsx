"use client";

import {
  Type,
  TextCursorInput,
  Hash,
  Mail,
  Phone,
  Calendar,
  List,
  CheckSquare,
  Circle,
  Paperclip,
  ListPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldType } from "@/types/forms";

interface FieldTypeSelectorProps {
  onSelect: (type: FieldType) => void;
}

const fieldTypes: {
  type: FieldType;
  label: string;
  icon: React.ElementType;
}[] = [
  { type: "text", label: "Text", icon: Type },
  { type: "textarea", label: "Text Area", icon: TextCursorInput },
  { type: "number", label: "Number", icon: Hash },
  { type: "email", label: "Email", icon: Mail },
  { type: "tel", label: "Phone", icon: Phone },
  { type: "date", label: "Date", icon: Calendar },
  { type: "select", label: "Dropdown", icon: List },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: "radio", label: "Radio", icon: Circle },
  { type: "file", label: "File Upload", icon: Paperclip },
  { type: "list", label: "List", icon: ListPlus },
];

export function FieldTypeSelector({ onSelect }: FieldTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
      {fieldTypes.map(({ type, label, icon: Icon }) => (
        <Button
          key={type}
          variant="outline"
          size="sm"
          onClick={() => onSelect(type)}
          className="flex h-auto flex-col items-center gap-1 py-2"
        >
          <Icon className="h-4 w-4" />
          <span className="text-xs">{label}</span>
        </Button>
      ))}
    </div>
  );
}
