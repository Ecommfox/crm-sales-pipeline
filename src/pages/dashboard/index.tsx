import { useMemo } from "react";
import { useList } from "@refinedev/core";
import { Lead, CallLog, Appointment } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Phone, Target, CheckCircle2, Clock } from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  none: "Aucun",
  "pre-qualified": "Pré-qualifié",
  qualified: "Qualifié",
  "pre-scheduled": "Pré-planifié",
  confirmed: "Confirmé",
};

const STAGE_COLORS: Record<string, string> = {
  none: "#ef4444",
  "pre-qualified": "#f97316",
  qualified: "#eab308",
  "pre-scheduled": "#06b6d4",
  confirmed: "#22c55e",
};

interface KPICard {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
}

export default function DashboardPage() {
  const { result: leadsResult } = useList<Lead>({ resource: "leads", pagination: { pageSize: 1000 } });
  const { result: callLogsResult } = useList<CallLog>({ resource: "callLogs", pagination: { pageSize: 5000 } });
  const { result: appointmentsResult } = useList<Appointment>({ resource: "appointments", pagination: { pageSize: 500 } });

  const leads = leadsResult?.data ?? [];
  const callLogs = callLogsResult?.data ?? [];
  const appointments = appointmentsResult?.data ?? [];

  // ─── Calculate KPIs ───────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalLeads = leads.length;
    const todaysCalls = callLogs.filter((log) => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    }).length;

    const qualifiedLeads = leads.filter((l) => l.stage === "qualified").length;
    const confirmedLeads = leads.filter((l) => l.stage === "confirmed").length;
    const preScheduledLeads = leads.filter((l) => l.stage === "pre-scheduled").length;

    const qualificationRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;
    const appointmentConfirmationRate =
      appointments.length > 0
        ? Math.round(
            (appointments.filter((a) => a.finalStatus === "Confirmé").length / appointments.length) * 100
          )
        : 0;

    const avgCallDuration = 0; // Would need call duration data

    return {
      totalLeads,
      todaysCalls,
      qualifiedLeads,
      confirmedLeads,
      preScheduledLeads,
      qualificationRate,
      appointmentConfirmationRate,
      avgCallDuration,
    };
  }, [leads, callLogs, appointments]);

  // ─── Pipeline Funnel Data ─────────────────────────────────────────────────

  const funnelData = useMemo(() => {
    const stages = [
      { name: "Tous les leads", value: leads.length, stage: "all" },
      { name: "Pré-qualifiés", value: leads.filter((l) => l.stage === "pre-qualified").length, stage: "pre-qualified" },
      { name: "Qualifiés", value: leads.filter((l) => l.stage === "qualified").length, stage: "qualified" },
      { name: "Pré-planifiés", value: leads.filter((l) => l.stage === "pre-scheduled").length, stage: "pre-scheduled" },
      { name: "Confirmés", value: leads.filter((l) => l.stage === "confirmed").length, stage: "confirmed" },
    ];
    return stages;
  }, [leads]);

  // ─── Per-Operator Performance ─────────────────────────────────────────────

  const operatorPerformance = useMemo(() => {
    const operators: Record<
      string,
      { calls: number; leadsQualified: number; appointmentsBooked: number }
    > = {};

    // Count calls per operator
    callLogs.forEach((log) => {
      if (!operators[log.teleoperator]) {
        operators[log.teleoperator] = { calls: 0, leadsQualified: 0, appointmentsBooked: 0 };
      }
      operators[log.teleoperator].calls += 1;

      // Count qualifications (calls that led to qualified stage)
      if (log.leadStatusAfter === "qualified") {
        operators[log.teleoperator].leadsQualified += 1;
      }
    });

    // Count appointments per operator (using mainContactId's company's first contact as link)
    appointments.forEach((apt) => {
      const lead = leads.find((l) => l.id === apt.leadId);
      if (lead && lead.teleoperateurAppel) {
        if (!operators[lead.teleoperateurAppel]) {
          operators[lead.teleoperateurAppel] = { calls: 0, leadsQualified: 0, appointmentsBooked: 0 };
        }
        operators[lead.teleoperateurAppel].appointmentsBooked += 1;
      }
    });

    return Object.entries(operators)
      .map(([name, data]) => ({
        name,
        ...data,
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 8);
  }, [callLogs, appointments, leads]);

  // ─── Scoring Distribution ────────────────────────────────────────────────

  const scoringDistribution = useMemo(() => {
    const ranges = [
      { range: "0-25", count: 0 },
      { range: "25-50", count: 0 },
      { range: "50-75", count: 0 },
      { range: "75-100", count: 0 },
    ];

    leads.forEach((lead) => {
      if (lead.score !== null && lead.score !== undefined) {
        if (lead.score < 25) ranges[0].count += 1;
        else if (lead.score < 50) ranges[1].count += 1;
        else if (lead.score < 75) ranges[2].count += 1;
        else ranges[3].count += 1;
      }
    });

    return ranges;
  }, [leads]);

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble des performances et des KPIs de l'équipe.</p>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total des Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold">{kpis.totalLeads}</div>
                <p className="text-xs text-muted-foreground mt-1">Tous les stades</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Appels Aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold">{kpis.todaysCalls}</div>
                <p className="text-xs text-muted-foreground mt-1">Aujourd'hui</p>
              </div>
              <Phone className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de Qualification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold">{kpis.qualificationRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">{kpis.qualifiedLeads} qualifiés</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de Confirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold">{kpis.appointmentConfirmationRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">RDV confirmés</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Charts Row 1 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entonnoir de Pipeline</CardTitle>
            <CardDescription>Distribution des leads par étape</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Scoring Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribution des Scores</CardTitle>
            <CardDescription>Répartition par plage de score</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scoringDistribution}
                  dataKey="count"
                  nameKey="range"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {scoringDistribution.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={["#ff6b6b", "#ffa94d", "#74c0fc", "#51cf66"][idx]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ─── Performance par Opérateur ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance par Téléopérateur</CardTitle>
          <CardDescription>Appels, qualifications et RDV réservés par opérateur</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={operatorPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="calls" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="leadsQualified" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="appointmentsBooked" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
