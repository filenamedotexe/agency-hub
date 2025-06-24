"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Webhook, WebhookType } from "@/types/webhooks";
import { WebhookForm } from "@/components/webhooks/webhook-form";

export default function AutomationsPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [formType, setFormType] = useState<WebhookType>("GENERAL");
  const [deleteWebhookId, setDeleteWebhookId] = useState<string | null>(null);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch("/api/webhooks");
      if (!response.ok) throw new Error("Failed to fetch webhooks");
      const data = await response.json();
      setWebhooks(data);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
    } finally {
      setLoading(false);
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
      alert(error instanceof Error ? error.message : "Failed to save webhook");
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
    } catch (error) {
      console.error("Error toggling webhook:", error);
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
    } catch (error) {
      console.error("Error deleting webhook:", error);
      alert("Failed to delete webhook");
    } finally {
      setDeleteWebhookId(null);
    }
  };

  const openForm = (type: WebhookType) => {
    setFormType(type);
    setShowForm(true);
  };

  const editWebhook = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setShowForm(true);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Automations</h1>
        <p className="text-muted-foreground">
          Manage webhooks and automation workflows
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Webhooks</CardTitle>
          <CardDescription>
            Webhooks configured for forms will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formWebhooks.length === 0 ? (
            <p className="text-muted-foreground">No form webhooks configured</p>
          ) : (
            <WebhookTable
              webhooks={formWebhooks}
              onEdit={editWebhook}
              onToggle={handleToggle}
              onDelete={setDeleteWebhookId}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Tool Webhooks</CardTitle>
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
            <WebhookTable
              webhooks={contentToolWebhooks}
              onEdit={editWebhook}
              onToggle={handleToggle}
              onDelete={setDeleteWebhookId}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>General Webhooks</CardTitle>
              <CardDescription>
                General webhooks for custom automation
              </CardDescription>
            </div>
            <Button onClick={() => openForm("GENERAL")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {generalWebhooks.length === 0 ? (
            <p className="text-muted-foreground">
              No general webhooks configured
            </p>
          ) : (
            <WebhookTable
              webhooks={generalWebhooks}
              onEdit={editWebhook}
              onToggle={handleToggle}
              onDelete={setDeleteWebhookId}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteWebhookId}
        onOpenChange={(open) => !open && setDeleteWebhookId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WebhookTable({
  webhooks,
  onEdit,
  onToggle,
  onDelete,
}: {
  webhooks: Webhook[];
  onEdit: (webhook: Webhook) => void;
  onToggle: (webhook: Webhook) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>URL</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Executions</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {webhooks.map((webhook) => (
          <TableRow key={webhook.id}>
            <TableCell className="font-medium">{webhook.name}</TableCell>
            <TableCell className="max-w-xs truncate text-muted-foreground">
              {webhook.url}
            </TableCell>
            <TableCell>
              <Badge variant={webhook.isActive ? "default" : "secondary"}>
                {webhook.isActive ? (
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
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                <Activity className="mr-1 h-3 w-3" />
                {webhook._count?.executions || 0}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(webhook.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Switch
                  checked={webhook.isActive}
                  onCheckedChange={() => onToggle(webhook)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(webhook)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(webhook.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
