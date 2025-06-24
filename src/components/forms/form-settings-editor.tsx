"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormSettings } from "@/types/forms";

interface FormSettingsEditorProps {
  settings: FormSettings;
  onChange: (settings: FormSettings) => void;
}

export function FormSettingsEditor({
  settings,
  onChange,
}: FormSettingsEditorProps) {
  const updateSetting = (key: keyof FormSettings, value: string) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Configure webhook to send form submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              type="url"
              value={settings.webhookUrl || ""}
              onChange={(e) => updateSetting("webhookUrl", e.target.value)}
              placeholder="https://example.com/webhook"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              POST request will be sent with form data on submission
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form Behavior</CardTitle>
          <CardDescription>
            Configure what happens after form submission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="redirectUrl">Redirect URL</Label>
            <Input
              id="redirectUrl"
              type="url"
              value={settings.redirectUrl || ""}
              onChange={(e) => updateSetting("redirectUrl", e.target.value)}
              placeholder="https://example.com/thank-you"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              Redirect users to this URL after successful submission
            </p>
          </div>

          <div>
            <Label htmlFor="successMessage">Success Message</Label>
            <Input
              id="successMessage"
              value={settings.successMessage || ""}
              onChange={(e) => updateSetting("successMessage", e.target.value)}
              placeholder="Form submitted successfully!"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              Message shown to users after successful submission
            </p>
          </div>

          <div>
            <Label htmlFor="submitButtonText">Submit Button Text</Label>
            <Input
              id="submitButtonText"
              value={settings.submitButtonText || ""}
              onChange={(e) =>
                updateSetting("submitButtonText", e.target.value)
              }
              placeholder="Submit"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
