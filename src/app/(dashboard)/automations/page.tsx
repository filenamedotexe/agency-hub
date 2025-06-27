"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  Activity,
  CheckCircle,
  XCircle,
  TestTube,
  Copy,
  ExternalLink,
  Globe,
  Zap,
  History,
} from "lucide-react";
import { MotionButton } from "@/components/ui/motion-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResponsiveDataTable } from "@/components/ui/responsive-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Webhook, WebhookType, WebhookExecution } from "@/types/webhooks";
import { WebhookForm } from "@/components/webhooks/webhook-form";
import { getCallbackUrlClient } from "@/lib/callback-urls";
import { useToast } from "@/hooks/use-toast";

export default function AutomationsPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [formType, setFormType] = useState<WebhookType>("GENERAL");
  const [deleteWebhookId, setDeleteWebhookId] = useState<string | null>(null);
  const [selectedWebhookHistory, setSelectedWebhookHistory] =
    useState<Webhook | null>(null);
  const [webhookExecutions, setWebhookExecutions] = useState<
    WebhookExecution[]
  >([]);
  const [loadingExecutions, setLoadingExecutions] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchWebhooks = useCallback(async () => {
    try {
      const response = await fetch("/api/webhooks");
      if (!response.ok) throw new Error("Failed to fetch webhooks");
      const data = await response.json();
      setWebhooks(data);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch webhooks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const fetchWebhookExecutions = async (webhookId: string) => {
    setLoadingExecutions(true);
    try {
      const response = await fetch(`/api/webhooks/${webhookId}`);
      if (!response.ok) throw new Error("Failed to fetch webhook executions");
      const data = await response.json();
      setWebhookExecutions(data.executions || []);
    } catch (error) {
      console.error("Error fetching webhook executions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch webhook execution history",
        variant: "destructive",
      });
    } finally {
      setLoadingExecutions(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      const url = editingWebhook
        ? `/api/webhooks/${editingWebhook.id}`
        : "/api/webhooks";
      const method = editingWebhook ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save webhook");
      }

      await fetchWebhooks();
      setShowForm(false);
      setEditingWebhook(null);
    } catch (error) {
      console.error("Error saving webhook:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save webhook",
        variant: "destructive",
      });
    }
  };

  const handleToggle = async (webhook: Webhook) => {
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !webhook.isActive }),
      });

      if (!response.ok) throw new Error("Failed to update webhook");
      await fetchWebhooks();

      toast({
        title: "Success",
        description: `Webhook ${!webhook.isActive ? "enabled" : "disabled"}`,
      });
    } catch (error) {
      console.error("Error toggling webhook:", error);
      toast({
        title: "Error",
        description: "Failed to update webhook",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteWebhookId) return;

    try {
      const response = await fetch(`/api/webhooks/${deleteWebhookId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete webhook");
      await fetchWebhooks();

      toast({
        title: "Success",
        description: "Webhook deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting webhook:", error);
      toast({
        title: "Error",
        description: "Failed to delete webhook",
        variant: "destructive",
      });
    } finally {
      setDeleteWebhookId(null);
    }
  };

  const handleTestWebhook = async (webhook: Webhook) => {
    try {
      const activeUrl = webhook.isProduction
        ? webhook.productionUrl || webhook.url
        : webhook.testingUrl || webhook.url;

      const testPayload = {
        test: true,
        webhookName: webhook.name,
        environment: webhook.isProduction ? "production" : "testing",
        timestamp: new Date().toISOString(),
        message: "This is a test webhook from Agency Hub Automations page",
        ...(webhook.type === "CONTENT_TOOL" && {
          toolId: "test-tool-id",
          toolName: "Test Content Tool",
          clientId: "test-client-id",
          clientName: "Test Client",
          fieldValues: { topic: "Test Topic" },
          callbackUrl: getCallbackUrlClient(
            "test-tool-id",
            webhook.isProduction
          ),
        }),
        ...(webhook.type === "FORM" && {
          formId: "test-form-id",
          formName: "Test Form",
          submissionId: "test-submission-id",
          formData: { name: "Test User", email: "test@example.com" },
        }),
      };

      const response = await fetch("/api/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: activeUrl,
          payload: testPayload,
          headers: webhook.headers || {},
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to test webhook");
      }

      const result = await response.json();

      if (result.statusCode === 200 || result.statusCode === 204) {
        toast({
          title: "Success",
          description: `Test webhook sent successfully to ${webhook.isProduction ? "Production" : "Testing"} URL! Status: ${result.statusCode}`,
        });
      } else {
        toast({
          title: "Warning",
          description: `Webhook test sent but received status ${result.statusCode}. Check your webhook endpoint.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing webhook:", error);
      toast({
        title: "Error",
        description: "Failed to test webhook. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const openForm = (type: WebhookType) => {
    setFormType(type);
    setShowForm(true);
  };

  const editWebhook = async (webhook: Webhook) => {
    if (webhook.type === "CONTENT_TOOL") {
      // Find which content tool uses this webhook and navigate to its settings
      try {
        const response = await fetch("/api/content-tools");
        if (response.ok) {
          const tools = await response.json();
          const tool = tools.find((t: any) => t.webhookId === webhook.id);

          if (tool) {
            toast({
              title: "Redirecting",
              description: `Opening ${tool.name} settings...`,
            });
            // Navigate to content tools with the specific tool ID in the URL hash
            router.push(`/content-tools#tool-${tool.id}`);
          } else {
            toast({
              title: "Error",
              description: "Could not find the content tool for this webhook",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error finding content tool:", error);
        toast({
          title: "Error",
          description: "Failed to find the content tool for this webhook",
          variant: "destructive",
        });
      }
    } else if (webhook.type === "FORM") {
      // Navigate to forms page - we'll need to find which form uses this webhook
      toast({
        title: "Redirecting",
        description: "Opening form editor...",
      });
      router.push("/forms");
    } else {
      // For general webhooks, use the regular edit form
      setEditingWebhook(webhook);
      setShowForm(true);
    }
  };

  const viewWebhookHistory = (webhook: Webhook) => {
    setSelectedWebhookHistory(webhook);
    fetchWebhookExecutions(webhook.id);
  };

  const formWebhooks = webhooks.filter((w) => w.type === "FORM");
  const contentToolWebhooks = webhooks.filter((w) => w.type === "CONTENT_TOOL");
  const generalWebhooks = webhooks.filter((w) => w.type === "GENERAL");

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-muted-foreground">Loading webhooks...</div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Automations</h1>
          <p className="text-muted-foreground">
            {editingWebhook ? "Edit webhook" : "Create new webhook"}
          </p>
        </div>
        <WebhookForm
          webhook={editingWebhook || undefined}
          type={!editingWebhook ? formType : undefined}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingWebhook(null);
          }}
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Automations</h1>
          <p className="text-muted-foreground">
            Manage webhooks and automation workflows with production/testing
            environments
          </p>
        </div>

        <EnhancedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Form Webhooks
            </CardTitle>
            <CardDescription>
              Webhooks configured for forms will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formWebhooks.length === 0 ? (
              <p className="text-muted-foreground">
                No form webhooks configured
              </p>
            ) : (
              <EnhancedWebhookTable
                webhooks={formWebhooks}
                onEdit={editWebhook}
                onToggle={handleToggle}
                onDelete={setDeleteWebhookId}
                onTest={handleTestWebhook}
                onViewHistory={viewWebhookHistory}
                onCopy={copyToClipboard}
              />
            )}
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Content Tool Webhooks
            </CardTitle>
            <CardDescription>
              Webhooks attached to content tools will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contentToolWebhooks.length === 0 ? (
              <p className="text-muted-foreground">
                No content tool webhooks configured
              </p>
            ) : (
              <EnhancedWebhookTable
                webhooks={contentToolWebhooks}
                onEdit={editWebhook}
                onToggle={handleToggle}
                onDelete={setDeleteWebhookId}
                onTest={handleTestWebhook}
                onViewHistory={viewWebhookHistory}
                onCopy={copyToClipboard}
              />
            )}
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  General Webhooks
                </CardTitle>
                <CardDescription>
                  General webhooks for custom automation
                </CardDescription>
              </div>
              <MotionButton onClick={() => openForm("GENERAL")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Webhook
              </MotionButton>
            </div>
          </CardHeader>
          <CardContent>
            {generalWebhooks.length === 0 ? (
              <p className="text-muted-foreground">
                No general webhooks configured
              </p>
            ) : (
              <EnhancedWebhookTable
                webhooks={generalWebhooks}
                onEdit={editWebhook}
                onToggle={handleToggle}
                onDelete={setDeleteWebhookId}
                onTest={handleTestWebhook}
                onViewHistory={viewWebhookHistory}
                onCopy={copyToClipboard}
              />
            )}
          </CardContent>
        </EnhancedCard>

        {/* Webhook Execution History Dialog */}
        <Dialog
          open={!!selectedWebhookHistory}
          onOpenChange={(open) => !open && setSelectedWebhookHistory(null)}
        >
          <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Webhook Execution History: {selectedWebhookHistory?.name}
              </DialogTitle>
              <DialogDescription>
                Recent webhook executions and their responses
              </DialogDescription>
            </DialogHeader>

            {loadingExecutions ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">
                  Loading execution history...
                </div>
              </div>
            ) : webhookExecutions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No executions found for this webhook
              </div>
            ) : (
              <div className="space-y-4">
                {webhookExecutions.map((execution) => (
                  <div
                    key={execution.id}
                    className="space-y-2 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            execution.statusCode === 200
                              ? "default"
                              : "destructive"
                          }
                        >
                          {execution.statusCode || "Unknown"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(execution.executedAt).toLocaleString()}
                        </span>
                      </div>
                      {execution.error && (
                        <Badge variant="destructive">Error</Badge>
                      )}
                    </div>

                    {execution.error && (
                      <div className="text-sm text-red-600 dark:text-red-400">
                        <strong>Error:</strong> {execution.error}
                      </div>
                    )}

                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View payload and response
                      </summary>
                      <div className="mt-2 space-y-2">
                        <div>
                          <strong>Payload:</strong>
                          <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
                            {JSON.stringify(execution.payload, null, 2)}
                          </pre>
                        </div>
                        {execution.response && (
                          <div>
                            <strong>Response:</strong>
                            <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
                              {JSON.stringify(execution.response, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={!!deleteWebhookId}
          onOpenChange={(open) => !open && setDeleteWebhookId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this webhook? This action cannot
                be undone and will remove all execution history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

function EnhancedWebhookTable({
  webhooks,
  onEdit,
  onToggle,
  onDelete,
  onTest,
  onViewHistory,
  onCopy,
}: {
  webhooks: Webhook[];
  onEdit: (webhook: Webhook) => void;
  onToggle: (webhook: Webhook) => void;
  onDelete: (id: string) => void;
  onTest: (webhook: Webhook) => void;
  onViewHistory: (webhook: Webhook) => void;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <ResponsiveDataTable
      columns={[
        {
          key: "name",
          label: "Name & Environment",
          priority: "high",
          renderCell: (_, webhook) => (
            <div className="space-y-1">
              <div className="font-medium">{webhook.name}</div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={webhook.isProduction ? "default" : "secondary"}
                  className="text-xs"
                >
                  {webhook.isProduction ? "Production" : "Testing"}
                </Badge>
                {webhook.type === "CONTENT_TOOL" && (
                  <Badge variant="outline" className="text-xs">
                    Content Tool
                  </Badge>
                )}
              </div>
            </div>
          ),
        },
        {
          key: "urls",
          label: "URLs",
          priority: "medium",
          renderCell: (_, webhook) => {
            const activeUrl = webhook.isProduction
              ? webhook.productionUrl || webhook.url
              : webhook.testingUrl || webhook.url;
            return (
              <div className="space-y-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <span className="text-xs text-muted-foreground">Active:</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="max-w-[200px] truncate text-left font-mono text-xs hover:text-foreground sm:max-w-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopy(activeUrl, "Active URL");
                        }}
                      >
                        {activeUrl}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-sm break-all">{activeUrl}</div>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {webhook.type === "CONTENT_TOOL" && (
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                    <span className="text-xs text-muted-foreground">
                      Callback:
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="max-w-[200px] truncate text-left font-mono text-xs hover:text-foreground sm:max-w-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopy(
                              getCallbackUrlClient(
                                "{{toolId}}",
                                webhook.isProduction
                              ),
                              "Callback URL"
                            );
                          }}
                        >
                          {getCallbackUrlClient(
                            "{{toolId}}",
                            webhook.isProduction
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-sm break-all">
                          {getCallbackUrlClient(
                            "{{toolId}}",
                            webhook.isProduction
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            );
          },
        },
        {
          key: "isActive",
          label: "Status",
          priority: "high",
          renderCell: (value) => (
            <Badge variant={value ? "default" : "secondary"}>
              {value ? (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="mr-1 h-3 w-3" />
                  Inactive
                </>
              )}
            </Badge>
          ),
        },
        {
          key: "_count",
          label: "Executions",
          priority: "medium",
          renderCell: (value, webhook) => (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewHistory(webhook);
                  }}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <Badge variant="outline">
                    <Activity className="mr-1 h-3 w-3" />
                    {value?.executions || 0}
                  </Badge>
                </button>
              </TooltipTrigger>
              <TooltipContent>View execution history</TooltipContent>
            </Tooltip>
          ),
        },
        {
          key: "createdAt",
          label: "Created",
          priority: "low",
          renderCell: (value) => (
            <span className="text-muted-foreground">
              {new Date(value).toLocaleDateString()}
            </span>
          ),
        },
        {
          key: "actions",
          label: "Actions",
          priority: "high",
          renderCell: (_, webhook) => (
            <div className="flex items-center justify-end gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Switch
                    checked={webhook.isActive}
                    onCheckedChange={() => {
                      onToggle(webhook);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TooltipTrigger>
                <TooltipContent>Toggle active state</TooltipContent>
              </Tooltip>

              {webhook.type !== "CONTENT_TOOL" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <MotionButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTest(webhook);
                      }}
                      disabled={!webhook.isActive}
                    >
                      <TestTube className="h-4 w-4" />
                    </MotionButton>
                  </TooltipTrigger>
                  <TooltipContent>Test webhook</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <MotionButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewHistory(webhook);
                    }}
                  >
                    <History className="h-4 w-4" />
                  </MotionButton>
                </TooltipTrigger>
                <TooltipContent>View execution history</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <MotionButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(webhook);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </MotionButton>
                </TooltipTrigger>
                <TooltipContent>Edit webhook</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <MotionButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(webhook.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </MotionButton>
                </TooltipTrigger>
                <TooltipContent>Delete webhook</TooltipContent>
              </Tooltip>
            </div>
          ),
        },
      ]}
      data={webhooks}
    />
  );
}
