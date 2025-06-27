"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Save, Settings, ChevronRight, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotionButton } from "@/components/ui/motion-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FieldType,
  Form,
  FormSettings,
  FormStep,
} from "@/types/forms";
import { FieldTypeSelector } from "./field-type-selector";
import { SortableField } from "./sortable-field";
import { FormSettingsEditor } from "./form-settings-editor";
import { StepProgress } from "@/components/ui/progress-indicators";
import { cn } from "@/lib/utils";

interface MultiStepFormBuilderProps {
  form?: Form;
  onSave: (data: {
    name: string;
    description?: string;
    schema: FormField[];
    steps?: FormStep[];
    settings?: FormSettings;
    serviceId?: string;
  }) => Promise<void>;
  serviceId?: string;
}

export function MultiStepFormBuilder({
  form,
  onSave,
  serviceId,
}: MultiStepFormBuilderProps) {
  const [name, setName] = useState(form?.name || "");
  const [description, setDescription] = useState(form?.description || "");
  const [fields, setFields] = useState<FormField[]>(form?.schema || []);
  const [steps, setSteps] = useState<FormStep[]>(form?.steps || []);
  const [settings, setSettings] = useState<FormSettings>({
    ...form?.settings,
    multiStep: form?.settings?.multiStep ?? false,
    progressIndicator: form?.settings?.progressIndicator ?? "steps",
    allowStepNavigation: form?.settings?.allowStepNavigation ?? true,
    validateStepBeforeNext: form?.settings?.validateStepBeforeNext ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<FormStep | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const generateFieldName = (fieldLabel: string) => {
    const formNamePart = name.trim() || "form";
    const fieldLabelPart = fieldLabel.trim() || "field";

    const cleanName = `${formNamePart}_${fieldLabelPart}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    return cleanName;
  };

  const addStep = () => {
    const newStep: FormStep = {
      id: `step-${Date.now()}`,
      title: `Step ${steps.length + 1}`,
      description: "",
      order: steps.length,
    };
    setSteps([...steps, newStep]);
    setActiveStepId(newStep.id);
  };

  const updateStep = (stepId: string, updates: Partial<FormStep>) => {
    setSteps(
      steps.map((step) => (step.id === stepId ? { ...step, ...updates } : step))
    );
  };

  const removeStep = (stepId: string) => {
    // Remove the step
    setSteps(steps.filter((step) => step.id !== stepId));

    // Remove all fields associated with this step
    setFields(fields.filter((field) => field.stepId !== stepId));

    // Update active step if needed
    if (activeStepId === stepId) {
      const remainingSteps = steps.filter((step) => step.id !== stepId);
      setActiveStepId(remainingSteps.length > 0 ? remainingSteps[0].id : null);
    }
  };

  const moveStep = (stepId: string, direction: "up" | "down") => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    if (
      (direction === "up" && stepIndex === 0) ||
      (direction === "down" && stepIndex === steps.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? stepIndex - 1 : stepIndex + 1;
    const newSteps = arrayMove(steps, stepIndex, newIndex);

    // Update order values
    newSteps.forEach((step, index) => {
      step.order = index;
    });

    setSteps(newSteps);
  };

  const addField = (type: FieldType) => {
    const defaultLabel = `New ${type} field`;
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: defaultLabel,
      name: generateFieldName(defaultLabel),
      required: false,
      stepId: settings.multiStep ? activeStepId || undefined : undefined,
      ...(["select", "radio", "checkbox"].includes(type) && {
        options: [
          { label: "Option 1", value: "option1" },
          { label: "Option 2", value: "option2" },
        ],
      }),
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a form name");
      return;
    }

    if (fields.length === 0) {
      alert("Please add at least one field");
      return;
    }

    if (settings.multiStep && steps.length === 0) {
      alert("Please add at least one step for multi-step form");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name,
        description,
        schema: fields,
        steps: settings.multiStep ? steps : undefined,
        settings,
        serviceId,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldsForStep = (stepId: string | null) => {
    if (!settings.multiStep || !stepId) {
      return fields;
    }
    return fields.filter((field) => field.stepId === stepId);
  };

  const handleStepModalSave = () => {
    if (editingStep) {
      updateStep(editingStep.id, editingStep);
    }
    setStepModalOpen(false);
    setEditingStep(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
          <CardDescription>
            Configure your form&apos;s basic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Form Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contact Form"
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this form"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="multi-step"
              checked={settings.multiStep || false}
              onCheckedChange={(checked) => {
                setSettings({ ...settings, multiStep: checked });
                if (checked && steps.length === 0) {
                  addStep();
                }
              }}
            />
            <Label htmlFor="multi-step">Enable multi-step form</Label>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="fields" className="w-full">
        <TabsList>
          <TabsTrigger value="fields">Form Fields</TabsTrigger>
          {settings.multiStep && <TabsTrigger value="steps">Steps</TabsTrigger>}
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Fields</CardTitle>
              <CardDescription>
                {settings.multiStep
                  ? "Add fields to each step of your form"
                  : "Drag and drop to reorder fields"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.multiStep && steps.length > 0 && (
                <div className="mb-6">
                  <Label className="mb-2 block">Select Step</Label>
                  <div className="flex flex-wrap gap-2">
                    {steps
                      .sort((a, b) => a.order - b.order)
                      .map((step) => (
                        <MotionButton
                          key={step.id}
                          variant={
                            activeStepId === step.id ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setActiveStepId(step.id)}
                        >
                          {step.title}
                          <span className="ml-2 text-xs opacity-60">
                            ({getFieldsForStep(step.id).length} fields)
                          </span>
                        </MotionButton>
                      ))}
                  </div>
                </div>
              )}

              <div data-testid="field-type-selector">
                <FieldTypeSelector onSelect={addField} />
              </div>

              {getFieldsForStep(activeStepId).length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={getFieldsForStep(activeStepId).map((f) => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {getFieldsForStep(activeStepId).map((field) => (
                        <SortableField
                          key={field.id}
                          field={field}
                          onUpdate={(updates) => updateField(field.id, updates)}
                          onRemove={() => removeField(field.id)}
                          formName={name}
                          generateFieldName={generateFieldName}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  {settings.multiStep && activeStepId
                    ? "No fields in this step. Click the buttons above to add fields."
                    : "No fields added yet. Click the buttons above to add fields."}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {settings.multiStep && (
          <TabsContent value="steps" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Form Steps</CardTitle>
                    <CardDescription>
                      Organize your form into multiple steps
                    </CardDescription>
                  </div>
                  <MotionButton onClick={addStep} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Step
                  </MotionButton>
                </div>
              </CardHeader>
              <CardContent>
                {steps.length > 0 ? (
                  <div className="space-y-3">
                    {steps
                      .sort((a, b) => a.order - b.order)
                      .map((step, index) => (
                        <Card key={step.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className="font-medium">{step.title}</h4>
                                  {step.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {step.description}
                                    </p>
                                  )}
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {getFieldsForStep(step.id).length} fields
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveStep(step.id, "up")}
                                disabled={index === 0}
                              >
                                <ChevronRight className="h-4 w-4 rotate-[-90deg]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveStep(step.id, "down")}
                                disabled={index === steps.length - 1}
                              >
                                <ChevronRight className="h-4 w-4 rotate-90" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingStep(step);
                                  setStepModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => removeStep(step.id)}
                                disabled={steps.length <= 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No steps added yet. Click &quot;Add Step&quot; to create
                    your first step.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Multi-step Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Multi-Step Settings</CardTitle>
                <CardDescription>
                  Configure how your multi-step form behaves
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="progress-indicator">Progress Indicator</Label>
                  <Select
                    value={settings.progressIndicator || "steps"}
                    onValueChange={(value: "steps" | "circular" | "linear") =>
                      setSettings({ ...settings, progressIndicator: value })
                    }
                  >
                    <SelectTrigger id="progress-indicator">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="steps">Step Indicators</SelectItem>
                      <SelectItem value="circular">
                        Circular Progress
                      </SelectItem>
                      <SelectItem value="linear">
                        Linear Progress Bar
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="allow-navigation"
                    checked={settings.allowStepNavigation ?? true}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, allowStepNavigation: checked })
                    }
                  />
                  <Label htmlFor="allow-navigation">
                    Allow users to navigate between steps
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="validate-steps"
                    checked={settings.validateStepBeforeNext ?? true}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        validateStepBeforeNext: checked,
                      })
                    }
                  />
                  <Label htmlFor="validate-steps">
                    Validate step before allowing next
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="settings">
          <FormSettingsEditor settings={settings} onChange={setSettings} />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : form ? "Update Form" : "Create Form"}
        </Button>
      </div>

      {/* Step Edit Modal */}
      <Dialog open={stepModalOpen} onOpenChange={setStepModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Step</DialogTitle>
            <DialogDescription>
              Update the step title and description
            </DialogDescription>
          </DialogHeader>
          {editingStep && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="step-title">Title</Label>
                <Input
                  id="step-title"
                  value={editingStep.title}
                  onChange={(e) =>
                    setEditingStep({ ...editingStep, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="step-description">Description (Optional)</Label>
                <Textarea
                  id="step-description"
                  value={editingStep.description || ""}
                  onChange={(e) =>
                    setEditingStep({
                      ...editingStep,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStepModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStepModalSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
