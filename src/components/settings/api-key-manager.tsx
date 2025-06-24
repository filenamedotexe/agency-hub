"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, Plus, Trash2, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";

interface ApiKey {
  id: string;
  service: string;
  maskedKey: string;
  lastFour: string;
  createdAt: string;
  updatedAt: string;
}

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState({
    service: "anthropic" as "anthropic" | "openai",
    key: "",
  });
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);

  const [editValue, setEditValue] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchApiKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/settings/api-keys");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleAddKey = async () => {
    if (!newKey.key) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newKey),
      });

      if (!response.ok) throw new Error("Failed to save API key");

      const data = await response.json();
      toast({
        title: "Success",
        description: data.message,
      });

      setNewKey({ service: "anthropic", key: "" });
      setShowAddForm(false);
      fetchApiKeys();
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    }
  };

  const handleUpdateKey = async (id: string) => {
    if (!editValue) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/settings/api-keys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: editValue }),
      });

      if (!response.ok) throw new Error("Failed to update API key");

      const data = await response.json();
      toast({
        title: "Success",
        description: data.message,
      });

      setEditingKey(null);
      setEditValue("");
      fetchApiKeys();
    } catch (error) {
      console.error("Error updating API key:", error);
      toast({
        title: "Error",
        description: "Failed to update API key",
        variant: "destructive",
      });
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      const response = await fetch(`/api/settings/api-keys/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete API key");

      const data = await response.json();
      toast({
        title: "Success",
        description: data.message,
      });

      setDeleteKeyId(null);
      fetchApiKeys();
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="py-4 text-center">Loading API keys...</div>;
  }

  return (
    <div className="space-y-4">
      {/* API Keys List */}
      <div className="space-y-2">
        {apiKeys.map((key) => (
          <div
            key={key.id}
            data-testid="api-key-row"
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium capitalize">{key.service}</p>
                <p className="text-sm text-muted-foreground">
                  {editingKey === key.id ? (
                    <Input
                      type={showKey[key.id] ? "text" : "password"}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-64"
                      placeholder="Enter new API key"
                    />
                  ) : (
                    <span data-testid="masked-api-key">{key.maskedKey}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editingKey === key.id ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setShowKey({ ...showKey, [key.id]: !showKey[key.id] })
                    }
                  >
                    {showKey[key.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button size="sm" onClick={() => handleUpdateKey(key.id)}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingKey(null);
                      setEditValue("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Update API key"
                    onClick={() => {
                      setEditingKey(key.id);
                      setEditValue("");
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    aria-label="Delete API key"
                    onClick={() => setDeleteKeyId(key.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Key Form */}
      {showAddForm ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <Label htmlFor="service">Service</Label>
            <Select
              value={newKey.service}
              onValueChange={(value) =>
                setNewKey({
                  ...newKey,
                  service: value as "anthropic" | "openai",
                })
              }
            >
              <SelectTrigger id="service">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="key">API Key</Label>
            <Input
              id="key"
              name="key"
              type="password"
              value={newKey.key}
              onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
              placeholder={`Enter your ${newKey.service} API key`}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAddKey}>Save API Key</Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setNewKey({ service: "anthropic", key: "" });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setShowAddForm(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          {apiKeys.some((k) => k.service === "anthropic")
            ? "Add OpenAI Key"
            : "Add Anthropic Key"}
        </Button>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteKeyId}
        onOpenChange={() => setDeleteKeyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API key? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteKeyId && handleDeleteKey(deleteKeyId)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
