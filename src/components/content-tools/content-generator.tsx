"use client";

import { useState, useEffect } from "react";
import { Sparkles, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContentTool } from "@/types/content-tools";

interface ContentGeneratorProps {
  tool: ContentTool;
  onBack: () => void;
}

export function ContentGenerator({ tool, onBack }: ContentGeneratorProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const extractVariables = () => {
      const regex = /{{(\w+)}}/g;
      const matches = Array.from(tool.prompt.matchAll(regex));
      const vars: Record<string, string> = {};

      matches.forEach((match) => {
        const varName = match[1];
        if (varName !== "businessName" && varName !== "clientName") {
          vars[varName] = "";
        }
      });

      setVariables(vars);
    };

    extractVariables();
  }, [tool.prompt]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedClientId) {
      alert("Please select a client");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const response = await fetch(`/api/content-tools/${tool.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          variables,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate content");

      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (error) {
      console.error("Error generating content:", error);
      alert("Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    alert("Content copied to clipboard!");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{tool.name}</h2>
          <p className="text-muted-foreground">{tool.description}</p>
        </div>
        <Button variant="outline" onClick={onBack}>
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
                value={selectedClientId}
                onValueChange={setSelectedClientId}
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

            {Object.entries(variables).map(([key, value]) => (
              <div key={key}>
                <Label htmlFor={key}>
                  {key.charAt(0).toUpperCase() +
                    key.slice(1).replace(/([A-Z])/g, " $1")}
                </Label>
                {key.toLowerCase().includes("description") ||
                key.toLowerCase().includes("context") ||
                key.toLowerCase().includes("benefits") ? (
                  <Textarea
                    id={key}
                    value={value}
                    onChange={(e) =>
                      setVariables({ ...variables, [key]: e.target.value })
                    }
                    placeholder={`Enter ${key}...`}
                    rows={3}
                  />
                ) : (
                  <Input
                    id={key}
                    value={value}
                    onChange={(e) =>
                      setVariables({ ...variables, [key]: e.target.value })
                    }
                    placeholder={`Enter ${key}...`}
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
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>
              Your AI-generated content will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedContent ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
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
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                {isGenerating ? (
                  <div className="space-y-2">
                    <Sparkles className="mx-auto h-8 w-8 animate-pulse" />
                    <p>Generating content...</p>
                  </div>
                ) : (
                  <p>Generated content will appear here</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
