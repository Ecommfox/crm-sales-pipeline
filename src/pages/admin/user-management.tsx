// src/pages/admin/user-management.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabaseClient } from "@/lib/supabaseClient";
import { useUserRole } from "@/hooks/use-user-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, AlertCircle, Edit2, Copy, CheckCircle, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserDetailModal } from "@/components/admin/user-detail-modal";
import { logUserRoleChange, logUserStatusChange } from "@/lib/auditLogger";
import { createInvitation, generateInvitationLink, getPendingInvitations } from "@/lib/invitationService";
import type { UserProfile, UserRole, PendingInvitation } from "@/types";

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("teleoperator");
  const [inviting, setInviting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);

  // Redirect if not admin
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, roleLoading, navigate]);

  // Fetch users
  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      try {
        setError("");
        const { data, error: fetchError } = await supabaseClient
          .from("user_profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setUsers(data || []);

        // Fetch pending invitations
        const invitations = await getPendingInvitations();
        setPendingInvitations(invitations);
      } catch (err: any) {
        setError(err.message || "Failed to load users");
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      // Find the old role for audit logging
      const oldUser = users.find((u) => u.id === userId);
      const oldRole = oldUser?.role || "viewer";

      const { error } = await supabaseClient
        .from("user_profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      // Log the role change
      await logUserRoleChange(userId, oldUser?.email || "", oldRole, newRole);

      // Refresh list
      const { data } = await supabaseClient
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to update user role");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const oldUser = users.find((u) => u.id === userId);

      const { error } = await supabaseClient
        .from("user_profiles")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      // Log the status change
      await logUserStatusChange(userId, oldUser?.email || "", currentStatus, !currentStatus);

      // Refresh list
      const { data } = await supabaseClient
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to update user status");
    }
  };

  const inviteUser = async () => {
    try {
      setError("");
      setInviting(true);

      if (!inviteEmail || !inviteEmail.includes("@")) {
        setError("Please enter a valid email address");
        setInviting(false);
        return;
      }

      // Get current user for logging
      const { data: userData } = await supabaseClient.auth.getUser();
      const currentUserEmail = userData.user?.email || "unknown";

      // Create invitation
      const invitation = await createInvitation(inviteEmail, inviteRole, currentUserEmail);

      if (!invitation) {
        throw new Error("Failed to create invitation");
      }

      // Generate shareable link
      const link = generateInvitationLink(invitation.token);
      setGeneratedLink(link);

      // Refresh pending invitations list
      const updatedInvitations = await getPendingInvitations();
      setPendingInvitations(updatedInvitations);

      // Reset form but keep dialog open to show the link
      setInviteEmail("");
      setInviteRole("teleoperator");
    } catch (err: any) {
      setError(err.message || "Failed to send invitation");
      console.error("Error inviting user:", err);
    } finally {
      setInviting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const roleConfig: Record<UserRole, { label: string; className: string }> = {
    admin: { label: "Admin", className: "bg-red-100 text-red-800" },
    manager: { label: "Manager", className: "bg-blue-100 text-blue-800" },
    teleoperator: { label: "Teleoperator", className: "bg-green-100 text-green-800" },
    viewer: { label: "Viewer", className: "bg-gray-100 text-gray-800" },
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = (updatedUser: UserProfile) => {
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage team members and their roles
          </p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation link to a new team member
              </DialogDescription>
            </DialogHeader>

            {!generatedLink ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={inviting}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(value) => setInviteRole(value as UserRole)}
                    disabled={inviting}
                  >
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
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsInviteDialogOpen(false)}
                    disabled={inviting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={inviteUser} disabled={!inviteEmail || inviting}>
                    {inviting ? "Sending..." : "Send Invite"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Invitation sent! Share the link below with the user.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label>Invitation Link</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={generatedLink}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                      }}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Link expires in 7 days
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    setIsInviteDialogOpen(false);
                    setGeneratedLink(null);
                  }}
                >
                  Done
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {pendingInvitations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Pending Invitations ({pendingInvitations.length})</CardTitle>
            <p className="text-sm text-muted-foreground">
              Users who have been invited but haven't signed up yet
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 bg-white rounded border border-blue-100"
                >
                  <div>
                    <p className="font-medium text-sm">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited as <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {invitation.role}
                      </Badge>
                      {" "} • Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
          <p className="text-sm text-muted-foreground">
            Users appear here after they sign up. Assign roles to control their access level.
          </p>
          <div className="mt-4">
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>
        </CardHeader>

        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(newRole) =>
                            updateUserRole(user.id, newRole as UserRole)
                          }
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="teleoperator">Teleoperator</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                          className="h-7 px-2"
                        >
                          <Badge
                            className={
                              user.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="gap-2 h-8"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}
