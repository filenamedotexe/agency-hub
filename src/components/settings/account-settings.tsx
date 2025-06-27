"use client";

import { useState } from "react";
import { Save, User, Mail, Building } from "lucide-react";
import { MotionButton } from "@/components/ui/motion-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export function AccountSettings() {
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState({
    businessName: "Agency Hub",
    email: "admin@agencyhub.com",
    phone: "+1 (555) 123-4567",
    address: "123 Business Ave, Suite 100",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "United States",
    timezone: "America/New_York",
    description:
      "Full-service digital marketing agency specializing in web design, SEO, and social media marketing.",
  });

  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      // In production, this would call an API endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Success",
        description: "Account settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update account settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Business Information */}
      <div>
        <h3 className="text-lg font-medium">Business Information</h3>
        <p className="text-sm text-muted-foreground">
          Update your business details and contact information
        </p>
      </div>

      <Separator />

      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="businessName">Business Name</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="businessName"
                value={accountData.businessName}
                onChange={(e) =>
                  setAccountData({
                    ...accountData,
                    businessName: e.target.value,
                  })
                }
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={accountData.email}
                onChange={(e) =>
                  setAccountData({ ...accountData, email: e.target.value })
                }
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={accountData.phone}
              onChange={(e) =>
                setAccountData({ ...accountData, phone: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={accountData.timezone}
              onChange={(e) =>
                setAccountData({ ...accountData, timezone: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            value={accountData.address}
            onChange={(e) =>
              setAccountData({ ...accountData, address: e.target.value })
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={accountData.city}
              onChange={(e) =>
                setAccountData({ ...accountData, city: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={accountData.state}
              onChange={(e) =>
                setAccountData({ ...accountData, state: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="zipCode">ZIP/Postal Code</Label>
            <Input
              id="zipCode"
              value={accountData.zipCode}
              onChange={(e) =>
                setAccountData({ ...accountData, zipCode: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Business Description</Label>
          <Textarea
            id="description"
            value={accountData.description}
            onChange={(e) =>
              setAccountData({ ...accountData, description: e.target.value })
            }
            rows={4}
            placeholder="Describe your business..."
          />
        </div>
      </div>

      <Separator />

      {/* Additional Settings */}
      <div>
        <h3 className="mb-4 text-lg font-medium">Additional Settings</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your account
              </p>
            </div>
            <MotionButton variant="outline" size="sm">
              Configure
            </MotionButton>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Data Export</p>
              <p className="text-sm text-muted-foreground">
                Download all your data in CSV format
              </p>
            </div>
            <MotionButton variant="outline" size="sm">
              Export Data
            </MotionButton>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Account Security</p>
              <p className="text-sm text-muted-foreground">
                Manage password and security settings
              </p>
            </div>
            <MotionButton variant="outline" size="sm">
              Security Settings
            </MotionButton>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <MotionButton onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Changes"}
        </MotionButton>
      </div>
    </div>
  );
}
