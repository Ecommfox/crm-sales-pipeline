// src/pages/admin/index.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabaseClient } from "@/lib/supabaseClient";
import { useUserRole } from "@/hooks/use-user-role";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserProfileCard } from "@/components/user-profile-card";
import {
  BarChart3,
  AlertCircle,
  Users,
  Activity,
  Settings as SettingsIcon,
  TrendingUp,
  Clock,
  FileText,
} from "lucide-react";
import type { UserProfile, AuditLogEntry } from "@/types";

export default function AdminDashboardPage() {
  const router = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();

  const [stats, setStats] = useState({
    totalUsers: 0,
    adminCount: 0,
    managerCount: 0,
    teleoperatorCount: 0,
    viewerCount: 0,
    activeUserCount: 0,
  });

  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch data
  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      try {
        setError("");

        // Fetch user statistics
        const { data: users, error: userError } = await supabaseClient
          .from("user_profiles")
          .select("*");

        if (userError) throw userError;

        const userStats = {
          totalUsers: users?.length || 0,
          adminCount: users?.filter((u: UserProfile) => u.role === "admin").length || 0,
          managerCount: users?.filter((u: UserProfile) => u.role === "manager").length || 0,
          teleoperatorCount:
            users?.filter((u: UserProfile) => u.role === "teleoperator").length || 0,
          viewerCount: users?.filter((u: UserProfile) => u.role === "viewer").length || 0,
          activeUserCount:
            users?.filter((u: UserProfile) => u.is_active).length || 0,
        };

        setStats(userStats);

        // Fetch recent audit activity
        const { data: logs, error: logsError } = await supabaseClient
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (logsError) throw logsError;
        setRecentActivity(logs || []);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <div className="space-y-6 p-6"><UserProfileCard /></div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      description: "Registered system users",
    },
    {
      title: "Active Users",
      value: stats.activeUserCount,
      icon: Activity,
      color: "bg-green-50 text-green-600",
      description: "Currently active accounts",
    },
    {
      title: "Admins",
      value: stats.adminCount,
      icon: SettingsIcon,
      color: "bg-purple-50 text-purple-600",
      description: "Administrator accounts",
    },
    {
      title: "Managers",
      value: stats.managerCount,
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-600",
      description: "Manager level users",
    },
  ];

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-100 text-red-800",
      manager: "bg-blue-100 text-blue-800",
      teleoperator: "bg-green-100 text-green-800",
      viewer: "bg-gray-100 text-gray-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      create: "bg-green-100 text-green-800",
      update: "bg-blue-100 text-blue-800",
      delete: "bg-red-100 text-red-800",
      login: "bg-purple-100 text-purple-800",
      logout: "bg-gray-100 text-gray-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Admin Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            System overview and user management metrics
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "User Management", path: "/admin/users", icon: Users },
          { label: "Audit Logs", path: "/admin/audit-logs", icon: FileText },
          { label: "Admin Settings", path: "/admin/settings", icon: SettingsIcon },
          { label: "Dashboard", path: "/admin", icon: BarChart3 },
        ].map(({ label, path, icon: Icon }) => (
          <Button
            key={path}
            variant="outline"
            className="h-auto justify-start gap-3 p-4"
            onClick={() => router(path)}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Button>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* User Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>User Role Distribution</CardTitle>
          <CardDescription>Current breakdown of users by role</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-800">Admin</Badge>
                <span className="text-sm text-muted-foreground">
                  {stats.adminCount} user{stats.adminCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${stats.totalUsers > 0 ? (stats.adminCount / stats.totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">Manager</Badge>
                <span className="text-sm text-muted-foreground">
                  {stats.managerCount} user{stats.managerCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${stats.totalUsers > 0 ? (stats.managerCount / stats.totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">Teleoperator</Badge>
                <span className="text-sm text-muted-foreground">
                  {stats.teleoperatorCount} user{stats.teleoperatorCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${stats.totalUsers > 0 ? (stats.teleoperatorCount / stats.totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-800">Viewer</Badge>
                <span className="text-sm text-muted-foreground">
                  {stats.viewerCount} user{stats.viewerCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-500 h-2 rounded-full"
                  style={{
                    width: `${stats.totalUsers > 0 ? (stats.viewerCount / stats.totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system actions and changes</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router("/admin/audit-logs")}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            View All
          </Button>
        </CardHeader>

        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No recent activity</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {recentActivity.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.user_email || "System"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.resource_type || "unknown"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {log.details || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common admin tasks</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router("/admin/users")}
            >
              <Users className="h-4 w-4" />
              Manage Users
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router("/admin/settings")}
            >
              <SettingsIcon className="h-4 w-4" />
              System Settings
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router("/admin/audit-logs")}
            >
              <Activity className="h-4 w-4" />
              View Audit Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>💡 System Tip:</strong> Use the admin dashboard to monitor user activity,
            manage permissions, and configure system settings. All actions are logged for audit
            purposes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
