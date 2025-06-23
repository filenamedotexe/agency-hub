"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
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

const formSchema = z.object({
  name: z.string().min(1, "Template name is required").max(255),
  type: z.enum(["GOOGLE_ADS", "FACEBOOK_ADS", "WEBSITE_DESIGN"], {
    required_error: "Please select a service type",
  }),
  price: z
    .string()
    .transform((val) => {
      if (!val) return undefined;
      const num = parseFloat(val);
      return isNaN(num) ? undefined : num;
    })
    .optional(),
  defaultTasks: z
    .array(
      z.object({
        name: z.string().min(1, "Task name is required"),
        description: z.string().optional(),
        clientVisible: z.boolean().default(false),
      })
    )
    .min(1, "At least one task is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewServiceTemplatePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      defaultTasks: [{ name: "", description: "", clientVisible: false }],
    },
  });

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/service-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create template");
      }

      toast.success("Service template created");
      router.push("/services");
    } catch (error: any) {
      toast.error(error.message || "Failed to create template");
    } finally {
      setSubmitting(false);
    }
  };

  const addTask = () => {
    const currentTasks = form.getValues("defaultTasks");
    form.setValue("defaultTasks", [
      ...currentTasks,
      { name: "", description: "", clientVisible: false },
    ]);
  };

  const removeTask = (index: number) => {
    const currentTasks = form.getValues("defaultTasks");
    form.setValue(
      "defaultTasks",
      currentTasks.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Create Service Template
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a reusable template for services you offer to clients
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                {form.watch("defaultTasks").map((_, index) => (
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
                        </div>

                        {form.watch("defaultTasks").length > 1 && (
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

          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href="/services">Cancel</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
