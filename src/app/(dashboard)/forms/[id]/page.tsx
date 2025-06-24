"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Eye, ExternalLink, Download } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormResponse } from "@/types/forms";

export default function FormDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [formRes, responsesRes] = await Promise.all([
          fetch(`/api/forms/${params.id}`),
          fetch(`/api/forms/${params.id}/responses`),
        ]);

        if (!formRes.ok || !responsesRes.ok) {
          throw new Error("Failed to fetch form data");
        }

        const formData = await formRes.json();
        const responsesData = await responsesRes.json();

        setForm(formData);
        setResponses(responsesData);
      } catch (error) {
        console.error("Error fetching form data:", error);
        alert("Failed to load form");
        router.push("/forms");
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [params.id, router]);

  const exportResponses = () => {
    if (!form || responses.length === 0) return;

    // Create CSV content
    const headers = form.schema.map((field) => field.label);
    const rows = responses.map((response) => {
      return form.schema.map((field) => {
        const fieldData = response.responseData[field.name];
        return fieldData?.value || "";
      });
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.name.replace(/\s+/g, "-").toLowerCase()}-responses.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-muted-foreground">Loading form...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-muted-foreground">Form not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/forms")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{form.name}</h1>
            {form.description && (
              <p className="text-muted-foreground">{form.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/forms/${params.id}/preview`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/forms/${params.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Form
          </Button>
        </div>
      </div>

      <Tabs defaultValue="responses" className="w-full">
        <TabsList>
          <TabsTrigger value="responses">
            Responses ({responses.length})
          </TabsTrigger>
          <TabsTrigger value="structure">Form Structure</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Form Responses</CardTitle>
                  <CardDescription>
                    All submissions for this form
                  </CardDescription>
                </div>
                {responses.length > 0 && (
                  <Button variant="outline" onClick={exportResponses}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent data-testid="form-responses">
              {responses.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No responses yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Submitted</TableHead>
                      {form.schema.slice(0, 3).map((field) => (
                        <TableHead key={field.id}>{field.label}</TableHead>
                      ))}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell className="font-medium">
                          {response.client?.businessName ||
                            response.client?.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(response.submittedAt).toLocaleString()}
                        </TableCell>
                        {form.schema.slice(0, 3).map((field) => (
                          <TableCell key={field.id}>
                            {response.responseData[field.name]?.value || "-"}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(`/clients/${response.clientId}`)
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Fields</CardTitle>
              <CardDescription>The structure of this form</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {form.schema.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{field.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {field.type} • {field.name}
                        {field.required && " • Required"}
                      </p>
                    </div>
                    <Badge variant="secondary">Field {index + 1}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>Configuration for this form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.settings?.webhookUrl && (
                <div>
                  <p className="text-sm font-medium">Webhook URL</p>
                  <p className="text-sm text-muted-foreground">
                    {form.settings.webhookUrl}
                  </p>
                </div>
              )}
              {form.settings?.redirectUrl && (
                <div>
                  <p className="text-sm font-medium">Redirect URL</p>
                  <p className="text-sm text-muted-foreground">
                    {form.settings.redirectUrl}
                  </p>
                </div>
              )}
              {form.settings?.successMessage && (
                <div>
                  <p className="text-sm font-medium">Success Message</p>
                  <p className="text-sm text-muted-foreground">
                    {form.settings.successMessage}
                  </p>
                </div>
              )}
              {form.settings?.submitButtonText && (
                <div>
                  <p className="text-sm font-medium">Submit Button Text</p>
                  <p className="text-sm text-muted-foreground">
                    {form.settings.submitButtonText}
                  </p>
                </div>
              )}
              {!form.settings?.webhookUrl && !form.settings?.redirectUrl && (
                <p className="text-sm text-muted-foreground">
                  No special settings configured
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
