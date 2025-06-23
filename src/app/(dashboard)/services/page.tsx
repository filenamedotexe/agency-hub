"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ServiceTemplate {
  id: string;
  name: string;
  type: "GOOGLE_ADS" | "FACEBOOK_ADS" | "WEBSITE_DESIGN";
  defaultTasks: Array<{
    name: string;
    description?: string;
    clientVisible: boolean;
  }>;
  price?: number;
  _count?: {
    services: number;
  };
  createdAt: string;
  updatedAt: string;
}

const typeLabels = {
  GOOGLE_ADS: "Google Ads",
  FACEBOOK_ADS: "Facebook Ads",
  WEBSITE_DESIGN: "Website Design",
};

const typeColors = {
  GOOGLE_ADS: "bg-blue-100 text-blue-700",
  FACEBOOK_ADS: "bg-indigo-100 text-indigo-700",
  WEBSITE_DESIGN: "bg-purple-100 text-purple-700",
};

export default function ServicesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/service-templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      toast.error("Failed to load service templates");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTemplateId) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/service-templates/${deleteTemplateId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete template");
      }

      toast.success("Service template deleted");
      setTemplates(templates.filter((t) => t.id !== deleteTemplateId));
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template");
    } finally {
      setDeleting(false);
      setDeleteTemplateId(null);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Service Templates
          </h1>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Service Templates
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage templates for services you offer to clients
          </p>
        </div>
        <Button asChild>
          <Link href="/services/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-center text-gray-600">
              No service templates yet. Create your first template to get
              started.
            </p>
            <Button asChild>
              <Link href="/services/templates/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="transition-shadow hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      <Badge
                        variant="secondary"
                        className={typeColors[template.type]}
                      >
                        {typeLabels[template.type]}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="h-8 w-8"
                    >
                      <Link href={`/services/templates/${template.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => setDeleteTemplateId(template.id)}
                      disabled={
                        !!template._count?.services &&
                        template._count.services > 0
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {template.price && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="mr-1 h-4 w-4" />$
                      {template.price.toFixed(2)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Default Tasks ({template.defaultTasks.length})
                    </p>
                    <ul className="mt-1 space-y-1">
                      {template.defaultTasks.slice(0, 3).map((task, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          • {task.name}
                        </li>
                      ))}
                      {template.defaultTasks.length > 3 && (
                        <li className="text-sm text-gray-500">
                          +{template.defaultTasks.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                  {template._count?.services !== undefined && (
                    <p className="text-xs text-gray-500">
                      Used in {template._count.services} service
                      {template._count.services !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteTemplateId}
        onOpenChange={(open) => !open && setDeleteTemplateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service template? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
