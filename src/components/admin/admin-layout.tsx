// src/components/admin/admin-layout.tsx
import { useEffect, useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import { useUserRole } from "@/hooks/use-user-role";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Lock, Users, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdminLayoutProps {
  children?: ReactNode;
  showTabs?: boolean;
}

export function AdminLayout({ children, showTabs = true }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [currentTab, setCurrentTab] = useState("users");

  // Redirect if not admin
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, roleLoading, navigate]);

  // Determine active tab based on current route
  useEffect(() => {
    if (location.pathname.includes("/admin/audit-logs")) {
      setCurrentTab("audit-logs");
    } else if (location.pathname.includes("/admin/settings")) {
      setCurrentTab("settings");
    } else {
      setCurrentTab("users");
    }
  }, [location.pathname]);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6 p-6 max-w-2xl mx-auto mt-12">
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page. Admin access required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    switch (tab) {
      case "users":
        navigate("/admin/users");
        break;
      case "audit-logs":
        navigate("/admin/audit-logs");
        break;
      case "settings":
        navigate("/admin/settings");
        break;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              System management and configuration
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      {showTabs && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Settings</CardTitle>
            <CardDescription>Manage your system</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={currentTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger
                  value="audit-logs"
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Audit Logs
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-6">
                {children}
              </TabsContent>

              <TabsContent value="audit-logs" className="mt-6">
                {/* Audit logs content will be handled by route */}
                {children}
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
                <div className="space-y-6">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <p className="text-sm text-blue-900">
                        <strong>ℹ️ Settings Page:</strong> Additional system
                        configurations coming soon.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {!showTabs && children}
    </div>
  );
}
