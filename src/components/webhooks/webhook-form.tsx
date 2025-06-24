"use client";

import { useState } from "react";
import { Save } from "lucide-react";
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
import { Webhook, WebhookType } from "@/types/webhooks";

interface WebhookFormProps {
  webhook?: Webhook;
  type?: WebhookType;
  entityId?: string;
  onSave: (data: {
    name: string;
    url: string;
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
  const [name, setName] = useState(webhook?.name || "");
  const [url, setUrl] = useState(webhook?.url || "");
  const [webhookType, setWebhookType] = useState<WebhookType>(
    webhook?.type || type || "GENERAL"
  );
  const [headers, setHeaders] = useState(
    webhook?.headers ? JSON.stringify(webhook.headers, null, 2) : ""
  );
  const [isActive, setIsActive] = useState(webhook?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      alert("Please enter a valid URL");
      return;
    }

    // Parse headers if provided
    let parsedHeaders: Record<string, string> | undefined;
    if (headers.trim()) {
      try {
        parsedHeaders = JSON.parse(headers);
      } catch {
        alert("Invalid headers JSON format");
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave({
        name,
        url,
        type: webhookType,
        entityId,
        headers: parsedHeaders,
        isActive,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{webhook ? "Edit Webhook" : "Create Webhook"}</CardTitle>
        <CardDescription>
          Configure webhook endpoint and settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Webhook Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Webhook"
          />
        </div>

        <div>
          <Label htmlFor="url">Webhook URL</Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/webhook"
          />
        </div>

        {!type && (
          <div>
            <Label htmlFor="type">Webhook Type</Label>
            <Select
              value={webhookType}
              onValueChange={(value) => setWebhookType(value as WebhookType)}
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

        <div>
          <Label htmlFor="headers">Custom Headers (Optional)</Label>
          <Textarea
            id="headers"
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            placeholder={`{\n  "X-API-Key": "your-api-key"\n}`}
            rows={4}
            className="font-mono text-sm"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            JSON format for custom headers to include with webhook requests
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="active">Active</Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : webhook ? "Update" : "Create"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
