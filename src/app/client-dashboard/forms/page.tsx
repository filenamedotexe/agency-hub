"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { FormRenderer } from "@/components/forms/form-renderer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface FormResponse {
  id: string;
  formId: string;
  data: Record<string, any>;
  createdAt: string;
}

interface ClientForm {
  id: string;
  name: string;
  description?: string;
  schema: any[];
  settings?: any;
  serviceId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  responses: FormResponse[];
  _count: {
    responses: number;
  };
}

export default function ClientFormsPage() {
  const { user } = useAuth();
  const [selectedForm, setSelectedForm] = useState<ClientForm | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);

  const { data: forms = [], isLoading } = useQuery<ClientForm[]>({
    queryKey: ["client-forms", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/client/forms");
      if (!response.ok) throw new Error("Failed to fetch forms");
      return response.json();
    },
    enabled: !!user,
  });

  const handleFormSubmit = async (data: Record<string, any>) => {
    if (!selectedForm) return;

    try {
      const response = await fetch(`/api/forms/${selectedForm.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) throw new Error("Failed to submit form");

      toast.success("Form submitted successfully!");
      setShowFormDialog(false);
      setSelectedForm(null);
    } catch (error) {
      toast.error("Failed to submit form. Please try again.");
    }
  };

  const openForm = (form: ClientForm) => {
    setSelectedForm(form);
    setShowFormDialog(true);
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Forms</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activeForms = forms.filter((form) => form.isActive);
  const completedForms = forms.filter(
    (form) => !form.isActive && form._count.responses > 0
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Forms</h1>

      {activeForms.length === 0 && completedForms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600">No forms available at this time</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Forms */}
          {activeForms.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">
                Forms to Complete
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeForms.map((form) => (
                  <Card
                    key={form.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => openForm(form)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{form.name}</CardTitle>
                          {form.description && (
                            <CardDescription className="mt-1">
                              {form.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant="default" className="ml-2">
                          <Clock className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant="default">
                        Fill Out Form
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Forms */}
          {completedForms.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-800">
                Completed Forms
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedForms.map((form) => (
                  <Card key={form.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{form.name}</CardTitle>
                          {form.description && (
                            <CardDescription className="mt-1">
                              {form.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant="secondary">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Submitted {form._count.responses} time
                        {form._count.responses !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedForm?.name}</DialogTitle>
            {selectedForm?.description && (
              <DialogDescription>{selectedForm.description}</DialogDescription>
            )}
          </DialogHeader>
          {selectedForm && (
            <FormRenderer
              form={selectedForm}
              onSubmit={handleFormSubmit}
              isPreview={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
