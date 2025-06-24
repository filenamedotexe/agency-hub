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
import { ContentTool } from "@/types/content-tools";
import { ContentGenerator } from "@/components/content-tools/content-generator";

const toolIcons: Record<string, React.ElementType> = {
  BLOG_WRITER: FileText,
  FACEBOOK_VIDEO_AD: Video,
  FACEBOOK_IMAGE_AD: Image,
  GOOGLE_SEARCH_AD: Search,
  SEO_KEYWORD_RESEARCH: Key,
};

export default function ContentToolsPage() {
  const [tools, setTools] = useState<ContentTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<ContentTool | null>(null);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const response = await fetch("/api/content-tools");
      if (!response.ok) throw new Error("Failed to fetch content tools");
      const data = await response.json();
      setTools(data);
    } catch (error) {
      console.error("Error fetching content tools:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-muted-foreground">Loading content tools...</div>
      </div>
    );
  }

  if (selectedTool) {
    return (
      <ContentGenerator
        tool={selectedTool}
        onBack={() => setSelectedTool(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Tools</h1>
        <p className="text-muted-foreground">
          Generate high-quality content for your clients using AI
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = toolIcons[tool.type] || FileText;

          return (
            <Card
              key={tool.id}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => setSelectedTool(tool)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Icon className="h-8 w-8 text-primary" />
                  {tool._count && tool._count.generatedContent > 0 && (
                    <Badge variant="secondary">
                      <History className="mr-1 h-3 w-3" />
                      {tool._count.generatedContent}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{tool.name}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Content
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
    </div>
  );
}
