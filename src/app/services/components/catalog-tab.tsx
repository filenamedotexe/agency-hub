"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Grid,
  List,
  Copy,
  BarChart3,
  Archive,
  MoreHorizontal,
  CheckCircle,
  XCircle,
} from "lucide-react";
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
import { MotionButton } from "@/components/ui/motion-button";
import {
  MotionIconButton,
  MotionDiv,
  MotionBadge,
} from "@/components/ui/motion-elements";
import { CardContent } from "@/components/ui/card";
import { Skeleton, CardSkeleton } from "@/components/ui/skeleton-loader";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
  status?: "ACTIVE" | "ARCHIVED";
  _count?: {
    services: number;
    orders?: number;
  };
  _sum?: {
    revenue?: number;
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

export default function CatalogTab() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [editingPrice, setEditingPrice] = useState<{
    id: string;
    price: number;
  } | null>(null);

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

  const handleDuplicate = async (template: ServiceTemplate) => {
    try {
      const response = await fetch("/api/service-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          type: template.type,
          defaultTasks: template.defaultTasks,
          price: template.price,
        }),
      });

      if (!response.ok) throw new Error("Failed to duplicate template");

      const newTemplate = await response.json();
      toast.success("Service template duplicated");
      fetchTemplates();
    } catch (error) {
      toast.error("Failed to duplicate template");
    }
  };

  const handleArchive = async (templateId: string) => {
    try {
      const response = await fetch(`/api/service-templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });

      if (!response.ok) throw new Error("Failed to archive template");

      toast.success("Service template archived");
      fetchTemplates();
    } catch (error) {
      toast.error("Failed to archive template");
    }
  };

  const handlePriceUpdate = async (templateId: string, newPrice: number) => {
    try {
      const response = await fetch(`/api/service-templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: newPrice }),
      });

      if (!response.ok) throw new Error("Failed to update price");

      toast.success("Price updated");
      setEditingPrice(null);
      fetchTemplates();
    } catch (error) {
      toast.error("Failed to update price");
    }
  };

  const handleBulkArchive = async () => {
    if (selectedTemplates.length === 0) return;

    try {
      await Promise.all(
        selectedTemplates.map((id) =>
          fetch(`/api/service-templates/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "ARCHIVED" }),
          })
        )
      );

      toast.success(`${selectedTemplates.length} templates archived`);
      setSelectedTemplates([]);
      fetchTemplates();
    } catch (error) {
      toast.error("Failed to archive templates");
    }
  };

  const toggleSelectAll = () => {
    if (selectedTemplates.length === templates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(templates.map((t) => t.id));
    }
  };

  const toggleSelect = (templateId: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId]
    );
  };

  if (loading) {
    return (
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <MotionDiv
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold text-gray-900">
            Service Catalog
          </h2>
          <Skeleton className="h-10 w-40" />
        </MotionDiv>
        <MotionDiv className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </MotionDiv>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MotionDiv
        className="mb-6 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Service Catalog
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage templates for services you offer to clients
            </p>
          </div>
          <MotionButton asChild className="w-full sm:w-auto">
            <Link href="/services/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </MotionButton>
        </div>

        <div className="flex items-center justify-between">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) =>
              value && setViewMode(value as "grid" | "table")
            }
            className="justify-start"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {selectedTemplates.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedTemplates.length} selected
              </span>
              <Button variant="outline" size="sm" onClick={handleBulkArchive}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
            </div>
          )}
        </div>
      </MotionDiv>

      {templates.length === 0 ? (
        <EnhancedCard>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-center text-gray-600">
              No service templates yet. Create your first template to get
              started.
            </p>
            <MotionButton asChild>
              <Link href="/services/templates/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Link>
            </MotionButton>
          </CardContent>
        </EnhancedCard>
      ) : viewMode === "grid" ? (
        <MotionDiv
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {templates.map((template) => (
            <EnhancedCard
              key={template.id}
              onClick={() =>
                router.push(`/services/templates/${template.id}/edit`)
              }
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    <div className="mt-1">
                      <MotionBadge
                        variant="secondary"
                        className={typeColors[template.type]}
                      >
                        {typeLabels[template.type]}
                      </MotionBadge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <MotionIconButton
                      variant="ghost"
                      size="sm"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/services/templates/${template.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </MotionIconButton>
                    <MotionIconButton
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTemplateId(template.id);
                      }}
                      disabled={
                        !!template._count?.services &&
                        template._count.services > 0
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </MotionIconButton>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
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
              </div>
            </EnhancedCard>
          ))}
        </MotionDiv>
      ) : (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <EnhancedCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTemplates.length === templates.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTemplates.includes(template.id)}
                        onCheckedChange={() => toggleSelect(template.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <div className="mt-1">
                          <MotionBadge
                            variant="secondary"
                            className={typeColors[template.type]}
                          >
                            {typeLabels[template.type]}
                          </MotionBadge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingPrice?.id === template.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editingPrice.price}
                            onChange={(e) =>
                              setEditingPrice({
                                ...editingPrice,
                                price: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-24"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handlePriceUpdate(
                                  template.id,
                                  editingPrice.price
                                );
                              } else if (e.key === "Escape") {
                                setEditingPrice(null);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() =>
                              handlePriceUpdate(template.id, editingPrice.price)
                            }
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="text-left hover:underline"
                          onClick={() =>
                            setEditingPrice({
                              id: template.id,
                              price: template.price || 0,
                            })
                          }
                        >
                          ${template.price?.toFixed(2) || "0.00"}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {template.status === "ARCHIVED" ? (
                          <>
                            <XCircle className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Archived</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-700">Active</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {template._count?.orders || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      ${template._sum?.revenue?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/services/templates/${template.id}/edit`}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(template)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/services?tab=analytics&template=${template.id}`}
                            >
                              <BarChart3 className="mr-2 h-4 w-4" />
                              View Analytics
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleArchive(template.id)}
                            className="text-orange-600"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteTemplateId(template.id)}
                            className="text-red-600"
                            disabled={
                              !!template._count?.services &&
                              template._count.services > 0
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </EnhancedCard>
        </MotionDiv>
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
    </MotionDiv>
  );
}
