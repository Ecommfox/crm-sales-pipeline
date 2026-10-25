import { useState, useMemo } from "react";
import { useList } from "@refinedev/core";
import { Lead, CallLog, Appointment } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
} from "recharts";
import { Calendar, Filter } from "lucide-react";

// Helper to initialize default date range (last 90 days)
function getDefaultDateRange() {
  const now = new Date();
  const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
  };
}

export default function AnalyticsPage() {
  const { result: leadsResult } = useList<Lead>({ resource: "leads", pagination: { pageSize: 1000 } });
  const { result: callLogsResult } = useList<CallLog>({ resource: "callLogs", pagination: { pageSize: 5000 } });
  const { result: appointmentsResult } = useList<Appointment>({ resource: "appointments", pagination: { pageSize: 500 } });

  const leads = leadsResult?.data ?? [];
  const callLogs = callLogsResult?.data ?? [];
  const appointments = appointmentsResult?.data ?? [];

  const defaultRange = getDefaultDateRange();
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);

  // ─── Filter data by date range ─────────────────────────────────────────────

  const filteredCallLogs = useMemo(
    () =>
      callLogs.filter((log) => {
        const logDate = new Date(log.date).toISOString().split("T")[0];
        return logDate >= fromDate && logDate <= toDate;
      }),
    [callLogs, fromDate, toDate]
  );

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((apt) => {
        // Handle both YYYY-MM-DD and ISO datetime formats
        const dateString = apt.appointmentDate?.split("T")[0];
        if (!dateString) return false;
        return dateString >= fromDate && dateString <= toDate;
      }),
    [appointments, fromDate, toDate]
  );

  // ─── Calls Over Time ──────────────────────────────────────────────────────

  const callsOverTime = useMemo(() => {
    const data: Record<string, number> = {};
    filteredCallLogs.forEach((log) => {
      const date = new Date(log.date).toISOString().split("T")[0];
      data[date] = (data[date] || 0) + 1;
    });
    return Object.entries(data)
      .sort()
      .map(([date, count]) => ({ date, appels: count }));
  }, [filteredCallLogs]);

  // ─── Lead Stage Transitions ───────────────────────────────────────────────

  const stageTransitions = useMemo(() => {
    const data: Record<string, number> = {
      none: 0,
      "pre-qualified": 0,
      qualified: 0,
      "pre-scheduled": 0,
      confirmed: 0,
    };

    filteredCallLogs.forEach((log) => {
      data[log.leadStatusAfter]++;
    });

    return [
      { stage: "Aucun", count: data.none },
      { stage: "Pré-qualifié", count: data["pre-qualified"] },
      { stage: "Qualifié", count: data.qualified },
      { stage: "Pré-planifié", count: data["pre-scheduled"] },
      { stage: "Confirmé", count: data.confirmed },
    ];
  }, [filteredCallLogs]);

  // ─── Appointment Conversion Funnel ────────────────────────────────────────

  const conversionFunnel = useMemo(() => {
    const qualifiedCount = leads.filter((l) => l.stage === "qualified").length;
    const preScheduledCount = leads.filter((l) => l.stage === "pre-scheduled").length;
    const confirmedCount = leads.filter((l) => l.stage === "confirmed").length;
    const confirmedAppointments = filteredAppointments.filter((a) => a.finalStatus === "Confirmé").length;

    return [
      { name: "Qualifiés", value: qualifiedCount, fill: "#3b82f6" },
      { name: "Pré-planifiés", value: preScheduledCount, fill: "#06b6d4" },
      { name: "Confirmés", value: confirmedCount, fill: "#10b981" },
      { name: "RDV confirmés", value: confirmedAppointments, fill: "#22c55e" },
    ];
  }, [leads, filteredAppointments]);

  // ─── Call Result Distribution ─────────────────────────────────────────────

  const callResultDistribution = useMemo(() => {
    const data: Record<string, number> = {};
    filteredCallLogs.forEach((log) => {
      data[log.callResult] = (data[log.callResult] || 0) + 1;
    });
    return Object.entries(data)
      .map(([result, count]) => ({ name: result, value: count }));
  }, [filteredCallLogs]);

  const COLORS = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#06b6d4",
    "#22c55e",
    "#3b82f6",
    "#a855f7",
  ];

  // ─── Appointment Status Summary ────────────────────────────────────────────

  const appointmentSummary = useMemo(() => {
    const confirmed = filteredAppointments.filter((a) => a.finalStatus === "Confirmé").length;
    const lost = filteredAppointments.filter((a) => a.finalStatus === "Perdu").length;
    const planned = filteredAppointments.filter((a) => !a.finalStatus || a.finalStatus === "Planifié").length;

    return [
      { name: "Confirmé", value: confirmed, fill: "#10b981" },
      { name: "Perdu", value: lost, fill: "#ef4444" },
      { name: "Planifié", value: planned, fill: "#3b82f6" },
    ];
  }, [filteredAppointments]);

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Graphiques et métriques de performance sur la période sélectionnée.</p>
      </div>

      {/* ─── Date Filters ─── */}
      <div className="flex gap-4 items-end bg-white border rounded-lg p-4">
        <div className="space-y-2">
          <Label>Du</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Au</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setFromDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
            setToDate(new Date().toISOString().split("T")[0]);
          }}
        >
          90 derniers jours
        </Button>
      </div>

      {/* ─── Row 1: Calls Over Time ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appels au fil du temps</CardTitle>
          <CardDescription>Nombre d'appels par jour</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={callsOverTime}>
              <defs>
                <linearGradient id="colorAppels" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="appels"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorAppels)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ─── Row 2: Stage Transitions & Call Result Distribution ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transitions de Stade</CardTitle>
            <CardDescription>Leads ayant transitionné par stade</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stageTransitions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Résultats d'Appels</CardTitle>
            <CardDescription>Distribution des résultats d'appels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={callResultDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                  dataKey="value"
                >
                  {callResultDistribution.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ─── Row 3: Conversion Funnel & Appointment Status ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funnel de Conversion</CardTitle>
            <CardDescription>Progression du lead à RDV confirmé</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statut des Rendez-vous</CardTitle>
            <CardDescription>Distribution des statuts RDV</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentSummary}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                  dataKey="value"
                >
                  {appointmentSummary.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ─── Summary Stats ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Appels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCallLogs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Sur la période</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">RDV Planifiés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAppointments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Rendez-vous</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux Confirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAppointments.length > 0
                ? Math.round((filteredAppointments.filter((a) => a.finalStatus === "Confirmé").length / filteredAppointments.length) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">RDV confirmés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Appels/Jour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                filteredCallLogs.length /
                  Math.max(
                    1,
                    (new Date(toDate).getTime() - new Date(fromDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Moyenne</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
