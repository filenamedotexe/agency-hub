"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { FileText, Calendar, User, Settings, Copy, Code } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MotionListItem } from "@/components/ui/motion-elements";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DynamicField } from "@/components/ui/dynamic-field";

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

  // Extract all dynamic fields from form responses
  const dynamicFields =
    responses?.reduce(
      (fields, response) => {
        Object.entries(response.responseData).forEach(([key, field]) => {
          if (field && typeof field === "object" && "value" in field) {
            fields[key] = {
              ...field,
              fromForm: response.formName,
              submittedAt: response.submittedAt,
            };
          }
        });
        return fields;
      },
      {} as Record<string, any>
    ) || {};

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Form Responses & Dynamic Fields
            </CardTitle>
            <CardDescription>
              Dynamic fields from submitted forms
            </CardDescription>
          </div>
          {Object.keys(dynamicFields).length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Fields
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Dynamic Fields Management</DialogTitle>
                  <DialogDescription>
                    View and manage dynamic fields available for this client
                  </DialogDescription>
                </DialogHeader>
                <DynamicFieldsManager dynamicFields={dynamicFields} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {responses && responses.length > 0 ? (
            <div className="space-y-6">
              {responses.map((response, index) => (
                <MotionListItem
                  key={response.id}
                  index={index}
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
                </MotionListItem>
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

// Dynamic Fields Manager Component
function DynamicFieldsManager({
  dynamicFields,
}: {
  dynamicFields: Record<string, any>;
}) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Fields Overview</TabsTrigger>
        <TabsTrigger value="usage">Usage Guide</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4">
          {Object.entries(dynamicFields).map(([key, field], index) => (
            <MotionListItem
              key={key}
              index={index}
              className="space-y-3 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{field.label || key}</h4>
                  <p className="text-sm text-muted-foreground">
                    From: {field.fromForm} •{" "}
                    {format(new Date(field.submittedAt), "PPp")}
                  </p>
                </div>
                <Badge variant="secondary">{field.type}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Variable Name:</span>
                  <div className="flex items-center gap-2">
                    <DynamicField
                      field={`{{${key}}}`}
                      variant="code"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Value:</span>
                  <span className="max-w-xs truncate text-sm text-muted-foreground">
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
              </div>
            </MotionListItem>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="usage" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              How to Use Dynamic Fields
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="mb-2 font-medium">In Content Tools</h4>
              <p className="mb-2 text-sm text-muted-foreground">
                Use these variables in your content tool prompts to
                automatically populate client-specific data:
              </p>
              <div className="rounded-lg bg-muted p-3">
                <div className="text-sm">
                  Write a blog post about{" "}
                  <DynamicField field="{{topic}}" variant="inline" /> for{" "}
                  <DynamicField field="{{businessName}}" variant="inline" />.
                  <br />
                  Target audience:{" "}
                  <DynamicField field="{{target_audience}}" variant="inline" />
                  <br />
                  Key benefits:{" "}
                  <DynamicField field="{{key_benefits}}" variant="inline" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">Available Variables</h4>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <DynamicField
                    field="{{businessName}}"
                    variant="code"
                    className="text-xs"
                  />
                  <span className="text-sm text-muted-foreground">
                    Client&apos;s business name
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DynamicField
                    field="{{clientName}}"
                    variant="code"
                    className="text-xs"
                  />
                  <span className="text-sm text-muted-foreground">
                    Client&apos;s name
                  </span>
                </div>
                {Object.keys(dynamicFields).map((key, index) => (
                  <MotionListItem
                    key={key}
                    index={index}
                    className="flex items-center gap-2"
                  >
                    <DynamicField
                      field={`{{${key}}}`}
                      variant="code"
                      className="text-xs"
                    />
                    <span className="text-sm text-muted-foreground">
                      {dynamicFields[key].label} (from{" "}
                      {dynamicFields[key].fromForm})
                    </span>
                  </MotionListItem>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">Tips</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  • Variables are automatically replaced when generating content
                </li>
                <li>
                  • Use descriptive field names in forms for better organization
                </li>
                <li>
                  • File fields will show download links in generated content
                </li>
                <li>• Variables are case-sensitive and must match exactly</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
