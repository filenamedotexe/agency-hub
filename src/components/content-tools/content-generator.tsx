"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Copy,
  Download,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Info,
  Calendar,
  Clock,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContentTool, ContentToolField } from "@/types/content-tools";
import { DynamicField } from "@/components/ui/dynamic-field";
import { toast } from "sonner";

interface ContentGeneratorProps {
  tool: ContentTool;
  clients: any[];
  selectedClientId: string | null;
  onClientSelect: (clientId: string | null) => void;
}

export function ContentGenerator({
  tool,
  clients,
  selectedClientId,
  onClientSelect,
}: ContentGeneratorProps) {
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});
  const [allDynamicFields, setAllDynamicFields] = useState<Record<string, any>>(
    {}
  );
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [editingTool, setEditingTool] = useState<ContentTool | null>(null);
  const [toolFields, setToolFields] = useState<ContentToolField[]>([]);
  const [previousGeneratedContent, setPreviousGeneratedContent] = useState<
    any[]
  >([]);
  const [sortBy, setSortBy] = useState<"date" | "client">("date");

  const getDefaultFieldsForTool = (type: string): ContentToolField[] => {
    const baseFields: ContentToolField[] = [
      {
        id: "topic",
        name: "topic",
        label: "Topic",
        type: "text",
        required: true,
        clientVisible: true,
        placeholder: "Enter topic...",
        defaultValue: "",
        order: 1,
      },
    ];

    switch (type) {
      case "BLOG_WRITER":
        return [
          ...baseFields,
          {
            id: "wordCount",
            name: "wordCount",
            label: "Word Count",
            type: "number",
            required: false,
            clientVisible: true,
            placeholder: "Enter wordCount...",
            defaultValue: "500",
            order: 2,
          },
          {
            id: "tone",
            name: "tone",
            label: "Tone",
            type: "text",
            required: false,
            clientVisible: true,
            placeholder: "Enter tone...",
            defaultValue: "Professional",
            order: 3,
          },
          {
            id: "keywords",
            name: "keywords",
            label: "Keywords",
            type: "textarea",
            required: false,
            clientVisible: true,
            placeholder: "Enter keywords...",
            defaultValue: "",
            order: 4,
          },
        ];
      default:
        return baseFields;
    }
  };

  const fetchPreviousContent = useCallback(async () => {
    if (!tool.id) return;

    try {
      const response = await fetch(
        `/api/content-tools/${tool.id}/generated-content${selectedClientId ? `?clientId=${selectedClientId}` : ""}`
      );
      if (response.ok) {
        const data = await response.json();
        setPreviousGeneratedContent(data);
      }
    } catch (error) {
      console.error("Failed to fetch previous content:", error);
    }
  }, [tool.id, selectedClientId]);

  const initializeToolFields = useCallback(() => {
    // Initialize with default fields if none exist
    if (!tool.fields || tool.fields.length === 0) {
      const defaultFields: ContentToolField[] = getDefaultFieldsForTool(
        tool.type
      );
      setToolFields(defaultFields);
    } else {
      setToolFields(tool.fields);
    }
  }, [tool.fields, tool.type]);

  const fetchClients = useCallback(async () => {
    // This function is handled by parent component
  }, []);

  const fetchAllDynamicFields = useCallback(async () => {
    try {
      const response = await fetch("/api/forms");
      if (response.ok) {
        const forms = await response.json();
        const fieldsByForm: Record<string, any> = {};

        forms.forEach((form: any) => {
          const formFields = form.fields.map((field: any) => ({
            name: field.name,
            label: field.label,
            type: field.type || "text",
            placeholder: field.placeholder || "",
            variable: `{{${field.name}}}`,
          }));

          if (formFields.length > 0) {
            fieldsByForm[form.name] = {
              id: form.id,
              fields: formFields,
            };
          }
        });

        setAllDynamicFields(fieldsByForm);
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
    }
  }, []);

  const fetchClientDynamicFields = useCallback(async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/form-responses`);
      if (!response.ok) return;

      const formResponses = await response.json();
      const fields: Record<string, any> = {};

      formResponses.forEach((response: any) => {
        if (response.responseData) {
          Object.entries(response.responseData).forEach(
            ([key, field]: [string, any]) => {
              if (field && typeof field === "object" && "value" in field) {
                fields[key] = {
                  value: field.value,
                  label: field.label || key,
                  type: field.type || "text",
                  fromForm: response.formName,
                };
              }
            }
          );
        }
      });

      setDynamicFields(fields);
    } catch (error) {
      console.error("Error fetching client dynamic fields:", error);
      setDynamicFields({});
    }
  }, []);

  useEffect(() => {
    initializeToolFields();
  }, [initializeToolFields]);

  useEffect(() => {
    fetchPreviousContent();
  }, [fetchPreviousContent]);

  useEffect(() => {
    fetchClients();
    fetchAllDynamicFields();
  }, [fetchClients, fetchAllDynamicFields]);

  useEffect(() => {
    if (selectedClientId) {
      fetchClientDynamicFields(selectedClientId);
    } else {
      setDynamicFields({});
    }
  }, [selectedClientId, fetchClientDynamicFields]);

  useEffect(() => {
    if (selectedClientId && Object.keys(allDynamicFields).length > 0) {
      const availableFormFields = Object.values(allDynamicFields).flatMap(
        (formData: any) => formData.fields.map((field: any) => field.name)
      );

      const missingFields = availableFormFields.filter(
        (fieldName) =>
          !dynamicFields[fieldName] || !dynamicFields[fieldName].value
      );

      if (missingFields.length > 0 && Object.keys(dynamicFields).length === 0) {
        const selectedClient = clients.find((c) => c.id === selectedClientId);
        toast.info(
          `${selectedClient?.businessName || selectedClient?.name || "This client"} hasn't filled out any forms yet. You can still generate content, but dynamic fields won't be replaced with actual values.`
        );
      } else if (missingFields.length > 0) {
        toast.warning(
          `${missingFields.length} dynamic field(s) don't have values for this client. They'll appear as placeholders in the generated content.`
        );
      }
    }
  }, [selectedClientId, allDynamicFields, dynamicFields, clients, toast]);

  const handleGenerate = async () => {
    if (!selectedClientId) {
      toast.error("Please select a client");
      return;
    }

    // Validate required fields
    const requiredFields = toolFields.filter(
      (field) => field.required && field.clientVisible
    );
    const missingFields = requiredFields.filter(
      (field) => !fieldValues[field.name]?.trim()
    );

    if (missingFields.length > 0) {
      toast.error(
        `Please fill in required fields: ${missingFields.map((f) => f.label).join(", ")}`
      );
      return;
    }

    // Check if webhook is configured
    if (!tool.webhookId) {
      toast.warning(
        "No webhook configured for this tool. Content will be generated but won't be sent to any external system. Configure a webhook in the tool settings to enable external integrations.",
        { duration: 5000 }
      );
    }

    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const response = await fetch(`/api/content-tools/${tool.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          fieldValues,
          toolFields,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate content");

      const data = await response.json();
      setGeneratedContent(data.content);

      // Show success message with webhook info
      if (tool.webhookId) {
        toast.success("Content generated and sent to webhook successfully!");
      } else {
        toast.success("Content generated successfully!");
      }

      // Refresh the previous content list
      fetchPreviousContent();
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success("Content copied to clipboard!");
  };

  const downloadContent = () => {
    const blob = new Blob([generatedContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tool.name.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEditFields = () => {
    setEditingTool({ ...tool, fields: toolFields });
    setIsEditingFields(true);
  };

  const handleSaveFields = async () => {
    if (!editingTool) return;

    try {
      const response = await fetch(`/api/content-tools/${tool.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: editingTool.fields,
        }),
      });

      if (!response.ok) throw new Error("Failed to save fields");

      setToolFields(editingTool.fields || []);
      setIsEditingFields(false);
      setEditingTool(null);
      toast.success("Fields saved successfully!");
    } catch (error) {
      console.error("Error saving fields:", error);
      toast.error("Failed to save fields");
    }
  };

  const handleAddField = () => {
    if (!editingTool) return;

    const newField: ContentToolField = {
      id: `field_${Date.now()}`,
      name: `field${(editingTool.fields?.length || 0) + 1}`,
      label: "New Field",
      type: "text",
      required: false,
      clientVisible: true,
      placeholder: "",
      defaultValue: "",
      order: (editingTool.fields?.length || 0) + 1,
    };

    setEditingTool({
      ...editingTool,
      fields: [...(editingTool.fields || []), newField],
    });
  };

  const handleDeleteField = (fieldId: string) => {
    if (!editingTool) return;

    setEditingTool({
      ...editingTool,
      fields: editingTool.fields?.filter((field) => field.id !== fieldId) || [],
    });
  };

  const handleUpdateField = (
    fieldId: string,
    updates: Partial<ContentToolField>
  ) => {
    if (!editingTool) return;

    setEditingTool({
      ...editingTool,
      fields:
        editingTool.fields?.map((field) =>
          field.id === fieldId ? { ...field, ...updates } : field
        ) || [],
    });
  };

  const insertDynamicField = (fieldName: string, targetFieldId: string) => {
    if (!editingTool) return;

    const variable = `{{${fieldName}}}`;
    setEditingTool({
      ...editingTool,
      fields:
        editingTool.fields?.map((field) =>
          field.id === targetFieldId
            ? { ...field, defaultValue: (field.defaultValue || "") + variable }
            : field
        ) || [],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{tool.name}</h2>
          <p className="text-muted-foreground">{tool.description}</p>
        </div>
        <Button variant="outline" onClick={() => onClientSelect(null)}>
          Back to Tools
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Fill in the required information to generate content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="client">Select Client</Label>
              <Select
                value={selectedClientId || ""}
                onValueChange={(value) =>
                  onClientSelect(value === "" ? null : value)
                }
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.businessName || client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Available Dynamic Fields</Label>
              <Button variant="outline" size="sm" onClick={handleEditFields}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Fields
              </Button>
            </div>

            <div className="rounded-lg border">
              <div className="rounded-t-lg border-b bg-muted/50 px-4 py-3">
                <h4 className="text-sm font-medium">
                  Available Dynamic Fields
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click any field to copy it to your clipboard
                </p>
              </div>
              <div className="max-h-48 space-y-4 overflow-y-auto p-4">
                {/* Built-in fields */}
                <div>
                  <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Client Data
                  </h5>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50">
                      <DynamicField
                        field="{{businessName}}"
                        variant="badge"
                        className="text-xs"
                      />
                      <span className="text-xs text-muted-foreground">
                        Business name
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50">
                      <DynamicField
                        field="{{clientName}}"
                        variant="badge"
                        className="text-xs"
                      />
                      <span className="text-xs text-muted-foreground">
                        Client name
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                {Object.entries(allDynamicFields).map(
                  ([formName, formData]: [string, any]) => (
                    <div key={formName}>
                      <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {formName}
                      </h5>
                      <div className="grid grid-cols-1 gap-2">
                        {formData.fields.map((field: any) => (
                          <div
                            key={field.name}
                            className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50"
                          >
                            <DynamicField
                              field={field.variable}
                              variant="badge"
                              className="text-xs"
                            />
                            <span className="text-xs text-muted-foreground">
                              {field.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {Object.keys(allDynamicFields).length === 0 && (
                  <div className="py-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No form fields available
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Create forms with fields to see them here
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Display client-specific dynamic fields */}
            {selectedClientId && Object.keys(dynamicFields).length > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50/50">
                <div className="rounded-t-lg border-b border-green-200 bg-green-100/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <h4 className="text-sm font-medium text-green-800">
                      Client Dynamic Fields (with values)
                    </h4>
                  </div>
                  <p className="mt-1 text-xs text-green-700">
                    {clients.find((c) => c.id === selectedClientId)
                      ?.businessName || "This client"}{" "}
                    has filled out these fields
                  </p>
                </div>
                <div className="space-y-2 p-4">
                  {Object.entries(dynamicFields).map(([key, field]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-md p-2 hover:bg-green-100/50"
                    >
                      <DynamicField
                        field={`{{${key}}}`}
                        variant="badge"
                        className="text-xs"
                      />
                      <span className="max-w-32 truncate text-xs font-medium text-green-700">
                        {field.value || "No value"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Render configurable fields */}
            {toolFields
              .filter((field) => field.clientVisible)
              .sort((a, b) => a.order - b.order)
              .map((field) => (
                <div key={field.id}>
                  <div className="mb-2 flex items-center gap-2">
                    <Label htmlFor={field.name} className="flex-1">
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </Label>
                  </div>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={field.name}
                      value={
                        fieldValues[field.name] || field.defaultValue || ""
                      }
                      onChange={(e) =>
                        setFieldValues((prev) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : field.type === "select" && field.options ? (
                    <Select
                      value={
                        fieldValues[field.name] || field.defaultValue || ""
                      }
                      onValueChange={(value) =>
                        setFieldValues((prev) => ({
                          ...prev,
                          [field.name]: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type === "number" ? "number" : "text"}
                      value={
                        fieldValues[field.name] || field.defaultValue || ""
                      }
                      onChange={(e) =>
                        setFieldValues((prev) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                </div>
              ))}

            <Button
              onClick={handleGenerate}
              disabled={!selectedClientId || isGenerating}
              className="w-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Content"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedClientId ? (
                    <>
                      Content for{" "}
                      {clients.find((c) => c.id === selectedClientId)
                        ?.businessName || "Client"}
                    </>
                  ) : (
                    <>All Generated Content</>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedClientId
                    ? "Content generated for this client"
                    : "All content generated with this tool"}
                </CardDescription>
              </div>
              {!selectedClientId && previousGeneratedContent.length > 0 && (
                <Select
                  value={sortBy}
                  onValueChange={(value: "date" | "client") => setSortBy(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Sort by Date</SelectItem>
                    <SelectItem value="client">Sort by Client</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Current generation */}
            {generatedContent && (
              <div className="mb-6 space-y-4 rounded-lg border border-green-200 bg-green-50/50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-green-800">
                    Just Generated
                  </span>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <pre className="whitespace-pre-wrap text-sm">
                    {generatedContent}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadContent}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            )}

            {/* Previous generations */}
            {previousGeneratedContent.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Previous Generations ({previousGeneratedContent.length})
                </div>
                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {previousGeneratedContent
                    .sort((a, b) => {
                      if (sortBy === "client") {
                        return a.clientName.localeCompare(b.clientName);
                      }
                      return (
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                      );
                    })
                    .map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {item.clientName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(
                              new Date(item.createdAt),
                              "MMM d, yyyy 'at' h:mm a"
                            )}
                          </div>
                        </div>
                        <div className="mb-3 rounded bg-muted/50 p-2 text-sm text-xs text-muted-foreground">
                          <strong>Prompt:</strong>{" "}
                          {item.prompt.length > 100
                            ? `${item.prompt.substring(0, 100)}...`
                            : item.prompt}
                        </div>
                        <div className="rounded-md border bg-white p-3 text-sm">
                          <pre className="whitespace-pre-wrap">
                            {item.content.length > 200
                              ? `${item.content.substring(0, 200)}...`
                              : item.content}
                          </pre>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigator.clipboard.writeText(item.content)
                            }
                          >
                            <Copy className="mr-1 h-3 w-3" />
                            Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const blob = new Blob([item.content], {
                                type: "text/plain",
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `${item.clientName.replace(/\s+/g, "-")}-${format(new Date(item.createdAt), "yyyy-MM-dd")}.txt`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                          >
                            <Download className="mr-1 h-3 w-3" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : !generatedContent ? (
              <div className="py-12 text-center text-muted-foreground">
                {isGenerating ? (
                  <div className="space-y-2">
                    <Sparkles className="mx-auto h-8 w-8 animate-pulse" />
                    <p>Generating content...</p>
                  </div>
                ) : selectedClientId ? (
                  <div className="space-y-2">
                    <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p>No content generated for this client yet</p>
                    <p className="text-sm">
                      Generate your first piece of content above
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p>No content generated with this tool yet</p>
                    <p className="text-sm">
                      Select a client and generate your first piece of content
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Field Editor Dialog */}
      <Dialog open={isEditingFields} onOpenChange={setIsEditingFields}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Content Tool Fields</DialogTitle>
            <DialogDescription>
              Configure the fields that users will fill out to generate content.
              Use dynamic fields from forms as default values.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Dynamic Fields Reference */}
            <div>
              <h3 className="mb-2 font-medium">Available Dynamic Fields</h3>
              <div className="max-h-32 overflow-y-auto rounded-md bg-muted p-3">
                <div className="space-y-2 text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <DynamicField
                        field="{{businessName}}"
                        variant="code"
                        className="text-xs"
                      />
                      <span className="text-muted-foreground">
                        Client business name
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <DynamicField
                        field="{{clientName}}"
                        variant="code"
                        className="text-xs"
                      />
                      <span className="text-muted-foreground">Client name</span>
                    </div>
                  </div>

                  {Object.entries(allDynamicFields).map(
                    ([formName, formData]: [string, any]) => (
                      <div key={formName} className="border-t pt-2">
                        <h4 className="mb-1 text-xs font-medium">{formName}</h4>
                        <div className="space-y-1">
                          {formData.fields.map((field: any) => (
                            <div
                              key={field.name}
                              className="flex justify-between"
                            >
                              <DynamicField
                                field={field.variable}
                                variant="code"
                                className="text-xs"
                              />
                              <span className="text-xs text-muted-foreground">
                                {field.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Field Configuration */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium">Content Tool Fields</h3>
                <Button onClick={handleAddField} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Field
                </Button>
              </div>

              <div className="space-y-4">
                {editingTool?.fields
                  ?.sort((a, b) => a.order - b.order)
                  .map((field, index) => (
                    <div
                      key={field.id}
                      className="space-y-3 rounded-lg border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Field {index + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            {field.clientVisible ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {field.clientVisible
                                ? "Visible to clients"
                                : "Admin only"}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDeleteField(field.id)}
                          size="sm"
                          variant="outline"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Field Name</Label>
                          <Input
                            value={field.name}
                            onChange={(e) =>
                              handleUpdateField(field.id, {
                                name: e.target.value,
                              })
                            }
                            placeholder="fieldName"
                          />
                        </div>
                        <div>
                          <Label>Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) =>
                              handleUpdateField(field.id, {
                                label: e.target.value,
                              })
                            }
                            placeholder="Field Label"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value: any) =>
                              handleUpdateField(field.id, { type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="textarea">Textarea</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Order</Label>
                          <Input
                            type="number"
                            value={field.order}
                            onChange={(e) =>
                              handleUpdateField(field.id, {
                                order: parseInt(e.target.value) || 1,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Placeholder</Label>
                          <Input
                            value={field.placeholder || ""}
                            onChange={(e) =>
                              handleUpdateField(field.id, {
                                placeholder: e.target.value,
                              })
                            }
                            placeholder="Enter placeholder..."
                          />
                        </div>
                        <div>
                          <Label>Default Value (can use dynamic fields)</Label>
                          <Input
                            value={field.defaultValue || ""}
                            onChange={(e) =>
                              handleUpdateField(field.id, {
                                defaultValue: e.target.value,
                              })
                            }
                            placeholder="Enter default value..."
                          />
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`required-${field.id}`}
                            checked={field.required}
                            onCheckedChange={(checked) =>
                              handleUpdateField(field.id, { required: checked })
                            }
                          />
                          <Label htmlFor={`required-${field.id}`}>
                            Required
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`visible-${field.id}`}
                            checked={field.clientVisible}
                            onCheckedChange={(checked) =>
                              handleUpdateField(field.id, {
                                clientVisible: checked,
                              })
                            }
                          />
                          <Label htmlFor={`visible-${field.id}`}>
                            Client Visible
                          </Label>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditingFields(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveFields}>
                <Save className="mr-2 h-4 w-4" />
                Save Fields
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
