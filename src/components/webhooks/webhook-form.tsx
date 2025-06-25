"use client";

import { useState } from "react";
import { Save, TestTube, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Webhook, WebhookType } from "@/types/webhooks";
import { getCallbackUrlClient } from "@/lib/callback-urls";
import { useToast } from "@/hooks/use-toast";

interface WebhookFormProps {
  webhook?: Webhook;
  type?: WebhookType;
  entityId?: string;
  onSave: (data: {
    name: string;
    url: string;
    productionUrl?: string;
    testingUrl?: string;
    isProduction: boolean;
    type: WebhookType;
    entityId?: string;
    headers?: Record<string, string>;
    isActive: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}

export function WebhookForm({
  webhook,
  type,
  entityId,
  onSave,
  onCancel,
}: WebhookFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState(webhook?.name || "");
  const [productionUrl, setProductionUrl] = useState(
    webhook?.productionUrl || webhook?.url || ""
  );
  const [testingUrl, setTestingUrl] = useState(webhook?.testingUrl || "");
  const [isProduction, setIsProduction] = useState(
    webhook?.isProduction ?? true
  );
  const [webhookType, setWebhookType] = useState<WebhookType>(
    webhook?.type || type || "GENERAL"
  );
  const [headers, setHeaders] = useState(
    webhook?.headers ? JSON.stringify(webhook.headers, null, 2) : ""
  );
  const [isActive, setIsActive] = useState(webhook?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);

  // Get the active URL based on environment
  const activeUrl = isProduction ? productionUrl : testingUrl;

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a webhook name",
        variant: "destructive",
      });
      return;
    }

    if (!activeUrl.trim()) {
      toast({
        title: "Error",
        description: `Please enter a ${isProduction ? "production" : "testing"} URL`,
        variant: "destructive",
      });
      return;
    }

    // Validate URLs
    if (productionUrl.trim()) {
      try {
        new URL(productionUrl);
      } catch {
        toast({
          title: "Error",
          description: "Please enter a valid production URL",
          variant: "destructive",
        });
        return;
      }
    }

    if (testingUrl.trim()) {
      try {
        new URL(testingUrl);
      } catch {
        toast({
          title: "Error",
          description: "Please enter a valid testing URL",
          variant: "destructive",
        });
        return;
      }
    }

    // Parse headers if provided
    let parsedHeaders: Record<string, string> | undefined;
    if (headers.trim()) {
      try {
        parsedHeaders = JSON.parse(headers);
      } catch {
        toast({
          title: "Error",
          description: "Invalid headers JSON format",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave({
        name,
        url: activeUrl, // Set the active URL as the main URL for backwards compatibility
        productionUrl: productionUrl || undefined,
        testingUrl: testingUrl || undefined,
        isProduction,
        type: webhookType,
        entityId,
        headers: parsedHeaders,
        isActive,
      });

      toast({
        title: "Success",
        description: `Webhook ${webhook ? "updated" : "created"} successfully in ${isProduction ? "Production" : "Testing"} mode!`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!activeUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL to test",
        variant: "destructive",
      });
      return;
    }

    setTestingWebhook(true);
    try {
      const testPayload = {
        test: true,
        webhookName: name || "Test Webhook",
        environment: isProduction ? "production" : "testing",
        timestamp: new Date().toISOString(),
        message: "This is a test webhook from Agency Hub",
        ...(webhookType === "CONTENT_TOOL" && {
          toolId: "test-tool-id",
          toolName: "Test Content Tool",
          clientId: "test-client-id",
          clientName: "Test Client",
          fieldValues: { topic: "Test Topic" },
          callbackUrl: getCallbackUrlClient("test-tool-id", isProduction),
        }),
        ...(webhookType === "FORM" && {
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
          headers: headers ? JSON.parse(headers) : {},
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to test webhook");
      }

      const result = await response.json();

      if (result.statusCode === 200 || result.statusCode === 204) {
        toast({
          title: "Success",
          description: `Test webhook sent successfully to ${isProduction ? "Production" : "Testing"} URL! Status: ${result.statusCode}`,
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
    } finally {
      setTestingWebhook(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>{webhook ? "Edit Webhook" : "Create Webhook"}</CardTitle>
          <CardDescription>
            Configure webhook endpoint with production and testing environments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Webhook Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Webhook"
              />
            </div>

            {!type && (
              <div>
                <Label htmlFor="type">Webhook Type</Label>
                <Select
                  value={webhookType}
                  onValueChange={(value) =>
                    setWebhookType(value as WebhookType)
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="FORM">Form</SelectItem>
                    <SelectItem value="CONTENT_TOOL">Content Tool</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Environment Toggle */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <Label>Environment</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Testing</span>
                <Switch
                  checked={isProduction}
                  onCheckedChange={setIsProduction}
                />
                <span className="text-sm text-muted-foreground">
                  Production
                </span>
                <Badge
                  variant={isProduction ? "default" : "secondary"}
                  className="ml-2"
                >
                  {isProduction ? "Production" : "Testing"}
                </Badge>
              </div>
            </div>

            {/* URL Fields */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="production-url">Production URL</Label>
                  {isProduction && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <Input
                  id="production-url"
                  type="url"
                  value={productionUrl}
                  onChange={(e) => setProductionUrl(e.target.value)}
                  placeholder="https://your-production-webhook.com/endpoint"
                  className={isProduction ? "ring-2 ring-green-500/20" : ""}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="testing-url">Testing URL</Label>
                  {!isProduction && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <Input
                  id="testing-url"
                  type="url"
                  value={testingUrl}
                  onChange={(e) => setTestingUrl(e.target.value)}
                  placeholder="https://your-testing-webhook.com/endpoint"
                  className={!isProduction ? "ring-2 ring-blue-500/20" : ""}
                />
              </div>
            </div>

            {/* Active URL Display */}
            {activeUrl && (
              <div
                className={`rounded border p-3 ${isProduction ? "border-green-500/20 bg-green-50/50 dark:bg-green-950/20" : "border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20"}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-xs font-medium">
                    Active URL ({isProduction ? "Production" : "Testing"})
                  </Label>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(activeUrl, "Active URL")
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy URL</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(activeUrl, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Open URL</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <p className="break-all font-mono text-xs text-muted-foreground">
                  {activeUrl}
                </p>
              </div>
            )}
          </div>

          {/* Callback URL Display for Content Tools */}
          {webhookType === "CONTENT_TOOL" && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
              <Label className="text-sm font-medium">
                Callback URL for n8n
              </Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Use this URL in your n8n workflow to send generated content back
                to the app
              </p>
              <div
                className={`rounded border p-2 ${isProduction ? "border-green-500/20 bg-green-50/50 dark:bg-green-950/20" : "border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20"}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`h-5 text-xs ${isProduction ? "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400" : "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400"}`}
                  >
                    {isProduction ? "Production" : "Testing"} Callback
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        getCallbackUrlClient("{{toolId}}", isProduction),
                        "Callback URL"
                      )
                    }
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="break-all font-mono text-xs">
                  {getCallbackUrlClient("{{toolId}}", isProduction)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Replace {"{{" + "toolId" + "}" + "}"} with the actual content
                  tool ID in your n8n workflow
                </p>
              </div>
            </div>
          )}

          {/* Headers */}
          <div>
            <Label htmlFor="headers">Custom Headers (Optional)</Label>
            <Textarea
              id="headers"
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              placeholder={`{\n  "X-API-Key": "your-api-key",\n  "Authorization": "Bearer token"\n}`}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              JSON format for custom headers to include with webhook requests
            </p>
          </div>

          {/* Settings */}
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="active">Active</Label>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleTestWebhook}
              disabled={!activeUrl.trim() || testingWebhook}
            >
              <TestTube className="mr-2 h-4 w-4" />
              {testingWebhook ? "Testing..." : "Test Webhook"}
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : webhook ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
