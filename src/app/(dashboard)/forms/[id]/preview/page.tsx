"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Smartphone, Tablet, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormField } from "@/types/forms";
import { FormRenderer } from "@/components/forms/form-renderer";
import { cn } from "@/lib/utils";

type ViewportSize = "mobile" | "tablet" | "desktop";

export default function FormPreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [testData, setTestData] = useState<Record<string, any>>({});
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch form");
        const data = await response.json();
        setForm(data);
      } catch (error) {
        console.error("Error fetching form:", error);
        alert("Failed to load form");
        router.push("/forms");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [params.id, router]);

  const handleTestSubmit = (data: Record<string, any>) => {
    setTestData(data);
    setShowResult(true);
  };

  const viewportSizes = {
    mobile: "max-w-[375px]",
    tablet: "max-w-[768px]",
    desktop: "max-w-[1200px]",
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
            onClick={() => router.push(`/forms/${params.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Preview: {form.name}</h1>
            <p className="text-muted-foreground">
              Test your form before publishing
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <Eye className="h-3 w-3" />
          Preview Mode
        </Badge>
      </div>

      {/* Viewport Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Viewport Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button
              variant={viewport === "mobile" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewport("mobile")}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Mobile (375px)
            </Button>
            <Button
              variant={viewport === "tablet" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewport("tablet")}
            >
              <Tablet className="mr-2 h-4 w-4" />
              Tablet (768px)
            </Button>
            <Button
              variant={viewport === "desktop" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewport("desktop")}
            >
              <Monitor className="mr-2 h-4 w-4" />
              Desktop
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Preview */}
      <div className="flex justify-center">
        <div
          className={cn(
            "w-full transition-all duration-300",
            viewportSizes[viewport],
            viewport !== "desktop" && "border-x border-gray-200"
          )}
        >
          <Card>
            <CardHeader>
              <CardTitle>{form.name}</CardTitle>
              {form.description && (
                <p className="text-sm text-muted-foreground">
                  {form.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {!showResult ? (
                <FormRenderer
                  form={form}
                  onSubmit={handleTestSubmit}
                  isPreview={true}
                />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-medium text-green-800">
                      {form.settings?.successMessage ||
                        "Form submitted successfully!"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Test Submission Data:</h3>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <pre className="overflow-auto text-xs">
                        {JSON.stringify(testData, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowResult(false);
                        setTestData({});
                      }}
                    >
                      Test Again
                    </Button>
                    {form.settings?.redirectUrl && (
                      <p className="self-center text-sm text-muted-foreground">
                        In production, would redirect to:{" "}
                        {form.settings.redirectUrl}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test Mode Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• This is a test mode - no data will be saved</li>
            <li>• Webhooks will not be triggered in preview mode</li>
            <li>• Test form validation and user experience</li>
            <li>• Switch between viewport sizes to test responsive design</li>
            <li>• Submit the form to see what data would be collected</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
