"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiStepFormBuilder } from "@/components/forms/multi-step-form-builder";
import { Form } from "@/types/forms";

export default function EditFormPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleSave = async (data: any) => {
    try {
      console.log("Saving form data:", data);
      const response = await fetch(`/api/forms/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Form update error:", error);

        // Show detailed validation errors if available
        if (error.details && Array.isArray(error.details)) {
          const errorMessages = error.details
            .map(
              (detail: any) => `${detail.path?.join(".")}: ${detail.message}`
            )
            .join("\n");
          throw new Error(`Validation errors:\n${errorMessages}`);
        }

        throw new Error(error.error || "Failed to update form");
      }

      router.push(`/forms/${params.id}`);
    } catch (error) {
      console.error("Error updating form:", error);
      alert(error instanceof Error ? error.message : "Failed to update form");
    }
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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/forms")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Form</h1>
          <p className="text-muted-foreground">
            Make changes to your form structure and settings
          </p>
        </div>
      </div>

      <MultiStepFormBuilder form={form} onSave={handleSave} />
    </div>
  );
}
