"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { FileText, Calendar, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DynamicText } from "@/components/ui/dynamic-field";

interface GeneratedContent {
  id: string;
  toolName: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface GeneratedContentProps {
  clientId: string;
}

export function GeneratedContent({ clientId }: GeneratedContentProps) {
  const { data: content, isLoading } = useQuery<GeneratedContent[]>({
    queryKey: ["generated-content", clientId],
    queryFn: async () => {
      const response = await fetch(
        `/api/clients/${clientId}/generated-content`
      );
      if (!response.ok) throw new Error("Failed to fetch generated content");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generated Content
          </CardTitle>
          <CardDescription>Content created using AI tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Generated Content
        </CardTitle>
        <CardDescription>Content created using AI tools</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {content && content.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {content.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex w-full items-center justify-between pr-4">
                      <span className="font-medium">{item.toolName}</span>
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="mr-1 h-3 w-3" />
                        {format(new Date(item.createdAt), "PP")}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
                          <DynamicText variant="inline">
                            {item.content}
                          </DynamicText>
                        </pre>
                      </div>
                      {item.metadata &&
                        Object.keys(item.metadata).length > 0 && (
                          <div className="space-y-1 text-sm">
                            <p className="font-medium text-muted-foreground">
                              Metadata:
                            </p>
                            {Object.entries(item.metadata).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="grid grid-cols-3 gap-2"
                                >
                                  <span className="text-muted-foreground">
                                    {key}:
                                  </span>
                                  <span className="col-span-2">
                                    {String(value)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No generated content yet
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
