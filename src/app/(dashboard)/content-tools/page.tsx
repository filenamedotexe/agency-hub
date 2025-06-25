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
import { ContentTool } from "@/types/content-tools";
import { ContentGenerator } from "@/components/content-tools/content-generator";
import { useToast } from "@/hooks/use-toast";

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
    updates: { webhookId?: string | null }
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
              Add Webhook
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
                <div className="mb-2 flex items-center justify-between">
                  <Label>Environment</Label>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        webhookForm.isProduction ? "default" : "secondary"
                      }
                    >
                      {webhookForm.isProduction ? "Production" : "Testing"}
                    </Badge>
                    <Switch
                      checked={webhookForm.isProduction}
                      onCheckedChange={(checked) =>
                        setWebhookForm((prev) => ({
                          ...prev,
                          isProduction: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="webhook-production-url">
                      Production URL
                    </Label>
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
                        webhookForm.isProduction ? "border-green-500" : ""
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook-testing-url">Testing URL</Label>
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
                        !webhookForm.isProduction ? "border-blue-500" : ""
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
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowWebhookDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateWebhook}>Create Webhook</Button>
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
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{webhook.name}</p>
                      <Badge
                        variant={webhook.isProduction ? "default" : "outline"}
                        className="text-xs"
                      >
                        {webhook.isProduction ? "Production" : "Testing"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {webhook.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={webhook.isActive ? "default" : "secondary"}>
                      {webhook.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Content Tool Settings - {settingsTool?.name}
            </DialogTitle>
            <DialogDescription>
              Configure prompts and webhooks for this content tool
            </DialogDescription>
          </DialogHeader>
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
    updates: { webhookId?: string | null }
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
  const [newWebhookForm, setNewWebhookForm] = useState({
    name: "",
    productionUrl: "",
    testingUrl: "",
    headers: "",
    isProduction: true,
  });
  const [creatingWebhook, setCreatingWebhook] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(tool.id, {
        webhookId: selectedWebhookId === "none" ? null : selectedWebhookId,
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

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="webhook-select">Select Webhook</Label>
        <Select value={selectedWebhookId} onValueChange={setSelectedWebhookId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a webhook (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No webhook</SelectItem>
            {webhooks.map((webhook) => (
              <SelectItem key={webhook.id} value={webhook.id}>
                {webhook.name} - {webhook.url}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {webhooks.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            No webhooks available. Create one below to get started.
          </p>
        )}

        {webhooks.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            When content is generated, the form data will be sent to this
            webhook endpoint for processing by n8n, which will return the
            generated content.
          </p>
        )}

        <div className="mt-3">
          {!showNewWebhookForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewWebhookForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Webhook
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="font-medium">Create New Webhook</h4>
              <div className="space-y-3">
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
                  <div className="mb-2 flex items-center justify-between">
                    <Label>Environment</Label>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          newWebhookForm.isProduction ? "default" : "secondary"
                        }
                      >
                        {newWebhookForm.isProduction ? "Production" : "Testing"}
                      </Badge>
                      <Switch
                        checked={newWebhookForm.isProduction}
                        onCheckedChange={(checked) =>
                          setNewWebhookForm((prev) => ({
                            ...prev,
                            isProduction: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="new-webhook-production-url">
                        Production URL
                      </Label>
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
                          newWebhookForm.isProduction ? "border-green-500" : ""
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-webhook-testing-url">
                        Testing URL
                      </Label>
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
                          !newWebhookForm.isProduction ? "border-blue-500" : ""
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
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
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
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateNewWebhook}
                    disabled={creatingWebhook}
                  >
                    {creatingWebhook ? "Creating..." : "Create Webhook"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

// Use the real content tools page now that auth is working
export default ContentToolsPageOriginal;
