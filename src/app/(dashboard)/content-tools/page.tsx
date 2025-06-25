"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Video,
  Image,
  Search,
  Key,
  Sparkles,
  Settings,
  History,
  Edit,
  Webhook,
  Plus,
  X,
  Copy,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCallbackUrlClient } from "@/lib/callback-urls";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ContentTool, ContentToolField } from "@/types/content-tools";
import { ContentGenerator } from "@/components/content-tools/content-generator";
import { useToast } from "@/hooks/use-toast";
import { isNgrokConfigured } from "@/lib/callback-urls";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const toolIcons: Record<string, React.ElementType> = {
  BLOG_WRITER: FileText,
  FACEBOOK_VIDEO_AD: Video,
  FACEBOOK_IMAGE_AD: Image,
  GOOGLE_SEARCH_AD: Search,
  SEO_KEYWORD_RESEARCH: Key,
};

function ContentToolsPageOriginal() {
  const [tools, setTools] = useState<ContentTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ContentTool | null>(null);
  const [settingsTool, setSettingsTool] = useState<ContentTool | null>(null);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [webhookForm, setWebhookForm] = useState({
    name: "",
    productionUrl: "",
    testingUrl: "",
    headers: "",
    isProduction: true,
  });
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTools();
    fetchWebhooks();
    fetchClients();

    // Fallback timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("🧪 Timeout reached - forcing loading to false");
      setLoading(false);
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeoutId);
  }, []);

  // Handle URL hash to auto-open tool settings
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#tool-") && tools.length > 0) {
      const toolId = hash.replace("#tool-", "");
      const tool = tools.find((t) => t.id === toolId);
      if (tool) {
        setSettingsTool(tool);
        // Clear the hash after opening
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, [tools]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
    }
  };

  const fetchTools = async () => {
    console.log("🧪 Fetching content tools...");
    try {
      const response = await fetch("/api/content-tools");
      console.log("🧪 Response status:", response.status);

      if (!response.ok) {
        console.error(
          "🧪 Response not ok:",
          response.status,
          response.statusText
        );
        throw new Error(`Failed to fetch content tools: ${response.status}`);
      }

      const data = await response.json();
      console.log("🧪 Fetched tools:", data.length, "tools");
      setTools(data);
      console.log("🧪 Tools state set successfully");
    } catch (error) {
      console.error("🧪 Error fetching content tools:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load content tools"
      );
      // Set tools to empty array to allow the UI to render
      setTools([]);
    } finally {
      console.log("🧪 Setting loading to false");
      setLoading(false);
    }
  };

  const fetchWebhooks = async () => {
    try {
      const response = await fetch("/api/webhooks?type=CONTENT_TOOL");
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data);
      } else {
        console.error("Failed to fetch webhooks:", response.status);
        setWebhooks([]);
      }
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      setWebhooks([]);
    }
  };

  const handleUpdateTool = async (
    toolId: string,
    updates: { webhookId?: string | null; fields?: ContentToolField[] }
  ) => {
    try {
      const response = await fetch(`/api/content-tools/${toolId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update tool");

      await fetchTools(); // Refresh tools
      setSettingsTool(null);
    } catch (error) {
      console.error("Error updating tool:", error);
      alert("Failed to update tool");
    }
  };

  const handleCreateWebhook = async () => {
    const activeUrl = webhookForm.isProduction
      ? webhookForm.productionUrl
      : webhookForm.testingUrl;

    if (!webhookForm.name || !activeUrl) {
      toast({
        title: "Error",
        description: "Name and active URL are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const headers = webhookForm.headers
        ? JSON.parse(webhookForm.headers)
        : {};

      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: webhookForm.name,
          url: activeUrl,
          productionUrl: webhookForm.productionUrl,
          testingUrl: webhookForm.testingUrl,
          isProduction: webhookForm.isProduction,
          type: "CONTENT_TOOL",
          headers,
          isActive: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "Main webhook creation failed:",
          response.status,
          errorData
        );
        throw new Error(errorData.error || "Failed to create webhook");
      }

      const newWebhook = await response.json();
      console.log("Main webhook created successfully:", newWebhook);

      // Refresh webhooks list without reloading the page
      await fetchWebhooks();
      setShowWebhookDialog(false);
      setWebhookForm({
        name: "",
        productionUrl: "",
        testingUrl: "",
        headers: "",
        isProduction: true,
      });
      toast({
        title: "Success",
        description: `Webhook created successfully in ${webhookForm.isProduction ? "Production" : "Testing"} mode!`,
      });
    } catch (error) {
      console.error("Error creating webhook:", error);
      toast({
        title: "Error",
        description: "Failed to create webhook",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Content Tools</h1>
          <p className="text-muted-foreground">
            Generate high-quality content for your clients using AI
          </p>
        </div>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-muted-foreground">Loading content tools...</div>
        </div>
      </div>
    );
  }

  if (selectedTool) {
    return (
      <ContentGenerator
        tool={selectedTool}
        clients={clients}
        selectedClientId={selectedClientId}
        onClientSelect={setSelectedClientId}
      />
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Content Tools</h1>
          <p className="text-muted-foreground">
            Generate high-quality content for your clients using AI
          </p>
        </div>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="text-destructive">Error: {error}</div>
            <Button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchTools();
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Tools</h1>
          <p className="text-muted-foreground">
            Generate high-quality content for your clients using AI
          </p>
        </div>
        <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add New Content Tool
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Content Tool Webhook</DialogTitle>
              <DialogDescription>
                Add a webhook to receive content generation data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhook-name">Webhook Name</Label>
                <Input
                  id="webhook-name"
                  value={webhookForm.name}
                  onChange={(e) =>
                    setWebhookForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="My Content Webhook"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Environment</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Testing
                    </span>
                    <Switch
                      checked={webhookForm.isProduction}
                      onCheckedChange={(checked) =>
                        setWebhookForm((prev) => ({
                          ...prev,
                          isProduction: checked,
                        }))
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      Production
                    </span>
                    <Badge
                      variant={
                        webhookForm.isProduction ? "default" : "secondary"
                      }
                      className="ml-2"
                    >
                      {webhookForm.isProduction ? "Production" : "Testing"}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 grid gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="webhook-production-url">
                        Production URL
                      </Label>
                      {webhookForm.isProduction && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="webhook-production-url"
                      value={webhookForm.productionUrl}
                      onChange={(e) =>
                        setWebhookForm((prev) => ({
                          ...prev,
                          productionUrl: e.target.value,
                        }))
                      }
                      placeholder="https://your-production-webhook.com/endpoint"
                      className={
                        webhookForm.isProduction
                          ? "ring-2 ring-green-500/20"
                          : ""
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="webhook-testing-url">Testing URL</Label>
                      {!webhookForm.isProduction && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="webhook-testing-url"
                      value={webhookForm.testingUrl}
                      onChange={(e) =>
                        setWebhookForm((prev) => ({
                          ...prev,
                          testingUrl: e.target.value,
                        }))
                      }
                      placeholder="https://your-testing-webhook.com/endpoint"
                      className={
                        !webhookForm.isProduction
                          ? "ring-2 ring-blue-500/20"
                          : ""
                      }
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="webhook-headers">Custom Headers (JSON)</Label>
                <Textarea
                  id="webhook-headers"
                  value={webhookForm.headers}
                  onChange={(e) =>
                    setWebhookForm((prev) => ({
                      ...prev,
                      headers: e.target.value,
                    }))
                  }
                  placeholder='{"Authorization": "Bearer token"}'
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowWebhookDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateWebhook} className="bg-primary">
                  Create Webhook
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tools.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <div className="text-muted-foreground">
              No content tools available
            </div>
            <Button
              onClick={() => {
                setLoading(true);
                fetchTools();
              }}
              className="mt-4"
            >
              Refresh
            </Button>
          </div>
        ) : (
          tools.map((tool) => {
            const Icon = toolIcons[tool.type] || FileText;

            return (
              <Card key={tool.id} className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Icon className="h-8 w-8 text-primary" />
                    <div className="flex items-center space-x-1">
                      {tool.webhookId && (
                        <Badge variant="secondary" className="text-xs">
                          <Webhook className="mr-1 h-3 w-3" />
                          Webhook
                        </Badge>
                      )}
                      {tool._count && tool._count.generatedContent > 0 && (
                        <Badge variant="secondary">
                          <History className="mr-1 h-3 w-3" />
                          {tool._count.generatedContent}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => setSelectedTool(tool)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSettingsTool(tool)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Webhooks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Content Tool Webhooks
          </CardTitle>
          <CardDescription>
            Manage webhooks that receive content generation data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">
              No webhooks configured. Create one above to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{webhook.name}</p>
                      <Badge
                        variant={webhook.isProduction ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {webhook.isProduction ? "Production" : "Testing"}
                      </Badge>
                    </div>
                    <p className="font-mono text-sm text-muted-foreground">
                      {webhook.url}
                    </p>
                  </div>
                  <Badge variant={webhook.isActive ? "default" : "outline"}>
                    {webhook.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>How It Works</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Select a content tool above</p>
          <p>2. Choose a client to generate content for</p>
          <p>
            3. Fill in any required variables (these can include dynamic fields
            from client forms)
          </p>
          <p>4. Click generate to create AI-powered content</p>
          <p>5. Copy, download, or send the content via configured webhooks</p>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={!!settingsTool} onOpenChange={() => setSettingsTool(null)}>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              Content Tool Settings - {settingsTool?.name}
            </DialogTitle>
            <DialogDescription>
              Configure prompts and webhooks for this content tool
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {settingsTool && (
              <ContentToolSettings
                tool={settingsTool}
                webhooks={webhooks}
                onUpdate={handleUpdateTool}
                onClose={() => setSettingsTool(null)}
                toast={toast}
                fetchWebhooks={fetchWebhooks}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Content Tool Settings Component
function ContentToolSettings({
  tool,
  webhooks,
  onUpdate,
  onClose,
  toast,
  fetchWebhooks,
}: {
  tool: ContentTool;
  webhooks: any[];
  onUpdate: (
    toolId: string,
    updates: { webhookId?: string | null; fields?: ContentToolField[] }
  ) => Promise<void>;
  onClose: () => void;
  toast: any;
  fetchWebhooks: () => Promise<void>;
}) {
  const [selectedWebhookId, setSelectedWebhookId] = useState(
    tool.webhookId || "none"
  );
  const [saving, setSaving] = useState(false);
  const [showNewWebhookForm, setShowNewWebhookForm] = useState(false);
  const [showEditWebhookForm, setShowEditWebhookForm] = useState(false);
  const [newWebhookForm, setNewWebhookForm] = useState({
    name: "",
    productionUrl: "",
    testingUrl: "",
    headers: "",
    isProduction: true,
  });
  const [editWebhookForm, setEditWebhookForm] = useState({
    id: "",
    name: "",
    productionUrl: "",
    testingUrl: "",
    headers: "",
    isProduction: true,
  });
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [updatingWebhook, setUpdatingWebhook] = useState(false);

  // Custom fields state
  const [customFields, setCustomFields] = useState<ContentToolField[]>(
    tool.fields || []
  );
  const [newField, setNewField] = useState({
    name: "",
    label: "",
    type: "text" as const,
    required: false,
    placeholder: "",
  });
  const [showAddField, setShowAddField] = useState(false);

  // Get selected webhook details
  const selectedWebhook = webhooks.find((w) => w.id === selectedWebhookId);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(tool.id, {
        webhookId: selectedWebhookId === "none" ? null : selectedWebhookId,
        fields: customFields,
      });
      onClose();
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewWebhook = async () => {
    const activeUrl = newWebhookForm.isProduction
      ? newWebhookForm.productionUrl
      : newWebhookForm.testingUrl;

    if (!newWebhookForm.name || !activeUrl) {
      toast({
        title: "Error",
        description: "Name and active URL are required",
        variant: "destructive",
      });
      return;
    }

    setCreatingWebhook(true);
    try {
      const headers = newWebhookForm.headers
        ? JSON.parse(newWebhookForm.headers)
        : {};

      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWebhookForm.name,
          url: activeUrl,
          productionUrl: newWebhookForm.productionUrl,
          testingUrl: newWebhookForm.testingUrl,
          isProduction: newWebhookForm.isProduction,
          type: "CONTENT_TOOL",
          headers,
          isActive: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Webhook creation failed:", response.status, errorData);
        throw new Error(errorData.error || "Failed to create webhook");
      }

      const newWebhook = await response.json();
      console.log("Webhook created successfully:", newWebhook);

      // Update the webhooks list without reloading the page
      await fetchWebhooks();

      // Update the selected webhook to the newly created one
      setSelectedWebhookId(newWebhook.id);

      // Reset the form
      setShowNewWebhookForm(false);
      setNewWebhookForm({
        name: "",
        productionUrl: "",
        testingUrl: "",
        headers: "",
        isProduction: true,
      });

      toast({
        title: "Success",
        description: `Webhook created successfully in ${newWebhookForm.isProduction ? "Production" : "Testing"} mode!`,
      });
    } catch (error) {
      console.error("Error creating webhook:", error);
      toast({
        title: "Error",
        description: "Failed to create webhook",
        variant: "destructive",
      });
    } finally {
      setCreatingWebhook(false);
    }
  };

  const handleUpdateWebhook = async () => {
    const activeUrl = editWebhookForm.isProduction
      ? editWebhookForm.productionUrl
      : editWebhookForm.testingUrl;

    if (!editWebhookForm.name || !activeUrl) {
      toast({
        title: "Error",
        description: "Name and active URL are required",
        variant: "destructive",
      });
      return;
    }

    setUpdatingWebhook(true);
    try {
      const headers = editWebhookForm.headers
        ? JSON.parse(editWebhookForm.headers)
        : {};

      const response = await fetch(`/api/webhooks/${editWebhookForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editWebhookForm.name,
          url: activeUrl,
          productionUrl: editWebhookForm.productionUrl,
          testingUrl: editWebhookForm.testingUrl,
          isProduction: editWebhookForm.isProduction,
          headers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update webhook");
      }

      // Refresh webhooks list
      await fetchWebhooks();

      // Hide the edit form
      setShowEditWebhookForm(false);

      // Reset edit form
      setEditWebhookForm({
        id: "",
        name: "",
        productionUrl: "",
        testingUrl: "",
        headers: "",
        isProduction: true,
      });

      toast({
        title: "Success",
        description: "Webhook updated successfully!",
      });
    } catch (error) {
      console.error("Error updating webhook:", error);
      toast({
        title: "Error",
        description: "Failed to update webhook",
        variant: "destructive",
      });
    } finally {
      setUpdatingWebhook(false);
    }
  };

  const handleEditWebhook = (webhook: any) => {
    setEditWebhookForm({
      id: webhook.id,
      name: webhook.name,
      productionUrl: webhook.productionUrl || webhook.url,
      testingUrl: webhook.testingUrl || "",
      headers: webhook.headers ? JSON.stringify(webhook.headers, null, 2) : "",
      isProduction: webhook.isProduction !== false,
    });
    setShowEditWebhookForm(true);
    setShowNewWebhookForm(false);
  };

  // Custom field handlers
  const handleAddField = () => {
    if (!newField.name || !newField.label) {
      toast({
        title: "Error",
        description: "Field name and label are required",
        variant: "destructive",
      });
      return;
    }

    const field: ContentToolField = {
      id: crypto.randomUUID(),
      name: newField.name,
      label: newField.label,
      type: newField.type,
      required: newField.required,
      clientVisible: true,
      placeholder: newField.placeholder,
      order: customFields.length,
    };

    setCustomFields([...customFields, field]);
    setNewField({
      name: "",
      label: "",
      type: "text",
      required: false,
      placeholder: "",
    });
    setShowAddField(false);

    toast({
      title: "Success",
      description: "Custom field added successfully",
    });
  };

  const handleRemoveField = (fieldId: string) => {
    setCustomFields(customFields.filter((f) => f.id !== fieldId));
    toast({
      title: "Success",
      description: "Custom field removed successfully",
    });
  };

  const handleMoveField = (fieldId: string, direction: "up" | "down") => {
    const currentIndex = customFields.findIndex((f) => f.id === fieldId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= customFields.length) return;

    const newFields = [...customFields];
    [newFields[currentIndex], newFields[newIndex]] = [
      newFields[newIndex],
      newFields[currentIndex],
    ];

    // Update order values
    newFields.forEach((field, index) => {
      field.order = index;
    });

    setCustomFields(newFields);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label htmlFor="webhook-select">Select Webhook</Label>
        <Select value={selectedWebhookId} onValueChange={setSelectedWebhookId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a webhook (optional)">
              {selectedWebhookId !== "none" && selectedWebhook && (
                <span className="flex items-center gap-2 truncate">
                  <span>{selectedWebhook.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    -{" "}
                    {selectedWebhook.url.length > 40
                      ? selectedWebhook.url.substring(0, 40) + "..."
                      : selectedWebhook.url}
                  </span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No webhook</SelectItem>
            {webhooks.map((webhook) => (
              <SelectItem key={webhook.id} value={webhook.id}>
                <span className="flex items-center gap-2">
                  <span>{webhook.name}</span>
                  <span className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {webhook.url}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="text-sm text-muted-foreground">
          When content is generated, the form data will be sent to this webhook
          endpoint for processing by n8n, which will return the generated
          content.
        </p>

        {/* Always show webhook configuration section */}
        <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Webhook Configuration</h4>
            {selectedWebhook && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditWebhook(selectedWebhook)}
                  className="h-8"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Badge
                  variant={
                    selectedWebhook.isProduction ? "default" : "secondary"
                  }
                >
                  {selectedWebhook.isProduction ? "Production" : "Testing"}
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {selectedWebhook ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active URL
                </p>
                <p className="break-all font-mono text-sm">
                  {selectedWebhook.url}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No webhook selected
              </p>
            )}

            <div className="border-t pt-2">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                n8n Callback URL
              </p>

              {/* Active Callback URL based on webhook environment */}
              <div
                className={`rounded border p-2 ${selectedWebhook?.isProduction ? "border-green-500/20 bg-green-50/50 dark:bg-green-950/20" : "border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20"}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-medium">
                    {selectedWebhook?.isProduction ? "Production" : "Testing"}{" "}
                    Callback
                  </p>
                  <Badge
                    variant="outline"
                    className={`h-5 text-xs ${selectedWebhook?.isProduction ? "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400" : "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400"}`}
                  >
                    Active
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <p className="flex-1 break-all font-mono text-xs">
                    {getCallbackUrlClient(
                      tool.id,
                      selectedWebhook?.isProduction || false
                    )}
                  </p>
                  {!selectedWebhook?.isProduction && !isNgrokConfigured() && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                          >
                            <Info className="h-3 w-3 text-yellow-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <div className="space-y-2 text-xs">
                            <p className="font-semibold">
                              Setup ngrok for Testing:
                            </p>
                            <ol className="list-inside list-decimal space-y-1">
                              <li>
                                Install ngrok:{" "}
                                <code className="rounded bg-slate-100 px-1">
                                  brew install ngrok
                                </code>
                              </li>
                              <li>
                                Run:{" "}
                                <code className="rounded bg-slate-100 px-1">
                                  ngrok http 3001
                                </code>
                              </li>
                              <li>
                                Copy the https URL (e.g.,
                                https://abc123.ngrok.io)
                              </li>
                              <li>
                                Update{" "}
                                <code className="rounded bg-slate-100 px-1">
                                  .env.local
                                </code>
                                :
                                <br />
                                <code className="rounded bg-slate-100 px-1 text-[10px]">
                                  NEXT_PUBLIC_CALLBACK_BASE_URL_TESTING=https://abc123.ngrok.io
                                </code>
                              </li>
                              <li>Restart your dev server</li>
                            </ol>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      const url = getCallbackUrlClient(
                        tool.id,
                        selectedWebhook?.isProduction || false
                      );
                      if (
                        !selectedWebhook?.isProduction &&
                        !isNgrokConfigured()
                      ) {
                        toast({
                          title: "Configure ngrok first",
                          description:
                            "Click the info icon for setup instructions",
                          variant: "default",
                        });
                        return;
                      }
                      navigator.clipboard.writeText(url);
                      toast({
                        title: "Copied!",
                        description: `${selectedWebhook?.isProduction ? "Production" : "Testing"} callback URL copied to clipboard`,
                      });
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Use this URL in your n8n webhook response to send the generated
                content back. Add a &quot;Respond to Webhook&quot; node in n8n
                with this URL to complete the flow.
              </p>
            </div>

            {selectedWebhook &&
              selectedWebhook.headers &&
              Object.keys(selectedWebhook.headers).length > 0 && (
                <div className="border-t pt-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Custom Headers
                  </p>
                  <pre className="mt-1 rounded bg-background p-2 text-sm">
                    {JSON.stringify(selectedWebhook.headers, null, 2)}
                  </pre>
                </div>
              )}
          </div>
        </div>

        {/* Show edit form when editing */}
        {selectedWebhook && showEditWebhookForm && (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Edit Webhook</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditWebhookForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-webhook-name">Webhook Name</Label>
                <Input
                  id="edit-webhook-name"
                  value={editWebhookForm.name}
                  onChange={(e) =>
                    setEditWebhookForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="My Content Webhook"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Environment</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Testing
                    </span>
                    <Switch
                      checked={editWebhookForm.isProduction}
                      onCheckedChange={(checked) =>
                        setEditWebhookForm((prev) => ({
                          ...prev,
                          isProduction: checked,
                        }))
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      Production
                    </span>
                    <Badge
                      variant={
                        editWebhookForm.isProduction ? "default" : "secondary"
                      }
                      className="ml-2"
                    >
                      {editWebhookForm.isProduction ? "Production" : "Testing"}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 grid gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="edit-webhook-production-url">
                        Production URL
                      </Label>
                      {editWebhookForm.isProduction && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="edit-webhook-production-url"
                      value={editWebhookForm.productionUrl}
                      onChange={(e) =>
                        setEditWebhookForm((prev) => ({
                          ...prev,
                          productionUrl: e.target.value,
                        }))
                      }
                      placeholder="https://your-production-webhook.com/endpoint"
                      className={
                        editWebhookForm.isProduction
                          ? "ring-2 ring-green-500/20"
                          : ""
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="edit-webhook-testing-url">
                        Testing URL
                      </Label>
                      {!editWebhookForm.isProduction && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="edit-webhook-testing-url"
                      value={editWebhookForm.testingUrl}
                      onChange={(e) =>
                        setEditWebhookForm((prev) => ({
                          ...prev,
                          testingUrl: e.target.value,
                        }))
                      }
                      placeholder="https://your-testing-webhook.com/endpoint"
                      className={
                        !editWebhookForm.isProduction
                          ? "ring-2 ring-blue-500/20"
                          : ""
                      }
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-webhook-headers">
                  Custom Headers (JSON)
                </Label>
                <Textarea
                  id="edit-webhook-headers"
                  value={editWebhookForm.headers}
                  onChange={(e) =>
                    setEditWebhookForm((prev) => ({
                      ...prev,
                      headers: e.target.value,
                    }))
                  }
                  placeholder='{"Authorization": "Bearer token"}'
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditWebhookForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateWebhook}
                  disabled={updatingWebhook}
                  className="bg-primary"
                >
                  {updatingWebhook ? "Updating..." : "Update Webhook"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div>
          {!showNewWebhookForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewWebhookForm(true)}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Webhook
            </Button>
          ) : (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Create New Webhook</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewWebhookForm(false);
                    setNewWebhookForm({
                      name: "",
                      productionUrl: "",
                      testingUrl: "",
                      headers: "",
                      isProduction: true,
                    });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-webhook-name">Webhook Name</Label>
                  <Input
                    id="new-webhook-name"
                    value={newWebhookForm.name}
                    onChange={(e) =>
                      setNewWebhookForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="My Content Webhook"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Environment</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Testing
                      </span>
                      <Switch
                        checked={newWebhookForm.isProduction}
                        onCheckedChange={(checked) =>
                          setNewWebhookForm((prev) => ({
                            ...prev,
                            isProduction: checked,
                          }))
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        Production
                      </span>
                      <Badge
                        variant={
                          newWebhookForm.isProduction ? "default" : "secondary"
                        }
                        className="ml-2"
                      >
                        {newWebhookForm.isProduction ? "Production" : "Testing"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="new-webhook-production-url">
                          Production URL
                        </Label>
                        {newWebhookForm.isProduction && (
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <Input
                        id="new-webhook-production-url"
                        value={newWebhookForm.productionUrl}
                        onChange={(e) =>
                          setNewWebhookForm((prev) => ({
                            ...prev,
                            productionUrl: e.target.value,
                          }))
                        }
                        placeholder="https://your-production-webhook.com/endpoint"
                        className={
                          newWebhookForm.isProduction
                            ? "ring-2 ring-green-500/20"
                            : ""
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="new-webhook-testing-url">
                          Testing URL
                        </Label>
                        {!newWebhookForm.isProduction && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <Input
                        id="new-webhook-testing-url"
                        value={newWebhookForm.testingUrl}
                        onChange={(e) =>
                          setNewWebhookForm((prev) => ({
                            ...prev,
                            testingUrl: e.target.value,
                          }))
                        }
                        placeholder="https://your-testing-webhook.com/endpoint"
                        className={
                          !newWebhookForm.isProduction
                            ? "ring-2 ring-blue-500/20"
                            : ""
                        }
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="new-webhook-headers">
                    Custom Headers (JSON)
                  </Label>
                  <Textarea
                    id="new-webhook-headers"
                    value={newWebhookForm.headers}
                    onChange={(e) =>
                      setNewWebhookForm((prev) => ({
                        ...prev,
                        headers: e.target.value,
                      }))
                    }
                    placeholder='{"Authorization": "Bearer token"}'
                    rows={3}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleCreateNewWebhook}
                    disabled={creatingWebhook}
                    className="w-full sm:w-auto"
                  >
                    {creatingWebhook ? "Creating..." : "Create Webhook"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Fields Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Custom Fields</h4>
            <p className="text-sm text-muted-foreground">
              Add custom fields that will appear in the content generation form
              and be sent to the webhook
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddField(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Button>
        </div>

        {/* Existing Custom Fields */}
        {customFields.length > 0 && (
          <div className="space-y-2">
            {customFields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{field.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {field.type}
                    </Badge>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    Field name: {field.name}
                    {field.placeholder &&
                      ` • Placeholder: ${field.placeholder}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveField(field.id, "up")}
                    >
                      ↑
                    </Button>
                  )}
                  {index < customFields.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveField(field.id, "down")}
                    >
                      ↓
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveField(field.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Field Form */}
        {showAddField && (
          <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <h5 className="font-medium">Add Custom Field</h5>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddField(false);
                  setNewField({
                    name: "",
                    label: "",
                    type: "text",
                    required: false,
                    placeholder: "",
                  });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="field-name">Field Name (for webhook)</Label>
                <Input
                  id="field-name"
                  value={newField.name}
                  onChange={(e) =>
                    setNewField((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="companyName"
                />
              </div>
              <div>
                <Label htmlFor="field-label">Display Label</Label>
                <Input
                  id="field-label"
                  value={newField.label}
                  onChange={(e) =>
                    setNewField((prev) => ({
                      ...prev,
                      label: e.target.value,
                    }))
                  }
                  placeholder="Company Name"
                />
              </div>
              <div>
                <Label htmlFor="field-type">Field Type</Label>
                <Select
                  value={newField.type}
                  onValueChange={(value: any) =>
                    setNewField((prev) => ({
                      ...prev,
                      type: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="field-placeholder">
                  Placeholder (optional)
                </Label>
                <Input
                  id="field-placeholder"
                  value={newField.placeholder}
                  onChange={(e) =>
                    setNewField((prev) => ({
                      ...prev,
                      placeholder: e.target.value,
                    }))
                  }
                  placeholder="Enter company name..."
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="field-required"
                checked={newField.required}
                onCheckedChange={(checked) =>
                  setNewField((prev) => ({
                    ...prev,
                    required: checked,
                  }))
                }
              />
              <Label htmlFor="field-required">Required field</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddField(false);
                  setNewField({
                    name: "",
                    label: "",
                    type: "text",
                    required: false,
                    placeholder: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddField}>Add Field</Button>
            </div>
          </div>
        )}

        {customFields.length === 0 && !showAddField && (
          <div className="py-8 text-center text-muted-foreground">
            No custom fields added yet. Click &quot;Add Field&quot; to create
            custom fields for this content tool.
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-primary">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

// Use the real content tools page now that auth is working
export default ContentToolsPageOriginal;
