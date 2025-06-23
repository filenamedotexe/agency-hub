"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Search, Plus } from "lucide-react";

export default function StyleGuidePage() {
  const [inputValue, setInputValue] = useState("");
  const [selectValue, setSelectValue] = useState("");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Style Guide</h1>
        <p className="mt-2 text-gray-600">
          A comprehensive guide to our design system components
        </p>
      </div>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>Our brand and system colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-3 text-lg font-semibold">Brand Colors</h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <div className="mb-2 h-20 w-full rounded-md bg-brand-primary"></div>
                    <p className="text-sm font-medium">Primary</p>
                    <p className="text-xs text-gray-500">#4F46E5</p>
                  </div>
                  <div>
                    <div className="mb-2 h-20 w-full rounded-md bg-brand-success"></div>
                    <p className="text-sm font-medium">Success</p>
                    <p className="text-xs text-gray-500">#10B981</p>
                  </div>
                  <div>
                    <div className="mb-2 h-20 w-full rounded-md bg-brand-warning"></div>
                    <p className="text-sm font-medium">Warning</p>
                    <p className="text-xs text-gray-500">#F59E0B</p>
                  </div>
                  <div>
                    <div className="mb-2 h-20 w-full rounded-md bg-brand-error"></div>
                    <p className="text-sm font-medium">Error</p>
                    <p className="text-xs text-gray-500">#EF4444</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold">Gray Scale</h3>
                <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                    (shade) => (
                      <div key={shade}>
                        <div
                          className={`h-16 w-full bg-gray-${shade} mb-2 rounded-md border`}
                        ></div>
                        <p className="text-xs font-medium">Gray {shade}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Typography Scale</CardTitle>
              <CardDescription>Text styles and hierarchy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">Page Title (3xl, bold)</p>
                  <p className="text-xs text-gray-500">
                    text-3xl font-bold text-gray-900
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    Section Title (2xl, semibold)
                  </p>
                  <p className="text-xs text-gray-500">
                    text-2xl font-semibold text-gray-800
                  </p>
                </div>
                <div>
                  <p className="text-xl font-semibold">
                    Card Title (xl, semibold)
                  </p>
                  <p className="text-xs text-gray-500">
                    text-xl font-semibold text-gray-800
                  </p>
                </div>
                <div>
                  <p className="text-base">Body Text (base, normal)</p>
                  <p className="text-xs text-gray-500">
                    text-base font-normal text-gray-700
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Secondary Text (sm, normal)
                  </p>
                  <p className="text-xs text-gray-500">
                    text-sm font-normal text-gray-600
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Metadata (xs, normal)</p>
                  <p className="text-xs text-gray-500">
                    text-xs font-normal text-gray-500
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Button variants and states</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="link">Link Button</Button>
                <Button variant="destructive">Destructive</Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button disabled>Disabled</Button>
                <Button className="loading">Loading...</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cards</CardTitle>
              <CardDescription>Card component examples</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Simple Card</CardTitle>
                    <CardDescription>A basic card with content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      This is the card content area where you can place any
                      content.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Card with Footer</CardTitle>
                    <CardDescription>Including action buttons</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Cards can have footers for actions.
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      Cancel
                    </Button>
                    <Button size="sm">Save</Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tables</CardTitle>
              <CardDescription>Data table styling</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">John Doe</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Jane Smith</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Controls</CardTitle>
              <CardDescription>Input fields and form elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input-example">Text Input</Label>
                <Input
                  id="input-example"
                  placeholder="Enter some text..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="input-disabled">Disabled Input</Label>
                <Input
                  id="input-disabled"
                  placeholder="Disabled input"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="input-error">Input with Error</Label>
                <Input
                  id="input-error"
                  placeholder="Invalid input"
                  className="border-brand-error focus-visible:ring-brand-error"
                />
                <p className="text-sm text-brand-error">
                  This field is required
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textarea-example">Textarea</Label>
                <Textarea
                  id="textarea-example"
                  placeholder="Enter a longer description..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="select-example">Select</Label>
                <Select value={selectValue} onValueChange={setSelectValue}>
                  <SelectTrigger id="select-example">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                    <SelectItem value="option3">Option 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
              <CardDescription>
                Feedback and notification components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTitle>Default Alert</AlertTitle>
                <AlertDescription>
                  This is a default alert message for general information.
                </AlertDescription>
              </Alert>

              <Alert variant="success">
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  Your action was completed successfully.
                </AlertDescription>
              </Alert>

              <Alert variant="warning">
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Please review this important information.
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Something went wrong. Please try again.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loading States</CardTitle>
              <CardDescription>Skeleton and loading indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>

              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Empty States</CardTitle>
              <CardDescription>
                When there&apos;s no data to display
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="No documents found"
                description="Get started by creating your first document."
                action={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Document
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
