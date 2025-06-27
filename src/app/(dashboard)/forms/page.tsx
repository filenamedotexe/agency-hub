"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, FileText, ExternalLink, Eye } from "lucide-react";
import { MotionButton } from "@/components/ui/motion-button";
import { MotionIconButton } from "@/components/ui/motion-elements";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton-loader";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResponsiveDataTable } from "@/components/ui/responsive-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/types/forms";

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch("/api/forms");
      if (!response.ok) throw new Error("Failed to fetch forms");
      const data = await response.json();
      setForms(data);
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteFormId) return;

    try {
      const response = await fetch(`/api/forms/${deleteFormId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to delete form");
        return;
      }

      setForms(forms.filter((form) => form.id !== deleteFormId));
    } catch (error) {
      console.error("Error deleting form:", error);
      alert("Failed to delete form");
    } finally {
      setDeleteFormId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <EnhancedCard>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={5} columns={6} />
          </CardContent>
        </EnhancedCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Forms</h1>
          <p className="text-muted-foreground">
            Create and manage forms for collecting client information
          </p>
        </div>
        <MotionButton onClick={() => router.push("/forms/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Form
        </MotionButton>
      </div>

      {forms.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No forms yet"
          description="Create your first form to start collecting client information"
          action={
            <MotionButton onClick={() => router.push("/forms/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Form
            </MotionButton>
          }
        />
      ) : (
        <EnhancedCard>
          <CardHeader>
            <CardTitle>All Forms</CardTitle>
            <CardDescription>
              Manage your forms and view submission counts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveDataTable
              columns={[
                {
                  key: "name",
                  label: "Name",
                  priority: "high",
                  renderCell: (value) => (
                    <div className="font-medium">{value}</div>
                  ),
                },
                {
                  key: "description",
                  label: "Description",
                  priority: "medium",
                  renderCell: (value) => (
                    <span className="text-muted-foreground">
                      {value || "-"}
                    </span>
                  ),
                },
                {
                  key: "schema",
                  label: "Fields",
                  priority: "low",
                  renderCell: (value) => (
                    <Badge variant="secondary">{value.length} fields</Badge>
                  ),
                },
                {
                  key: "_count",
                  label: "Responses",
                  priority: "high",
                  renderCell: (value) => (
                    <Badge>{value?.responses || 0} responses</Badge>
                  ),
                },
                {
                  key: "createdAt",
                  label: "Created",
                  priority: "low",
                  renderCell: (value) => (
                    <span className="text-muted-foreground">
                      {new Date(value).toLocaleDateString()}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  priority: "high",
                  renderCell: (_, form) => (
                    <div className="flex items-center justify-end gap-2">
                      <MotionIconButton
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/forms/${form.id}`);
                        }}
                        title="View Details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </MotionIconButton>
                      <MotionIconButton
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/forms/${form.id}/preview`);
                        }}
                        title="Preview Form"
                      >
                        <Eye className="h-4 w-4" />
                      </MotionIconButton>
                      <MotionIconButton
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/forms/${form.id}/edit`);
                        }}
                        title="Edit Form"
                      >
                        <Edit className="h-4 w-4" />
                      </MotionIconButton>
                      <MotionIconButton
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteFormId(form.id);
                        }}
                        disabled={
                          form._count?.responses
                            ? form._count.responses > 0
                            : false
                        }
                        title="Delete Form"
                      >
                        <Trash2 className="h-4 w-4" />
                      </MotionIconButton>
                    </div>
                  ),
                },
              ]}
              data={forms}
              onRowClick={(form) => router.push(`/forms/${form.id}`)}
            />
          </CardContent>
        </EnhancedCard>
      )}

      <AlertDialog
        open={!!deleteFormId}
        onOpenChange={(open) => !open && setDeleteFormId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this form? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
