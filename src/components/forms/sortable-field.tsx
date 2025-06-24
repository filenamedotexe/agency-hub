"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FieldOption } from "@/types/forms";

interface SortableFieldProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
}

export function SortableField({
  field,
  onUpdate,
  onRemove,
}: SortableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const addOption = () => {
    const newOption: FieldOption = {
      label: `Option ${(field.options?.length || 0) + 1}`,
      value: `option${(field.options?.length || 0) + 1}`,
    };
    onUpdate({ options: [...(field.options || []), newOption] });
  };

  const updateOption = (index: number, updates: Partial<FieldOption>) => {
    const newOptions = [...(field.options || [])];
    newOptions[index] = { ...newOptions[index], ...updates };
    onUpdate({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = field.options?.filter((_, i) => i !== index);
    onUpdate({ options: newOptions });
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="relative">
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <CardContent className="space-y-3 py-4 pl-10 pr-2">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`${field.id}-label`}>Label</Label>
                  <Input
                    id={`${field.id}-label`}
                    value={field.label}
                    onChange={(e) => onUpdate({ label: e.target.value })}
                    placeholder="Field label"
                  />
                </div>
                <div>
                  <Label htmlFor={`${field.id}-name`}>Field Name</Label>
                  <Input
                    id={`${field.id}-name`}
                    value={field.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    placeholder="field_name"
                  />
                </div>
              </div>

              {["text", "textarea", "email", "tel", "number"].includes(
                field.type
              ) && (
                <div>
                  <Label htmlFor={`${field.id}-placeholder`}>Placeholder</Label>
                  <Input
                    id={`${field.id}-placeholder`}
                    value={field.placeholder || ""}
                    onChange={(e) => onUpdate({ placeholder: e.target.value })}
                    placeholder="Enter placeholder text"
                  />
                </div>
              )}

              {["select", "radio", "checkbox"].includes(field.type) && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  {field.options?.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option.label}
                        onChange={(e) =>
                          updateOption(index, { label: e.target.value })
                        }
                        placeholder="Label"
                      />
                      <Input
                        value={option.value}
                        onChange={(e) =>
                          updateOption(index, { value: e.target.value })
                        }
                        placeholder="Value"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addOption}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Option
                  </Button>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id={`${field.id}-required`}
                  checked={field.required}
                  onCheckedChange={(checked) => onUpdate({ required: checked })}
                />
                <Label htmlFor={`${field.id}-required`}>Required field</Label>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="mt-6"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
