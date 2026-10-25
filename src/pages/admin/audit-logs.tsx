// src/pages/admin/audit-logs.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabaseClient } from "@/lib/supabaseClient";
import { useUserRole } from "@/hooks/use-user-role";
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
import { AlertCircle, FileText, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditLogEntry } from "@/types";

export default function AuditLogsPage() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterResource, setFilterResource] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, roleLoading, navigate]);

  // Fetch audit logs
  useEffect(() => {
    if (!isAdmin) return;

    const fetchLogs = async () => {
      try {
        setError("");
        const { data, error: fetchError } = await supabaseClient
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);

        if (fetchError) throw fetchError;
        setLogs(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load audit logs");
        console.error("Error fetching audit logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [isAdmin]);

  // Filter logs based on criteria
  const filteredLogs = logs.filter((log) => {
    if (searchUser && !log.user_email?.toLowerCase().includes(searchUser.toLowerCase())) {
      return false;
    }
    if (filterAction && log.action !== filterAction) {
      return false;
    }
    if (filterResource && log.resource_type !== filterResource) {
      return false;
    }
    if (dateFrom) {
      const logDate = new Date(log.created_at);
      const fromDate = new Date(dateFrom);
      if (logDate < fromDate) {
        return false;
      }
    }
    if (dateTo) {
      const logDate = new Date(log.created_at);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (logDate > toDate) {
        return false;
      }
    }
    return true;
  });

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <p className="text-muted-foreground">Loading audit logs...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6 p-6 max-w-2xl mx-auto mt-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page. Admin access required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const actionColorMap: Record<string, string> = {
    create: "bg-green-100 text-green-800",
    update: "bg-blue-100 text-blue-800",
    delete: "bg-red-100 text-red-800",
    login: "bg-purple-100 text-purple-800",
    logout: "bg-gray-100 text-gray-800",
  };

  const resourceIcons: Record<string, string> = {
    user: "👤",
    lead: "📞",
    company: "🏢",
    contact: "📧",
    appointment: "📅",
    call: "☎️",
  };

  const allActions = [...new Set(logs.map((l) => l.action))].sort() as string[];
  const allResources = [...new Set(logs.map((l) => l.resource_type).filter(Boolean))].sort() as string[];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Audit Logs
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Recent system activity and changes
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Search by User Email
              </label>
              <Input
                className="mt-4"
                placeholder="e.g., admin@example.com"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Action Type
                </label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Actions</SelectItem>
                    {allActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Resource Type
                </label>
                <Select value={filterResource} onValueChange={setFilterResource}>
                  <SelectTrigger>
                    <SelectValue placeholder="All resources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Resources</SelectItem>
                    {allResources.map((resource) => (
                      <SelectItem key={resource} value={resource}>
                        {(resource?.charAt(0).toUpperCase() || "") +
                          (resource?.slice(1) || "")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  From Date
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  To Date
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {(searchUser || filterAction || filterResource || dateFrom || dateTo) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchUser("");
                  setFilterAction("");
                  setFilterResource("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Activity Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Activity Log ({filteredLogs.length} entries)
          </CardTitle>
        </CardHeader>

        <CardContent>
          {filteredLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {logs.length === 0
                ? "No audit logs found"
                : "No logs match your filters"}
            </p>
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
                  {filteredLogs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.user_email || "System"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            actionColorMap[log.action] || "bg-gray-100 text-gray-800"
                          }
                        >
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {(log.resource_type &&
                            resourceIcons[log.resource_type]) ||
                            "📋"}{" "}
                          {log.resource_type || "unknown"}
                        </span>
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

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>💡 Info:</strong> Audit logs track all user actions and
            system changes for security and compliance purposes. Logs are
            retained for 90 days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
