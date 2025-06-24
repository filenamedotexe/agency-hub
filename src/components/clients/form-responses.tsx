"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { FileText, Calendar, User } from "lucide-react";
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

interface FormResponse {
  id: string;
  formId: string;
  formName: string;
  responseData: Record<string, any>;
  submittedAt: string;
}

interface FormResponsesProps {
  clientId: string;
}

export function FormResponses({ clientId }: FormResponsesProps) {
  const { data: responses, isLoading } = useQuery<FormResponse[]>({
    queryKey: ["form-responses", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/form-responses`);
      if (!response.ok) throw new Error("Failed to fetch form responses");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Form Responses
          </CardTitle>
          <CardDescription>Dynamic fields from submitted forms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
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
          <FileText className="h-5 w-5" />
          Form Responses
        </CardTitle>
        <CardDescription>Dynamic fields from submitted forms</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {responses && responses.length > 0 ? (
            <div className="space-y-6">
              {responses.map((response) => (
                <div
                  key={response.id}
                  className="space-y-3 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{response.formName}</h4>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="mr-1 h-3 w-3" />
                      {format(new Date(response.submittedAt), "PPp")}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(response.responseData).map(
                      ([key, field]) => (
                        <div
                          key={key}
                          className="grid grid-cols-3 gap-2 text-sm"
                        >
                          <span className="font-medium text-muted-foreground">
                            {field.label || key}:
                          </span>
                          <span className="col-span-2">
                            {field.type === "file" ? (
                              <a
                                href={field.value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View file
                              </a>
                            ) : (
                              field.value || "-"
                            )}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No form responses yet
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
