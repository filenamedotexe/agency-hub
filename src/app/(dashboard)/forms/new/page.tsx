"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiStepFormBuilder } from "@/components/forms/multi-step-form-builder";

export default function NewFormPage() {
  const router = useRouter();

  const handleSave = async (data: any) => {
    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create form");
      }

      const form = await response.json();
      router.push(`/forms/${form.id}`);
    } catch (error) {
      console.error("Error creating form:", error);
      alert(error instanceof Error ? error.message : "Failed to create form");
    }
  };

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
          <h1 className="text-3xl font-bold">Create New Form</h1>
          <p className="text-muted-foreground">
            Build a custom form to collect client information
          </p>
        </div>
      </div>

      <MultiStepFormBuilder onSave={handleSave} />
    </div>
  );
}
