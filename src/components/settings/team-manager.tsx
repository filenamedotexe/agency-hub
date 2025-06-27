"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Edit, Mail, Shield } from "lucide-react";
import { MotionButton } from "@/components/ui/motion-button";
import { MotionListItem } from "@/components/ui/motion-elements";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { MotionBadge } from "@/components/ui/motion-elements";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  profileData?: {
    name?: string;
  };
}

const ROLES = [
  {
    value: "ADMIN",
    label: "Admin",
    description: "Full access to all features",
  },
  {
    value: "SERVICE_MANAGER",
    label: "Service Manager",
    description: "Manage services and clients",
  },
  {
    value: "COPYWRITER",
    label: "Copywriter",
    description: "Access to assigned services and tasks",
  },
  { value: "EDITOR", label: "Editor", description: "Edit and review content" },
  {
    value: "VA",
    label: "Virtual Assistant",
    description: "Support tasks and client communication",
  },
];

export function TeamManager() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    role: "COPYWRITER",
    name: "",
  });

  const { toast } = useToast();

  const fetchTeamMembers = useCallback(async () => {
    try {
      const response = await fetch("/api/settings/team");
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const handleAddMember = async () => {
    try {
      const response = await fetch("/api/settings/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to add team member");

      toast({
        title: "Success",
        description: "Team member added successfully",
      });

      setShowAddForm(false);
      setFormData({ email: "", role: "SERVICE_MANAGER", name: "" });
      fetchTeamMembers();
    } catch (error) {
      console.error("Error adding team member:", error);
      toast({
        title: "Error",
        description: "Failed to add team member",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;

    try {
      const response = await fetch(`/api/settings/team/${editingMember.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: formData.role }),
      });

      if (!response.ok) throw new Error("Failed to update team member");

      toast({
        title: "Success",
        description: "Team member updated successfully",
      });

      setShowAddForm(false);
      setEditingMember(null);
      fetchTeamMembers();
    } catch (error) {
      console.error("Error updating team member:", error);
      toast({
        title: "Error",
        description: "Failed to update team member",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      const response = await fetch(`/api/settings/team/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete team member");

      toast({
        title: "Success",
        description: "Team member removed successfully",
      });

      setDeleteMemberId(null);
      fetchTeamMembers();
    } catch (error) {
      console.error("Error deleting team member:", error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="py-4 text-center">Loading team members...</div>;
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "SERVICE_MANAGER":
        return "default";
      case "CLIENT":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      {/* Team Members List */}
      <div className="space-y-2">
        {teamMembers.map((member, index) => (
          <MotionListItem
            key={member.id}
            index={index}
            className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3 sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {member.profileData?.name || member.email.split("@")[0]}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {member.email}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <MotionBadge variant={getRoleBadgeVariant(member.role)}>
                    {ROLES.find((r) => r.value === member.role)?.label ||
                      member.role}
                  </MotionBadge>
                  <span className="text-xs text-muted-foreground">
                    Added {new Date(member.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
              <MotionButton
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingMember(member);
                  setFormData({
                    email: member.email,
                    role: member.role,
                    name:
                      member.profileData?.name || member.email.split("@")[0],
                  });
                  setShowAddForm(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </MotionButton>
              <MotionButton
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => setDeleteMemberId(member.id)}
              >
                <Trash2 className="h-4 w-4" />
              </MotionButton>
            </div>
          </MotionListItem>
        ))}
      </div>

      <MotionButton
        onClick={() => setShowAddForm(true)}
        className="w-full sm:w-auto"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Team Member
      </MotionButton>

      {/* Add Member Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Edit Team Member" : "Add Team Member"}
            </DialogTitle>
            <DialogDescription>
              {editingMember
                ? "Update team member role and information"
                : "Invite a new member to your team"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="member@example.com"
                disabled={!!editingMember}
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <p>{role.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <MotionButton
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setEditingMember(null);
                setFormData({ email: "", role: "COPYWRITER", name: "" });
              }}
            >
              Cancel
            </MotionButton>
            <MotionButton
              onClick={editingMember ? handleUpdateMember : handleAddMember}
            >
              {editingMember ? "Update Member" : "Add Member"}
            </MotionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteMemberId}
        onOpenChange={() => setDeleteMemberId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member? They will lose
              access to the system immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteMemberId && handleDeleteMember(deleteMemberId)
              }
              className="bg-destructive text-destructive-foreground"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
