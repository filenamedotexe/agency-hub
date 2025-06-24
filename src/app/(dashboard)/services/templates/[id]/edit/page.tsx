"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, FileText, CheckSquare, X, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  name: z.string().min(1, "Template name is required").max(255),
  type: z.enum(["GOOGLE_ADS", "FACEBOOK_ADS", "WEBSITE_DESIGN"], {
    required_error: "Please select a service type",
  }),
  price: z
    .string()
    .transform((val) => {
      if (!val) return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    })
    .nullable()
    .optional(),
  defaultTasks: z
    .array(
      z.object({
        name: z.string().min(1, "Task name is required"),
        description: z.string().optional(),
        clientVisible: z.boolean().default(false),
        checklist: z
          .array(
            z.object({
              id: z.string(),
              text: z.string(),
              completed: z.boolean().default(false),
            })
          )
          .optional(),
      })
    )
    .min(1, "At least one task is required"),
  requiredForms: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditServiceTemplatePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [forms, setForms] = useState<any[]>([]);
  const [editingChecklistItem, setEditingChecklistItem] = useState<{
    taskIndex: number;
    checklistIndex: number;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templateResponse, formsResponse] = await Promise.all([
          fetch(`/api/service-templates/${params.id}`),
          fetch("/api/forms"),
        ]);

        if (!templateResponse.ok) throw new Error("Failed to fetch template");
        if (!formsResponse.ok) throw new Error("Failed to fetch forms");

        const template = await templateResponse.json();
        const formsData = await formsResponse.json();

        setForms(formsData || []);

        form.reset({
          name: template.name,
          type: template.type,
          price: template.price?.toString() || "",
          defaultTasks: template.defaultTasks,
          requiredForms: template.requiredForms || [],
        });
      } catch (error) {
        toast.error("Failed to load template");
        router.push("/services");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, form, router]);

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      // Filter out empty checklist items before submission
      const cleanedData = {
        ...data,
        defaultTasks: data.defaultTasks.map((task) => ({
          ...task,
          checklist:
            task.checklist?.filter((item) => item.text.trim() !== "") || [],
        })),
      };

      const response = await fetch(`/api/service-templates/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update template");
      }

      toast.success("Service template updated");
      router.push("/services");
    } catch (error: any) {
      toast.error(error.message || "Failed to update template");
    } finally {
      setSubmitting(false);
    }
  };

  const addTask = () => {
    const currentTasks = form.getValues("defaultTasks");
    form.setValue("defaultTasks", [
      ...currentTasks,
      { name: "", description: "", clientVisible: false, checklist: [] },
    ]);
  };

  const removeTask = (index: number) => {
    const currentTasks = form.getValues("defaultTasks");
    form.setValue(
      "defaultTasks",
      currentTasks.filter((_, i) => i !== index)
    );
  };

  const addChecklistItem = (taskIndex: number) => {
    const currentTasks = form.getValues("defaultTasks");
    const task = currentTasks[taskIndex];
    const newChecklistItem = {
      id: crypto.randomUUID(),
      text: "",
      completed: false,
    };

    const updatedTask = {
      ...task,
      checklist: [...(task.checklist || []), newChecklistItem],
    };

    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = updatedTask;
    form.setValue("defaultTasks", updatedTasks);
  };

  const removeChecklistItem = (taskIndex: number, checklistIndex: number) => {
    const currentTasks = form.getValues("defaultTasks");
    const task = currentTasks[taskIndex];

    const updatedTask = {
      ...task,
      checklist: task.checklist?.filter((_, i) => i !== checklistIndex) || [],
    };

    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = updatedTask;
    form.setValue("defaultTasks", updatedTasks);
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Service Template
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Update the service template details and tasks
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>
                Basic information about the service template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Google Ads Campaign Setup"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
                        <SelectItem value="FACEBOOK_ADS">
                          Facebook Ads
                        </SelectItem>
                        <SelectItem value="WEBSITE_DESIGN">
                          Website Design
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-8"
                          {...field}
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Default price for this service
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Default Tasks</CardTitle>
                  <CardDescription>
                    Tasks that will be created when this service is assigned
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTask}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {form.watch("defaultTasks")?.map((_, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-4">
                          <FormField
                            control={form.control}
                            name={`defaultTasks.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Task Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Set up campaign structure"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`defaultTasks.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Detailed description of the task..."
                                    rows={3}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`defaultTasks.${index}.clientVisible`}
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Client Visible
                                  </FormLabel>
                                  <FormDescription>
                                    Allow clients to see this task
                                    {form.watch(
                                      `defaultTasks.${index}.checklist`
                                    )?.length > 0 && (
                                      <span className="mt-1 block text-xs text-orange-600">
                                        Note: Checklists are never visible to
                                        clients
                                      </span>
                                    )}
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {/* Checklist Section */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <FormLabel className="flex items-center gap-2 text-base">
                                  <CheckSquare className="h-4 w-4" />
                                  Internal Checklist
                                </FormLabel>
                                <FormDescription>
                                  Private checklist items for task completion
                                  (not visible to clients)
                                </FormDescription>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addChecklistItem(index)}
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Add Item
                              </Button>
                            </div>

                            {form
                              .watch(`defaultTasks.${index}.checklist`)
                              ?.map((item, checklistIndex) => {
                                const isEditing =
                                  editingChecklistItem?.taskIndex === index &&
                                  editingChecklistItem?.checklistIndex ===
                                    checklistIndex;

                                return (
                                  <div
                                    key={checklistIndex}
                                    className="flex items-center gap-2 rounded-md bg-gray-50 p-2"
                                  >
                                    {isEditing ? (
                                      <FormField
                                        control={form.control}
                                        name={`defaultTasks.${index}.checklist.${checklistIndex}.text`}
                                        render={({ field }) => (
                                          <FormItem className="flex-1">
                                            <FormControl>
                                              <Input
                                                placeholder="e.g., Verify campaign settings"
                                                {...field}
                                                className="bg-white"
                                                autoFocus
                                                onBlur={() =>
                                                  setEditingChecklistItem(null)
                                                }
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") {
                                                    setEditingChecklistItem(
                                                      null
                                                    );
                                                  }
                                                  if (e.key === "Escape") {
                                                    setEditingChecklistItem(
                                                      null
                                                    );
                                                  }
                                                }}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    ) : (
                                      <div className="flex flex-1 items-center gap-2">
                                        <span className="text-sm">
                                          {item.text ||
                                            "Click edit to add text"}
                                        </span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-gray-500 hover:text-gray-700"
                                          onClick={() =>
                                            setEditingChecklistItem({
                                              taskIndex: index,
                                              checklistIndex,
                                            })
                                          }
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-600 hover:text-red-700"
                                      onClick={() =>
                                        removeChecklistItem(
                                          index,
                                          checklistIndex
                                        )
                                      }
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {form.watch("defaultTasks")?.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => removeTask(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Required Forms
              </CardTitle>
              <CardDescription>
                Forms that clients must complete when this service is assigned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="requiredForms"
                render={() => (
                  <FormItem>
                    <div className="space-y-3">
                      {forms.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No forms available. Create forms first to assign them
                          to this service.
                        </p>
                      ) : (
                        forms.map((formItem) => (
                          <FormField
                            key={formItem.id}
                            control={form.control}
                            name="requiredForms"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={formItem.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(
                                        formItem.id
                                      )}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...field.value,
                                              formItem.id,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== formItem.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm font-normal">
                                      {formItem.name}
                                    </FormLabel>
                                    {formItem.description && (
                                      <FormDescription className="text-xs">
                                        {formItem.description}
                                      </FormDescription>
                                    )}
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href="/services">Cancel</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update Template"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
