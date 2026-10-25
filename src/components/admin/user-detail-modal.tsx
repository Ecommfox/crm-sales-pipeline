// src/components/admin/user-detail-modal.tsx
import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logUserProfileUpdate, logUserRoleChange } from "@/lib/auditLogger";
import type { UserProfile, UserRole } from "@/types";

interface UserDetailModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedUser: UserProfile) => void;
}

export function UserDetailModal({
  user,
  isOpen,
  onClose,
  onSave,
}: UserDetailModalProps) {
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setDepartment(user.department || "");
      setRole(user.role);
      setIsActive(user.is_active);
      setError("");
    }
  }, [user, isOpen]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const { error: updateError } = await supabaseClient
        .from("user_profiles")
        .update({
          full_name: fullName,
          department,
          role,
          is_active: isActive,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Track what changed for audit logging
      const changes: Record<string, { old: any; new: any }> = {};
      if (user.full_name !== fullName) {
        changes["full_name"] = { old: user.full_name || "N/A", new: fullName };
      }
      if (user.department !== department) {
        changes["department"] = { old: user.department || "N/A", new: department };
      }
      if (user.is_active !== isActive) {
        changes["is_active"] = { old: user.is_active, new: isActive };
      }

      // Log role change separately if it changed
      if (user.role !== role) {
        await logUserRoleChange(user.id, user.email, user.role, role);
      }

      // Log other profile changes
      if (Object.keys(changes).length > 0) {
        await logUserProfileUpdate(user.id, user.email, changes);
      }

      // Call onSave callback with updated user
      if (onSave) {
        onSave({
          ...user,
          full_name: fullName,
          department,
          role,
          is_active: isActive,
        });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update user");
      console.error("Error updating user:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User Details</DialogTitle>
          <DialogDescription>
            Update user information and role assignments
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ""}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., Sales, Marketing"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="teleoperator">Teleoperator</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={isActive ? "active" : "inactive"}
              onValueChange={(value) => setIsActive(value === "active")}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
